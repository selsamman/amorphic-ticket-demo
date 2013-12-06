module.exports.controller = function (objectTemplate, getTemplate)
{
	var BaseController = getTemplate('./baseController.js').BaseController;

	var Person = getTemplate('./person.js').Person;
	var Project = getTemplate('./project.js').Project;
	var Ticket = getTemplate('./ticket.js').Ticket;

	if (typeof(require) != "undefined") {
		Q = require('q');  // Don't use var or js optimization will force local scope
		var dbname =  objectTemplate.config.db;
		var crypto = require('crypto');
		var _ = require('./lib/underscore');
	}
	Controller = BaseController.extend(
		{

			// Intermediate data

			firstName:      {type: String, value: "", length: 50, rule: ["name", "required"]},
			lastName:       {type: String, value: "", length: 50, rule: ["name", "required"]},
			email:          {type: String, value: "", length: 50, rule: ["text", "email", "required"]},
			password:       {isLocal: true, type: String, value: ""},
			confirmPassword: {isLocal: true, type: String, value: ""},
			newPassword:    {isLocal: true, type: String, value: ""},

			// States

			passwordChangeToken: {type: String},
			loginError:     {type: String, value: ""},
			loggedIn:       {type: Boolean, toServer: false, value: false},
			page:			{type: String, value: 'home'},
			sub:            {type: String, value: ''},
			lightBox:       {type: String, value:''},

			// Model

			ticket:         {type: Ticket},
			tickets:        {type: Array, of: Ticket},

			person:         {type: Person},
			people:         {type: Array, of: Person},


			project:        {type: Project},
			projects:       {type: Array, of: Project},

			// Housekeeping data

			heartBeatInterval: {isLocal: true, type: Number, value: 0},
			activity:          {isLocal: true, type: Boolean, value: true},
			pageSaved:         {isLocal: true, type: Boolean, value: true},
			sessionExpiration: {isLocal: true, type: Number, value: 0},
			waitCount:      0, // seconds waiting for a pending call to complete

			init: function () {
			},

			/*
			 * -------  Ticket functions ----------------------------------------------------------------
			 */
			newTicket: function () {
				this.ticket = new Ticket(this.person, this.project);
				this.tickets.splice(0, 0, this.ticket);
				this.setPage('ticket');
			},
			saveTicket: {on: "server", body: function () {
				if (this.ticket)
					this.ticket.persistSave();
			}},
			deleteTicket: {on: "server", body: function () {
				if (this.ticket)
					this.ticket.persistDelete();
				var ix = _.indexOf(this.tickets, this.ticket);
				if (ix >= 0)
					this.tickets.splice(ix, 1);
				console.log("Deleting " + this.ticket.__id__ + " " + this.ticket.name);
				this.ticket = null;
			}},

			/**
			 * Return a list of all tickets
			 *
			 * @returns {*}
			 */
			getTickets: function ()
			{
				if (!this.tickets) {
					this.tickets = [];     // Now empty array
					this.fetchTickets();   // Page will be re-rendered when this returns
				}
				return this.tickets;
			},

			/**
			 * Update list of tickets in controller
			 */
			fetchTickets: {on: 'server', body: function()
			{
				return Ticket.getFromPersistWithQuery({}).then( function (tickets) {
					this.tickets = tickets;
				}.bind(this)).fail(function (err) {
					this.log(0, "Error fetching tickets " + err.toString() + err.stack ? err.stack : "");
				}.bind(this))
			}},

			/*
			 * -------  Project functions ----------------------------------------------------------------
			 */
			newProject: function () {
				this.project = new Project(this.person);
				this.projects.splice(0, 0, this.project);
				this.setPage('project');
			},
			saveProject: {on: "server", body: function () {
				if (this.project)
					this.project.persistSave();
			}},
			deleteProject: {on: "server", body: function () {
				if (this.project)
					this.project.persistDelete();
				var ix = _.indexOf(this.projects, this.project);
				if (ix >= 0)
					this.projects.splice(ix, 1);
				console.log("Deleting " + this.project.__id__ + " " + this.project.name);
				this.project = null;
			}},

			/**
			 * Return a list of all projects
			 *
			 * @returns {*}
			 */
			getProjects: function ()
			{
				if (!this.projects) {
					this.projects = [];     // Now empty array
					this.fetchProjects();   // Page will be re-rendered when this returns
				}
				return this.projects;
			},

			/**
			 * Update list of projects in controller
			 */
			fetchProjects: {on: 'server', body: function()
			{
				return Project.getFromPersistWithQuery({}).then( function (projects) {
						this.projects = projects;
					}.bind(this)).fail(function (err) {
						this.log(0, "Error fetching projects " + err.toString() + err.stack ? err.stack : "");
					}.bind(this))
			}},

			/*
			 * -------  Person functions ----------------------------------------------------------------
			 */

				/**
			 * Return a list of all people
			 *
			 * @returns {*}
			 */
			getPeople: function ()
			{
				if (!this.people) {
					this.people = [];     // Now empty array
					this.fetchPeople();   // Page will be re-rendered when this returns
				}
				return this.people;
			},

			/**
			 * Update list of people in controller
			 */
			fetchPeople: {on: 'server', body: function()
			{
				return Person.getFromPersistWithQuery({}).then( function (people) {
						this.people = people;
					}.bind(this)).fail(function (err) {
						this.log(0, "Error fetching people " + err.toString() + err.stack ? err.stack : "");
					}.bind(this))
			}},

			/*
			 * -------  Account functions ----------------------------------------------------------------
			 */

			startRegister: function (from) {
				this.registrationFrom = from;
				this.lightBox='register';
			},

			clientLogin: function () {
				var password = this.password;
				this.password = "";
				if(!this.hasErrors())
					this.login(password)
			},
			clientLogout: function () {
				this.logout();
			},
			clientRegister: function (doVerify) {
				if (this.password != this.confirmPassword)
					this.setError(this, 'confirmPassword', {message: "Passwords must match"});
				else {
					var password = this.password;
					if(!this.hasErrors(password)) {
						this.password = "";
						this.confirmPassword = "";
						this.register(password)
					}
				}
			},
			clientRegistered: {on: 'client', body: function () {
				if (this.registrationFrom)
					this.getCustomerMetric('registration').setRange(this.registrationFrom);
				if (this.pendingAction == "application_second_step") {
					this.setupApplication();
					return this.setPage("application_second_step");
				}

			}},
			clientChangePassword: function () {
				if(!this.hasErrors()) {
					var password = this.password;
					var newPassword = this.newPassword;
					this.password = '';
					this.newPassword = '';
					this.changePassword(password, newPassword);
				}
			},
			clientChangeEmail: function () {
				if(!this.hasErrors()) {
					var password = this.password;
					this.password = '';
					this.changeEmailAddress(password);
				}
			},
			clientChangePasswordFromToken: function () {
				var self = this;
				if(!this.hasErrors()) {
					var newPassword = this.newPassword;
					this.newPassword = '';
					return this.changePasswordFromToken(newPassword);
				}
			},
			/**
			 * Create a new person if one does not exist and consider ourselves logged in
			 *
			 * @param password
			 */
			register: {on: "server", body: function (password)
			{
				this.loginError =  "";
				return Person.countFromPersistWithQuery({email: this.email}).then( function (count)
					{
						if (count > 0)
							this.loginError = "This email already registered";
						else {
							var person = new Person(this.email, this.firstName, "", this.lastName);
							return person.register(password).then( function(error)
								{
									if (error)
										this.loginError = error;
									else {
										this.loggedIn = true;
										this.person = person;
										this.lightBox = '';
										return this.sendEmail("Register",
											this.person.email, this.person.firstName, [
												{name: "FNAME", content: this.person.firstName},
												{name: "LNAME", content: this.person.lastName}
											]);
									}
								}.bind(this)).then (function () {
									return this.setPage("home");
								}.biind(this))		;
						}
					}.bind(this)).fail(function (err) {
						this.log(0, "Error on registration " + err.toString() + err.stack ? err.stack : "");
					}.bind(this))
			}},


			/**
			 * login
			 * @param password
			 */
			login: {on: "server", body: function(password)
			{
				this.loginError =  "";
				if (this.loggedIn) {
					this.loginError = "Already logged in"
					return false;
				}
				return Person.getFromPersistWithQuery({email: this.email}).then( function (persons)
					{
						if (persons.length == 0) {
							this.loginError =  "Invalid email or password";
							this.log(1, "Log In attempt for " + this.email + " failed (invalid email)");
							return true;
						}
						var person = persons[0];
						return person.authenticate(password).then( function(authenticated)
						{
							if (authenticated) {
								this.loggedIn = true;
								this.person = person;
								this.lightBox = '';
								return this.setPage("home");
							} else {
								this.loginError = "Invalid email or password";
								return true;
							}

						}.bind(this))
					}.bind(this)).fail( function (err)	{
						this.log(0, "Error on registration " + err.toString() + (err.stack ? err.stack : ""));
					});
			}},

			/**
			 * Log out
			 */
			logout: {on: "server", body: function()
			{
				this.log(1, "Customer " + this.email + " logged out");

				this.person = null;
				this.people = null;
				this.project = null;
				this.projects = null;
				this.ticket = null;
				this.tickets = null;

				this.loggedIn = false;

				return this.setPage("home");
			}},


			/**
			 * Change email address for a logged in user
			 */
			changeEmailAddress: {on: "server", body: function(password)
			{
				this.loginError =  "";
				var oldEmail = this.model.email;
				var newEmail = this.email;

				return this.verifyOldPassword(password).then(function(correct)
				{
					if (correct) {
						this.person.email = newEmail;
						this.lightBox="changeemailconfirm";
						return this.model.persistSave().then(function ()
							{
								return this.sendEmail("EmailChanged", oldEmail,
									this.model.primaryCustomer.firstName, [
										{name: "NEWLOGIN", content: newEmail},
										{name: "FNAME", content: this.model.primaryCustomer.firstName}
									]);

							}.bind(this)).then(function ()
							{
								return this.sendEmail("EmailChanged", newEmail,
									this.model.primaryCustomer.firstName [
										{name: "NEWLOGIN", content: newEmail},
										{name: "FNAME", content: this.model.primaryCustomer.firstName}
										]);

							}.bind(this)).fail(function (err) {
								this.log(0, "Error on changePassword " + err.toString() + err.stack ? err.stack : "");
							}.bind(this))
					}
				}.bind(this));
			}},

			/**
			 * Change the password for a logged in user verifying old password
			 */
			changePassword: {on: "server", body: function(oldPassword, password)
			{
				this.loginError =  "";
				return !this.loggedIn || this.getHash(password, this.model.passwordSalt).then (function(hash)
					{
						if(this.model.passwordHash === hash) {
							this.loginError = "Invalid old password";
							return false;
						} else {
							var error = this.validateNewPassword(password);
							if (error) {
								this.loginError = error;
								return;
							}
							// Create new salt and hash and then just log you in
							return this.getSalt().then(function (salt)
								{
									this.model.passwordSalt = salt;
									return this.getHash(password, salt);

								}.bind(this)).then(function (hash)
								{
									this.model.passwordHash = hash;
									this.lightBox = "changepasswordconfirm";
									return this.save();

								}.bind(this)).then(function ()
								{
									this.log(1, "Changed password for " + this.model.email);
									return this.sendEmail("PasswordChanged",
										this.model.email, this.model.primaryCustomer.firstName,
										[{name: "FNAME", content: this.model.primaryCustomer.firstName}]);
								}.bind(this));
						}

					}.bind(this)).fail(function (err)
					{
						this.log(0, "Error on changePassword " + err.toString() + err.stack ? err.stack : "");
						return Q.fcall(function () {return "Error"});

					}.bind(this))
			}},

			/**
			 * Request that an email be sent with a password change link
			 */
			requestPasswordChange: {on: "server", body: function()
			{
				this.loginError =  "";
				this.log(1, "Request password reset for " + this.email);
				return Application.getFromPersistWithQuery({email: this.email})	.then(function (models)
					{
						var model = models[0];
						if (model)
							return this.getSalt().then (function (token) {
								model.passwordChangeToken = token;
								var now = new Date();
								now.setDate(now.getDate() + 1);
								model.passwordChangeExpires = now;
								return model.persistSave().then (function()
									{
										return this.sendEmail("ChangePassword",
											this.email, model.primaryCustomer.firstName, [
												{name: "RESET", content: "https://www.your server.com?resetpassword&email=" +
													this.email + "&token=" + token},
												{name: "FNAME", content: model.primaryCustomer.firstName}
											]);

									}.bind(this)).then (function ()
									{
										this.lightBox = 'forgot2';

									}.bind(this));
							}.bind(this));
						else {
							this.loginError = "We have no record of that Email address";
							return "Invalid EMail";
						}

					}.bind(this)).fail(function (err)
					{
						this.log(0, "Error on changePassword " + err.toString() + err.stack ? err.stack : "");
						return Q.fcall(function () {return "Error"});

					}.bind(this))
			}},

			/**
			 * Change the password given the token generated from requestPasswordChange
			 * or simply the fact that we are logged in
			 */
			changePasswordFromToken: {on: "server", body: function(password)
			{
				this.loginError =  "";
				return Application.getFromPersistWithQuery({email:this.email}).then(function (customers)
					{
						if (customers.length < 1) {
							this.loginError = "Invalid password change link - make sure you copied correctly from the email";
							return false
						}
						var model = customers[0];
						// You must logged in or the token must match and be unexpired
						if (this.passwordChangeToken != model.passwordChangeToken ||
							(new Date()).getTime() > model.passwordChangeExpires.getTime()) {
							this.loginError = "Invalid password change - may have expired";
							return null;
						} else {
							// Validate password
							var error = this.validateNewPassword(password);
							if (error) {
								this.loginError = error;
								return false;
							}
							// Create new salt and hash and then just log you in
							return this.getSalt().then(function (salt)
								{
									customers[0].passwordSalt = salt;
									return this.getHash(password, salt);

								}.bind(this)).then(function (hash)
								{
									this.customerId = model._id.toString();
									this.model = customers[0];
									this.previousProgress = this.model.progress;
									this.model.passwordChangeToken = null;
									this.model.passwordHash = hash;
									this.loggedIn = true;
									this.lightBox = "changepasswordconfirm";
									this.email = this.model.email;
									console.log(this.lightBox);
									return this.model.persistSave();

								}.bind(this)).then(function ()
								{
									this.log(1, "Changed password for " + this.model.email);
									return this.setPage(this.model.lastPageVisited);

								}.bind(this)).then(function ()
								{
									return this.sendEmail("PasswordChanged",
										this.model.email, this.model.primaryCustomer.firstName,
										[{name: "FNAME", content: this.model.primaryCustomer.firstName}]);

								}.bind(this)).then(function ()
								{
									return true;

								}.bind(this))
						}

					}.bind(this)).fail(function (err)
					{
						this.log(0, "Error on changePasswordFromToken " + err.toString() + err.stack ? err.stack : "");
						return Q.fcall(function () {return "Error"});

					}.bind(this))
			}},

			log: function (level, text) {
				(this.__template__.objectTemplate || RemoteObjectTemplate).log(level, text);
			},

/*
 * -------  Housekeeping ----------------------------------------------------------------------
 */

			clientInit: {on: "client", body: function (sessionExpiration)
			{
				if (sessionExpiration)
					this.sessionExpiration = sessionExpiration;

				// Handle session expiration and auto-save
				var self = this;
				this.activity = true;
				if (this.heartBeatInterval)
					clearInterval(this.heartBeatInterval)
				this.heartBeatInterval = setInterval(function () {self.heartBeat()}, 5000)
				if (document.location.search.match(/resetpassword&email=(.*?)&token=(.*)/) &&
					this.lightBox != 'changepasswordconfirm')
				{
					this.passwordChangeToken = RegExp.$2;
					this.email = RegExp.$1;
					this.lightBox='changepasswordtoken';
					this.loginError = "";
				}
			}},

			shutdown: function () {
				if (this.heartBeatInterval)
					clearInterval(this.heartBeatInterval)
				this.isShudown = true;
			},

			heartBeat: function () {
				console.log('heartbeat');
				if (this.activity && !this.pageSaved)
					this.savePage();
				else if (((new Date()).getTime() - semotus.lastServerInteraction) >
					(this.sessionExpiration + 5000)) {
					this.log(1, "session should expire now");
					this.setPage('');
					this.savePage();  // Will force a reset
				}
				this.activity = false;
			},

			preRenderInitialize: function() {
				this.attr(".currency", {format: this.formatDollar});
				this.attr(".spin", {min: "{prop.min}", max: "{prop.max}"});
				this.rule("text", {maxlength: "{prop.length}", validate: this.isText, format: this.formatText});
				this.rule("numeric", {parse: this.parseNumber, format: this.formatText});
				this.rule("name", {maxlength: "{prop.length}", validate: this.isName});
				this.rule("email", {validate: this.isEmail});
				this.rule("currency", {format:this.formatDollar, parse: this.parseCurrency});
				this.rule("currencycents", {format:this.formatCurrencyCents, parse: this.parseCurrency});
				this.rule("date", {format: this.formatDate, parse: this.parseDate});
				this.rule("datetime", {format: this.formatDateTime, parse: this.parseDate});
				this.rule("DOB", {format: this.formatDate, parse: this.parseDOB});
				this.rule("SSN", {validate: this.isSSN});
				this.rule("taxid", {validate: this.isTaxID});
				this.rule("phone", {validate: this.isPhone});
				this.rule("required", {validate: this.notEmpty});
				this.rule("percent", {validate: this.isPercent, format: this.formatPercent});
				this.rule("zip5", {validate: this.isZip5});
			},
			/**
			 * Called after each pass of Bindster to render DOM
			 */
			initialize: function () {
				var foo = 1;
			},

			onprerender: function() {
				var foo = 1;
			},

			/**
			 * called by BINDster after a render.  Auto-save mechanism saves page if
			 * any activity (that would cause a render) so we set that activity flag here.
			 * We DON"T want to force a save if the render was caused by refreshing the
			 * controller data.
			 *
			 * @param name
			 */
			onrender: function(name) {

				if (this.messageRefresh)
					this.messageRefresh = false;
				else {
					this.activity = true;
					this.pageSaved = false;
				}
			},

			setPage: {on: "client", body: function (page, force, subpage) {
				var url = page + (subpage ? "_" + subpage : "");
				if (window.history && window.history.pushState) {
					window.history.pushState({}, document.title, "/#" + url);
				} else {
					document.location.pathname = '';
					document.location.hash = '#' + url;
				}

				this.sub = subpage ? subpage : '';
				this.page = page;
				this.scrollTo = page;
				if (typeof(this[page + 'Init']) == 'function')
					this[page + 'Init']();
			}},

			savePage: function() {
				if (this.isShudown)
					return;
				var self=this;
				this.waitCount++;
				if (this.waitCount == 10) {
					console.log("Not able to save for 10 seconds - refreshing");
					semotus.refreshSession();
				}
				if (this.waitCount == 20) {
					this.oldrmode = this.lightBox;
					this.lightBox = "offline";
					this.refresh();
					console.log("Not able to save for 20 seconds - going offline");
				}
				if (this.waitCount < 20)
					if (RemoteObjectTemplate.getPendingCallCount() > 0) {
						this.resaveTimeout = setTimeout(function () {self.savePage()}, 1000);
						if (this.waitCount < 10)
							console.log(RemoteObjectTemplate.getPendingCallCount() + " call(s) outstanding waiting to save page");
					} else {
						this.waitCount = 0;
						this.save();
						this.pageSaved = true;
					}
			},

			isPage: function(name) {
				return this.page == name;
			},

			pageInit: function () {
				this.postRenderTasks.push(function () {
					$.placeholder.shim();
				});
				this.password = "";
				this.confirmPassword = "";
			},
			/**
			 *  Not clear what should be saved
			 */
			save: {on: "server", body: function (updateMC)
			{
				if (this.projects)
					for (var ix = 0; ix < this.projects.length; ++ix)
						console.log(this.projects[ix].__id__ + " " + this.projects[ix].name);
				if (this.tickets)
					for (var ix = 0; ix < this.tickets.length; ++ix)
						console.log(this.tickets[ix].__id__ + " " + this.tickets[ix].title);

			}},
			clientSalt: function () {
				return this.getSalt().then(function(m){alert(m)},function(m){alert("error: " + m)});
			},
			getSalt: {on: "server", body: function () {
				return Q.ninvoke(crypto, 'randomBytes', 64).then( function (buf)
				{
					var x = x.y.z;
					return buf.toString('hex')
				});
			}},

			/**
			 * Send an email with mandrill
			 *
			 * @param template
			 * @param email
			 * @param name
			 * @param vars
			 * @return {*}
			 */
			sendEmail: function (template, email, name, vars)
			{/*
				return mandrillAPI('/messages/send-template', {
					template_name: template,
					template_content: [
						{name: "foo", content: "bar"}
					],
					message: {
						to: [{
							email: (dbname == "prod" || dbname == "uat") ? email : "name@domain.com",
							name: name
						}],
						from_email: "help@domainh.com",
						from_name: "Name",
						global_merge_vars: vars
					}
				}).then(function (results)
					{
						if (results.length > 0 && results[0].status != "sent")
							this.log(0, "Controller error sending welcome email for " +
								this.model.email + ": " + results[0].reject_reason);
						return Q.fcall(function () {return "Error"});

					}.bind(this), function(error)
					{
						this.log(0, "Controller error sending welcome email for " + this.model.email + ": " + error.message);
						return Q.fcall(function () {return "Error"});

					}.bind(this));
				*/
				return Q.fcall(function(){return true});
			}

		});

	return {Controller: Controller};
}

