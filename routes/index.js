var express = require('express');
var router = express.Router();
var url = require("url");

const testFolder = './files/';

var fs = require("fs");

var mpg = require('mpg123');

var player = new mpg.MpgPlayer();
var volume = 50;
player.volume(volume);

/* GET home page. */
router.get('/', function(req, res, next) {

  var parsedUrl = url.parse(req.url, true); // true to get query as object
  var queryAsObject = parsedUrl.query;

  if(queryAsObject.play) {
    player.play("./mp3/" + queryAsObject.play);
  }

  if (queryAsObject.action) {
    var action = queryAsObject.action;
    switch (action) {
        case "stop":
          player.stop();
          break;
        case "volinc":
          volume += 10;
          if (volume > 100) volume = 100;
          player.volume(volume);
          break;
        case "voldec":
            volume -= 10;
            if (volume < 0) volume = 0;
            player.volume(volume);
            break;

    }
  }

  files = fs.readdirSync("./mp3");
  res.render('index', { title: 'Express', files: files });
});

module.exports = router;
