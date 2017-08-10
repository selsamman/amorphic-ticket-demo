import {
    Supertype,
    supertypeClass,
    property,
    remote,
    Remoteable,
    Persistable,
    Bindable
} from 'amorphic';
import * as Q from 'q';
import * as _ from 'underscore';
import * as crypto from 'crypto';
import {Principal} from './Principal';
import {SecurityContext} from './SecurityContext';
import {
    defaultAdminRole,
    queryFilter,
    maxPreviousPasswords,
    validateEmailHumanReadable,
    passwordChangeExpiresHours,
    maxLoginAttempts,
    validateEmailForce,
    maxLoginPeriodMinutes
} from './AuthenticationHelpers';

@supertypeClass
export class AuthenticatedPrincipal extends Remoteable(Persistable(Supertype)) implements Principal {
    @property()
    role:  string;

    // These secure elements are NEVER transmitted

    @property({toServer: false})
    email: string = '';

    @property({toServer: false})
    newEmail: string = '';

    @property({toServer: false})
    firstName: string = '';

    @property({toServer: false})
    lastName: string = '';

    @property({toServer: false})
    emailValidated: boolean = false;

    @property({toServer: false})
    suspended: boolean = false;

    @property({toServer: false})
    lockedOut: boolean = false;

    @property({toServer: false, toClient: false, type: Date})
    unsuccesfulLogins: Array<Date> = [];

    @property({toServer: false})
    passwordExpires: Date;

    @property({toServer: false})
    mustChangePassword: boolean = false;

    @property({toServer: false, toClient: false, type: String})
    previousSalts: Array<string> = [];

    @property({toServer: false, toClient: false, type: String})
    previousHashes: Array<string> = [];


    @property({toServer: false, persist: false})
    securityContext:  SecurityContext;

    // These are never received.  You can mess with your passwork assuming you are logged in but never see it

    @property({toClient: false, toServer: false})
    passwordHash: string;

    @property({toClient: false, toServer: false})
    passwordSalt: string;

    @property({toClient: false, toServer: false})
    passwordChangeHash: string = '';

    @property({toClient: false, toServer: false})
    passwordChangeSalt: string = '';

    @property({toClient: false, toServer: false})
    passwordChangeExpires: Date;

    @property({toClient: false, toServer: false})
    validateEmailCode: string;

    constructor() {
        super();
    }

    static new() {
        return new AuthenticatedPrincipal().init();
    }

    init() {
        return this;
    }

    @remote()
    roleSet (role) {
        if (this.securityContext.role == defaultAdminRole.call(this))
            this.role = role;
        else
            throw {code: "role_change", text: "You cannot change roles"};
    }

    @remote()
    suspendUser (suspended) {
        if (this.securityContext.role == defaultAdminRole.call(this) && (this.role != defaultAdminRole.call(this)))
            this.suspended = suspended;
        else
            throw {code: "suspend_change", text: "You cannot suspend/resume"};
        return this.persistSave();
    }

    @remote()
    changeEmail (email) {
        if (this.securityContext.role == defaultAdminRole.call(this) && (this.role != defaultAdminRole.call(this)))
            return AuthenticatedPrincipal.getFromPersistWithQuery(queryFilter.call(this, {email: email})).then(function (principals) {
                if (principals.length > 0)
                    throw {code: "email_change_exists", text: "Email already exists"};
                this.email = email;
                return this.persistSave();
            }.bind(this));
        else
            throw {code: "email_change", text: "You cannot change email"};
    }


    @remote()
    setRoleForUser (role) {
        this.roleSet(role);
        return this.persistSave();
    }

    /**
     * Create a password hash and save the object
     *
     * @param password
     * @returns {*} promise (true) when done
     * throws an exception if the password does not meet password rules
     */

    establishPassword (password, expires, noValidate, forceChange) {
        if (!noValidate)
            this.validateNewPassword(password);

        var promises = [];
        if (maxPreviousPasswords.call(this))
            for (var ix = 0; ix < this.previousHashes.length; ++ix)
                (function () {
                    var closureIx = ix;
                    promises.push(this.getHash(password, this.previousSalts[closureIx]).then(function (hash) {
                        if (this.previousHashes[closureIx] === hash)
                            throw {code: "last3", text: "Password same as one of last " + maxPreviousPasswords.call(this)};
                        return Q(true);
                    }.bind(this)));
                }.bind(this))()
        return Q.all(promises).then(function ()
        {
            // Get a random number as the salt
            return this.getSalt().then(function (salt) {
                this.passwordSalt = salt;
                this.passwordChangeHash = "";

                // Create a hash of the password with the salt
                return this.getHash(password, salt);

            }.bind(this)).then(function (hash) {
                // Save this for verification later
                this.passwordHash = hash;
                while (this.previousSalts.length > maxPreviousPasswords.call(this))
                    this.previousSalts.splice(0, 1);
                while (this.previousHashes.length > maxPreviousPasswords.call(this))
                    this.previousHashes.splice(0, 1);
                this.previousSalts.push(this.passwordSalt);
                this.previousHashes.push(this.passwordHash);
                this.passwordExpires = expires;
                this.mustChangePassword = forceChange || false;
                return this.persistSave();
            }.bind(this));

        }.bind(this));
    }

    /**
     * Check password rules for a new password
     *
     * @param password
     * @return {*}
     */
    validateNewPassword (password) {
        if (password.length < 6 || password.length > 30 || !password.match(/[A-Za-z]/) || !password.match(/[0-9]/))

            throw {code: "password_composition",
                text: "Password must be 6-30 characters with at least one letter and one number"};
    }

    /**
     * Return a password hash
     *
     * @param password
     * @param salt
     * @return {*}
     */

    getHash (password, salt) {
        return Q.ninvoke(crypto, 'pbkdf2', password, salt, 10000, 64).then(function (whyAString : string) {
            return Q((new Buffer(whyAString, 'binary')).toString('hex'));
        });
    }

    /**
     * Get a secure random string for the salt
     *
     * @return {*}
     */
    getSalt () {
        return Q.ninvoke(crypto, 'randomBytes', 64).then(function (buf : Buffer) {
            return Q(buf.toString('hex'));
        });
    }

    /*
     * Make registration pending verification of a code usually sent by email
     */
    setEmailVerificationCode () {
        this.emailValidated = false;
        if (validateEmailHumanReadable.call(this)) {
            this.validateEmailCode = Math.random().toString().substr(2,4);
            return this.persistSave();
        } else
            return this.getSalt().then(function (salt) {
                this.validateEmailCode = salt.substr(10, 6);
                return this.persistSave();

            }.bind(this));
    }

    /*
     * Verify the email code passed in and reset the principal record to allow registration to proceed
     */
    consumeEmailVerificationCode (code) {
        if (code != this.validateEmailCode)
            throw {code: "inavlid_validation_link", text: "Incorrect email validation link"}

        //this.validateEmailCode = false;
        this.emailValidated = true;
        return this.persistSave();
    }

    /**
     * Create a one-way hash for changing passwords
     * @returns {*}
     */
    setPasswordChangeHash () {
        var token;
        return this.getSalt().then(function (salt) {
            token = salt;
            return this.getSalt();
        }.bind(this)).then(function (salt) {
            this.passwordChangeSalt = salt;
            return this.getHash(token, salt);
        }.bind(this)).then(function (hash) {
            this.passwordChangeHash = hash;
            this.passwordChangeExpires = new Date(((new Date()).getTime() +
            (passwordChangeExpiresHours.call(this) || 24) * 60 * 60 * 1000));
            return this.persistSave();
        }.bind(this)).then(function () {
            return Q(token);
        }.bind(this));
    }

    /**
     * Consume a password change token and change the password
     *
     * @param token
     * @returns {*}
     */
    consumePasswordChangeToken (token, newPassword) {
        if (!this.passwordChangeHash)
            throw {code: "password_reset_used", text: "Password change link already used"};
        return this.getHash(token, this.passwordChangeSalt).then(function (hash) {
            if (this.passwordChangeHash != hash)
                throw {code: "invalid_password_change_link", text: "Incorrect password change link"};
            if (this.passwordChangeExpires.getTime() < (new Date()).getTime())
                throw {code: "password_change_link_expired", text: "Password change link expired"};
            return this.establishPassword(newPassword);
        }.bind(this));
    }

    /**
     * Verify a password on login (don't reveal password vs. user name is bad)
     *
     * @param password
     * @returns {*}
     */
    authenticate (password, loggedIn, novalidate) {
        if (!novalidate && this.validateEmailCode && validateEmailForce.call(this))

            throw {code: "registration_unverified",
                text: "Please click on the link in your verification email to activate this account"};

        if (this.lockedOut)
            throw {code: "locked out", text: "Please contact your security administrator"};

        if (this.passwordExpires && (new Date()).getTime() > this.passwordExpires.getTime())
            throw {code: "loginexpired", text: "Your password has expired"};

        return this.getHash(password, this.passwordSalt).then(function (hash) {
            if (this.passwordHash !== hash) {
                return this.badLogin().then(function () {
                    this.persistSave();
                    throw loggedIn ?
                        {code: "invalid_password", text: "Incorrect password"} :
                        {code: "invalid_email_or_password", text: "Incorrect email or password"};
                }.bind(this));
            } else {
            }
            return Q(true);

        }.bind(this))
    }

    badLogin () {
        if (maxLoginAttempts.call(this)) {
            this.unsuccesfulLogins.push(new Date());
            this.unsuccesfulLogins = _.filter(this.unsuccesfulLogins, function (attempt : any) {
                return ((new Date(attempt)).getTime() > ((new Date()).getTime() - 1000 * 60 * maxLoginPeriodMinutes.call(this)));
            }.bind(this));
            if (this.unsuccesfulLogins.length > maxLoginAttempts.call(this)) {
                if (this.role != defaultAdminRole.call(this)) {
                    this.lockedOut = true;
                }
                return Q.delay(10000)
            }
            return Q.delay(1000);
        } else
            return Q.delay(2000)
    }

}
