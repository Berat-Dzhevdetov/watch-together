const jsSHA = require("jssha");
module.exports = {
    isBadWordUsed: (wordToCheck, offensiveWords) => {
        wordToCheck = wordToCheck.toLowerCase();
        Object.keys(offensiveWords).forEach(function(key) {
            offensiveWords[key].forEach(value => {
                if (wordToCheck.includes(value) == true) {
                    throw Error;
                }
            });
        });
        return false;
    },
    sha512: (password) => {
        if (!password) return;
        var hashObj = new jsSHA("SHA-512", "TEXT", { numRounds: 1 });
        hashObj.update(password);
        var hash = hashObj.getHash("HEX");
        return hash;
    },
    getAllRooms: (con) => {
        return new Promise(function(resolve, reject) {
            let sql = "SELECT id,password FROM rooms ORDER BY `timestamp` DESC,id DESC";

            con.query(sql, function(err, results) {
                if (err) {
                    console.log(27);
                    reject(new Error(err));
                }
                return resolve(results);
            })
        })
    },
    getUser: (con, username, callback, password = '') => {
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
    },
    registerUser: (con, username, password, callback) => {
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
    },
    insertCookieCode: (con, id, code, callback) => {
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
    },
    createRandomString: (length) => {
        var result = [];
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result.push(characters.charAt(Math.floor(Math.random() *
                charactersLength)));
        }
        return result.join('');
    },
    getUserDataFromCookie: (con, code) => {
        if (!con || !code) return;
        return new Promise(function(resolve, reject) {
            let sql = "SELECT `id`,`username`,`cookie` FROM `users` WHERE `cookie`=?";

            con.query(sql, [
                code
            ], function(err, results) {
                if (err) {
                    reject(new Error("Error rows is undefined"));
                }
                return resolve(results);
            })
        })

    },
    clearUserCookieFromDb: (con, uid, callback) => {
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
    },
    isLogged: (con, res, cookieName) => {
        return new Promise(function(resolve, reject) {
            let cookie = res.cookies[cookieName];
            if (!cookie || cookie == undefined && typeof cookie != 'string') {
                return resolve(false);
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
}