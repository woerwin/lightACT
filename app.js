
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
//var userRoute = require('./routes/user');
var http = require('http');
var path = require('path');
var exphbs  = require('express3-handlebars');
var configs = require('./config/config');
var flash = require('connect-flash');
var util = require('util');
var log4js = require('log4js');

var MongoStore = require('connect-mongo')(express);

var fs = require('fs');
//var accessLog = fs.createWriteStream('logs/access.log', {flags: 'a'});
var errorLog = fs.createWriteStream('logs/error.log', {flags: 'a'});

var app = express();

// all environments
//app.set('port', process.env.PORT || 3000);
if(process.env.APP_PORT){
    app.set('port', process.env.APP_PORT);//BAE ?
}else{
    app.set('port', process.env.PORT || 3000);
}
app.set('port', 18080);//BAE
//console.log(util.inspect(process.env));

app.set('env','development');//production development process.env.NODE_ENV

app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'ejs');

/*
//Helpers
var hbs = exphbs.create({
    // Specify helpers which are only registered on this instance.
    helpers: {
        foo: function () { return 'FOO!'; },
        bar: function () { return 'BAR!'; }
    }
});
app.engine('html', hbs.engine);
*/

app.engine('html', exphbs({
    layoutsDir: 'views/layouts/',
    partialsDir: 'views/partials/',
    layout: true,
    defaultLayout: 'layout',
    extname: '.html'
}));
app.set('view engine', 'html');
//app.enable('view cache');

app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
app.use(express.logger('dev'));
//app.use(express.logger({stream: accessLog}));

app.use(express.compress());
//app.use(express.json());
//app.use(express.urlencoded());
//app.use(express.multipart());
app.use(express.bodyParser());
//app.use(express.bodyParser({ keepExtensions: true, uploadDir: './public/images' }));
app.use(express.methodOverride());

app.use(express.cookieParser('secretQAZ!'));
app.use(express.session({
   secret: configs.cookieSecret,
   key: configs.cookieName,//cookie name
   cookie: {path: '/',httpOnly: true,maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
   store: new MongoStore({
     db: configs.dbName,
     collection: "sessions",
     host: configs.dbHost,
     port: configs.dbPort,
     username: configs.dbUser,
     password: configs.dbPWD,
     auto_reconnect:configs.dbAutoReconnect,
     ssl:configs.dbSSL,
     //url: configs.dbUrl,
     stringify:true
   })
}));
app.use(flash());
//app.use(express.csrf());//req.csrfToken()  validated

log4js.configure({
  appenders: [
    { type: 'console' },
    {
      type: 'file',
      filename: 'logs/access.log', 
      maxLogSize: 1024,
      backups:4,
      category: 'normal' 
    }
  ]//,
  //replaceConsole: true
});
//var logger = log4js.getLogger('normal');
//logger.setLevel('INFO');
app.use(log4js.connectLogger(log4js.getLogger('normal'), {level:'auto', format:':method :url'}));//level:log4js.levels.INFO

app.use(app.router);
//app.use(express.directory('public'))
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (err, req, res, next) {
  var meta = '[' + new Date() + '] ' + req.url + '\n';
  errorLog.write(meta + err.stack + '\n');
  next();
});

/*
// all environments
app.configure(function(){
  app.set('comm_conf', '0');
});
// development only
app.configure('development', function(){
  app.set('env_conf', '1');
});
// production only
app.configure('production', function(){
  app.set('env_conf', '2');
});
*/

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// development only
if ('production' == app.get('env')) {
  console.log('production env...');
}

app.locals({
    title: 'home',
    user: '',
    is_admin: 0,
    error: '',
    success: ''
});

app.all('*',function(req,res,next){
    res.locals.user = req.session.user;
    res.locals.is_admin = req.session.is_admin ? req.session.is_admin : 0;
    res.locals.error = req.flash('error').toString();
    res.locals.success = req.flash('success').toString();
    next();
});

//app.get('/', routes.index);
//app.get('/users', userRoute.list);
routes(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log(new Date() + '  Express server listening on port ' + app.get('port'));
});
