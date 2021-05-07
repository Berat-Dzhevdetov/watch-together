var express = require('express');
var socket = require("socket.io");
const mysql = require('mysql');
var hbs = require('express-handlebars');
var cors = require('cors');
//const fs = require('fs');
//const ytdl = require('ytdl-core');
//const bodyParser = require('body-parser');
const services = require('./services');
const constants = require('./rules/constants');
const errorMessages = require('./rules/errorMessages');
const goodMessages = require('./rules/successfulMessages');
const offensiveWords = require('./rules/offensive_words');
const { emailRegex, passwordRegex } = require('./rules/constants');
//let a = errorMessages.invalidUsernameLength([constants.minLengthOfUsername, constants.maxLengthOfUsername]);

//App setup
var app = express();
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cors());


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
app.post('/register', (req, res) => {
    let username = req.body.username.trim();
    let password = req.body.password.trim();
    let errors = [];
    let isFormBad = false;
    if (username === '' || typeof username !== 'string' || password === '' || typeof password !== 'string') {
        res.render(__dirname + '/public/views/register', { msg: [errorMessages.emptyForm] });
        return;
    }
    if (username.length < constants.minLengthOfUsername || username.length > constants.maxLengthOfUsername) {
        errors.push(errorMessages.invalidUsernameLength([constants.minLengthOfUsername, constants.maxLengthOfUsername]))
        isFormBad = true;
    }
    if (password.length < constants.minLengthOfPassword || password.length > constants.maxLengthOfPassword) {
        errors.push(errorMessages.invalidPasswordLength([constants.minLengthOfPassword, constants.maxLengthOfPassword]))
        isFormBad = true;
    }
    if (constants.passwordRegex.test(password)) {
        errors.push(errorMessages.invalidPassword)
        isFormBad = true;
    }
    if (isFormBad) {
        res.render(__dirname + '/public/views/register', { msg: errors });
        return;
    }

    try {
        services.isBadWordUsed(username, offensiveWords)
    } catch (e) {
        errors.push(errorMessages.offensiveWordsUsed);
        isFormBad = true;
    }

    if (isFormBad) {
        res.render(__dirname + '/public/views/register', { msg: errors });
        return;
    }
    console.log('a');
});