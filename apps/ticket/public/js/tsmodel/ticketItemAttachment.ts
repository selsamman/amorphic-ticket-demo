import {TicketItem} from './ticketItem';

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





