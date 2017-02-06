module.exports.controller = function (objectTemplate, uses)
{
    // Include model
	var BaseController = uses('./baseController.js', 'BaseController');
	var Person = uses('./person.js', 'Person')
	var Project = uses('./project.js', 'Project');
	var Ticket = uses('./ticket.js', 'Ticket');

    // Non-Semotus modules
	if (typeof(require) != "undefined") {
		Q = require('q');  // Don't use var or js - optimization will force local scope
		_ = require('./lib/underscore');
	}

    // Main controller (any other controllers should be embedded as properties)
    Controller = BaseController.extend("Controller",
	{
        // Global properties
		page:			{type: String, value: ''},          // The current page (path minus slash)
        file:           {type: String, value: ''},          // HTML file to load
		error:          {type: String},                     // Non-field specific error condition
		status:         {type: String},                     // Information status (e.g. saved at at ...)

		// References to the model

		ticket:         {type: Ticket},
		tickets:        {type: Array, of: Ticket, autoFetch: true},
        ticketsFetch:   {on: 'server', body: function () {
		    this.ticketsPersistor = {isFetching: false, isFetched: true};
		    return Ticket.getFromPersistWithQuery({}).then(function (tickets) {
		        this.tickets = tickets;
            }.bind(this));
        }},

		person:         {type: Person},
		people:         {type: Array, of: Person, autoFetch: true},
        peopleFetch:   {on: 'server', body: function () {
            this.peoplePersistor = {isFetching: false, isFetched: true};
            return Person.getFromPersistWithQuery({}).then(function (people) {
                this.people = people;
            }.bind(this));
        }},

		project:        {type: Project},
		projects:       {type: Array, of: Project, autoFetch: true},
        projectsFetch:   {on: 'server', body: function () {
            this.projectsPersistor = {isFetching: false, isFetched: true};
            return Project.getFromPersistWithQuery({}).then(function (projects) {
                this.projects = projects;
            }.bind(this));
        }},

        // Temporary fields
        comment:        {type: String},                     // When adding a comment to a ticket

        /*
         * -------  Ticket functions ----------------------------------------------------------------
         */

        // Create a new ticket and make it current
        newTicket: function ()
        {
            if (!this.ticket || this.ticket.created) {
                this.ticket = new Ticket();
                if (_.indexOf(this.tickets, this.ticket) < 0) // Add to list
                    this.tickets.splice(0, 0, this.ticket);
                this.error = null;
            }
            this.route.private.ticket();
        },

        // Ask the ticket to save itself and update our list of tickets
        saveTicket: {
            on: "server",
            validate: function () {return this.validate()},
            body: function ()
		{
			if (this.ticket)

				return this.ticket.save().then(function(error)
                {
                        this.status = "Ticket Saved at " + this.getDisplayTime();
                        this.error = null;

				}.bind(this));
		}},

        // Ask the ticket to remove itself and update our list of tickets
		deleteTicket: {
            on: "server",
            body: function ()
		{
			if (this.ticket)

				return this.ticket.remove().then(function ()
                {
					var ix = _.indexOf(this.tickets, this.ticket); // Remove from list
					if (ix >= 0)
						this.tickets.splice(ix, 1);
					this.ticket = null;

                }.bind(this));
		}},

        /*
         * -------  Project functions ----------------------------------------------------------------
         */
        deletePerson: {
            on: "server",
            body: function (person)
        {
            if (this.isAdmin()) {
                person.remove().then(function () {
                    this.createAdmin();
                    if (this.loggedInPerson == person)
                        this.logout('');
                }.bind(this));
            }
        }},

		/*
		 * -------  General Functions ----------------------------------------------------------------
		 */
        deleteAll: {
            // This could start a lot of asynchronous activity.  In the real world you would not do this
            // but in the real world you would not have a deleteAll() :-)
            on: "server",
            body: function ()
        {
            if (this.isAdmin()) {
                this.projectsFetch().then (function () {
                    _.map(this.projects, function (project) {
                        this.project = project;
                        this.deleteProject();
                    }.bind(this));
                    return this.ticketsFetch();
                }.bind(this)).then(function () {
                    _.map(this.tickets, function (ticket) {
                        this.ticket = ticket;
                        this.deleteTicket();
                    }.bind(this));
                    return this.personsFetch();
                }.bind(this)).then(function () {
                    _.map(this.person, function (person) {
                        if (person != this.person)
                            this.deletePerson(person);
                    }.bind(this));
                    this.logout('');
                }.bind(this));
            }
        }},
        /**
         * If no admin's present create one
         */
        publicInitAll: {
            on: "server",
            body: function ()
        {
            this.createAdmin();
        }},

        // create a new project to be saved later
		newProject: function ()
        {
            if (!this.project || this.project.created) {
                this.project = new Project("");
                if (_.indexOf(this.projects, this.project) < 0)
                    this.projects.splice(0, 0, this.project);
                this.error = null;
            }
            this.route.private.project();
		},

	    saveProject: {on: "server", body: function ()
		{
			if (this.project)

				return this.project.save(this.person).then(function()
				{
                    this.status = "Project saved at " + this.getDisplayTime();
                    this.error = "";

				}.bind(this));
		}},

		deleteProject: {on: "server", body: function ()
		{
			if (this.project)

				return this.project.remove().then(function ()
                {
					var ix = _.indexOf(this.projects, this.project);
					if (ix >= 0)
						this.projects.splice(ix, 1);
					console.log("Deleting " + this.project.__id__ + " " + this.project.name);
					this.project = null;

				}.bind(this));
		}},
        runTests: function () {
            // Invoke Mocha script
            expect = undefined;
            if (document.location.search.match(/test/)) {
                this.loadScript("modules/mocha/mocha.js", function () {
                    this.loadScript("modules/chai/chai.js", function () {
                        mocha.ui('bdd');
                        mocha.reporter('html');
                        expect = chai.expect;
                        this.loadScript("test/all.js", function () {
                            mocha.run();
                            this.mocha = true;
                            document.getElementById('container').style.marginRight = "400px";
                        });
                    });
                });
            }
        },
            /*
             * -------  Housekeeping ----------------------------------------------------------------------
             */

		clientInit: function ()
		{
            BaseController.prototype.clientInit.call(this);
            this.router = AmorphicRouter;
            this.route = AmorphicRouter.route(this, ticketRoutes);
        },

        login: function ()
        {
            this.publicLogin('home');
        },

        logout: function ()
        {
            // Ideally for security purposes and to prevent leaks there should be a controller reset capability
            this.people = null;
            this.project = null;
            this.projects = null;
            this.ticket = null;
            this.tickets = null;
            this.publicLogout('home');
        },

        /**
         * Called if an error thrown on server call that is not handled
         */
        handleRemoteError: function (error) {
            this.error = this.getErrorMessage(error);
        },

        /**
         * Setup the controller to display a given file
         * @param page
         * @param file
         */
        pageInit: function (file) {
            this.password = "";
            this.newPassword = "";
            this.confirmPassword = "";
            this.error = "";
        },

        /**
         * Set the current page
         *
         * @param page (router path but without the initial slash needed)
         */
		setPage: {on: "client", body: function (page)
        {
            this.router.goTo(page);
 		}},

        isPage: function(name) {
            return this.page == name;
        },

        log: function (level, text) {
            (this.__template__.objectTemplate || RemoteObjectTemplate).log(level, text);
        },

        getDisplayTime: function () {
            var date = new Date();
            return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear() + " " +
                date.toTimeString().replace(/ .*/, '');
        },

        /**
         * Security check on remote calls is execute from semotus before executing a call on the server
         *
         * @param functionName
         * @returns {Boolean} - whether to proceed with call
         */
        validateServerCall: function (functionName)
        {
            if (functionName.match(/^public/))
                return true;
            return this.loggedIn ? true : false;
        }


    });
}

