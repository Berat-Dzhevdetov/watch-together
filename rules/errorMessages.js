module.exports = {
    requiredUsername: "Please enter your username and try again",
    requiredEmail: "Please enter your email and try again",
    requiredPassword: "Please enter your password and try again",
    invalidUsernameLength: (args) => `Username should be between ${args[0]} and ${args[1]} symbols`,
    invalidEmail: "Please enter your email address in format: yourname@example.com and try again",
    invalidPasswordLength: (args) => `Password should be between ${args[0]} and ${args[1]} symbols`,
    invalidPassword: "Your password must contain at least one number and one capitalized letter",
    emptyForm: "Please enter your credentials above",
    usernameInUse: "Your username is already in use",
    emailInUse: "Your email is already in use",
    usernameAndEmailAreInUse: "Sorry but your username and email are currenly in use",
    undeliveredMail: "Sorry we couldn't send you an email, please try again",
    notVerifiedEmail: "To log in you need to confirm your mail",
    nonExistentProfile: "We did not find an account matching this information",
    emptyEmailOrUserNameLogin: "Please put your email address or username",
    offensiveWordsUsed: "Sorry but you cannot use bad words"
}