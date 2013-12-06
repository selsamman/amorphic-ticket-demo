module.exports.ticket = function (objectTemplate, getTemplate)
{
	var Person = getTemplate('./person.js').Person;
	var Project = getTemplate('./project.js').Project;
	var ProjectRelease = getTemplate('./project.js').ProjectRelease;

	var Ticket = objectTemplate.create("ticket:ticket",
	{
		title:              {type: String, value: null},
		description:        {type: String, value: ""},
		created:            {type: Date, value: null, rule: ["datetime"]},
		creator:            {type: Person, value: null},
		release:            {type: ProjectRelease, value: null},
		project:            {type: Project, value: null},

		init: function (person, project, title, description, release) {
			this.title = title || null;
			this.creator = person || null;
			this.project = project || null
			this.release = release || null;
			this.created = new Date();
		},
		assignRelease: function (name) {
			var release = this.project.getRelease(name);
			if (!release)
				throw ("cannot find release " + release + " for project " + this.name);
			this.release = release;
		}
	});

	/**
	 * Any additional informational content for ticket added after creation
	 * such as a comment or an approval
	 */
	var TicketItem = objectTemplate.create("ticketItem:ticketItem",
	{
		creator:            {type: Person},
		created:            {type: Date},
		ticket:             {type: Ticket},

		init: function (ticket, person) {
			this.ticket = ticket;
			this.creator = person || null;
			this.created = new Date();
		}

	});

	var TicketItemAttachment = objectTemplate.create("attachment:ticketItemAttachment",
	{
		data:        {type: String},
		name:        {type: String},
		created:     {type: Date},
		ticketItem:  {type: TicketItem},
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
		},
		addAttachment: function(name, data) {
			var attachment = new TicketItemAttachment(this, name, data);
			this.attachments.push(attachment);
			return attachment;
		}
	});


	var TicketItemApproval = TicketItem.extend("ticketItem:ticketItemApproval",
	{
		init: function (person) {
			TicketItem.call(this, person);
		}
	});

	Ticket.mixin(
	{
		ticketItems:        {type: Array, of: TicketItem, value: []},
		addComment: function (person, text) {
			var item = new TicketItemComment(this, person, text);
			this.ticketItems.push(item);
			return item;
		},
		addApproval: function (person) {
			if (!this.project)
				throw "cannot approve ticket that is not assigned to a project";
			if (!this.project.getRole( "manager", person))
				throw "only the project manager role can approve a ticket";
			var item = new TicketItemApproval(this, person);
			this.ticketItems.push(item);
			return item;
		}

	});

	return {
		Ticket: Ticket,
		TicketItem: TicketItem,
		TicketItemAttachment: TicketItemAttachment,
		TicketItemComment: TicketItemComment,
		TicketItemApproval: TicketItemApproval
	}
}


