const app = Sammy('#container', function() {
    this.use('Handlebars', 'hbs');

    this.get('/', function(context) {
        extendedContext(context)
    })
})
app.run();

function extendedContext(context) {
    const user = getUserData();
    context.isLoggedIn = Boolean(user);
    context.email = user ? user.email : '';
    return context.loadPartials({
        'header': '/templates/header.hbs'
    })
}