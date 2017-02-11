import {Person} from './person';
import {Project} from './project';

export class Ticket {

    // Insecure properties can be set on the client and saved by a logged in user
    title:			string;			// rule: ["required"]},
    description:	string;			// {type: String},

    // Secure properties only set on the server
    created:            Date;		//{toServer: false, type: Date},
    creator:            Person;		//{toServer: false, type: Person, fetch: true},
    project:            Project;	//{toServer: false, type: Project, fetch: true},

    ticketItems: 	Array<TicketItem> = [];		//, value: []},

    constructor (title, description) {
        this.title = title || null;
        this.description = description || null;
    };

    addComment (comment) {
        /*
         on: "server",
         validate: function () {
         return this.validate();
         },
         body: function (comment
         */
        comment = new TicketItemComment(this, comment);
        this.ticketItems.push(comment);
        return comment;
    }

    /*
     titleSet (value) {				// {on: "server", body: function(value)
     if (value.match(/Sam/i) && value.match(/sucks|poor|untidy|bug|bugs|buggy|crap/i))
     throw "Don't disparage Sam";
     this.title = value;
     };
     validateServerCall () {
     return this.getSecurityContext() ? true : false;
     };

     projectSet (project) {	// {on: "server", body: function(project)
     return Project.getFromPersistWithId(project._id).then( function(project) {
     this.project = project || null;
     return project;
     }.bind(this));
     };

     remove () {		//  {on: "server", body: function ()
     for (var ix = 0; ix < this.ticketItems; ++ix)
     this.ticketItems[ix].remove();
     if (this.project) {
     for (var ix = 0; ix < this.project.tickets.length; ++ix)
     if (this.project.tickets[ix] == this)
     this.project.splice(ix, 1);
     this.project.save();
     }
     return this.persistDelete();
     };

     save () {

     on: "server",
     validate: function () {return this.validate()},
     body: function ()

     if (!this.created)
     this.created = new Date();

     if (!this.creator)
     this.creator = this.getSecurityContext().principal;

     return this.persistSave();
     }
     */
};

/**
 * Any additional informational content for ticket added after creation
 * such as a comment or an approval
 */
export class TicketItem {

    // Secure properties can only be set on the server
    creator:            Person; 		//{toServer: false, type: Person, fetch: true},
    created:            Date;			//{toServer: false, type: Date},
    ticket:             Ticket;			//{toServer: false, type: Ticket},

    // Only called on the server
    constructor (ticket) {
        this.ticket = ticket;
        //this.creator = this.getSecurityContext().principal;
        this.created = new Date();
    }
};

export class TicketItemComment extends TicketItem {

    text:               string;			//, rule: ['required'], value: null},
    attachments:        Array<TicketItemAttachment>		//, value: []},

    // Only called on the server
    constructor (ticket, text) {
        super(ticket);
        this.text = text;
    };

    addAttachment (name, data) {
        var attachment = new TicketItemAttachment(this, name, data);
        this.attachments.push(attachment);
        return attachment;
    };

    /*
     remove () {
     for (var ix = 0;ix < this.attachments.length;++ix)
     this.attachments[ix].persistDelete();
     this.persistDelete();
     };
     */
};

export class TicketItemAttachment {	// = objectTemplate.create("TicketItemAttachment",
    data:               string;
    name:               string;
    created:            Date;
    ticketItem:         TicketItem;

    // Only called on the server
    constructor (ticketItem, name, data) {
        this.ticketItem = ticketItem || null;
        this.name = name || null;
        this.data = data || null;
        this.created = new Date();
    }
};





