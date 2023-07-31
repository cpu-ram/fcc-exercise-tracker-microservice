const express = require('express');

const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const { ObjectId } = mongoose.Types;
require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.static('public'));

const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', (err) => {
  console.log(err);
});

const userSchema = new mongoose.Schema({
  username: String,
  log: [{
    description: String,
    duration: Number,
    date: String,
  }],
});
const User = mongoose.model('User', userSchema);

const selectObjectProperties = (targetObj, fieldsArr) => (
  Object.keys(targetObj).filter((x) => (fieldsArr.includes(x)))
    .reduce((accum, field) => Object.assign(accum, { [field]: targetObj[field] }), {})
);
const convertQueryResultToJson = ((queryResult) => (JSON.parse(JSON.stringify(queryResult))));

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/views/index.html`);
});
app.post('/api/users', (req, res) => {
  const userName = req.body.username;
  const newUser = new User();
  newUser.username = userName;

  newUser.save().then((x) => {
    const neededProperties = ['username', '_id'];
    let result = x.toObject();
    result = selectObjectProperties(result, neededProperties);
    res.json(result);
  }, (err) => console.log(err));
});
app.get('/api/users', (req, res) => {
  User.find({}).exec().then((resArr) => {
    const properResponse = resArr
      .map((x) => x.toObject());
    res.json(properResponse);
  });
});
app.post('/api/users/:id/exercises', (req, res) => {
  const userId = req.params.id;
  let { description, duration, date } = req.body;
  const dateIsProvided = (date !== '') && !typeof date === undefined;
  if (dateIsProvided) date = new Date(Date.parse(date)).toDateString();
  if (!dateIsProvided) date = new Date().toDateString();

  const exercise = { description, duration, date };

  User.findOne({ _id: new ObjectId(userId) })
    .exec()
    .then((person) => {
      person.log.push(exercise);
      person.save();
      const response = selectObjectProperties(convertQueryResultToJson(person), ['_id', 'username']);

      return res.json(Object.assign(response, exercise));
    })
    .catch((err) => res.json(err));
});

app.get('/api/users/:id/logs', (req, res) => {
  const userId = req.params.id;
  const to = req.query.to;
  const from = req.query.from;
  const limit = req.query.limit;

  const stringIsDefinedAndNotEmpty = ((x) => (
    (x !== undefined) && (x !== '')
  ));

  User.findOne({
    _id: new ObjectId(userId),
  })
    .exec()
    .then(
      (response) => {
        const properResponse = selectObjectProperties(
          convertQueryResultToJson(response),
          ['_id', 'username', 'log'],
        );
        properResponse.log.forEach(
          (exercise) => (delete exercise._id),
        );
        if (stringIsDefinedAndNotEmpty(to)) {
          properResponse.log = properResponse.log.filter((x) => (
            !(new Date(Date.parse(x.date)) > new Date(Date.parse(to)))
          ));
        }
        if (stringIsDefinedAndNotEmpty(from)) {
          properResponse.log = properResponse.log.filter((x) => (
            !(new Date(Date.parse(x.date)) < new Date(Date.parse(from)))
          ));
        }
        if (stringIsDefinedAndNotEmpty(limit)) {
          properResponse.log = properResponse.log.slice(0, limit);
        }
        Object.assign(properResponse, { count: properResponse.log.length });
        res.json(properResponse);
      },
    )
    .catch((err) => console.log(err));
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
