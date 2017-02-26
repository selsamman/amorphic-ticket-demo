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
import {Project} from "../js/tsmodel/project";
import {Ticket} from "../js/tsmodel/ticket";

describe('Person', function() {

    let project: Project;

    beforeEach(function() {
        project = new Project('HavenLife', 'Term Life Insurance');
    });

    describe('addNewTicket', function() {
        it('should add a new ticket to itself', function(done) {
            project.addNewTicket('show1', 'show 1 in LV')
            expect(project.tickets.length).to.equal(1);
            expect(project.tickets[0].title).to.equal('show1');
            expect(project.tickets[0].description).to.equal('show 1 in LV');
            done();
        });
    });

});