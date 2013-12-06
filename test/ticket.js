var expect = require('chai').expect;
var Q = require("q");
var fs = require('fs');
var ObjectTemplate = require('semotus/objectTemplate.js');
var PersistObjectTemplate = require('semotus/persistObjectTemplate.js')(ObjectTemplate, null, ObjectTemplate);
var MongoClient = require('mongodb').MongoClient;
var nconf = require('nconf');
var Semotus = require('semotus');
nconf.argv().env();
nconf.file('checkedin', 'config.json');
nconf.file('local', 'config_secure.json');

var foo=require("../apps/ticket/public/js/ticket.js");

var requires = Semotus.getTemplates(PersistObjectTemplate, 'apps/ticket/public/js/',
	['ticket.js','person.js','person.js','project.js']);

var Ticket = requires.ticket.Ticket;
var TicketItem = requires.ticket.TicketItem;
var TicketItemAttachment =  requires.ticket.TicketItemAttachment;
var TicketItemComment =  requires.ticket.TicketItemComment;
var TicketItemApproval =  requires.ticket.TicketItemApproval;

var Person = requires.person.Person;
var Project = requires.project.Project;
var ProjectRelease = requires.project.ProjectRelease;
var ProjectRole = requires.project.ProjectRole;

var db;

var collections = JSON.parse(fs.readFileSync(__dirname + "/../apps/ticket/schema.json"));


// Injections

Person.inject(function () {
	Person.sendEmail = function (email, subject, body) {
		console.log(email + " " + subject);
	}
});

before (function (done) {
	Q.ninvoke(MongoClient, "connect", nconf.get('dbPath') + nconf.get('dbTestName')).then (function (dbopen) {
		db = dbopen;
		PersistObjectTemplate.setDB(db);
		PersistObjectTemplate.setSchema(collections);
		done();
	});
});

// Utility function to clear a collection via mongo native
function clearCollection(collectionName) {
	return Q.ninvoke(db, "collection", collectionName).then(function (collection) {
		return Q.ninvoke(collection, "remove").then (function () {
			return Q.ninvoke(collection, "count")
		});
	});
}

describe("Ticket System Test Suite", function () {

	it ("clears the ticket system", function (done) {
		clearCollection("ticket").then(function (count) {
			expect(count).to.equal(0);
			return clearCollection('attachment')
		}).then(function (count) {
			expect(count).to.equal(0);
			return clearCollection('person')
		}).then(function (count) {
			expect(count).to.equal(0);
			return clearCollection('project')
		}).then(function (count) {
			expect(count).to.equal(0);
			done();
		});
	});

	describe("Persist Test", function ()
	{

		// People
		var sam = new Person("sam@elsamman.com", "Sam", "M", "Elsamman");
		var karen = new Person("karen@elsamman.com", "Karen", "M", "Burke");

		// Projects
		var semotus = new Project(sam, "Semotus");
		var travel = new Project(karen, "Travel Bears");
		semotus.addRelease("0.1", (new Date('1/1/14')));
		semotus.addRelease("0.2", (new Date('3/1/14')));
		semotus.addRole("manager", karen);
		semotus.addRole("developer", sam);
		travel.addRole("manager", sam);
		travel.addRole("developer", sam);
		travel.addRelease("0.1", (new Date('1/1/14')));

		// Tickets
		var ticket1 = semotus.addTicket(sam, "semotus ticket1", "Ticket 1");
		ticket1.assignRelease("0.1");
		var ticket2 = semotus.addTicket(sam, "semotus ticket2", "Ticket 2");
		travel.addTicket(sam, "travel ticket1", "Ticket 1", "0.1");


		var item = ticket1.addComment(karen, "ticket1 item1");
		item.addAttachment("attachment1", "data1");
		item.addAttachment("attachment2", "data2");
		ticket1.addApproval(karen);

		// Some negative tests
		var exception;

		exception = null;
		try { ticket2.addApproval(sam); } catch (e) {exception = e.toString()}
		expect (exception).to.equal("only the project manager role can approve a ticket");

		// Persist them (everything hangs off people so the whole graph gets added

		var sam_id;
		var karen_id;
		var semotus_id;
		var travel_id;

		it("can create stuff", function (done) {
			semotus.persistSave().then(function(id) {
				semotus_id = id
				expect(semotus_id.length).to.equal(24);
				return travel.persistSave();
			}.bind(this)).then( function (id) {
				travel_id = id
				expect(travel_id.length).to.equal(24);
				return sam.persistSave();
			}.bind(this)).then( function (id) {
				sam_id = id
				expect(sam_id.length).to.equal(24);
				return karen.persistSave();
			}.bind(this)).then( function (id) {
				karen_id = id;
				expect(karen_id.length).to.equal(24);
				done();
			}.bind(this))
			.fail(function(e){done(e)});
		});

		it("can read stuff back", function (done) {
			Project.getFromPersistWithId(semotus_id).then (function (semotus)	{

				expect(semotus.name).to.equal("Semotus");
				expect(semotus.roles.length).to.equal(2);
				semotus.roles.sort(function(a,b){a.created - b.created});
				expect(semotus.roles[0].person.firstName).to.equal("Karen");
				expect(semotus.roles[1].person.firstName).to.equal("Sam");
				expect(semotus.creator.firstName).to.equal("Sam");
				semotus.tickets.sort(function(a,b){a.created - b.created});
				expect(semotus.tickets[0].title).to.equal("semotus ticket1");
				semotus.tickets[0].ticketItems.sort(function(a,b){a.created - b.created});
				expect(semotus.tickets[0].ticketItems[0] instanceof TicketItemComment).to.be.true;
				expect(semotus.tickets[0].ticketItems[1] instanceof TicketItemApproval).to.be.true;
				semotus.tickets[0].ticketItems[0].attachments.sort(function(a,b){a.created - b.created});
				expect(semotus.tickets[0].ticketItems[0].attachments[0].name).to.equal("attachment1");
				expect(semotus.tickets[0].ticketItems[0].attachments[1].name).to.equal("attachment2");
				done()
			}.bind(this))
			.fail(function(e)
				{done(e)}
			);
		});
	});
});



