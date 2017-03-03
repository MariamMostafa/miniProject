var express = require('express');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var path = require('path');
var session = require('express-session');
var fs = require('fs');
var mime = require('mime');
var mongoJS = require('mongojs');
db = mongoJS('miniproject',['students']);
var multer  = require('multer')
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() +  "." + mime.extension(file.mimetype)) //Appending .(fileExtension)
  }
});
var upload = multer({ dest: __dirname + '/public/uploads/',  storage: storage });


var app = express();

// Veiwing Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, 'views'));

// Body Parser Middleware -- for documentation
app.use(bodyParser.json()); // handels parsing json cotents
app.use(bodyParser.urlencoded({keepExtensions: true,extended: false}));

// Global Vars
app.use(function(req, res, next){
	res.locals.errors = null;
	res.locals.wrng = null;
	res.locals.regSucc = null;
	res.locals.inSucc = null;
	res.locals.err = null;
	res.locals.name = null;
	res.locals.xx = null;
	res.locals.array = null;
	next();
});


// Express Validator Middleware
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

app.use(session({secret: 'Heyy'}));


// for JQuerris, HTML & CSS files
app.use(express.static(path.join(__dirname,'public')));

app.get('/signIn',function(req,res){
	res.render('signIn.ejs');
});


app.get('/register',function(req,res){
	res.render('register.ejs');
});

app.post('/signIn',function(req,res){

	db.students.createIndex({username: 1}, {unique: true}); 
	req.checkBody('username', 'Username is Required').notEmpty();
	req.checkBody('password', 'Password is Required').notEmpty();

	errors = req.validationErrors();

	if(errors){

			res.render('signIn.ejs', { 
			errors : errors,
			inSuccess : false
			});

	} else {
	
		db.students.find({username : req.body.username},function(err,doss){
			if(doss.length == 0){
				res.render('signIn',{
							inSucc : false
						});
					

			}
			else {
				
				db.students.findOne({username: req.body.username}, function(err, doc) {
   				var s = doc.password.toString();
   				var nn = null;
   		
   				if(doc.work.length == 0)
   					nn = true;
   			
   				else 
   					nn = false;

   					console.log(nn);
   				if(s ===  req.body.password.toString()){
					
					req.session.username = req.body.username;
					res.render('signIn',{
							inSucc : true,
							xx : nn
						});

					
   				}else 
					{
						res.render('signIn',{
							wrng : true,
							xx : nn
						});
					

					}

				});

			}

		});
		
	}
 
});


app.post('/register', upload.single("file"), function(req,res){

	db.students.createIndex({username: 1}, {unique: true}); 
	req.checkBody('username', 'Username is Required').notEmpty();
	req.checkBody('password', 'Password is Required').notEmpty();
	req.checkBody('email', 'Email is Required').notEmpty();
	req.checkBody('gender', 'Choose a gender').notEmpty();

	errors = req.validationErrors();

	if(errors){  

			res.render('register.ejs', { 
			errors : errors,
			regSucc : false
			});

	}else{

		
		var newStudent = {
			name : null,
			username : req.body.username,
			password : req.body.password,
			email : req.body.email,
			gender : req.body.gender,
			picture : null,
			work : []

			
		}


		db.students.createIndex({username: 1}, {unique: true}); 

		db.students.insert(newStudent,function(err, result){
			if(err){
				console.log('This username is already taken.');

				res.render('register.ejs', { 
					use :'This username is already taken.',
					taken : false
				});

			}else {

				req.session.username = req.body.username;				
				res.render('register.ejs', { 
					regSucc : true
				});


		
		}

			});

	}
});

app.post('/createPortofolio', upload.any(), function(req,res){
	if(req.body.name)
		name = true;
	else 
		name = false;

	var ss = null;	

		if(req.files[0]){
			if(req.files[0].fieldname === 'pp')
				ss = null;
			else if(req.files[0].fieldname === 'ss')
				ss = true;
		} 

		if(req.files[1]){
			if(req.files[1].fieldname === 'ss')
				ss = true;
		}


		if(!ss && !(req.body.link)){

				console.log("error");
				res.render('createPortofolio',{
				err : true,
				name : name
			});

	} else {

		var pppp = null;
		var ssh = null;
		var li = null;
		var des = null;

		if(req.files[0]){
			if(req.files[0].fieldname === 'pp')
				pppp = req.files[0].filename;
			else if(req.files[0].fieldname !== 'pp')
				pppp = 'null.gif';
			else if(req.files[0].fieldname === 'ss')
				ssh = req.files[0].filename;

		} 

		if(req.files[1]){
			if(req.files[1].fieldname === 'ss')
				ssh = req.files[1].filename;
		}else{
			ssh = 'null.png';
		}

		if(req.body.link)
			li = req.body.link;
		else 
			li = "No link is added";


		if(req.body.description)
			des = req.body.description;

		else 
			des = "No description is added";

		db.students.update({username : req.session.username },
 		 { "$addToSet" : { work : {
 		 					screenshot :  ssh,
 		 					link : li,
 		 					description : des }
 		 				}
 		 });


		db.students.update({username : req.session.username },
 		 { "$set" : { name : req.body.name,
 		 			picture : pppp }
 		 });

		console.log("Added");
		res.render('createPortofolio',{
			err : false,
			name : name 
		});
	}
	
});

app.get('/createPortofolio',function(req,res){
		res.render('createPortofolio.ejs');
});

app.get('/user',function(req,res){
	db.students.findOne({ username : req.session.username }, function(err, doc){
		var em = doc.email;
		var tmp = doc.work;
		var gg = doc.gender;

		if(doc.picture == null || doc.picture === null)
			var p = "null.gif";
		else
			var p = doc.picture.toString();
	
		res.render('user', {
			usern : req.session.username,
			ppp : p,
			emailx : em,
			xxx : tmp,
			genderx : gg

		});

	});
	
});

app.post('/user',function(req,res){
		res.redirect('/addWork');

});


app.get('/index', function(req,res){
	res.render('index');
});

app.get('/addWork', function(req,res){
	res.render('addWork');

});

app.get('/signOut', function(req,res){
	req.session.destroy(function(err){
		console.log('destroyed');
		res.redirect('/index');
	});
});

app.post('/addWork', upload.single("file"), function(req,res){

	if((req.body.link == null  && req.file == null)){  
		console.log("error");
		res.render('addWork',{
			err : true
		});


	}else {

		var ssh = null;
		var li = null;
		var des = null;

		if(req.file)
			ssh = req.file.filename;
		else 
			ssh = "null.png";

		if(req.body.link)
			li = req.body.link;

		else 
			li = "No link is added";



		if(req.body.description)
			des = req.body.description;

		else 
			des = "No description is added";




		console.log(ssh + " " + li + " " + des);
	
		db.students.update({username : req.session.username },
 		 { "$addToSet" : { work : {
 		 					screenshot :  ssh,
 		 					link : li,
 		 					description : des }
 		 				}
 		 });
		console.log("Added");
		res.render('addWork',{
			err : false
		});
	}

});


app.get('/viewWorks', function(req,res){
	var arr = [];
	db.students.find(function(err,doc){
		doc.forEach(function(x){
			if(x.work.length > 0)
				arr.push(x);
		})
		res.render('viewWorks', {
			array : arr
		});

	})
	
});

app.listen(8888,function(){
	console.log('Server Started on Port 8888 ;)');
});		






