import {Supertype, supertypeClass, property} from 'supertype';
import {TicketItem} from './ticketItem';

@supertypeClass
export class Person {

    // Name
    @property()
    firstName:          string = "";     //value: "", length: 40, rule: ["name", "required"]},
    @property()
    middleName:         string = "";     // value: "", length: 40, rule: "name"},
    @property()
    lastName:           string = "";     //value: "", length: 40, rule: ["name", "required"]},

    // Secure data elements never transmitted in both directions
    @property()
    email:              string = "";     //{toServer: false, type: String, value: "", length: 200},

    // Relationships
    @property({type: TicketItem})
    ticketItems:        Array<TicketItem> = [];  //  {type: Array, of: TicketItem, value: {}},

    constructor  (email: string, first: string, middle: string, last: string) {
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

