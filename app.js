var express = require('express');
var socket = require("socket.io");
const mysql = require('mysql');
var hbs = require('express-handlebars');
var cors = require('cors');
const Services = require('./Services');
const constants = require('./rules/constants');
const errorMessages = require('./rules/errorMessages');
const offensiveWords = require('./rules/offensive_words');
const successfulMessages = require('./rules/successfulMessages');
var cookieParser = require('cookie-parser');

//App setup
var app = express();
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cors());
app.use(cookieParser());
app.use('/scripts', express.static(__dirname + '/public/scripts'));


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
//Get Requests
//Home
app.get('/', async function(req, res) {
    let promiseForAllRooms = Services.getAllRooms(con);
    let promiseToCheckIfItsLogged = Services.isLogged(con, req, constants.cookieName);
    Promise.all([promiseForAllRooms, promiseToCheckIfItsLogged])
        .then(result => {
            let rooms = result[0];
            rooms.forEach(room => {
                room.isSecured = room.password === null ? false : true;
            });
            let isLogged = result[1];

            if (isLogged) {
                Services.getUserDataFromCookie(con, req.cookies[constants.cookieName])
                    .then(udata => {
                        res.render(__dirname + '/public/views/home', {
                            rooms,
                            isLogged,
                            user: udata[0]
                        })
                    });
            } else {
                res.render(__dirname + '/public/views/home', {
                    rooms,
                    isLogged
                })
            }
        })
});

//Register
app.get('/register', function(req, res) {
    Services.isLogged(con, req, constants.cookieName)
        .then(result => {
            if (result === true) {
                res.redirect(__dirname + '/public/views/home');
            }
            res.render(__dirname + '/public/views/register');
        });
});
//Login
app.get('/login', function(req, res) {
    Services.isLogged(con, req, constants.cookieName)
        .then(result => {
            if (result === true) {
                res.redirect(__dirname + '/public/views/home');
            }
            res.render(__dirname + '/public/views/login');
        });
});
//Create room
app.get('/create-room', function(req, res) {
    let result = Services.getData(con, constants.cookieName, req, res);

    console.log(result);
    return;
    res.render(__dirname + '/public/views/create-room', {
        isLogged: result[0],
        user: result[1][0]
    })
});
app.get('/logout', function(req, res) {
    Services.getUserDataFromCookie(con, req.cookies[constants.cookieName])
        .then(result => {
            if (result.length == 0) {
                res.clearCookie(constants.cookieName);
                res.redirect('/');
            } else {
                Services.clearUserCookieFromDb(con, result[0].id, function(result) {
                    if (result.affectedRows == 1) {
                        res.clearCookie(constants.cookieName);
                        res.redirect('/');
                    }
                })
            }
        })
});
//Post Requests
app.post('/register', (req, res) => {
    //Getting user input
    let username = req.body.username.trim();
    let password = req.body.password.trim();
    let msgs = [];
    let isFormBad = false;
    //Checks if user didn't fill the inputs
    if (username === '' || typeof username !== 'string' || password === '' || typeof password !== 'string') {
        res.render(__dirname + '/public/views/register', { msg: [errorMessages.emptyForm] });
        return;
    }
    //Checks if the username is shorter or longer than allowed
    if (username.length < constants.minLengthOfUsername || username.length > constants.maxLengthOfUsername) {
        msgs.push(errorMessages.invalidUsernameLength([constants.minLengthOfUsername, constants.maxLengthOfUsername]))
        isFormBad = true;
    }
    //Checks if the password is shorter or longer than allowed
    if (password.length < constants.minLengthOfPassword || password.length > constants.maxLengthOfPassword) {
        msgs.push(errorMessages.invalidPasswordLength([constants.minLengthOfPassword, constants.maxLengthOfPassword]))
        isFormBad = true;
    }
    //Checks if the password meets given regex
    if (!constants.passwordRegex.test(password)) {
        msgs.push(errorMessages.invalidPassword)
        isFormBad = true;
    }
    //Resend user to the page with message what happened
    if (isFormBad) {
        res.render(__dirname + '/public/views/register', { msg: msgs });
        return;
    }

    //Checks if bad word is used
    try {
        Services.isBadWordUsed(username, offensiveWords)
    } catch (e) {
        msgs.push(errorMessages.offensiveWordsUsed);
        isFormBad = true;
    }

    //Resend user to the page with message what happened
    if (isFormBad) {
        res.render(__dirname + '/public/views/register', { msg: msgs });
        return;
    }
    //Trying to get the user so if we have the username not to register him again
    Services.getUser(con, username, function(results) {
        if (!results) {
            msgs.push(errorMessages.somethingWentWrong);
            res.render(__dirname + '/public/views/register', { msg: msgs });
            return;
        }
        if (results.length >= 1) {
            //Username in use
            msgs.push(errorMessages.usernameInUse);
            res.render(__dirname + '/public/views/register', { msg: msgs });
            return;
        }
        if (results.length === 0) {
            //Hashes the user password
            let hashedPassword = Services.sha512(password);
            //Register the user
            Services.registerUser(con, username, hashedPassword, function(results) {
                if (results.affectedRows == 1) {
                    msgs.push(successfulMessages.successfullyRegistered);
                    res.render(__dirname + '/public/views/register', { msg: msgs });
                    return;
                } else {
                    msgs.push(errorMessages.somethingWentWrong);
                    res.render(__dirname + '/public/views/register', { msg: msgs });
                    return;
                }
            })
        }
    })
});
app.post('/login', (req, res) => {
    //Getting user input
    let username = req.body.username.trim();
    let password = req.body.password.trim();
    let msgs = [];
    let isFormBad = false;
    //Checks if user didn't fill the inputs
    if (username === '' || typeof username !== 'string' || password === '' || typeof password !== 'string') {
        res.render(__dirname + '/public/views/register', { msg: [errorMessages.emptyForm] });
        return;
    }
    //Checks if the username is shorter or longer than allowed
    if (username.length < constants.minLengthOfUsername || username.length > constants.maxLengthOfUsername) {
        msgs.push(errorMessages.invalidUsernameLength([constants.minLengthOfUsername, constants.maxLengthOfUsername]))
        isFormBad = true;
    }

    if (isFormBad) {
        res.render(__dirname + '/public/views/login', { msg: msgs });
        return;
    }
    let hashedPassword = Services.sha512(password);
    Services.getUser(con, username, function(results) {
        if (results.length === 0) {
            msgs.push(errorMessages.nonExistentProfile);
            res.render(__dirname + '/public/views/login', { msg: msgs });
            return;
        } else if (results.length === 1) {
            let code = Services.createRandomString(128);
            var tryingToAvoidDublicatesCookies = setInterval(() => {
                Services.getUserDataFromCookie(con, code)
                    .then(result => {
                        if (result.length >= 1 && result[0].username != username) {
                            code = Services.createRandomString(128);
                        } else {
                            clearInterval(tryingToAvoidDublicatesCookies);
                        }
                    })
            }, 40)
            res.cookie(constants.cookieName, code);
            Services.insertCookieCode(con, results[0].id, code, function(result) {
                if (result.affectedRows === 1) {
                    res.redirect('/');
                } else {
                    msgs.push(errorMessages.somethingWentWrong);
                    res.render(__dirname + '/public/views/login', { msg: msgs });
                    return;
                }
            });
        }
    }, hashedPassword)
})
app.post('/create-room', (req, res) => {
    //Getting data
    let src = req.body.srclink.trim();
    let password = req.body.password.trim();

    if (src === '' || password === '') {
        let msg = 'a' // errorMessages.emptyForm;
        res.render(__dirname + '/public/views/create-room', { msg });
        return;
    }
    console.log('a');
})