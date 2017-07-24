/*jshint esversion: 6 */
/* @flow */
/* @annotations */
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var Horseman = require('node-horseman');
var himalaya = require('himalaya');
var util = require('util');
var async = require('async');

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
  extended: true
})); // support encoded bodies

app.get('/', function(req, res) {
  res.send('');
});

app.get('/privacy', function(req, res) {
  res.sendFile(__dirname + '/privacy.html');
});

app.listen(process.env.PORT || 3000, function() {
  console.log('Running Timetable Server');
});

app.post('/', async function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var response = await loadTimetable(username, password)
  res.send(response);
  res.end()
});

async function loadTimetable (username, password) {
  var completeJSON = [];
    var horseman = new Horseman();
    var timetableURI = await getDataURI(username, password, horseman);
    var timetableURL = getStudentNumber(timetableURI);
    var count = 8;
    for (var count = 8; count <= 19; count++) {
      var timetableDayHTML = await getTimetableData(count, timetableURL, horseman);
      var timetableJSON = HTMLtoJSON(timetableDayHTML)
      organiseJSON(timetableJSON, count, completeJSON);
    }
    var arrangedJSON = arrangeJSON(completeJSON);
    return arrangedJSON
}

function getDataURI(username, password, horseman) {
    var timetableURI =
      horseman
      .userAgent('Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0')
      .cookies([])
      .open('https://spaces.newington.nsw.edu.au/signin')
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
      .waitForNextPage({
        timeout: 15000
      })
      .waitForSelector('#diary_timetable_1', {
        timeout: 10000
      })
      .attribute('#diary_timetable_1', "data-view-loadable-view");
      return timetableURI;
}

function getStudentNumber(timetableURI) {
  var timetableURL = JSON.parse(timetableURI).uri;
  var URLBeforeDate = timetableURL.search('=');
  timetableURL = timetableURL.slice(0, URLBeforeDate + 1);
  return timetableURL;
}

function getTimetableData(count, timetableURL, horseman) {
    if (count < 10) {
      date = "2017-05-0" + count;
    } else if (count == 13 || count == 14) {

    } else {
      date = "2017-05-" + count;
    }
    var timetableDayHTML =
      horseman
      .open("https://spaces.newington.nsw.edu.au" + timetableURL + date)
      .waitForSelector("body > table > tbody")
      .html("body > table > tbody");
      return timetableDayHTML;
}

function HTMLtoJSON(timetableDayHTML){
      if (timetableDayHTML !== null) {
      var json = himalaya.parse(timetableDayHTML);
      return json
    } else {
      error(null);
    }
}

function organiseJSON(timetableJSON, count, completeJSON){
  var day = ""
  switch (count) {
      case (8 || 15):
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
    if (count < 15) {
      var week = "A";
    } else {
      var week = "B";
    }

    var timetableArray = [];

    for (var i = 0; i < Math.floor(timetableJSON.length / 2); i++) {
      var period = i + 1;
      var index = (2 * i);
      if (timetableJSON[index].children[3].children[0].content == "Assembly") {
        var dayTimetable = {
          "time": "",
          "subject": "",
          "class": "",
          "teacher_code": "",
          "period": "Assembly"
        };
        timetableArray.push(dayTimetable);
      } else if (timetableJSON[index].children[3].children[0].content.indexOf("Mentor") != -1) {
        var dayTimetable = {
          "time": timetableJSON[index].children[1].children[0].content,
          "subject": timetableJSON[index].children[3].children[0].content,
          "class": timetableJSON[index].children[5].children[0].content,
          "teacher_code": timetableJSON[index].children[7].children[1].children[0].content,
          "period": "Mentor"
        };
        timetableArray.push(dayTimetable);
      } else {
        var dayTimetable = {
          "time": timetableJSON[index].children[1].children[0].content,
          "subject": timetableJSON[index].children[3].children[0].content,
          "class": timetableJSON[index].children[5].children[0].content,
          "teacher_code": timetableJSON[index].children[7].children[1].children[0].content,
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
    completeJSON = completeJSON.push(dayJSON);
  }

function arrangeJSON(completeJSON) {
    var JSONstring = JSON.stringify(completeJSON);
    JSONstring = JSONstring.replace(/&amp;/g, "&");
    return JSONstring;
}

function error(err) {
  console.log("Error in top function");
}
