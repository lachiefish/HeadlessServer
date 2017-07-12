var cluster = require('cluster');
if (cluster.isMaster) {
  var express = require('express');
  var app = express();
  var bodyParser = require('body-parser');

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
    var worker = cluster.fork();
    var username = req.body.username;
    var password = req.body.password;
    worker.send({
      "username": username,
      "password": password,
    });
    worker.on('message', function(msg) {
      if (msg !== null) {
        res.send(msg);
        res.end();
      } else {
        res.status(500);
        res.end();
      }
      worker.on('exit', function() {
        console.log('Worker exited.');
      });
    });
  });
}

if (cluster.isWorker) {
  console.log("This is worker " + process.pid);
  require('newrelic');
  var Horseman = require('node-horseman');
  var horseman = new Horseman();
  var himalaya = require('himalaya');
  var util = require('util');
  var async = require('async');
  var queue = require('express-queue');

  var timetableURL = null;
  var date = null;
  var timetableHTML = null;
  var count = 8;
  var completeJSON = [];
  var day = null;
  var username = "";
  var password = "";
  var postResponse = null;

  process.on('message', function(msg) {
    var username = msg.username;
    var password = msg.password;
    loadSpaces();
      function loadSpaces() {
        completeJSON = [];
        count = 8;
        var timetableURLPromise =
          horseman
          .userAgent('Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0')
          .catch(function(err) {
            error(err);
          })
          .cookies([])
          .catch(function(err) {
            error(err);
          })
          .open('https://spaces.newington.nsw.edu.au/signin')
          .catch(function(err) {
            error(err);
          })
          .click("body > div.container > div.row.button > div > section:nth-child(1) > a")
          .catch(function(err) {
            error(err);
          })
          .waitForNextPage({
            timeout: 15000
          })
          .catch(function(err) {
            error(err);
          })
          .type("#user_email", username)
          .catch(function(err) {
            error(err);
          })
          .type("#user_password", password)
          .catch(function(err) {
            error(err);
          })
          .click("#user_submit")
          .catch(function(err) {
            error(err);
          })
          .waitForNextPage({
            timeout: 15000
          })
          .catch(function(err) {
            error(err);
          })
          .url()
          .catch(function(err) {
            error(err);
          })
          .waitForNextPage({
            timeout: 15000
          })
          .catch(function(err) {
            error(err);
          })
          .waitForSelector('#diary_timetable_1',{timeout: 10000})
          .catch(function(err) {
            error(err);
          })
          .attribute('#diary_timetable_1', "data-view-loadable-view")
          .catch(function(err) {
            error(err);
          });

        timetableURLPromise.then(function(attribute) {
          try {
            console.log("URL = " + attribute);
            timetableURL = attribute;
            var URLBeforeDate = timetableURL.search('=');
            timetableURL = timetableURL.slice(8, URLBeforeDate + 1);
            getTimetableData();
          } catch (err) {
            error(err);
          }
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
          var timetableHTMLPromise =
            horseman
            .open("https://spaces.newington.nsw.edu.au" + timetableURL + date)
            .catch(function(err) {
              error(err);
            })
            .waitForSelector("body > table > tbody")
            .catch(function(err) {
              error(err);
            })
            .html("body > table > tbody")
            .catch(function(err) {
              error(err);
            });
          timetableHTMLPromise.then(function(data) {
            try {
              dataToJSON(data);
              count = count + 1;
              getTimetableData();
            } catch (err) {
              error(err);
            }
          });
        } else {
          console.log("DONE");
          var JSONstring = JSON.stringify(completeJSON);
          JSONstring = JSONstring.replace(/&amp;/g, "&");
          process.send(JSONstring);
          process.exit(1);
        }
      }
  });

  function dataToJSON(html) {
    try {
      var json = himalaya.parse(html);
      organiseJSON(json);
    } catch (err) {
      console.log(err.message);
      process.exit(1);
    }
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

  function error(err) {
    process.send(null);
    console.log(err);
    process.exit(1);
  }
}
