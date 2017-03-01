import {Supertype, supertypeClass, property} from 'amorphic';
import {Person} from './person';
import {Ticket} from './ticket';
console.log("Compiling Project");
@supertypeClass
export class Project extends Supertype {

	// Name
	@property({length: 40, rule: ["name", "required"]})
	name:               string;

	@property({rule: ["datetime"]})
	description:        string;

	@property()
	created:            Date;

	@property({oServer: false, fetch: true})
	creator:            Person;

	@property({getType: ()=>{return Ticket}, fetch: true})
	tickets:            Array<Ticket> = [];

	constructor (name: string, description: string) {
		super();
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
*/
	save (authenticatedPerson?) {
		/*
		if (!this.creator) {
			this.creator = this.getSecurityContext().principal;
			this.created = new Date();
		}
		*/
		this.creator = authenticatedPerson;
		return this.persistSave();
	}

	remove () {
		return this.persistDelete();
	}

};