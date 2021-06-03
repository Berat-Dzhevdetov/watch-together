let jsSHA = require("jssha");
class Services {

    isBadWordUsed(wordToCheck, offensiveWords) {
        wordToCheck = wordToCheck.toLowerCase();
        Object.keys(offensiveWords).forEach(function(key) {
            offensiveWords[key].forEach(value => {
                if (wordToCheck.includes(value) == true) {
                    throw Error;
                }
            });
        });
        return false;
    }
    sha512(password) {
        if (!password) return;
        var hashObj = new jsSHA("SHA-512", "TEXT", { numRounds: 1 });
        hashObj.update(password);
        var hash = hashObj.getHash("HEX");
        return hash;
    }
    getAllRooms(con) {
        return new Promise(function(resolve, reject) {
            let sql = "SELECT r.password,r.code,u.username FROM rooms AS r JOIN users AS u ON r.userId= u.id ORDER BY `timestamp` DESC";

            con.query(sql, function(err, results) {
                if (err) {
                    reject(new Error(err));
                }
                return resolve(results);
            })
        })
    }
    getUser(con, username, callback, password = '') {
        if (!con || !username || !callback) return;
        let sql = "SELECT * FROM `users` WHERE `username`=?";
        if (password != '') {
            sql += " AND `password`=?";
        }
        con.query(sql, [
            username,
            password
        ], function(err, results) {
            if (err) {
                throw err;
            }
            return callback(results);
        })
    }
    registerUser(con, username, password, callback) {
        if (!con || !username || !callback || !password) return;
        let sql = "INSERT INTO `users` (`username`,`password`)VALUES(?,?)";
        con.query(sql, [
            username,
            password
        ], function(err, results) {
            if (err) {
                throw err;
            }
            return callback(results);
        })
    }
    insertCookieCode(con, id, code, callback) {
        if (!con || !id || !code) return;
        let sql = "UPDATE `users` SET `cookie`=? WHERE `id`=?";
        con.query(sql, [
            code,
            id
        ], function(err, results) {
            if (err) {
                throw err;
            }
            return callback(results);
        })
    }
    createRandomString(length) {
        var result = [];
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result.push(characters.charAt(Math.floor(Math.random() *
                charactersLength)));
        }
        return result.join('');
    }
    getUserDataFromCookie(con, code) {
        if (!con || !code) return;
        return new Promise(function(resolve, reject) {
            let sql = "SELECT `id`,`username`,`cookie`,`isAdmin` FROM `users` WHERE `cookie`=?";

            con.query(sql, [
                code
            ], function(err, results) {
                if (err) {
                    reject(new Error("Error rows is undefined"));
                }
                return resolve(results);
            })
        })

    }
    clearUserCookieFromDb(con, uid, callback) {
        if (!con || !uid) return;
        let sql = "UPDATE `users` SET `cookie`=null WHERE id=?";

        con.query(sql, [
            uid
        ], function(err, results) {
            if (err) {
                throw err;
            }
            return callback(results);
        })
    }
    isLogged(con, res, cookieName) {
        return new Promise(function(resolve, reject) {
            let cookie;
            try {
                cookie = res.cookies[cookieName] || undefined;
                if (!cookie || cookie == undefined && typeof cookie != 'string') {
                    return resolve(false);
                }
            } catch (error) {
                cookie = undefined;
            }

            let sql = "SELECT `id`,`username`,`cookie` FROM `users` WHERE `cookie`=?";
            con.query(sql, [cookie], function(err, results) {
                if (err) {
                    reject(new Error(err));
                }
                let boolean = results.length === 1 ? true : false;
                return resolve(boolean);
            })
        })
    }
    async getData(con, cookieName, req, res) {
        let promiseToCheckIfItsLogged = this.isLogged(con, req, cookieName);
        let promiseUserData = this.getUserDataFromCookie(con, req.cookies[cookieName]);
        return Promise.all([promiseToCheckIfItsLogged, promiseUserData])
            .then(result => {
                return result;
            });
    }
    createRoom(con, youtubelink, password, code, uid) {
        return new Promise(function(resolve, reject) {
            let sql = "INSERT INTO `rooms` (password,src,code,userId)VALUES(?,?,?,?)";
            con.query(sql, [
                password,
                youtubelink,
                code,
                uid
            ], function(err, results) {
                if (err) {
                    reject(new Error(err));
                }
                return resolve(results);
            })
        })
    }
    roomData(con, code) {
        return new Promise(function(resolve, reject) {
            let sql = "SELECT * FROM `rooms` WHERE code=? LIMIT 1";
            con.query(sql, [
                code
            ], function(err, results) {
                if (err) {
                    reject(new Error(err));
                }
                return resolve(results[0]);
            })
        })
    }
    howManyAreLeftInRoom(con, roomCode) {
        return new Promise(function(resolve, reject) {
            let sql = "SELECT COUNT(roomCode) AS count FROM roomusers WHERE roomCode = ? LIMIT 1";
            con.query(sql, [
                roomCode
            ], function(err, results) {
                if (err) {
                    reject(new Error(err));
                }
                return resolve(results[0]);
            })
        })
    }
    deleteRoom(con, roomCode) {
        return new Promise(function(resolve, reject) {
            let sql1 = "DELETE FROM rooms WHERE code = ?";
            let sql2 = "DELETE FROM roomusers WHERE roomCode = ?";
            try {
                con.query(sql1, [
                    roomCode
                ])
                con.query(sql2, [
                    roomCode
                ])
                resolve();
            } catch (error) {
                reject();
            }
        })
    }
    async joinInRoom(con, roomCode, userId) {
        return new Promise(function(resolve, reject) {
            let sql = "INSERT INTO roomusers (userId,roomCode)VALUES(?,?)";
            con.query(sql, [
                userId,
                roomCode
            ], function(err) {
                if (err) {
                    reject(new Error(err));
                }
                return resolve();
            })

        })
    }
    removeUserFromRoom(con, roomCode, userId) {
        return new Promise(function(resolve, reject) {
            let sql = "DELETE FROM roomusers WHERE userId=? AND roomCode=?";
            con.query(sql, [
                userId,
                roomCode
            ], function(err) {
                if (err) {
                    reject(new Error(err));
                }
                return resolve();
            })

        })
    }
}

module.exports = new Services;