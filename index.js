var express = require('express');
var socket = require("socket.io");
const mysql = require('mysql');


const fs = require('fs');
const ytdl = require('ytdl-core');

ytdl('http://www.youtube.com/watch?v=aqz-KE-bpKQ')
    .pipe(fs.createWriteStream('./public/video.mp4'));

//App setup
var app = express();

var server = app.listen(4000, function() {
    console.log('listening to 4000 port');
})

//Static files
app.use(express.static("public"));

//Socket setup
var io = socket(server);

io.on("connection", function(socket) {
    console.log("made socket connection ", socket.id);
    socket.on('chat', function(data) {
        io.sockets.emit('chat', data);
    });

    //Sending to all that someone connected to the stream
    socket.on('connected', function(data) {
        io.sockets.emit('connected', data);
    })
    socket.on('left', function(data) {
        io.sockets.emit('left', data);
    })
    socket.on('video-trigger', function(data) {
        io.sockets.emit('video-trigger', data);
    })
});