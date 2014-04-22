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
		_ = require('./lib/underscore');
	}

    Controller = BaseController.extend(
	{
		page:			{type: String, value: ''},
		lightBox:       {type: String, value:''},
		error:          {type: String},
		status:         {type: String},
        comment:        {type: String},

		// References to the model

		ticket:         {type: Ticket},
		tickets:        {type: Array, of: Ticket},

		person:         {type: Person},
		people:         {type: Array, of: Person},


		project:        {type: Project},
		projects:       {type: Array, of: Project},

        /**
         * Called on object creation
         */
		init: function () {
		},

		/*
		 * -------  Ticket functions ----------------------------------------------------------------
		 */

        // Create a new ticket and make it current
        newTicket: function () {
            this.ticket = new Ticket();
            this.setPage('ticket');
            this.error = null;
        },

        // Ask the ticket to save itself and update our list of tickets
        saveTicket: {on: "server", validate: function () {return this.validate()}, body: function ()
		{
			if (this.ticket)
				return this.ticket.save().then(function(error)	{
                        if (_.indexOf(this.tickets, this.ticket) < 0) // Add to list
    				        this.tickets.splice(0, 0, this.ticket);
                        this.status = "Ticket Saved at " + this.getDisplayTime();
                        this.error = null;
				}.bind(this),
                function (error) {
                    this.error = error.message;
                }.bind(this));
		}},

        // Ask the ticket to remove itself and update our list of tickets
		deleteTicket: {on: "server", body: function ()
		{
			if (this.ticket)
				return this.ticket.remove().then(function () {
					var ix = _.indexOf(this.tickets, this.ticket); // Remove from list
					if (ix >= 0)
						this.tickets.splice(ix, 1);
					this.ticket = null;
                }.bind(this));
		}},

		/*
		 * -------  Project functions ----------------------------------------------------------------
		 */

		newProject: function () { // create a new project to be saved later
			this.project = new Project("");
			this.setPage('project');
		},

	    saveProject: {on: "server", body: function ()
		{
			if (this.project)
				return this.project.save(this.person).then(function(project)
				{
					if (_.indexOf(this.projects, this.project) < 0)
						this.projects.splice(0, 0, project);
                    this.status = "Project saved at " + this.getDisplayTime();
                    this.error = "";
				}.bind(this));
		}},

		deleteProject: {on: "server", body: function ()
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
* -------  Housekeeping ----------------------------------------------------------------------
*/
		clientInit: function ()
		{
            BaseController.prototype.clientInit.call(this);
            this.changePasswordCheck();
            this.setPage(this.page);

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
        },

        /**
         * Called when controller destroyed so we can delete any resources (e.g. timers)
         */
        clientTerm: function () {
        },

        /**
         * Called if an error thrown on server call that is not handled
         */
        handleRemoteError: function (error) {
            this.error = error;
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

