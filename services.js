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
        var hashObj = new jsSHA("SHA-512", "TEXT", { numRounds: 1 });
        hashObj.update(password);
        var hash = hashObj.getHash("HEX");
        return hash;
    },
    getAllRooms: (con, callback) => {
        let sql = "SELECT id,password FROM rooms ORDER BY `timestamp` DESC,id DESC";

        con.query(sql, function(err, results) {
            if (err) {
                throw err;
            }
            return callback(results);
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
    }
}