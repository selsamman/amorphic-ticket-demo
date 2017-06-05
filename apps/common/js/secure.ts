import {Supertype, supertypeClass, property, Remoteable, Persistable} from 'amorphic';
import {TicketItem} from './ticketItem';
console.log("Compiling Person");
import {AuthenticatedPrincipal} from "amorphic-userman";
import {Created} from "./created";

@supertypeClass({toClient: false})
export class Secure extends Created(Remoteable(Persistable(Supertype))) {

    @property()
    secret:          string = "!!!!!!!!!!!!";

};

