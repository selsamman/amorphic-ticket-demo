module.exports.controller = function (objectTemplate, getTemplate)
{
    // Application Modules
	var BaseController = getTemplate('./baseController.js').BaseController;
	var Person = getTemplate('./person.js').Person;
	var Project = getTemplate('./project.js').Project;
	var Ticket = getTemplate('./ticket.js').Ticket;

    // Non-Semotus modules
	if (typeof(require) != "undefined") {
		Q = require('q');  // Don't use var or js optimization will force local scope
		var crypto = require('crypto');
		var _ = require('./lib/underscore');
	}

    Controller = BaseController.extend(
	{

		page:			{type: String, value: 'home'},
		lightBox:       {type: String, value:''},
		error:          {type: String},
		status:         {type: String},

		// Referenced to object model

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
		waitCount:          0, // seconds waiting for a pending call to complete

		init: function () {
		},

		validateServerCall: function (functionName) // called by semotus prior to anyfunction call
		{
			if (functionName.match(/^userAuthenticated/))
				return this.loggedIn && this.loggedInRole == "user";
			if (functionName.match(/^public/))
				return true;
			return false;
		},


        serverInit: function () {
             var names = "";
             Q.ninvoke(objectTemplate.getDB(), "collection", "ticket").then (function (collection) {
                return Q.ninvoke(collection, "find", {}, {limit: 1}).then( function (cursor)
                {
                    var processed = 0;
                    return Q.ninvoke(cursor, "count", false).then(function (count)
                    {
                         function sumTickets(cursor) {
                            return Q.ninvoke(cursor, "toArray").then(function (tickets) {
                                for (var ix = 0; ix < tickets.length; ++ ix)
                                    names += tickets[ix].title + " ";
                                processed += tickets.length;
                                if (processed < count)
                                    return Q.ninvoke(collection, "find", {}, {skip: processed, limit: 1}).then( function (cursor) {
                                        return sumTickets(cursor);
                                    });
                                else
                                    return "anythingbutapromise";
                            })
                        }
                        return sumTickets(cursor);
                    });
                });
            }).then (function () {console.log(names)});
        },


		/*
		 * -------  Ticket functions ----------------------------------------------------------------
		 */

		getTickets: function () // Setup ticket collection and call server to fetch them if needed
		{
			if (!this.tickets) {
				this.tickets = [];                      // New empty array
				this.userAuthenticatedGetTickets();     // Page will be re-rendered when this returns
			}
			return this.tickets;                        // Always returns an array of tickets or empty array
		},

		saveTicket: function ()
		{
			this.userAuthenticatedSaveTicket().then(    // Save ticket on server and display results
				function () {
					this.message = "Ticket Saved at " + this.getDisplayTime();
					this.error = "";
				},
				function (error) {
					this.message = "";
					this.error = error;
				}
			);
		},

		newTicket: function () {
			this.ticket = new Ticket(this.person, this.project);
			this.setPage('ticket');
		},

		deleteTicket: function () {
			this.userAuthenticatedDeleteTicket();
		},

		userAuthenticatedGetTickets: {on: 'server', body: function()
		{
			return Ticket.getFromPersistWithQuery({}).then( function (tickets) {
				this.tickets = tickets;
			}.bind(this));
		}},

		userAuthenticatedSaveTicket: {on: "server", body: function ()
		{
			if (this.ticket)
				return this.ticket.save(this.person).then(function(ticket)
				{
					// Update with newly saved one or add to list
					var ix = _.indexOf(this.tickets, this.ticket)
					if (ix >= 0)
						this.tickets.splice(ix, 1, ticket);
					else
						this.tickets.splice(0, 0, ticket);

					this.ticket = ticket;

				}.bind(this));
		}},

		userAuthenticatedDeleteTicket: {on: "server", body: function ()
		{
			if (this.ticket)
				return this.ticket.remove().then(function ()
				{
					// Remove from session
					var ix = _.indexOf(this.tickets, this.ticket);
					if (ix >= 0)
						this.tickets.splice(ix, 1);
					console.log("Deleting " + this.ticket.__id__ + " " + this.ticket.name);
					this.ticket = null;
				});
		}},

		/*
		 * -------  Project functions ----------------------------------------------------------------
		 */

		// Client side

		getProjects: function () // setup collection and fetch projects if needed
		{
			if (!this.projects) {
				this.projects = [];     // Now empty array
				this.userAuthenticatedGetProjects();   // Page will be re-rendered when this returns
			}
			return this.projects;
		},

		newProject: function () { // create a new project to be saved later
			this.project = new Project(this.person);
			this.setPage('project');
		},

		deleteProject: function () {
			this.userAuthenticatedDeleteProject();
		},

		saveProject: function ()
		{
			this.userAuthenticatedSaveProject().then(
				function () {
					this.message = "Project saved at " + this.getDisplayTime();
					this.error = "";
				},
				function (error) {
					this.message = "";
					this.error = error;
				}
			);
		},

		// Server Side

		userAuthenticatedGetProjects: {on: 'server', body: function()
		{
			return Project.getFromPersistWithQuery({}).then( function (projects) {
					this.projects = projects;
				}.bind(this)).fail(function (err) {
					this.log(0, "Error fetching projects " + err.toString() + err.stack ? err.stack : "");
				}.bind(this))
		}},

		userAuthenticatedSaveProject: {on: "server", body: function ()
		{
			if (this.project)
				return this.project.save(this.person).then(function(project)
				{
					// Update with newly saved one or add to list
					var ix = _.indexOf(this.projects, this.project)
					if (ix >= 0)
						this.projects.splice(ix, 1, project);
					else
						this.projects.splice(0, 0, project);
					
					this.project = project;
					
				}.bind(this));
		}},

		userAuthenticatedDeleteProject: {on: "server", body: function ()
		{
			if (this.project)
				return this.project.remove().then(function () {
					var ix = _.indexOf(this.projects, this.project);
					if (ix >= 0)
						this.projects.splice(ix, 1);
					console.log("Deleting " + this.project.__id__ + " " + this.project.name);
					this.project = null;
				}.bind(this));
		}},

		/*
		 * -------  Person functions ----------------------------------------------------------------
		 */

		getPeople: function ()
		{
			if (!this.people) {
				this.people = [];     // Now empty array
				this.userAuthenticatedGetPeople();   // Page will be re-rendered when this returns
			}
			return this.people;
		},
		userAuthenticatedGetPeople: {on: 'server', body: function()
		{
			return Person.getFromPersistWithQuery({}).then( function (people) {
					this.people = people;
				}.bind(this)).fail(function (err) {
					this.log(0, "Error fetching people " + err.toString() + err.stack ? err.stack : "");
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
				this.error = "";
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
					this.publicSave();
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
		publicSave: {on: "server", body: function (updateMC)
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

