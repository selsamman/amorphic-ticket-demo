import {Supertype, supertypeClass, property, Remoteable, Persistable} from 'amorphic';
import {TicketItem} from './ticketItem';
console.log("Compiling Person");
import {AuthenticatedPrincipal} from './AuthenticatedPrincipal';
//import {Created} from "./created";
import {Person} from './person';

@supertypeClass({toClient: false})
export class Secure extends Remoteable(Persistable(Supertype)) {
    @property()
    created:            Date;

    @property({fetch: true, getType: () => {return Person}})
    creator:            Person;

    @property()
    secret:          string = "!!!!!!!!!!!!";

};

