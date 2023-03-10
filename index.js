// import dependencies you will use
const express = require('express');
const path = require('path');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey("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");
//const bodyParser = require('body-parser'); // not required for Express 4.16 onwards as bodyParser is now included with Express
// set up expess validator
const {check, validationResult} = require('express-validator'); //destructuring an object

const fileUpload = require('express-fileupload'); // for file upload

//steps for adding login logout
const session = require('express-session'); // session

const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/bloodbanksystem');

const BloodBank = mongoose.model('BloodBank', {
    name: String,
    address1 : String,
    address2 : String,
    city : String,
    province : String,
    postalCode : String,
    email : String,
    phoneNumber : String,
    openingHour : String,
    closingHour : String,
    password : String
});

const Appointment = mongoose.model('Appointment', {
    userid: String,
    username: String,
    useremail: String,
    bloodbankid : String,
    bloodbankname: String,
    bloodbankaddress1 : String,
    bloodbankcity : String,
    bloodbankprovince : String,
    bloodbankpostalCode : String,
    bloodbankemail : String,
    bloodbankpnone: String,
    bookingdate : String,
    status: String
});

const User = mongoose.model('User', {
    name: String,
    dateOfBirth : String,
    gender:String,
    email : String,
    phoneNumber : String,
    password: String,
    
});

// set up variables to use packages
var myApp = express();

myApp.use(express.urlencoded({extended:false})); // new way after Express 4.16
myApp.use(fileUpload());// for file upload
// set path to public folders and view folders

myApp.use(session({
    secret: 'secretkey1245', // should be unique for each application
    resave: false,
    saveUninitialized: true
}));

myApp.set('views', path.join(__dirname, 'views'));
//use public folder for CSS etc.
myApp.use(express.static(__dirname+'/public'));
myApp.set('view engine', 'ejs');

// set up different routes (pages) of the website
// render the home page
myApp.get('/',function(req, res){
    res.render('login'); 
});

// render login page
myApp.get('/login',function(req, res){
    var pageData = {
        error : ''
    }
    res.render('login', pageData); 
});

// render login page
myApp.get('/loginUser',function(req, res){
    var pageData = {
        error : ''
    }
    res.render('loginUser', pageData); 
});

// login submit page
myApp.post('/loginsubmit',[
    check('username', 'Please enter username.').not().isEmpty(),
    check('password', 'Please enter password.').not().isEmpty()
],function(req, res){

    //fetch all the form fields
    var email = req.body.username;
    var password = req.body.password;

    //find in database if it exits
    BloodBank.findOne({email: email, password: password}).exec(function(err, bloodBank){
    
        if(bloodBank){ // would be true if user is found in admin user
            // save in session
            req.session.bloodbankemail = bloodBank.email;
            req.session.bloodbankid = bloodBank.id;
            req.session.loggedId = true;
            res.redirect('/bloodbankhome');
        }
        else{
            var pageData = {
                error : 'login credentials are not correct.'
            }
            res.render('login', pageData);
        }
       
    });

    
});

// login submit user page
myApp.post('/loginsubmituser',[
    check('username', 'Please enter username.').not().isEmpty(),
    check('password', 'Please enter password.').not().isEmpty()
],function(req, res){

    //fetch all the form fields
    var email = req.body.username;
    var password = req.body.password;

    //find in database if it exits
    User.findOne({email: email, password: password}).exec(function(err, adminuser){
    
        if(adminuser){ // would be true if user is found in admin user
            // save in session
            req.session.userid = adminuser._id;
            req.session.useremail_user = adminuser.email;
            req.session.username_user = adminuser.name;
            req.session.loggedId_user = true;
            res.render('appointment');
        }
        else{
            var pageData = {
                error : 'login credentials are not correct.'
            }
            res.render('loginUser', pageData);
        }
       
    });

    
});

// render view orders page
myApp.get('/bloodbankhome',function(req, res){
    if(req.session.loggedId){
         res.render('bloodbankhome');
    }
    else{
        res.redirect('/login');
    }
});



// render delete page
myApp.get('/delete/:id',function(req, res){
    if(req.session.loggedId){

        var id = req.params.id;
        Order.findByIdAndDelete({_id: id}).exec(function(err, contacts){
           
            var message = 'Sorry, Order has not been found.';

            if(contacts){
                message = 'Order has been deleted successfully.';
            }
            var pageData = {
                message : message
            }
            res.render('deletesuccess', pageData);
        });
    }
    else{
    res.redirect('/login');
    }
});

// logout 
myApp.get('/logout',function(req, res){
    // clear session
    req.session.username = '';
    req.session.loggedId = false;
    res.redirect('/login'); 
});

myApp.get('/signupbloodbank',function(req, res){
    var pageData = {
        error : ''
    }
    res.render('signupbloodbank', pageData); 
});

myApp.get('/signupUser',function(req, res){
    var pageData = {
        error : ''
    }
    res.render('signupUser', pageData); 
});



myApp.post('/bloodbankSignup',[
],function(req, res){

    //fetch all the form fields
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    var confirmpassword = req.body.confirmpassword;

    //find in database if it exits
    BloodBank.findOne({email: email}).exec(function(err, bloodbank){
    
        if(bloodbank){ 

            var pageData = {
                error : 'Blood Bank with same email already exists.'
            }
            res.render('signupbloodbank', pageData);
        }
        else{
            var pageData = {
                name : name,
                email : email,
                password : password,
                confirmpassword : confirmpassword,
                address1 : null,
                address2 : null,
                city : null,
                province : null,
                postalCode : null,
                phoneNumber : null,
                openingHour : null,
                closingHour : null,
            }
        
            var bloodBank = new BloodBank(pageData); 
            bloodBank.save();

            res.render('login');
        }
       
    });

    
});

myApp.get('/profile',function(req, res){
    if(req.session.loggedId){
        BloodBank.findOne({email: req.session.bloodbankemail}).exec(function(err, bloodbank){ 
            var userData = {
                name: bloodbank.name,
                address1 : bloodbank.address1,
                address2 : bloodbank.address2,
                city : bloodbank.city,
                province : bloodbank.province,
                postalCode : bloodbank.postalCode,
                phoneNumber : bloodbank.phoneNumber,
                openingHour : bloodbank.openingHour,
                closingHour : bloodbank.closingHour
            };
    
            var pageData = {
                userData: userData
            }
            res.render('profile', pageData);
        });
    }
    else{
        res.redirect('/login');
    }
});

myApp.post('/profileSubmit',[
],function(req, res){

    //fetch all the form fields
    var name =  req.body.name;
    var address1 =  req.body.addressline1;
    var address2 =  req.body.addressline2;
    var city =  req.body.city;
    var province =  req.body.province;
    var postalCode =  req.body.postalCode.toLowerCase();
    var phoneNumber =  req.body.phoneNumber;
    var openingHour =  req.body.openingHour;
    var closingHour =  req.body.closingHour;
    console.log(address1);
    //find in database if it exits
    BloodBank.findOne({email: req.session.username}).exec(function(err, bloodbank){
    
        bloodbank.name=name,
        bloodbank.address1 =address1,
        bloodbank.address2 =address2,
        bloodbank.city =city,
        bloodbank.province =province,
        bloodbank.postalCode =postalCode,
        bloodbank.phoneNumber =phoneNumber,
        bloodbank.openingHour =openingHour,
        bloodbank.closingHour =closingHour
        bloodbank.save();
        res.redirect('/bloodbankhome');
    });
});


myApp.post('/userSignup',[
],function(req, res){

    //fetch all the form fields
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    var confirmpassword = req.body.confirmpassword;

    //find in database if it exits
    User.findOne({email: email}).exec(function(err, user)
    {
        console.log(user);
        if(user)
        { 
            var pageData = {
                error : 'User with same email already exists.'
            }
            res.render('signupUser', pageData);
        }
        else if(password != confirmpassword)
        {
            var pageData = {
                error : 'Password and confirm password not matching.'
            }
            res.render('signupUser', pageData);
        }
        else{
            console.log("user signup start");
            var pageData = {
                name : name,
                dateOfBirth :'',
                gender:'',
                email : email,
                phoneNumber :'',
                password : password
                
            }
            console.log(pageData);
            var user = new User(pageData); 
            user.save();
            res.render('loginUser');
        }
       
    });
});

// render view orders page
myApp.get('/appointment',function(req, res){
    res.render('appointment'); 
});

// login submit user page
myApp.post('/postalcodesearch',[],function(req, res){
    //fetch all the form fields
    var postalcode = req.body.postalcode;
    //find in database if it exits
    BloodBank.find({postalCode: postalcode.toLowerCase()}).exec(function(err, bloodbanks){
        if(bloodbanks){ // would be true if bloodbank is found 
            res.render('selectbloodbank', {bloodbanks: bloodbanks});
        }
        else{
            var pageData = {
                error : 'Blood bank is not available in near by area.'
            }
            res.render('appointment', pageData);
        }
       
    });
});



myApp.get('/select/:id',function(req, res){
    
    var id = req.params.id;

    var bloodBankData = {
        bloodbankid : id
    };

    BloodBank.findOne({_id: id}).exec(function(err, bloodbank){
        if(bloodbank){ // would be true if bloodbank is found 
           console.log(bloodbank);
           res.render('selectdates', {bloodbankData: bloodbank});
        }      
    });
});

myApp.post('/select/bookappointment',[],function(req, res){

    console.log(123);
    // if(req.session.loggedId_user){

    //fetch all the form fields
    var id = req.body.bloodbankid;
    var bookingdate = req.body.date;
    var userid = req.session.userid;
    var bloodbankName= req.body.bloodbankname;
    var bloodbankaddress1= req.body.bloodbankaddress1;
    var bloodbankcity= req.body.bloodbankcity;
    var bloodbankprovince= req.body.bloodbankprovince;
    var bloodbankpostalCode= req.body.bloodbankpostalcode;
    var bloodbankemail= req.body.bloodbankemail;
    var bloodbankpnone= req.body.bloodbankphonenumber;
    var username = req.session.username_user;
    var useremail = req.session.useremail_user;

    //find in database if it exits
            var pageData = {
                userid: userid,
                username: username,
                useremail: useremail,
                bloodbankid : id,
                bloodbankname: bloodbankName,
                bloodbankaddress1 : bloodbankaddress1,
                bloodbankcity : bloodbankcity,
                bloodbankprovince : bloodbankprovince,
                bloodbankpostalCode : bloodbankpostalCode,
                bloodbankemail : bloodbankemail,
                bloodbankpnone: bloodbankpnone,
                bookingdate : bookingdate,
                status: "Confirmed"
            }
        
            console.log(pageData);

            var user = new Appointment(pageData); 
            user.save();

            let message = 'Hello '+ username + ','
                          +'Your appointment to donate blood is booked on ' + bookingdate
                          +'Please arrive at least 15 min early at'
                          + bloodbankName +
                          + bloodbankaddress1 +
                          + bloodbankcity +', ' + bloodbankprovince
                          + bloodbankpnone;

            const msg = {
                to: useremail,
                from: 'rushaytrivedi@gmail.com',
                subject: 'Appointment Booked on - ' + bookingdate,
                html: '<h2>Appointment Booked</h2><br/><p1>'+ message +'</p1>',
              };
              sgMail.send(msg);

            res.render('userhome');
        
        // }
        // else{
        //     res.render('loginUser');
        // }
    });

    /*myApp.get('/userAppointments',function(req, res){
        //fetch from session
        console.log(123);
        /*var userid = req.session.userid;
        //find in database if it exits
        Appointment.find({userid: userid}).exec(function(err, appointments){
            console.log(appointments);
            if(appointments){ // would be true if bloodbank is found 
                res.render('userAppointments', {appointments: appointments});
            }
            else{
                var pageData = {
                    error : 'No appointment booked.'
                }
                res.render('appointment', pageData);
            }
           
        });
    
        res.render('userAppointment'); 
    });
*/
    
myApp.get('/bloodBankAppointments',function(req, res){
    //fetch from session
    var userid = req.session.bloodbankid;
    console.log(userid);
    //find in database if it exits
    Appointment.find({bloodbankid: userid}).exec(function(err, appointments){
        console.log(appointments);
        if(appointments){ // would be true if bloodbank is found 
            res.render('bloodBankAppointments', {appointments: appointments});
        }
        else{
            var pageData = {
                error : 'No appointment booked.'
            }
            res.render('appointment', pageData);
        }
        
        
    });

});

myApp.get('/userAppointments',function(req, res){
    //fetch from session
    //fetch from session
    console.log(123);
    var userid = req.session.userid;
    //find in database if it exits
    Appointment.find({userid: userid}).exec(function(err, appointments){
        console.log(appointments);
        if(appointments){ // would be true if bloodbank is found 
            res.render('userAppointment', {appointments: appointments});
        }
        else{
            var pageData = {
                error : 'No appointment booked.'
            }
            res.render('appointment', pageData);
        }
       
    });


});



// start the server and listen at a port
myApp.listen(8081);

//tell everything was ok
console.log('Browse website on localhost at port 8081....');


