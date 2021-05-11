module.exports = {
    minLengthOfUsername: 4,
    maxLengthOfUsername: 12,
    minLengthOfPassword: 6,
    maxLengthOfPassword: 16,
    passwordRegex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/,
    emailRegex: /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
    urlRegex: /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig,
    secsToNextEmail: 60,
    cookieName: 'watchtogetherapp'
}