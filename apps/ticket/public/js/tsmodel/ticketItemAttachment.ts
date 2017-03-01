import {Supertype, supertypeClass, property, remote} from 'amorphic';
import {TicketItem} from './ticketItem';
console.log("Compiling TicketItemAttachment");
@supertypeClass
export class TicketItemAttachment extends Supertype {	// = objectTemplate.create("TicketItemAttachment",
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
        super();
        this.ticketItem = ticketItem || null;
        this.name = name || null;
        this.data = data || null;
        this.created = new Date();
    }
};





