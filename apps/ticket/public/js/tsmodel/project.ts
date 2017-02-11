import {Person} from './person';
import {Ticket} from './ticket';

export class Project {

	// Name
	name:               string; 			// length: 40, rule: ["name", "required"]},
	description:        string;
	created:            Date;				// rule: ["datetime"]},
	creator:            Person;				// {toServer: false, fetch: true},
	tickets:            Array<Ticket> = []		//{toServer: false, type: Array, of: ProjectRole, value: [], fetch: true},

	constructor (name, description) {
		this.name = name;
		this.description = description;
	};

	addNewTicket (title, description) {
		const ticket : Ticket = new Ticket(title, description);
		ticket.project = this;
		this.tickets.push(ticket);
	}
/*
	validateServerCall () {
		return this.getSecurityContext().principal ? true : false;
	};
	save (authenticatedPerson) {
		if (!this.creator) {
			this.creator = this.getSecurityContext().principal;
			this.created = new Date();
		}
		return this.persistSave();
	}

	remove: function () {
		return this.persistDelete();
	}
*/
};