var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var async = require('async');


var crypto = require('crypto');
var User = require('../models/user');
var secret = require('../secret/secret');

module.exports = (app, passport) => {

    app.get('/', (req, res, next) => {
           res.render('index', {title: 'Index || RateMe'});
    });

    app.get('/signup', (req, res) => {
        var errors = req.flash('error'); //to get the error message
        console.log(errors);
        res.render('user/signup', {title: 'Signup || RateMe', messages: errors, 
        hasErrors: errors.length > 0});
    });

    app.post('/signup', validate, passport.authenticate('local.signup', {
        successRedirect: '/home',
        failureRedirect: '/signup',
        failureFlash: true
    }));
    
    app.get('/login', (req, res) => {
        var errors = req.flash('error'); //to get the error message
        res.render('user/login', {title: 'Login || RateMe', messages: errors, 
        hasErrors: errors.length > 0});
    });

    app.post('/login', loginValidation, passport.authenticate('local.login', {
        successRedirect: '/home',
        failureRedirect: '/login',
        failureFlash: true
    }));

    app.get('/home', (req, res) => {
        res.render('home', {title: 'Home || RateMe'});
    });

    app.get('/forgot', (req, res) => {
        var errors = req.flash('error'); //to get the error message
        var info = req.flash('info');
        res.render('user/forgot', {title: 'Request Password Reset', messages: errors, 
        hasErrors: errors.length > 0, info: info, noErrors: info.length > 0 });
    });
    //Creating token for reset password
    app.post('/forgot', (req, res, next) =>{
        async.waterfall([
            function(callback){
                crypto.randomBytes(20,(err, buf) => {
                    var rand = buf.toString('hex');
                    callback(err, rand);
                });
            },
            // Validate user email if it is exist 
            function(rand, callback){
                User.findOne({'email':req.body.email}, (err, user) => {
                    if(!user){
                        req.flash('error', 'No account exist or email is invalid');
                        return res.redirect('/forgot');
                    }
                    // Set random token 
                    user.passwordResetToken = rand;
                    user.passwordResetExpires = Date.now() + 60*60*1000;

                    user.save((err) => {
                        callback(err, rand, user)
                    });
                })
            },
            //sending token to users email
            function(rand, user, callback){
                var smtpTransport = nodemailer.createTransport({
                    service: 'gmail', 
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: true,
                    requireTLS: true,
                    auth: {
                        user: secret.auth.user,
                        pass: secret.auth.pass
                    }
                });

                var mailOptions = {
                    to: req.body.email,
                    from: 'RateMe ' + '<' + secret.auth.user + '>',
                    subject: 'RateMe Application Password Reset Token',
                    text: 'You have requested for password reset token. \n\n' +
                            'Please click on the link to complete the process: \n\n' +
                            'http://localhost/reset/' +rand+'\n\n' 
                };
                
                smtpTransport.sendMail(mailOptions, (err, response) => {
                    req.flash('info', 'A password reset token has been sent to ' + user.email);
                    return callback(err, user);
                });
            }
        ], (err) => {
            if(err){
                return next(err);
            }
            res.redirect('/forgot');
        })
    });
}

function validate(req, res, next){
    req.checkBody('fullname', 'Fullname is Required').notEmpty();
    req.checkBody('fullname', 'Fullname Must Not Be Less Than 5').isLength({min:5});
    req.checkBody('email', 'Email is Required').notEmpty();
    req.checkBody('email', 'Email is Invalid').isEmail();
    req.checkBody('password', 'Password is Required').notEmpty();
    req.checkBody('password', 'Password Must Not Be Less Than 5').isLength({min:5});
    // req.check('password', 'Password Must Contain at least 1 Number.').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{5,}$/, "i");
    
    var errors = req.validationErrors();

    if(errors){
        var messages = [];
        errors.forEach((error) => {
            messages.push(error.msg);
        });

        req.flash('error', messages);
        res.redirect('/signup');
    }else{
        return next();
    }
}

function loginValidation(req, res, next){
    req.checkBody('email', 'Email is Required').notEmpty();
    req.checkBody('email', 'Email is Invalid').isEmail();
    req.checkBody('password', 'Password is Required').notEmpty();
    req.checkBody('password', 'Password Must Not Be Less Than 5').isLength({min:5});
    // req.check('password', 'Password Must Contain at least 1 Number.').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{5,}$/, "i");
    
    var loginErrors = req.validationErrors();

    if(loginErrors){
        var messages = [];
        loginErrors.forEach((error) => {
            messages.push(error.msg);
        });

        req.flash('error', messages);
        res.redirect('/login');
    }else{
        return next();
    }
}