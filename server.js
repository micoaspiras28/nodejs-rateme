var express = require('express');
var cookieParser =require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var ejs = require('ejs');
var engine = require('ejs-mate');
var session = require('express-session');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(session);
var passport = require('passport');
var flash = require('connect-flash');
var ejsLint = require('ejs-lint');



var app = express();

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/rateme', {useNewUrlParser: true});

require('./config/passport');
require('./secret/secret');

app.use(express.static('public'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.use(cookieParser());

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(expressValidator());

app.use(session({
  secret: 'Thisismytestkey',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({mongooseConnection: mongoose.connection})
}));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());



require('./routes/user')(app, passport);
require('./routes/company')(app);

app.listen(3000, function(){
  console.log('It is running on port 3000');
})
