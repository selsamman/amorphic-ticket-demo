module.exports.ticket = function (objectTemplate, uses)
{
	var Person = uses('./person.js', 'Person');
	var Project = uses('./project.js', 'Project');

	var Ticket = objectTemplate.create("Ticket",
	{
        // Insecure properties can be set on the client and saved by a logged in user

		title:              {type: String, rule: ["required"]},
        titleSet:           {on: "server", body: function(value)
        {
            if (value.match(/Sam/i) && value.match(/sucks|poor|untidy|bug|bugs|buggy|crap/i))
                throw "Don't disparage Sam";
            this.title = value;
        }},
        description:        {type: String},

        // Secure properties only set on the server

		created:            {toServer: false, type: Date},
		creator:            {toServer: false, type: Person, fetch: true},
		project:            {toServer: false, type: Project, fetch: true},

		init: function (title, description)
        {
			this.title = title || null;
            this.description = description || null;
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

		remove:  {on: "server", body: function ()
        {
			for (var ix = 0; ix < this.ticketItems; ++ix)
				this.ticketItems[ix].remove();
            if (this.project) {
                for (var ix = 0; ix < this.project.tickets.length; ++ix)
                    if (this.project.tickets[ix] == this)
                        this.project.splice(ix, 1);
                this.project.save();
            }
            return this.persistDelete();
		}},

		save: {
            on: "server",
            validate: function () {return this.validate()},
            body: function ()
		{
            if (!this.created)
                this.created = new Date();

            if (!this.creator)
                this.creator = this.getSecurityContext().principal;

            return this.persistSave();
		}}
	});

	/**
	 * Any additional informational content for ticket added after creation
	 * such as a comment or an approval
	 */
	var TicketItem = objectTemplate.create("TicketItem",
	{
        // Secure properties can only be set on the server

		creator:            {toServer: false, type: Person, fetch: true},
		created:            {toServer: false, type: Date},
		ticket:             {toServer: false, type: Ticket},

        // Only called on the server
		init: function (ticket)
        {
			this.ticket = ticket;
            this.creator = this.getSecurityContext().principal;
            this.created = new Date();
		}

	});

	var TicketItemAttachment = objectTemplate.create("TicketItemAttachment",
	{
		data:               {type: String},
		name:               {type: String},
		created:            {type: Date},
		ticketItem:         {type: TicketItem},

        // Only called on the server
		init: function (ticketItem, name, data)
        {
			this.ticketItem = ticketItem || null;
			this.name = name || null;
			this.data = data || null;
			this.created = new Date();
		}
	});

	var TicketItemComment = TicketItem.extend("TicketItemComment",
	{
		text:               {type: String, rule: ['required'], value: null},
		attachments:        {type: Array, of: TicketItemAttachment, value: []},

        // Only called on the server
		init: function(ticket, text)
        {
			TicketItem.call(this, ticket);
			this.text = text || "";
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

	Ticket.mixin(
	{
		ticketItems:        {toServer: false, type: Array, of: TicketItem, value: []},
        addComment: {
            on: "server",
            validate: function () {
                return this.validate();
            },
            body: function (comment)
        {
            var comment = new TicketItemComment(this, comment);
            this.ticketItems.push(comment);
            return comment;
        }},
	});

}


