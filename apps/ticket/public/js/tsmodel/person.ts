import {TicketItem} from './ticket';

export class Person {

    // Name
    firstName:          string = "";     //value: "", length: 40, rule: ["name", "required"]},
    middleName:         string = "";     // value: "", length: 40, rule: "name"},
    lastName:           string = "";     //value: "", length: 40, rule: ["name", "required"]},

    // Secure data elements never transmitted in both directions
    email:              string = "";     //{toServer: false, type: String, value: "", length: 200},

    // Relationships
    ticketItems:        Array<TicketItem> = [];  //  {type: Array, of: TicketItem, value: {}},

    constructor  (email, first, middle, last) {
        this.firstName = first || "";
        this.middleName = middle || "";
        this.lastName = last || ""
        this.email = email || "";
    };

    getFullName () {
        return this.firstName + (this.middleName ? " " + this.middleName  + " ": " ") + this.lastName;
    };
/*
    save () {
        return this.persistSave();
    };

    remove () {
        if (this.getSecurityContext().isAdmin())
            return this.persistDelete();
        else
            return Q(false);
    };
*/
};

