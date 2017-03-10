var express = require('express');
var Gpio = require('onoff').Gpio;
var fs = require("fs");
var mpg = require('mpg123');
var url = require("url");

var mfrc522 = new (require("mfrc522-rpi"))();

var router = express.Router();

var currentDate = new Date();

var lastTrigger = currentDate.getTime();
var lastTag = "";

const fileFolder = '/media/usb/';
// const fileFolder = './mp3/';

var volume = 50;
var triggerDelay= 200;


var player = new mpg.MpgPlayer();
player.volume(volume);


function increaseVolume() {
    volume += 10;
    if (volume > 100) volume = 100;
    player.volume(volume);
}

function decreaseVolume() {
    volume -= 10;
    if (volume < 0) volume = 0;
    player.volume(volume);
}

function entprellt() {
    var currentDate = new Date();
    var currentTrigger = currentDate.getTime();
    if ((currentTrigger - lastTrigger) > triggerDelay) {
        lastTrigger = currentTrigger;
        return true;
    }
    return false;
}

function playRandom() {
    if (player.file) {
        console.log("Stoppe " + player.file);
        player.stop();
    } else {
        var files = fs.readdirSync(fileFolder);
        var index = Math.floor((Math.random() * files.length));
        var filename = files[index];
        console.log("Spiele " + fileFolder + filename);
        player.play(fileFolder + filename);

    }
}

button = new Gpio(21, 'in', "falling");
button.setActiveLow(false);

volinc = new Gpio(26, "in", "falling");
volinc.setActiveLow(false);

voldec = new Gpio(20, "in", "falling");
voldec.setActiveLow(false);

volinc.watch(function (err, value) {
    if (!entprellt()) return;
    console.log("Lauter");
    increaseVolume();
});

voldec.watch(function (err, value) {
    if (!entprellt()) return;
    console.log("Leiser");
    decreaseVolume();
});


button.watch(function (err, value) {
    if (!entprellt()) return;
    if (err) {
        console.log(err);
        return;
    }
    playRandom();
});


/* GET home page. */
router.get('/', function (req, res, next) {

    var parsedUrl = url.parse(req.url, true); // true to get query as object
    var queryAsObject = parsedUrl.query;

    if (queryAsObject.play) {
        player.play(fileFolder + queryAsObject.play);
    }

    if (queryAsObject.action) {
        var action = queryAsObject.action;
        switch (action) {
            case "stop":
                player.stop();
                break;
            case "volinc":
                increaseVolume();
                break;
            case "voldec":
                decreaseVolume();
                break;

        }
    }

    files = fs.readdirSync(fileFolder);

    var mp3_files = files.filter(function (item, index, array) {
        return item.substr(item.length - 4) == ".mp3";
    });

    res.render('index', {title: 'Express', files: mp3_files, lastTag: lastTag});
});

module.exports = router;


//# This loop keeps checking for chips. If one is near it will get the UID and authenticate
console.log("scanning...");
console.log("Please put chip or keycard in the antenna inductive zone!");
console.log("Press Ctrl-C to stop.");

setInterval(function () {

    //# Scan for cards
    var response = mfrc522.findCard();
    if (!response.status) {
        return;
    }
    console.log("Card detected, CardType: " + response.bitSize);

    //# Get the UID of the card
    response = mfrc522.getUid();
    if (!response.status) {
        console.log("UID Scan Error");
        return;
    }
    //# If we have the UID, continue
    const uid = response.data;
    var identifier = uid[0].toString(16) + uid[1].toString(16) + uid[2].toString(16) + uid[3].toString(16);
    lastTag = identifier;

    files = fs.readdirSync(fileFolder);

    for (var i = 0; i < files.length; i++) {
        var filename = files[i];

        if (filename.indexOf(identifier) != -1) {
            if (fileFolder + filename != player.file) {
                player.play(fileFolder + filename);
            }
        }

    }

    //# Stop
    mfrc522.stopCrypto();

}, 500);