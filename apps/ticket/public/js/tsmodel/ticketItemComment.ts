import {Supertype, supertypeClass, property, remote} from 'supertype';
import {Ticket} from './ticket';
import {TicketItem} from './ticketItem';
import {TicketItemAttachment} from './ticketItemAttachment';

@supertypeClass
export class TicketItemComment { //  extends TicketItem

    @property()
    text:               string;			//, rule: ['required'], value: null},
    @property({type: TicketItemAttachment})
    attachments:        Array<TicketItemAttachment>		//, value: []},

    // Only called on the server
    constructor (ticket: Ticket, text) {
        // super(ticket);
        this.text = text;
    };

    addAttachment (name, data) {
        var attachment = new TicketItemAttachment(this, name, data);
        this.attachments.push(attachment);
        return attachment;
    };

    /*
     remove () {
     for (var ix = 0;ix < this.attachments.length;++ix)
     this.attachments[ix].persistDelete();
     this.persistDelete();
     };
     */
};