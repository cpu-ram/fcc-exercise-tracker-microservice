const express = require('express');

const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
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
    date: Date,
  }],
});
const User = mongoose.model('User', userSchema);

const selectObjectProperties = (targetObj, fieldsArr) => (
  Object.keys(targetObj).filter((x) => (fieldsArr.includes(x)))
    .reduce((accum, field) => Object.assign(accum, { [field]: targetObj[field] }), {})
);

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
app.get('/api/users', (req, res) =>{
  User.find({}).exec().then((resArr) => {
    const properResponse = resArr
      .map((x) => x.toObject());
    res.json(properResponse);
  });
});
app.post('/api/users/:id/exercises', (req, res) => {
  const userId = req.params.id;
  let { description, duration, date } = req.body;
  const dateIsProvided = (date !== '');
  if (!dateIsProvided) date = Date();
  const exercise = { description, duration, date };

  User.findOne().exec().then((person) => {
    person.username = 'step';
    person.log.push(exercise);
    person.save();
    res.json(person);
  })
    .catch((err) => res.json(err));
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
