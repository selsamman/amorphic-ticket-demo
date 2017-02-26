import {Supertype, supertypeClass, property} from 'supertype';
import {Person} from './person';
import {Ticket} from './ticket';

@supertypeClass
export class Project {

	// Name
	@property()
	name:               string; 			// length: 40, rule: ["name", "required"]},
	@property()
	description:        string;
	@property()
	created:            Date;				// rule: ["datetime"]},
	@property()
	creator:            Person;				// {toServer: false, fetch: true},
	@property({type: Ticket})
	tickets:            Array<Ticket> = []		//{toServer: false, type: Array, of: ProjectRole, value: [], fetch: true},

	constructor (name: string, description: string) {
		this.name = name;
		this.description = description;
	};

	addNewTicket (title: string, description: string) {
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