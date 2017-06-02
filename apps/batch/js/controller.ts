import {Supertype, supertypeClass, Persistable, property, remote, amorphicStatic, Bindable} from 'amorphic';
import { TicketItemComment } from '../../common/js/ticketItemComment';
import {Ticket} from '../../common/js/ticket';
import * as Q from 'Q';
import * as _ from 'underscore';
import {Person} from "../../common/js/person";
import {Project} from "../../common/js/project";

var forceImport = TicketItemComment;

@supertypeClass
export class Controller extends Persistable(Supertype) {
    serverInit () {
        amorphicStatic.logger.info({userConfigFromAmorphic: this.amorphic.config.userConfig, userConfigFromStatic: amorphicStatic.config.userConfig}, 'Damon Up and Running ');
        setTimeout(() => this.tickTock(), 5000);

    }
    tickTock() {
        return Ticket.getFromPersistWithQuery({}).then(function (tickets) {
            this.amorphic.logger.info({count: tickets.length}, 'Read Tickets');
        }.bind(this));

    }
}
