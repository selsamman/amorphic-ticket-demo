module.exports.controller = function (objectTemplate, getTemplate)
{
    // Include model
	var BaseController = getTemplate('./baseController.js').BaseController;
	var Person = getTemplate('./person.js').Person;
	var Project = getTemplate('./project.js').Project;
	var Ticket = getTemplate('./ticket.js').Ticket;

    // Non-Semotus modules
	if (typeof(require) != "undefined") {
		Q = require('q');  // Don't use var or js - optimization will force local scope
		_ = require('./lib/underscore');
	}

    // Main controller (any other controllers should be embedded as properties)
    Controller = BaseController.extend(
	{
        // Global properties
		page:			{type: String, value: ''},          // The current page (hash name)
		error:          {type: String},                     // Non-field specific error condition
		status:         {type: String},                     // Information status (e.g. saved at at ...)

		// References to the model

		ticket:         {type: Ticket},
		tickets:        {type: Array, of: Ticket},

		person:         {type: Person},
		people:         {type: Array, of: Person},

		project:        {type: Project},
		projects:       {type: Array, of: Project},

        // Temporary fields
        comment:        {type: String},                     // When adding a comment to a ticket

        /*
         * -------  Ticket functions ----------------------------------------------------------------
         */

        // Create a new ticket and make it current
        newTicket: function ()
        {
            if (!this.ticket && !this.ticket.created) {
                this.ticket = new Ticket();
                if (_.indexOf(this.tickets, this.ticket) < 0) // Add to list
                    this.tickets.splice(0, 0, this.ticket);
                this.error = null;
            }
            this.setPage('ticket');
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

        // create a new project to be saved later
		newProject: function ()
        {
            if (!this.project || !this.project.created) {
                this.project = new Project("");
                if (_.indexOf(this.projects, this.project) < 0)
                    this.projects.splice(0, 0, this.project);
                this.error = null;
            }
            this.setPage('project');
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

        /*
        * -------  Housekeeping ----------------------------------------------------------------------
        */

		clientInit: function ()
		{
            BaseController.prototype.clientInit.call(this);
        },

        // This will eventually be embedded in the router
        resetPassword: function ()
        {
            if (document.location.search.match(/email=(.*?)&token=(.*)/))
            {
                this.passwordChangeHash = RegExp.$2;
                this.email = decodeURIComponent(RegExp.$1);
                this.setPage('reset_password');

            } else

                alert('Please try pasting the link from your email into the browser address bar')
        },

        // This will eventually be embedded in the router
        verifyEmail: function ()
        {
            if (document.location.search.match(/email=(.*?)&code=(.*)/))
            {
                this.verifyEmailCode = RegExp.$2;
                this.email = decodeURIComponent(RegExp.$1);
                this.publicVerifyEmailFromCode('registration_confirmation');

            } else

                alert('Please try pasting the link from your email into the browser address bar')
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
         * Set the current page
         *
         * @param name of page
         * @param not used
         * @param subpage (bookmark)
        */
		setPage: {on: "client", body: function (page, force, subpage)
        {
            this.password = "";
            this.newPassword = "";
            this.confirmPassword = "";
            this.error = "";
			var url = page + (subpage ? "_" + subpage : "");
			if (window.history && window.history.pushState) {
				window.history.pushState({}, document.title, "/#" + url);
			} else {
                if (document.location.pathname != '/')
				    document.location.pathname = '/';
				document.location.hash = '#' + url;
			}

			this.sub = subpage ? subpage : '';
			this.page = page;
			this.scrollTo = page;
			if (typeof(this[page + 'Init']) == 'function')
				this[page + 'Init']();
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
         * Security check on remote calls
         *
         * @param functionName
         * @returns {Boolean} - whether to proceed with call
         */
        validateServerCall: function (functionName) // called by semotus prior to anyfunction call
        {
            if (functionName.match(/^public/))
                return true;
            return this.securityContext ? true : false;
        }


    });

    return {Controller: Controller};
}

