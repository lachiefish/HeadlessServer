require('newrelic');
var Horseman = require('node-horseman');
var horseman = new Horseman();
var himalaya = require('himalaya');
var util = require('util');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var timetableURL = null;
var date = null;
var timetableHTML = null;
var count = 8;
var completeJSON = [];
var day = null;
var postResponse = null;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
  extended: true
})); // support encoded bodies

app.get('/', function(req, res) {
  res.send('');
});

app.post('/', function(req, res) {
  postResponse = res;
  var username = req.body.username;
  var password = req.body.password;
  console.log(username);
  console.log(password);
  loadSpaces(username, password);
});

app.listen(process.env.PORT || 3000, function() {
  console.log('Running Timetable Server');
});

function loadSpaces(username, password) {
  completeJSON = [];
  count = 8;
  var timetableURLPromise =
    horseman
    .userAgent('Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0')
    .cookies([])
    .open('https://spaces.newington.nsw.edu.au/signin')
    .on('error', function(msg) {
      console.log(msg);
    })
    .click("body > div.container > div.row.button > div > section:nth-child(1) > a")
    .waitForNextPage({
      timeout: 15000
    })
    .type("#user_email", username)
    .type("#user_password", password)
    .click("#user_submit")
    .waitForNextPage({
      timeout: 15000
    })
    .url()
    .log()
    .waitForNextPage({
      timeout: 15000
    })
    .waitForSelector('#diary_timetable_1')
    .attribute('#diary_timetable_1', "data-view-loadable-view");

  timetableURLPromise.then(attribute => {
    console.log("URL = " + attribute);
    timetableURL = attribute;
    var URLBeforeDate = timetableURL.search('=');
    timetableURL = timetableURL.slice(8, URLBeforeDate + 1);
    // console.log(timetableURL);
    getTimetableData();
  });
}

function getTimetableData() {
  if (count <= 19) {
    if (count < 10) {
      date = "2017-05-0" + count;
    } else if (count == 13 || count == 14) {

    } else {
      date = "2017-05-" + count;
    }
    // // console.log("MADE IT");
    var timetableHTMLPromise =
      horseman
      .open("https://spaces.newington.nsw.edu.au" + timetableURL + date)
      .html("body > table > tbody");
    timetableHTMLPromise.then(data => {
      dataToJSON(data);
      count = count + 1;
      getTimetableData();
    });
  } else {
    console.log("DONE");
    // console.log("!!!!!!!!!!!!!!!!!!!!!!!!!" + completeJSON);
  }
}

function dataToJSON(html) {
  var json = himalaya.parse(html);
  // // // console.log(util.inspect(json, false, null));
  organiseJSON(json);
}

function organiseJSON(json) {
  switch (count) {
    case 8:
      day = "Monday";
      break;
    case 15:
      day = "Monday";
      break;
    case 9:
      day = "Tuesday";
      break;
    case 16:
      day = "Tuesday";
      break;
    case 10:
      day = "Wednesday";
      break;
    case 17:
      day = "Wednesday";
      break;
    case 11:
      day = "Thursday";
      break;
    case 18:
      day = "Thursday";
      break;
    case 12:
      day = "Friday";
      break;
    case 19:
      day = "Friday";
      break;
  }
  // // // console.log(util.inspect(json, false, null));
  // console.log(json);
  if (count < 15) {
    var week = "A";
  } else {
    var week = "B";
  }

  var timetableArray = [];

  for (var i = 0; i < Math.floor(json.length / 2); i++) {
    period = i + 1;
    var index = (2 * i);
    if (json[index].children[3].children[0].content == "Assembly") {
      var dayTimetable = {
        "time": "",
        "subject": "",
        "class": "",
        "teacher_code": "",
        "period": "Assembly"
      };
      timetableArray.push(dayTimetable);
    } else if (json[index].children[3].children[0].content.indexOf("Mentor") != -1) {
      var dayTimetable = {
        "time": json[index].children[1].children[0].content,
        "subject": json[index].children[3].children[0].content,
        "class": json[index].children[5].children[0].content,
        "teacher_code": json[index].children[7].children[1].children[0].content,
        "period": "Mentor"
      };
    } else {
      var dayTimetable = {
        "time": json[index].children[1].children[0].content,
        "subject": json[index].children[3].children[0].content,
        "class": json[index].children[5].children[0].content,
        "teacher_code": json[index].children[7].children[1].children[0].content,
        "period": "Period " + period
      };
      timetableArray.push(dayTimetable);
    }
  }
  var dayJSON = {
    "week": week,
    "day": day,
    "timetable": timetableArray
  };
  completeJSON.push(dayJSON);
  if (count == 19) {
    response();
  }
}

function response() {
  var returnJSON = completeJSON;
  if (returnJSON != null) {
    postResponse.send(JSON.stringify(returnJSON));
    postResponse.end();
  }
}
