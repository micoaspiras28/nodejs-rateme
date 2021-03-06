var formidable = require('formidable');
var path = require('path');
var fs = require('fs');

var Company = require('../models/company');

module.exports = (app) => {
    app.get('/company/create', (req, res) => {
        var success = req.flash('success');
        res.render('company/company', {title: 'Company Registration', user: req.user,
        success:success, noErrors: success.length > 0});
    });

    app.post('/company/create', (req, res) => {
        var newCompany = new Company();
        newCompany.name = req.body.name;
        newCompany.address = req.body.address;
        newCompany.city = req.body.city;
        newCompany.country = req.body.country;
        newCompany.sector = req.body.sector;
        newCompany.website = req.body.website;
        newCompany.image = req.body.upload;

        newCompany.save((err) => {
            if(err){
                console.log(err);
            }
            console.log(newCompany);
            
            req.flash('success', 'Company data has been added');
            res.redirect('/company/create');
        })
    });
    
    app.post('/upload', (req, res) => {
        var form = new formidable.IncomingForm();

        form.uploadDir =  path.join(__dirname, '../public/uploads');

        form.on('file', (field, file) => {
            fs.rename(file.path, path.join(form.uploadDir, file.name), (err) => {
                if(err){
                    throw err
                }
                console.log('File has been renamed');
                
            });
        }),
        form.on('error', (err) => {
            console.log('An error occured', err);
        }),
        form.on('end', () => {
            console.log('File upload was successful');
        });
        form.parse(req);
    });

    app.get('/companies', (req, res) => {
        Company.find({}, (err, result) => {
            console.log(result);
            res.render('company/companies', {title: 'All Companies || Rate Me', user: req.user, data: result})
        });
    });

    app.get('/company-profile/:id', (req, res) => {
        res.render('company/company-profile', {title: 'Company Profile || Rate Me', user: req.user, id: req.params.id});
    });

    app.get('/company/register-employee/:id', (req, res) => {
        Company.findOne({'_id':req.params.id }, (err, data) => {
             res.render('company/register-employee', {title: 'Employee Registration || Rate Me', user: req.user, data: data});
        })
    });
}