var express = require('express');
var socket = require("socket.io");
const mysql = require('mysql');
var hbs = require('express-handlebars');

const fs = require('fs');
const ytdl = require('ytdl-core');

// ytdl('http://rs

//App setup
var app = express();

var server = app.listen(4000, function() {
        console.log('listening to 4000 port');
    })
    //Database connection
let con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "watchtogether"
});

app.use(express.static(__dirname + '/public/static'));

app.engine('hbs', hbs({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: __dirname + '/public/views/layouts/',
    partialsDir: __dirname + '/public/views/partials/'
}));
app.set('view engine', 'hbs');

app.get('/', function(req, res) {
    res.render(__dirname + '\\public\\views\\home');
});
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