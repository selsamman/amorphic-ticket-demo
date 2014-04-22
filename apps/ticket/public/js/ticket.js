module.exports.ticket = function (objectTemplate, getTemplate)
{
	var Person = getTemplate('./person.js').Person;
	var Project = getTemplate('./project.js').Project;
	var ProjectRelease = getTemplate('./project.js').ProjectRelease;

	var Ticket = objectTemplate.create("ticket:ticket",
	{
		title:              {type: String, rule: ["required"]},
        titleSet:           {on: "server", body: function(value) {
            if (value.match(/Sam/) && value.match(/sucks|poor|untidy|buggy|crap/))
                throw "Don't disparage Sam";
            this.title = value;
        }},
		description:        {type: String},
		created:            {toServer: false, type: Date},
		creator:            {toServer: false, type: Person, fetch: true},
		project:            {toServer: false, type: Project, fetch: true},
		release:            {toServer: false, type: ProjectRelease, fetch: true},

		init: function (title, description) {
			this.title = title || null;
            this.description = description || null;
            this.creator = this.getSecurityContext().principal;
 		},

        validateServerCall: function () {
            return this.getSecurityContext() ? true : false;
        },

		projectSet: {on: "server", body: function(project)
        {
            return Project.getFromPersistWithId(project._id).then( function(project) {
		        this.project = project || null;
                return project;
            }.bind(this));
		}},

		releaseSet: {on: "server", body: function (releaseOrId)
        {
            var releaseId = typeof(releaseOrId) == 'string' ? releaseOrId : releaseOrId._id
            return ProjectRelease.getFromPersistWithId(releaseId).then( function(release) {
                if (release && release.project != this.project)
				    throw "Attempt to set ticket project release that does not belong to project";
			    this.release = release || null;
                return release;
            });
		}},

		remove:  {on: "server", body: function ()
        {
			for (var ix = 0; ix < this.ticketItems; ++ix)
				this.ticketItems[ix].remove();
			return this.persistDelete();
            if (this.project)
                for (var ix = 0; ix < this.project.tickets.length; ++ix)
                    if (this.project.tickets[ix] == this)
                        this.project.splice(ix,1)
		}},

		save: function ()
		{
            if (!this.title)
                throw "Need a title";

            if (!this.created)
                this.created = new Date();

            if (!this.creator)
                this.creator = this.getSecurityContext().principal;

            return this.persistSave();
		}
	});

	/**
	 * Any additional informational content for ticket added after creation
	 * such as a comment or an approval
	 */
	var TicketItem = objectTemplate.create("ticketItem:ticketItem",
	{
		creator:            {toServer: false, type: Person, fetch: true},
		created:            {toServer: false, type: Date},
		ticket:             {toServer: false, type: Ticket},

		init: function (ticket, person) {
			this.ticket = ticket;
			this.creator = person || null;
			this.created = new Date();
		}

	});

	var TicketItemAttachment = objectTemplate.create("attachment:ticketItemAttachment",
	{
		data:               {type: String},
		name:               {type: String},
		created:            {type: Date},
		ticketItem:         {type: TicketItem},

		init: function (ticketItem, name, data) {
			this.ticketItem = ticketItem || null;
			this.name = name || null;
			this.data = data || null;
			this.created = new Date();
		}
	});

	var TicketItemComment = TicketItem.extend("ticketItem:ticketItemComment",
	{
		text:               {type: String, value: null},
		attachments:        {type: Array, of: TicketItemAttachment, value: []},

		init: function(ticket, person, text) {
			TicketItem.call(this, ticket, person);
			this.text = text || "";
            this.creator = this.getSecurityContext().principal;
            this.created = new Date();
		},
		addAttachment: function(name, data) {
			var attachment = new TicketItemAttachment(this, name, data);
			this.attachments.push(attachment);
			return attachment;
		},
		remove: function () {
			for (var ix = 0;ix < this.attachments.length;++ix)
				this.attachments[ix].persistDelete();
			this.persistDelete();
		}
	});


	var TicketItemApproval = TicketItem.extend("ticketItem:ticketItemApproval",
	{
		init: function (person) {
			TicketItem.call(this, person);
		},
		remove: function () {
			this.persistDelete();
		}
	});

	Ticket.mixin(
	{
		ticketItems:        {toServer: false, type: Array, of: TicketItem, value: []},

        addComment: {on: "server", body: function (comment) {
            var comment = new TicketItemComment(this, this.getSecurityContext().principal, comment);
            this.ticketItems.push(comment);
            return comment;
        }},

		addApproval:  {on: "server", body: function () {
            var person = this.getSecurityContext().principal;
			if (!this.project)
				throw "cannot approve ticket that is not assigned to a project";
			if (!this.project.getRole( "manager", person))
				throw "only the project manager role can approve a ticket";
			var item = new TicketItemApproval(this, person);
			this.ticketItems.push(item);
			return item;
		}}
	});

	return {
		Ticket: Ticket,
		TicketItem: TicketItem,
		TicketItemAttachment: TicketItemAttachment,
		TicketItemComment: TicketItemComment,
		TicketItemApproval: TicketItemApproval
	}
}


