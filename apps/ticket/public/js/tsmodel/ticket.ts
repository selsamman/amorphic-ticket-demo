import {Supertype, supertypeClass, property, remote} from 'supertype';
import {Person} from './person';
import {Project} from './project';
import {TicketItem} from './ticketItem';
import {TicketItemComment} from './ticketItemComment';
// import "reflect-metadata";

// function remote (props: Object) {
//     return function (target: any, targetKey: string, descriptor: PropertyDescriptor) {
//         target.__amorphicprops__ = target.__amorphicprops__ || {}
//         target.__amorphicprops__[targetKey] = props || {};
//         // I can modify the property descriptor here to inject remote proxy
//     }
// }

@supertypeClass
export class Ticket {

    @property({rule: ['required']})
    title:			string;

    @property()
    description:	string;			// {type: String},

    @property({toServer: false})
    created:            Date;

    @property({toServer: false, fetch: true})
    creator:            Person;		//{toServer: false, type: Person, fetch: true},

    @property({toServer: false, fetch: true})
    project:            Project;	//{toServer: false, type: Project, fetch: true},

    @property({of: TicketItem})
    ticketItems: 	Array<TicketItem> = [];		//, value: []},

    constructor (title : string, description : string, projectName? : string, projectDescription? : string) {
        this.title = title || null;
        this.description = description || null;
        if (projectName)
            this.project = new Project(projectName, projectDescription);
    };

    @remote({
        on: "server",
        validate: function () {
            return this.validate();
        }
    })
    addComment (comment) {
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