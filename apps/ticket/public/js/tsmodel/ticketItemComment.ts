import {TicketItem} from './ticketItem';
import {TicketItemAttachment} from './ticketItemAttachment';

export class TicketItemComment extends TicketItem {

    text:               string;			//, rule: ['required'], value: null},
    attachments:        Array<TicketItemAttachment>		//, value: []},

    // Only called on the server
    constructor (ticket, text) {
        super(ticket);
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