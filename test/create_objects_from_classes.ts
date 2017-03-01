import { Controller } from '../apps/ticket/public/js/controller';
import { Ticket } from '../apps/ticket/public/js/tsmodel/ticket';
import { Project } from '../apps/ticket/public/js/tsmodel/project';
import { expect } from 'chai';
import * as mocha from 'mocha';


describe('Create a Ticket', () => {
    it('Named Correctly', () => {
        const ticket : Ticket = new Ticket("First", "The first one");
        expect(ticket.title).to.equal("First");
    });
    it('Can create a ticket item', () => {
        const ticket : Ticket = new Ticket("First", "The first one");
        ticket.addComment("Boo Hoo")
        expect(ticket.ticketItems.length).to.equal(1);
    });
    it('Can deal with circular references', () => {
        const project : Project = new Project("First", "The first one");
        project.addNewTicket("Ticket 1", "The first")
        expect(project.tickets.length).to.equal(1);
        expect(project.tickets[0].project).to.equal(project);
    });
    it('Can create the controller', () => {
        var controller = new Controller();
    });

});