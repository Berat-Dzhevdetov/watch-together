const app = Sammy('#root', function() {
    this.use('Handlebars', 'hbs');

    this.get('/', function(context) {
        extendedContext(context)
            .then(function() {
                context.rooms = [{
                    roomId: '1',
                    password: true
                }, {
                    roomId: '2',
                    password: false
                }, {
                    roomId: '3',
                    password: true
                }]
                context.isLogged = false;
                this.partial('./templates/home.hbs')
            });
    });
    this.get('/register', function(context) {
        extendedContext(context)
            .then(function() {

                this.partial('./templates/register.hbs')
            });
    });
    this.get('/login', function(context) {
        extendedContext(context)
            .then(function() {

                this.partial('./templates/login.hbs')
            });
    });
    this.get('/create-room', function(context) {
        extendedContext(context)
            .then(function() {
                context.isLogged = true;
                this.partial('./templates/create-room.hbs')
            });
    });
    this.get('/logout', function(context) {
        extendedContext(context)
            .then(function() {
                context.isLogged = true;
                this.partial('./templates/logout.hbs')
            });
    });
})
app.run();

function extendedContext(context) {
    // const user = getUserData();
    // context.isLoggedIn = Boolean(user);
    // context.email = user ? user.email : '';
    return context.loadPartials({
        'header': './templates/header.hbs'
    })
}