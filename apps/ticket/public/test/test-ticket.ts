// declare function require(name:string);
// var ObjectTemplate = require('supertype');
// var PersistObjectTemplate = require('../../index.js')(ObjectTemplate, null, ObjectTemplate);

// PersistObjectTemplate.debugInfo = 'api;conflict;write;read;data';//'api;io';
// PersistObjectTemplate.debugInfo = 'conflict;data';//'api;io';
// PersistObjectTemplate.logger.setLevel('debug');


import Promise = require('bluebird');
import { expect } from 'chai';
import * as mocha from 'mocha';
import * as _ from 'underscore';
import {Ticket} from "../js/tsmodel/ticket";

describe('Ticket', function() {

    let ticket: Ticket;

    beforeEach(function() {
        ticket = new Ticket('HavenLife', 'Term Life Insurance');
    });

    describe('addComment', function() {
        it('should add a new comment to itself', function(done) {
            ticket.addComment('ticket comment');
            expect(ticket.ticketItems.length).to.equal(1);
            done();
        });
    });

});