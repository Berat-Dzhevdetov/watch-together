var express = require('express');
var socket = require("socket.io");
const mysql = require('mysql');
var hbs = require('express-handlebars');

const fs = require('fs');
const ytdl = require('ytdl-core');


//App setup
var app = express();

var server = app.listen(4000, function() {
    console.log('listening to 4000 port');
});

//Database connection
let con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "watchtogether"
});

//Static files
app.use(express.static(__dirname + '/public/static'));
//Adjustment view controller (Handlebars)
app.engine('hbs', hbs({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: __dirname + '/public/views/layouts/',
    partialsDir: __dirname + '/public/views/partials/'
}));

app.set('view engine', 'hbs');
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
    });
    //Sending to all that someone lefted the stream
    socket.on('left', function(data) {
        io.sockets.emit('left', data);
    });
    //Sending to all that someone triggered the video
    socket.on('video-trigger', function(data) {
        io.sockets.emit('video-trigger', data);
    });
});

//Database queries funtions
function getAllRooms(callback) {

    let sql = "SELECT id,password FROM rooms ORDER BY `timestamp` DESC,id DESC";

    con.query(sql, function(err, results) {
        if (err) {
            throw err;
        }
        return callback(results);
    })
}
//Get Requests
//Home
app.get('/', function(req, res) {
    getAllRooms(function(results) {
        let rooms = results;
        rooms.forEach(obj => {
            obj.isSecured = obj.password == null ? false : true;
        });
        res.render(__dirname + '/public/views/home', {
            isLogged: true,
            rooms
        })
    })
});

//Register
app.get('/register', function(req, res) {
    res.render(__dirname + '/public/views/register');
});
//Login
app.get('/login', function(req, res) {
    res.render(__dirname + '/public/views/login');
});
//Create room
app.get('/create-room', function(req, res) {

    res.render(__dirname + '/public/views/create-room');
});
app.get('/logout', function(req, res) {
    res.redirect('/');
});
//Post Requests