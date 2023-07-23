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
});
const User = mongoose.model('User', userSchema);

const validateUsername = () => (null);
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

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
