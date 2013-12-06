module.exports.person = function (objectTemplate, getTemplate)
{

	if (typeof(require) != "undefined") {
		Q = require('q');  // Don't use var or js optimization will force local scope
		var crypto = require('crypto');
	}


	var Person;
	Person = objectTemplate.create("person:person",
		{
			// Name
			firstName: {type: String, value: "", length: 40, rule: ["name", "required"]},
			middleName: {type: String, value: "", length: 40, rule: "name"},
			lastName: {type: String, value: "", length: 40, rule: ["name", "required"]},

			// Secure data elements never transmitted in both directions
			email: {toServer: false, type: String, value: "", length: 200},
			passwordHash: {toClient: false, toServer: false, type: String, value: ""},
			passwordSalt: {toClient: false, toServer: false, type: String, value: ""},
			passwordChangeToken: {toClient: false, toServer: false, type: String, value: ""},
			passwordChangeExpires: {toClient: false, toServer: false, type: Date},

			// Relationships

			init: function (email, first, middle, last) {
				this.firstName = first || "";
				this.middleName = middle || "";
				this.lastName = last || ""
				this.email = email || "";
			},
			getFullName: function() {
				return this.firstName + (this.middleName ? " " + this.middleName  + " ": " ") + this.lastName;
			},
			register: function (password) {
				var error = this.validateNewPassword(password);
				if (error)
					return Q.fcall(function () {
						return error
					});

				return this.getSalt().then(function (salt)
				{
					this.passwordSalt = salt;
					return this.getHash(password, salt);

				}.bind(this)).then(function (hash) {
					this.passwordHash = hash;
					return this.persistSave().then(function (id) {
						return null;
					}.bind(this));
				}.bind(this));
			},

			/**
			 * Check password rules for a new password
			 *
			 * @param password
			 * @return {*}
			 */
			validateNewPassword: function (password) {
				var error = "Password must be 6-30 characters with at least one letter and one number";
				if (password.length < 6 || password.length > 30)
					return error;
				if (!password.match(/[A-Za-z]/) || !password.match(/[0-9]/))
					return error;
				return null;
			},
			/**
			 * Return a passowrd hash
			 *
			 * @param password
			 * @param salt
			 * @return {*}
			 */
			getHash: function (password, salt) {
				return Q.ninvoke(crypto, 'pbkdf2', password, salt, 10000, 64)
					.then(function (whyAString) {
						return Q.fcall(function () {
							return(new Buffer(whyAString, 'binary')).toString('hex')
						})
					});
			},
			/**
			 * Get a secure random string for the salt
			 *
			 * @return {*}
			 */
			getSalt: function () {
				return Q.ninvoke(crypto, 'randomBytes', 64)
					.then(function (buf) {
						return Q.fcall(function () {
							return buf.toString('hex')
						})
					});
			},
			/**
			 * Verify a password required when a loggedin user makes a sensitive change
			 *
			 * @return {*}
			 */
			verifyOldPassword: function (password) {
				if (!this.loggedIn)
					return false;
				else
					return this.getHash(password, this.model.passwordSalt).then(function (hash) {
						if (this.model.passwordHash != hash) {
							this.loginError = "Incorrect password";
							return false;
						} else
							return true;

					}.bind(this));
			}


		});

	return {
		Person: Person
	}

}
module.exports.person_mixins = function (objectTemplate, requires)
{
	requires.person.Person.mixin(
	{
		projectRoles:           {type: Array, of: requires.project.ProjectRole, value: {}},
		ticketItems:            {type: Array, of: requires.ticket.TicketItem, value: {}},
		authenticate:  function (password) {
			return this.getHash(password, this.passwordSalt).then( function(hash)
			{
				return this.passwordHash === hash
			}.bind(this))
		}
	});
}


