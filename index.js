/*jshint esversion: 6 */
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var Horseman = require('node-horseman');
var himalaya = require('himalaya');
var util = require('util');
var async = require('async');
/**
 * @TODO
 * Remove this via npm so it removes from package.json and node_modules
 * Do the same for other depndencies that you've removed as well.
 *
 * npm {r|remove|uninstall} {packagename}
 */
var queue = require('express-queue');

/* @TODO This should be in the scope of each horseman instance, each user (request)
   has a unique username, password, timetable etc. */
var timetableURL = null;
var date = null;
var timetableHTML = null;
var count = 8;
var completeJSON = [];
var day = null;
var username = "";
var password = "";
var postResponse = null;

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
  /* @TODO How will the function(s) that use horseman see this, its not in their scope */
  var horseman = new Horseman();
  var username = req.body.username;
  var password = req.body.password;
  /* @TODO Instead of creating a new promise here, return a new promise from the
     function */
  var responseText = new Promise((resolve, reject) => {
      resPromise(resolve, reject);
    })
    /* @TODO As far as I know, only run time errors should be thrown from the
       base promise */
    .catch(err => error(err))
    .then(responseText => {
      res.send(responseText);
    }, /* Reject callback (2nd param) */);
    /* @TODO Reject should be reserved for network errors, so when horseman has
       an error, you should call reject() so it can be handled by the promise
       callbacks. */
});

/**
 * @TODO
 * I've added an example async chain called hotdog.js
 * It's completley hypothetical, but when creating your async chain to login,
 * get table etc. you should try and replicate what you see in hotdog.js.
 */

/**
 * @TODO
 * In good functional or object oriented programming, each method (function)
 * should ONLY perform one task, BUT do that one task really well.
 *
 * So don't worry about making "too many function", just make functions as you
 * see fit.
 *
 * IN SUMMARY/TL;DR Functions perform a single task, they don't handle any other
 * logic. You give a function some data and it will give you something back.
 * (In OOP this isn't completley true since you change values attached to a
 * class, but...thats kinda different.)
 *
 * Note on nesting
 * ---
 * Let's say have a function that makes a hotdog, you are bound to use function
 * to add condiments like addSause(), addSausage() etc. but these shouldn't
 * (need) to be nested. So, you may only start out making hotdogs, but what if
 * you start making hamburgers, you'll still need an addSause() but if its in
 *  the scope of the make hotdog function, it won't be able to call it.
 */


/**
 *  @TODO
 *  This is the function you should rewrite into small modules etc.
 * It'd be best to just re-write aposed to copy and paste, becuase from the
 * copy and pasted code, you'll just need to try and add logic around exisitng
 * code which can be anoying and far more prone to errors
 */
function resPromise(resolve, reject) {
  loadSpaces()
    .then(attribute => {
      timetableURL = JSON.parse(attribute).uri;
      var URLBeforeDate = timetableURL.search('=');
      timetableURL = timetableURL.slice(0, URLBeforeDate + 1);
      getTimetableData()
        .then(timetableHandler);
    });

  function timetableHandler(data) {
    dataToJSON(data);
    count = count + 1;
    getTimetableData()
      .then(timetableHandler);
  }

  function loadSpaces() {
    completeJSON = [];
    count = 8;
    var timetableURLPromise =
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
    return timetableURLPromise;
  }

  function getTimetableData() {
    if (count <= 19) {
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
      return timetableHTMLPromise;
    } else {
      console.log("DONE");
      var JSONstring = JSON.stringify(completeJSON);
      JSONstring = JSONstring.replace(/&amp;/g, "&");
      resolve(JSONstring);
    }
  }

  /**
   * @TODO
   * Function should do what a function says it does, should not do anything
   * else.
   *
   * If you want to get really fancy, you can add this function to the datatype
   * of String. So you can call:
   *   var parsedHtml = aString.htmlToJSON();
   * or
   *   "<div>a html string</div>".htmlToJSON();
   * Just an idea, you can see the link below. Just remember that String is an
   * actual defined (sort of) variable. Its really just an "special" object but
   * you can see for yourself under this comment there's a variable with a bunch
   * of datatypes.
   *
   * Think of it like this, EVERYTHING is an object in JavaScript, even the
   * datatypes. Think about the Math object, you've probably used Math.random()
   * before. It's just an object, thats why you use dot notation.
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/prototype
   */

  var deleteThisVariable = [
    Boolean,
    String,
    Number,
    Object,
    Array // Try not to get confused by this, but an arrays are objects with key pair values. So when you get the type of an array with typeof it will return 'object'
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures
  ];

  function dataToJSON(html) {
    if (html !== null) {
      var json = himalaya.parse(html);
  /* v should not do this v */
      organiseJSON(json);
    } else {
      error(null);
    }
  }

  function organiseJSON(json) {
    /**
     * @TODO
     * Wasn't sure if I could explain this one as well so I've demonstrated it
     * below. You can use && and || in switch.
     *
     * I've fixed monday so as an example.
     */
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
        timetableArray.push(dayTimetable);
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
  }
}

function error(err, /* reject */) {
  /* @TODO this function cannot see reject, you could pass it if you want... */
  reject("There was an error");
  console.log("Error: " + err);
}
