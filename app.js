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
app.use('/music', express.static(__dirname + '/public/music'));


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
    // console.log("made socket connection ", socket.id);
    socket.on('chat', function(data) {
        io.sockets.emit('chat', data);
    });

    //Sending to all that someone connected to the stream
    socket.on('connected', function(data) {
        io.sockets.emit('connected', data);
    });
    //Sending to all that someone left the stream
    socket.on('left-room', function(data) {
        Services.howManyAreLeftInRoom(con, data.roomCode)
            .then(res => {
                console.log(`abe ${data.username} leftna`, new Date().toUTCString());
                if (res > 0) {
                    io.sockets.emit('left-room', data);
                    Services.removeUserFromRoom(con, data.roomCode, data.uid)
                } else {
                    Services.deleteRoom(con, data.roomCode);
                    io.sockets.emit('deleted-room');
                }
            });
    });
    //Sending to all that someone triggered the video
    socket.on('video-trigger', function(data) {
        io.sockets.emit('video-trigger', data);
    });
    //Sending to all that someone created a room
    socket.on('room-created', function(data) {
        io.sockets.emit('room-created', data);
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
            let isLogged = result[1];
            if (isLogged) {
                Services.getUserDataFromCookie(con, req.cookies[constants.cookieName])
                    .then(udata => {
                        res.render(__dirname + '/public/views/home', {
                            rooms,
                            isLogged,
                            user: udata[0],
                            isAdmin: udata[0].isAdmin === 'Y' ? true : false,
                            anyRoom: result[0].length >= 1 ? true : false
                        })
                    });
            } else {
                res.render(__dirname + '/public/views/home', {
                    rooms,
                    isLogged,
                    anyRoom: result[0].length >= 1 ? true : false
                })
            }
        })
});
//Rooms
app.get('/room/:code', async function(req, res) {
    let isLogged = await Services.isLogged(con, req, constants.cookieName);
    if (isLogged != true) {
        res.status(401).render(__dirname + '/public/views/error', {
            status_code: 401,
            status_message: "Please log in."
        })
    }
    let code = req.params.code;
    let udata = await Services.getData(con, constants.cookieName, req, res);
    Services.roomData(con, code)
        .then(room => {
            if (room != undefined) {
                res.render(__dirname + '/public/views/room', {
                    user: udata[1][0],
                    isLogged,
                    roomCode: code
                })
            } else {
                res.status(404).render(__dirname + '/public/views/error', {
                    status_code: 404,
                    status_message: "Page not found."
                })
            }
        })

});
//Register
app.get('/register', async function(req, res) {
    let isLogged = await Services.isLogged(con, res, constants.cookieName);
    if (isLogged != false) {
        res.status(401).render(__dirname + '/public/views/error', {
            status_code: 401,
            status_message: "Please try with another page."
        })
        return;
    }
    res.render(__dirname + '/public/views/register');
});
//Login
app.get('/login', async function(req, res) {
    let isLogged = await Services.isLogged(con, res, constants.cookieName);
    if (isLogged != false) {
        res.status(401).render(__dirname + '/public/views/error', {
            status_code: 401,
            status_message: "Please try with another page."
        })
        return;
    }
    res.render(__dirname + '/public/views/login');
});
//Create room
app.get('/create-room', async function(req, res) {
    let result = await Services.getData(con, constants.cookieName, req, res);
    if (result[0] != true) {
        res.status(401).render(__dirname + '/public/views/error', {
            status_code: 401,
            status_message: "Please log in."
        })
        return;
    }
    res.render(__dirname + '/public/views/create-room', {
        isLogged: result[0],
        user: result[1][0]
    })
});
//Delete-room
app.get('/delete-room/:code', async function(req, res) {
    let isLogged = await Services.isLogged(con, req, constants.cookieName);
    if (isLogged != true) {
        res.status(401).render(__dirname + '/public/views/error', {
            status_code: 401,
            status_message: "Please log in."
        })
    }
    let udata = await Services.getData(con, constants.cookieName, req, res);
    if (udata[1][0].isAdmin != 'Y') {
        res.status(401).render(__dirname + '/public/views/error', {
            status_code: 401,
            status_message: "What are you trying?"
        })
    }
    let code = req.params.code;
    await Services.deleteRoom(con, code)
    io.emit('deleted-room', code);
    res.redirect('/');
});
//Logout
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
app.post('/register', async function(req, res) {
    let isLogged = await Services.isLogged(con, res, constants.cookieName);
    if (isLogged != false) {
        res.status(401).render(__dirname + '/public/views/error', {
            status_code: 401,
            status_message: "Please try with another page."
        })
    }
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
app.post('/login', async function(req, res) {
    let isLogged = await Services.isLogged(con, res, constants.cookieName);
    if (isLogged != false) {
        res.status(401).render(__dirname + '/public/views/error', {
            status_code: 401,
            status_message: "Please try with another page."
        })
    }
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
app.post('/create-room', async function(req, res) {
    //Getting data
    let src = req.body.srclink.trim();
    let password = req.body.password.trim();
    let udata = await Services.getData(con, constants.cookieName, req, res);
    let msgs = [];
    if (src === '' || password === '') {
        msgs.push(errorMessages.emptyForm);
        res.render(__dirname + '/public/views/create-room', {
            msgs,
            isLogged: udata[0],
            user: udata[1][0]
        });
        return;
    }
    if (!constants.youtubeLinkRegex.test(src)) {
        msgs.push(errorMessages.invalidYoutubeLink);
        res.render(__dirname + '/public/views/create-room', {
            msgs,
            isLogged: udata[0],
            user: udata[1][0]
        });
        return;
    }
    if (password.length < constants.minLengthOfPassword || password.length > constants.maxLengthOfPassword) {
        msgs.push(errorMessages.invalidPasswordLength);
        res.render(__dirname + '/public/views/create-room', {
            msgs,
            isLogged: udata[0],
            user: udata[1][0]
        });
        return;
    }
    let code = Services.createRandomString(128);
    password = Services.sha512(password);
    Services.createRoom(con, src, password, code, udata[1][0].id)
        .then(result => {
            if (result.affectedRows === 1) {
                let obj = {
                    roomCode: code,
                    username: udata[1][0].username
                }
                io.emit('new-room-created', obj);
                res.redirect('/room/' + code);
            }
        })
        .catch(err => {
            msgs.push(err);
            res.render(__dirname + '/public/views/create-room', {
                msgs,
                isLogged: udata[0],
                user: udata[1][0]
            });
        })
    return;
})
app.post('/join-room/:code', async function(req, res) {
    let isLogged = await Services.isLogged(con, req, constants.cookieName);
    if (isLogged != true) {
        res.status(401).render(__dirname + '/public/views/error', {
            status_code: 401,
            status_message: "Please log in."
        })
    }
    let code = req.params.code;
    let password = Services.sha512(req.body.password.trim());
    let udata = await Services.getData(con, constants.cookieName, req, res);
    Services.roomData(con, code)
        .then(async(room) => {
            if (room === undefined) {
                res.status(404).render(__dirname + '/public/views/error', {
                    status_code: 404,
                    status_message: "Room is not available."
                })
            } else if (room.password != password) {
                let msg = [errorMessages.wrongPassword];
                res.render(__dirname + '/public/views/room', {
                    user: udata[1][0],
                    isLogged,
                    roomCode: code,
                    msg
                })
            } else {
                let data = {
                    username: udata[1][0].username,
                    roomCode: code,
                }
                io.emit('connected-to-room', data);
                await Services.joinInRoom(con, code, udata[1][0].id);
                let room = await Services.roomData(con, code);
                res.render(__dirname + '/public/views/room', {
                    user: udata[1][0],
                    isLogged,
                    roomCode: code,
                    password: true,
                    src: room.src,
                    videoSrc: room.src
                        //isAdmin: true //todo: not every one is admin
                })
            }
        })
});
app.use(function(req, res, next) {
    res.status(404).render(__dirname + '/public/views/error', {
        status_code: 404,
        status_message: "Page not found."
    })
});