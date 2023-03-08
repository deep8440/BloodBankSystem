// import dependencies you will use
const express = require('express');
const path = require('path');
//const bodyParser = require('body-parser'); // not required for Express 4.16 onwards as bodyParser is now included with Express
// set up expess validator
const {check, validationResult} = require('express-validator'); //destructuring an object

const fileUpload = require('express-fileupload'); // for file upload

//steps for adding login logout
const session = require('express-session'); // session

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/bloodbanksystem');

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
    bloodbankid : String,
    
});

const User = mongoose.model('User', {
    name: String,
    dateOfBirth : String,
    gender:String,
    email : String,
    phoneNumber : String,
    
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

myApp.post('/checkout', [
    check('name', 'Please enter name').notEmpty(),
    check('phone', 'Phone number not in correct format it must be in xxx-xxx-xxxx').matches(/^[\d]{3}-[\d]{3}-[\d]{4}$/),
    ], function(req,res){
    console.log(req.body);

    //fetch data
    var mouse = req.body.mouse;
    var mouseprice = req.body.mouseprice.slice(1);
    var mouseqty = req.body.mouseqty;
    var pencil = req.body.pencil;
    var pencilprice = req.body.pencilprice.slice(1);
    var pencilqty = req.body.pencilqty;
    var lamp = req.body.lamp;
    var lampprice = req.body.lampprice.slice(1);
    var lampqty = req.body.lampqty;

    var name = req.body.name;
    var phone = req.body.phone;
   

    // check qauntity
    if(mouseqty == 0 && pencilqty == 0 && lampqty == 0){
        var errorData = [{
            msg : 'Please enter quantity for checkout'
        }];
        var userData = {
            name: name,
            phone : phone,
            mouseqty : mouseqty,
            pencilqty : pencilqty,
            lampqty : lampqty
        };
        var pageData = {
            errors: errorData,
            userData: userData
        }
        //console.log(errorData);
        res.render('home', pageData);
    }
    else{
        const errors = validationResult(req);
        if(!errors.isEmpty()){ // if there are errors

            var errorData = errors.array();
            var userData = {
                name: name,
                phone : phone,
                mouseqty : mouseqty,
                pencilqty : pencilqty,
                lampqty : lampqty
            }
            var pageData = {
                errors: errorData,
                userData: userData
            }
            //console.log(errorData);
            res.render('home', pageData);
        }
        else{
            var tax = 0.13;

            var subTotal = 0;

            // calculate sub total
            if(mouseqty != 0){
                subTotal += parseInt(mouseprice) * mouseqty;
            }

            if(pencilqty != 0){
                subTotal += parseInt(pencilprice) * pencilqty;
            }
            if(lampqty != 0){
                subTotal += parseInt(lampprice) * lampqty;
            }

            // calculate total tax
            var taxTotal = subTotal * tax;

            // calculate total
            var total =  subTotal + taxTotal;

            // create object to generate receipt
            var userData = {
                name: name,
                phone : phone,
                mouse : mouse,
                pencil : pencil,
                lamp : lamp,
                mouseqty : mouseqty,
                pencilqty : pencilqty,
                lampqty : lampqty,
                mouseprice : mouseprice,
                pencilprice : pencilprice,
                lampprice : lampprice,
                subTotal : subTotal.toFixed(2),
                taxTotal: taxTotal.toFixed(2),
                total: total.toFixed(2)
            }

            // save order details in database
            var newOrder = new Order(userData); 
            newOrder.save();

            res.render('orderreceipt', userData);
        }
    }
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
    BloodBank.findOne({email: email, password: password}).exec(function(err, adminuser){
    
        if(adminuser){ // would be true if user is found in admin user
            // save in session
            req.session.username = adminuser.email;
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
            req.session.username_user = adminuser.email;
            req.session.loggedId_user = true;
            res.redirect('/userhome');
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
        BloodBank.findOne({email: req.session.username}).exec(function(err, bloodbank){ 
            var userData = {
                name: bloodbank.name,
                address1 : bloodbank.address1,
                address2 : bloodbank.address2,
                city : bloodbank.city,
                province : bloodbank.province,
                postalCode : bloodbank.postalCode.toLowerCase(),
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
    var postalCode =  req.body.postalCode;
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
    User.findOne({email: email}).exec(function(err, user){
    
        if(user){ 
            var pageData = {
                error : 'User with same email already exists.'
            }
        }
        else{
            var pageData = {
                name : name,
                email : email,
                password : password,
                confirmpassword : confirmpassword
            }
        
            var user = new U
            ser(pageData); 
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

// start the server and listen at a port
myApp.listen(8080);

//tell everything was ok
console.log('Browse website on localhost at port 8080....');


