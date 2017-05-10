import {Supertype, supertypeClass, property, remote, Remoteable, Persistable} from 'amorphic';
import {Person} from './person';
import {Ticket} from './ticket';
import {TicketItemComment} from './ticketItemComment';
import {Created, Constructable} from './created';
console.log("Compiling TicketItem");

@supertypeClass
export class TicketItem extends Created(Remoteable(Persistable(Supertype))) {

    // Secure properties can only be set on the server
    @property({getType: ()=>{return Person}})
    creator:            Person; 		//{toServer: false, type: Person, fetch: true},

    @property()
    created:            Date;			//{toServer: false, type: Date},

    @property({getType: ()=>{return Ticket}})
    ticket:             Ticket;			//{toServer: false, type: Ticket},

    // Only called on the server
    constructor (ticket: Ticket, creator? : Person) {
        super()
        this.ticket = ticket;
        this.creator = creator;
        this.created = new Date();
    }

    isComment () {
        return this instanceof TicketItemComment;
    }

    remove () {
        return this.persistDelete();
    }
};
