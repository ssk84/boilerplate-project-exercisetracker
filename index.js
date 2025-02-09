const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
require('dotenv').config()

//mongoose - mongodb connection
const mongoose = require('mongoose');
const { log } = require('console');
mongoose.connect(process.env.MONGO_URI,
  { useNewUrlParser: true, useUnifiedTopology: true });
// ----------- User schema -------------------
const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
}, { versionKey: false });
const User = mongoose.model("User", userSchema);
// ---------- Exercise schema -----------------
const exerciseSchema = new mongoose.Schema({
  username: { type: String },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date },
  userId: {type: String}
}, { versionKey: false });
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// post api to create user in db
app.post("/api/users", (req, res) => {
  let name = req.body.username;
  User.create({ username: name }).then(result => {
    res.json({
      username: result.username,
      _id: result._id
    });
  });
});

// get api to retrieve users
app.get("/api/users", (req, res) => {
  User.find({}).then(users => res.json(users));
});

// get api to retrieve users
app.get("/api/users/:_id", async (req, res) => {
  let id = req.params._id;
  var usr = null;
  try {
    usr = await User.findById(id);
  } catch (err) {
    console.log(err);
  }
  console.log(usr.username);
});

// post api to set exercises
app.post("/api/users/:_id/exercises", async (req, res) => {
  let id = req.params._id;
  let desc = req.body.description;
  let duration = req.body.duration;
  let dt = new Date(req.body.date);
  //console.log("1.dt: "+dt);
  if (dt == '' || dt =='Invalid Date')
    dt = new Date();
  //console.log("2.dt: "+dt);
  let user = null;
  try {
    user = await User.findById(id);
  } catch (err) {
    console.log(err);
  }
  //console.log("## "+user.username);
  Exercise.create({
    username: user.username,
    userId: id,
    description: desc,
    duration: duration,
    date: dt
  }).then(result => {
    res.json({
      _id: result.userId,
      username: result.username,
      description: result.description,
      duration: result.duration,
      date: result.date.toDateString()
    });
  });
});

// get api to get user exercise logs
app.get("/api/users/:_id/logs", async (req, res) => {
  let id = req.params._id;
  const {from, to, limit } = req.query;
  console.log(from, to, limit);
  let exercises = null;
  try {
    let fromDt, toDt, filter1;
    if(!(from === undefined)){
      fromDt = new Date(from);
      fromDt = (fromDt == 'Invalid Date') ? '' : fromDt;
      //console.log("fromDt: "+fromDt);
      if(fromDt != ''){
        if(!(to === undefined)){
          toDt = new Date(to);
          toDt = (toDt == 'Invalid Date') ? new Date()
            : toDt;
        }else{
          toDt = new Date();
        }
        //console.log("toDt: "+toDt);
        filter1 = {
          userId: id,
          date: {$gte: fromDt, $lte: toDt}
        };
      }
    }else{
      filter1 = { userId: id };
    }
    //console.log("filter: "+JSON.stringify(filter1));
    if(limit === undefined)
      exercises = (await Exercise.find(filter1));
    else
      exercises = (await Exercise.find(filter1).limit(limit).exec());
    //console.log(exercises.length);
  } catch (err) {
    console.log(err);
  }
  let logObj;
  if(exercises == 0){
    logObj = '{}';
  }else{
    logObj = '{ "username": ';
    for (let i = 0; i < exercises.length; i++) {
      if (i == 0) {
        logObj = logObj + '"' + exercises[i].username + '",';
        logObj = logObj + '"count": ' + exercises.length + ',';
        logObj = logObj + '"_id": ' + '"' + exercises[i].userId + '",';
        logObj = logObj + '"log": [';
      }
      logObj = logObj + '{"description": ' + '"' + exercises[i].description + '",';
      logObj = logObj + '"duration": ' + exercises[i].duration + ',';
      //console.log("tds: "+exercises[i].date);
      logObj = logObj + '"date": ' + '"' + exercises[i].date.toDateString() + '"}';
      if (i == exercises.length - 1) {
        logObj = logObj + ']}'
      } else {
        logObj = logObj + ','
      }
    }
  }

  res.json(JSON.parse(logObj));
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
