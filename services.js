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
    }
}