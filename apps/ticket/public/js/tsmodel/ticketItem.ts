import {Person} from './person';
import {Ticket} from './ticket';
import {TicketItemComment} from './ticketItemComment';

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



