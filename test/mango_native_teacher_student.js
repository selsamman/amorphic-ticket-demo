/*
* Teacher Student Example
*
* This tests the ability to use ObjectTemplate by itself with MongoDB
*
* */

var expect = require('chai').expect;
var Q = require("q");
var ObjectTemplate = require('semotus/objectTemplate.js');
var PersistObjectTemplate = require('semotus/persistObjectTemplate.js')(ObjectTemplate, null, ObjectTemplate);
var mongo = require('q-mongodb');

var Student = ObjectTemplate.create({
	name:       {type: String},
	grade:      {type: String, value: "A+"}
});

var Teacher = ObjectTemplate.create({
	name:       {type: String}
});

var Class = ObjectTemplate.create({
	student:    {type: Student},
	teacher:    {type: Teacher}
});

Student = Student.mixin({
	classes:    {type: Array, of: Class}
});

Teacher = Teacher.mixin({
	classes:    {type: Array, of: Class}
});


var MongoClient = require('mongodb').MongoClient;
var Q = require('Q');

var db;


before (function (done) {
	Q.ninvoke(MongoClient, "connect", "mongodb://localhost:27017/testpersist").then (function (dbopen) {
		db = dbopen;
		PersistObjectTemplate.setDB(db);
		done();
	});
});

function clearCollection(collectionName) {
	return Q.ninvoke(db, "collection", collectionName).then(function (collection) {
		return Q.ninvoke(collection, "remove").then (function () {
			return Q.ninvoke(collection, "count")
		});
	});
}

describe("Mongo Test Suite", function () {

	it ("clears the student teachers", function (done) {
		clearCollection("students")
		.then(function (count) {
			expect(count).to.equal(0);
			return clearCollection('teachers')
		}).then(function (count) {
			expect(count).to.equal(0);
			return clearCollection('classes')
		}).then(function (count) {
			expect(count).to.equal(0);
			done();
		})
	});

	describe("Mongo insert", function () {

		it ("can insert and read back stuff", function (done) {
			var student_id = 0;
			var teacher_id = 0;
			Q.ninvoke(db, "collection", "students").then(function (students) {
				return Q.ninvoke(students, "insert", {name: 'sam', grade: 'A+'})
				.then(function(inserts) {
					student_id = inserts[0]._id;
					return Q.invoke(db, "collection", 'teachers').then(function(teachers) {
						return Q.ninvoke(teachers, "insert", {name: 'julia'})
						.then(function(inserts) {
							teacher_id = inserts[0]._id;
							return Q.ninvoke(db, "collection", 'classes')
							.then(function(classes) {
								return Q.ninvoke(classes, "insert", {teacher_id: teacher_id, student_id: student_id})
								.then(function (items) {
									return Q.ninvoke(students, "find")
								}).then(function (cursor) {
									return Q.ninvoke(cursor, "toArray");
								}).then(function (items) {
									expect(items[0].name).to.equal("sam");
									return Q.ninvoke(teachers, "find");
								}).then(function (cursor) {
									return Q.ninvoke(cursor, "toArray");
								}).then(function (items) {
									expect(items[0].name).to.equal("julia");
									return Q.ninvoke(classes, "find");
								}).then(function (cursor) {
									return Q.ninvoke(cursor, "toArray");
								}).then(function (items) {
									expect(items[0].teacher_id.toString()).to.equal(teacher_id.toString());
									expect(items[0].student_id.toString()).to.equal(student_id.toString());
									return Q.fcall(function(){return "yea"});
								})
							})
						})
					})
				})
			}).then(function(res){expect(res).to.equal("yea");done()})
			.fail(function(e){done(e)});
		});
	});

});

