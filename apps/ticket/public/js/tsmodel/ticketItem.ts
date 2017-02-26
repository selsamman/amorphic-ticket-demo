import {Supertype, supertypeClass, property, remote} from 'supertype';
import {Person} from './person';
import {Ticket} from './ticket';
import {TicketItemComment} from './ticketItemComment';

@supertypeClass
export class TicketItem {

    // Secure properties can only be set on the server
    @property()
    creator:            Person; 		//{toServer: false, type: Person, fetch: true},
    @property()
    created:            Date;			//{toServer: false, type: Date},
    @property()
    ticket:             Ticket;			//{toServer: false, type: Ticket},

    // Only called on the server
    constructor (ticket: Ticket) {
        this.ticket = ticket;
        //this.creator = this.getSecurityContext().principal;
        this.created = new Date();
    }

    isComment () {
        return this instanceof TicketItemComment;
    }
};
