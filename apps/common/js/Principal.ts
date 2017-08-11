import {
    Supertype,
    supertypeClass,
    property,
    remote,
    Remoteable,
    Persistable,
    Bindable
} from 'amorphic';
import {SecurityContext} from './SecurityContext';

class _Persistent extends Persistable(Supertype) {}

export interface Principal extends _Persistent {
    role:  string;

    email: string;

    newEmail: string;

    firstName: string;

    lastName: string;

    emailValidated: boolean;

    suspended: boolean;

    lockedOut: boolean;

    unsuccesfulLogins: Array<Date>;

    passwordExpires: Date;

    mustChangePassword: boolean;

    previousSalts: Array<string>;

    previousHashes: Array<string>;

    securityContext:  SecurityContext;

    // These are never received.  You can mess with your passwork assuming you are logged in but never see it

    passwordHash: string;

    passwordSalt: string;

    passwordChangeHash: string;

    passwordChangeSalt: string;

    passwordChangeExpires: Date;

    validateEmailCode: string;

    roleSet (role)
    suspendUser (suspended);
    changeEmail (email);

    setRoleForUser (role);
    /**
     * Create a password hash and save the object
     *
     * @param password
     * @returns {*} promise (true) when done
     * throws an exception if the password does not meet password rules
     */

    establishPassword (password, expires, noValidate, forceChange);
    /**
     * Check password rules for a new password
     *
     * @param password
     * @return {*}
     */
    validateNewPassword (password);
    /**
     * Return a password hash
     *
     * @param password
     * @param salt
     * @return {*}
     */

    getHash (password, salt);
    /**
     * Get a secure random string for the salt
     *
     * @return {*}
     */
    getSalt ();
    /*
     * Make registration pending verification of a code usually sent by email
     */
    setEmailVerificationCode ();
    /*
     * Verify the email code passed in and reset the principal record to allow registration to proceed
     */
    consumeEmailVerificationCode (code);
    /**
     * Create a one-way hash for changing passwords
     * @returns {*}
     */
    setPasswordChangeHash ();
    /**
     * Consume a password change token and change the password
     *
     * @param token
     * @returns {*}
     */
    consumePasswordChangeToken (token, newPassword);
    /**
     * Verify a password on login (don't reveal password vs. user name is bad)
     *
     * @param password
     * @returns {*}
     */
    authenticate (password, loggedIn, novalidate);
    badLogin ();
}