var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');
var SM = require('./modules/save-manager');
var TemplateManager = require('./modules/template-manager');
var TeacherManager = require('./modules/teacher-manager');
var HM = require('./modules/hints-manager');

module.exports = function(app) {

// main login page //
	app.get('/', function(req, res){
	// check if the user's credentials are saved in a cookie //
		if (req.cookies.user == undefined || req.cookies.pass == undefined){
			res.render('login', { title: 'Hello - Please Login To Your Account' });
		} else {
	// attempt automatic login //
			AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
				if (o != null){
				    req.session.user = o;
					res.redirect('/home');
				}	else{
					res.render('login', { title: 'Hello - Please Login To Your Account' });
				}
			});
		}
	});
	
	app.post('/', function(req, res){
		AM.manualLogin(req.body['user'], req.body['pass'], function(e, o){
			if (!o){
				res.status(400).send(e);
			}	else{
				req.session.user = o;
				if (req.body['remember-me'] == 'true'){
					res.cookie('user', o.user, { maxAge: 900000 });
					res.cookie('pass', o.pass, { maxAge: 900000 });
				}
				res.status(200).send(o);
			}
		});
	});
	
// logged-in user homepage //

	app.get('/home', function(req, res) {
		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		} else{
			res.render('home', {
				title : 'Biggerpy Python Editor',
				udata : req.session.user
			});
		}
	});

	app.post('/home/save', function(req, res) {
		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			// NOT SAVED!
			//req.session.?
		} else {
			SM.save(req.session.user, req.body['entry'], req.body['data'], function(e, o) {
				if (e) {
					res.status(400).send('error-saving-code');
				} else {
					// Saved
					res.status(200).send('ok');
				}
			});
		}
	});

	app.post('/home/load', function(req, res) {
		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			// NOT LOADED!
			//req.session.?
		} else {
			SM.load(req.session.user, req.body['entry'], function(e, o) {
				if (e) {
					res.status(200).send(null);
				} else {
					// Loaded
					res.status(200).send(o)
				}
			});
		}
	});

	app.post('/templates', function(req, res) {
		TemplateManager.loadTemplate(req.body['id'], req.body['teacher'], function (e, o) {
			if (!e){
				res.status(200).send(o);
			} else {
				res.status(400).send(null);
			}
		});
	});
	
	app.get('/account', function(req, res) {
		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}	else{
			TeacherManager.loadTeachers(function(e, o) {
				if (e) {
					// error loading teachers
				} else {
					res.render('account', {
						title : 'My Account',
						teachers : o,
						udata : req.session.user
					});
				}
			});
		}
	});
	
	app.post('/account', function(req, res){
		if (req.session.user == null){
			res.redirect('/');
		}	else{
			AM.updateAccount({
				id		: req.session.user._id,
				name	: req.body['name'],
				email	: req.body['email'],
				pass	: req.body['pass'],
                playerid: req.body['playerid'],
				teacher	: req.body['teacher']
			}, function(e, o){
				if (e){
					res.status(400).send('error-updating-account');
				}	else{
					req.session.user = o;
			// update the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });	
					}
					res.status(200).send('ok');
				}
			});
		}
	});

	app.post('/logout', function(req, res){
		res.clearCookie('user');
		res.clearCookie('pass');
		req.session.destroy(function(e){ res.status(200).send('ok'); });
	})
	
// creating new accounts //
	
	app.get('/signup', function(req, res) {
		TeacherManager.loadTeachers(function(e, o) {
			if (e) {
				// error loading teachers
			} else {
				res.render('signup', {  title: 'Signup', teachers : o });
			}
		});
	});
	
	app.post('/signup', function(req, res){
		AM.addNewAccount({
			name 	: req.body['name'],
			email 	: req.body['email'],
			user 	: req.body['user'],
			pass	: req.body['pass'],
			teacher : req.body['teacher'],
			userType: "student"
		}, function(e){
			if (e){
				res.status(400).send(e);
			}	else{
				res.status(200).send('ok');
			}
		});
	});

// password reset //

	app.post('/lost-password', function(req, res){
	// look up the user's account via their email //
		AM.getAccountByEmail(req.body['email'], function(o){
			if (o){
				EM.dispatchResetPasswordLink(o, function(e, m){
				// this callback takes a moment to return //
				// TODO add an ajax loader to give user feedback //
					if (!e){
						res.status(200).send('ok');
					}	else{
						for (k in e) console.log('ERROR : ', k, e[k]);
						res.status(400).send('unable to dispatch password reset');
					}
				});
			}	else{
				res.status(400).send('email-not-found');
			}
		});
	});

	app.get('/reset-password', function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		AM.validateResetLink(email, passH, function(e){
			if (e != 'ok'){
				res.redirect('/');
			} else{
	// save the user's email in a session instead of sending to the client //
				req.session.reset = { email:email, passHash:passH };
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});
	
	app.post('/reset-password', function(req, res) {
		var nPass = req.body['pass'];
	// retrieve the user's email from the session to lookup their account and reset password //
		var email = req.session.reset.email;
	// destory the session immediately after retrieving the stored email //
		req.session.destroy();
		AM.updatePassword(email, nPass, function(e, o){
			if (o){
				res.status(200).send('ok');
			}	else{
				res.status(400).send('unable to update password');
			}
		})
	});
	
// view & delete accounts //
	
	app.get('/print', function(req, res) {
		AM.getAllRecords( function(e, accounts){
			res.render('print', { title : 'Account List', accts : accounts });
		})
	});
	
	app.post('/delete', function(req, res){
		AM.deleteAccount(req.body.id, function(e, obj){
			if (!e){
				res.clearCookie('user');
				res.clearCookie('pass');
				req.session.destroy(function(e){ res.status(200).send('ok'); });
			}	else{
				res.status(400).send('record not found');
			}
	    });
	});
	
	app.get('/reset', function(req, res) {
		AM.delAllRecords(function(){
			res.redirect('/print');	
		});
	});

	app.get('/add_template', function(req, res) {
		if (req.session.user == null || req.session.user.name !== "biggerlab_admin") {
	// USER IS NOT ALLOWED
			res.redirect('/home');
		} else {
			res.render('addtemplate', {});
		}
	});

	app.post('/add_template', function(req, res) {
		if (req.session.user == null || req.session.user.name !== "biggerlab_admin") {
	// USER IS NOT ALLOWED
		} else {
		TemplateManager.addNewTemplate(req.body["lesson"], req.body["title"], req.body["content"], req.body["contentFinal"], function(e, o){
			if (!e){
				res.status(200).send('ok');
			} else {
				res.status(400).send('could not add template');
			}
	    });
		}
	});

	app.post('/load_template_list', function(req, res) {
		TemplateManager.loadTemplateList(function (e, o) {
			if (!e){
				res.status(200).send(o);
			} else {
				res.status(400).send(null);
			}
		});
	});
	
	app.get('/hints', function(req, res) {
		if (req.session.user == null) {
	// USER IS NOT ALLOWED
		} else {
			HM.loadHint(req.session.user.teacher, function(e,o) {
				res.status(200).send(e ? "# No Hints for Now" : o);
			});
		}
	});

	app.post('/hints', function(req, res) {
		if (req.session.user == null || req.session.user.userType !== "teacher") {
	// USER IS NOT ALLOWED
		} else {
			HM.saveHint(req.session.user, req.body["data"], function(e, o) {
				if (!e){
					res.status(200).send("Success");
				} else {
					res.status(400).send("Failed to save hint");
				}
			});
		}
	});

	app.post('/run', function(req, res) {
		if (req.session.user == null) {
	// USER IS NOT ALLOWED
		} else {
			wss.broadcast(JSON.stringify({'type': 'script', 'user': req.session.user.user, 'data': req.body["data"]}));
			res.status(200).send("Success");
		}
	});

	app.post('/kill', function(req, res) {
		if (req.session.user == null) {
	// USER IS NOT ALLOWED
		} else {
			wss.broadcast(JSON.stringify({'type': 'kill', 'user': req.session.user.user}));
			res.status(200).send("Success");
		}
	});
	
	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

};
