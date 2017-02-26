import {Supertype, supertypeClass, property, remote} from 'supertype';
import {TicketItem} from './ticketItem';

export class TicketItemAttachment {	// = objectTemplate.create("TicketItemAttachment",
    @property()
    data:               string;
    @property()
    name:               string;
    @property()
    created:            Date;
    @property()
    ticketItem:         TicketItem;

    // Only called on the server
    constructor (ticketItem, name, data) {
        this.ticketItem = ticketItem || null;
        this.name = name || null;
        this.data = data || null;
        this.created = new Date();
    }
};





