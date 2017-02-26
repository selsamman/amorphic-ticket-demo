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
import {Person} from "../js/tsmodel/person";

describe('Person', function() {

    let person;

    beforeEach(function() {
        person = new Person('tdh@havenlife.com', 'tom', 'dick', 'harry');
    });

    describe('getFullName', function() {
        it('should return first name and last name concatenated', function(done) {
            expect(person.getFullName()).to.equal('tom dick harry');
            done();
        });
    });

});