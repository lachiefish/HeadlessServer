/*jshint esversion: 6 */
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

app.post('/', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  loadTimetable(username, password)
    .then(() => {console.log("Response");});
});

function loadTimetable(username, password) {
  // @TODO Would be better to return the horseman promise (instead of making
  // new promise) since nothing happens after it.
  return new Promise((resolve, reject) => {
    var horseman = new Horseman();
    getDataURI(username, password, horseman)
      // @TODO You are passing an executing function, not a function reference,
      // so its being called as soon as loadTimetable is run your 2nd and 3rd
      // .then is correct as it's not being executed.
      .then(getStudentNumber(timetableURI))
      .then(() => {
        for (count == 8; count <= 19; count++) {
          getTimetableData(count, timetableURL, horseman);
        }
      })
      .then(arrangeJSON);
  });
}

function getDataURI(username, password, horseman) {
  // @TODO Would be better to return the horseman promise (instead of making
  // new promise) since nothing happens after it.
  return new Promise((resolve, reject) => {
    count = 8;
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

    if (timetableURI !== null) {
      resolve(timetableURI);
    } else {
      // @TODO Pass a string or error object to be delt with outside promise.
      reject(console.log("Error in getDataURI function"));
    }
  });
}

function getStudentNumber(timetableURI) {
  timetableURL = JSON.parse(timetableURI).uri;
  var URLBeforeDate = timetableURL.search('=');
  timetableURL = timetableURL.slice(0, URLBeforeDate + 1);
  return timetableURL;
}

function getTimetableData(count, timetableURL, horseman) {
  // @TODO Would be better to return the horseman promise (instead of making
  // new promise) since nothing happens after it.
  return new Promise((resolve, reject) => {
    if (count < 10) {
      date = "2017-05-0" + count;
    } else if (count == 13 || count == 14) {

    } else {
      date = "2017-05-" + count;
    }
    var timetableHTMLPromise =
      horseman
      .open("https://spaces.newington.nsw.edu.au" + timetableURL + date)
      .waitForSelector("body > table > tbody")
      .html("body > table > tbody");

    if (timetableHTMLPromise !== null) {
      resolve(timetableHTMLPromise);
    } else {
      // @TODO Pass a string or error object to be delt with outside promise.
      reject(console.log("Error in getTimetableData function"));
    }
  });
}

function arrangeJSON() {
  // @TODO Would be better to return the horseman promise (instead of making
  // new promise) since nothing happens after it.
  return new Promise((resolve, reject) => {
    var JSONstring = JSON.stringify(completeJSON);
    JSONstring = JSONstring.replace(/&amp;/g, "&");

    if (JSONstring !== null) {
      resolve(JSONstring);
    } else {
      // @TODO Pass a string or error object to be delt with outside promise.
      reject(console.log("Error in arrangeJSON function"));
    }
  });
}
