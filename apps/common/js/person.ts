import {Supertype, supertypeClass, property, Remoteable, Persistable} from 'amorphic';
import {TicketItem} from './ticketItem';
console.log("Compiling Person");
import {AuthenticatedPrincipal} from "amorphic-userman";

@supertypeClass
export class Person extends AuthenticatedPrincipal {

    @property({length: 40, rule: ["name", "required"]})
    firstName:          string = "";

    @property({length: 40, rule: ["name", "required"]})
    middleName:         string = "";

    @property({length: 40, rule: ["name", "required"]})
    lastName:           string = "";     //value: "", length: 40, rule: ["name", "required"]},

    // Secure data elements never transmitted in both directions
    @property({toServer: false, length: 200})
    email:              string = "";

    // Relationships
    @property({type: TicketItem})
    ticketItems:        Array<TicketItem> = [];

    constructor  (email: string, first: string, middle: string, last: string) {
        super();
        this.firstName = first || "";
        this.middleName = middle || "";
        this.lastName = last || ""
        this.email = email || "";
    };

    getFullName () {
        return this.firstName + (this.middleName ? " " + this.middleName  + " ": " ") + this.lastName;
    };

    save () {
        return this.persistorSave();
    };

    remove () {
        //if (this.getSecurityContext().isAdmin())
            return this.persistDelete();
        //else
        //    return Q(false);
    };

};

