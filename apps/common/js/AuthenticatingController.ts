import {
    Supertype,
    supertypeClass,
    property,
    remote,
    Remoteable,
    Persistable,
    Bindable
} from 'amorphic';
import {
    defaultEmail,
    defaultPassword,
    defaultAdminRole,
    deferEmailChange,
    passwordExpiresMinutes,
    queryFilter,
    maxPreviousPasswords,
    validateEmailHumanReadable,
    validateEmail,
    validateEmailAndLogin,
    insertFilter,
    log,
    passwordChangeExpiresHours,
    maxLoginAttempts,
    validateEmailForce,
    maxLoginPeriodMinutes,
    temporaryPasswordExpiresMinutes
} from './AuthenticationHelpers';
import * as Q from 'q';
import * as urlparser from 'url';
import {SecurityContext} from './SecurityContext';
import {Principal} from './Principal';

@supertypeClass
export abstract class AuthenticatingController extends Bindable(Remoteable(Persistable(Supertype))) {

    @property({length: 50, rule: ["name", "required"]})
    firstName: string = '';

    @property({length: 50, rule: ["name", "required"]})
    lastName: string = '';

    @property({length: 50, rule: ["text", "email", "required"]})
    email: string = '';

    @property({length: 50, rule: ["text", "email", "required"]})
    newEmail: string = '';

    // Secure variables never leaked to the client

    @property({toClient: false})
    password: string = '';

    @property({toClient: false, rule:["required"]})
    confirmPassword: string = '';

    @property({toClient: false, rule:["required"]})
    newPassword: string = '';


    @property({toClient: false})
    passwordChangeHash: string = '';

    @property({toClient: false})
    verifyEmailCode: string = '';

    @property({toServer: false})
    loggedIn: boolean = false;

    @property({toServer: false})
    loggedInRole: string;

    constructor() {
        super();
    }

    init() {
        return this;
    }

    isAdmin () {
        return this.securityContext.isAdmin()
    }


    @property({toServer: false})
    securityContext:  SecurityContext;

    abstract setPrincipal(principal: Principal);
    abstract getPrincipal() : Principal;
    abstract newPrincipal(): Principal;

    isLoggedIn () {
        return !!this.loggedIn;
    }

    createAdmin () {
        this.getPrincipal().amorphicClass.countFromPersistWithQuery({role: defaultAdminRole.call(this)}).then(function (count) {
            if (count == 0) {
                var admin = this.newPrincipal();
                admin.email = defaultEmail.call(this) || "amorphic@amorphic.com";
                admin.firstName = "Admin";
                admin.lastName = "User";
                admin.role = defaultAdminRole.call(this);
                this.amorphicate(admin);
                return admin.establishPassword(defaultPassword.call(this) || "admin", null, true, true);
            } else
                return Q(false);
        }.bind(this));
    }

    /**
     * Create a new principal if one does not exist. This method is used by the currently logged in user to create
     * new users. The principal info comes from the an object which should have the following properties:
     *
     * firstName, lastName, email, newPassword, confirmPassword, role
     *
     * Also used to reset a password
     */
    @remote({validate: function(){return this.validate(document.getElementById('publicRegisterFields'))}})

    createNewAdmin (adminUser, url, pageConfirmation?, pageInstructions?, reset?) {

        // Check for security context of security admin
        if(this.loggedInRole !== defaultAdminRole.call(this)){
            throw {code: 'cannotcreateadmin', text: "Only a security admin can create users"};
        }
        if (adminUser.newPassword != adminUser.confirmPassword)
            throw {code: 'passwordmismatch', text: "Password's are not the same"};

        var principal;

        url = url ? urlparser.parse(url, true) : "";
        return this.getPrincipal().amorphicClass.getFromPersistWithQuery({email: adminUser.email}).then( function (principals)
        {
            if (reset) {
                if (principals.length == 0)
                    throw {code: "email_notfound", text: "Can't find this user"};
                principal = principals[0];
            } else {
                if (principals.length > 0)
                    throw {code: "email_registered", text:"This email is already registered"};
                principal = this.newPrincipal();
            }
            this.amorphicate(principal);

            // this[principalProperty] = this[principalProperty] || Principal.new();
            principal.lockedOut = false;
            if (!reset) {
                principal.email = adminUser.email;
                principal.firstName = adminUser.firstName;
                principal.lastName = adminUser.lastName;
                principal.role = adminUser.role;
            }
            return principal.establishPassword(adminUser.newPassword,
                principal.role == defaultAdminRole.call(this) ? null :
                    new Date((new Date()).getTime() + temporaryPasswordExpiresMinutes.call(this) * 1000 * 60), false, true);

        }.bind(this)).then( function() {
            if (validateEmail.call(this))
                return principal.setEmailVerificationCode();
            else {
                return Q();
            }
        }.bind(this)).then (function ()
        {
            if (url)
                this.sendEmail(validateEmail.call(this) ? "register_verify": "register",
                    principal.email, this.firstName + " " + this.lastName, [
                        {name: "firstName", content: this.firstName},
                        {name: "email", content: this.email},
                        {name: "link", content: url.protocol + "//" + url.host.replace(/:.*/, '') +
                        (url.port > 1000 ? ':' + url.port : '') +
                        "?email=" + encodeURIComponent(this.email) +
                        "&code=" + principal.validateEmailCode + "#verify_email"}
                    ]);
            if (validateEmail.call(this) && pageInstructions)
                return this.setPage(pageInstructions);
            if (!validateEmail.call(this) && pageConfirmation)
                return this.setPage(pageConfirmation);
            return Q(principal);
        }.bind(this))
    }

    /**
     * Create a new principal if one does not exist and consider ourselves logged in
     *
     * @param password
     */
    @remote({validate: function () {
        return this.validate(document.getElementById('publicRegisterFields'));
    }})
    publicRegister (url, pageConfirmation?, pageInstructions?) {
        if (this.newPassword != this.confirmPassword)
            throw {code: 'passwordmismatch', text: "Password's are not the same"};

        var principal;

        url = urlparser.parse(url, true);
        return this.getPrincipal().amorphicClass.countFromPersistWithQuery(
            queryFilter.call(this, {email: { $regex: new RegExp("^" + this.email.toLowerCase().replace(/([^0-9a-zA-Z])/g, "\\$1") + '$'), $options: 'i' }})
        ).then( function (count)
        {
            if (count > 0)
                throw {code: "email_registered", text:"This email already registered"};

            this.setPrincipal(this.getPrincipal() || this.newPrincipal());
            principal = this.getPrincipal();
            this.amorphicate(principal);
            principal.email = this.email;
            principal.firstName = this.firstName;
            principal.lastName = this.lastName;
            insertFilter.call(this, principal);
            return principal.establishPassword(this.newPassword);

        }.bind(this)).then( function() {
            if (validateEmail.call(this))
                return principal.setEmailVerificationCode();
            else
                return Q(true);
        }.bind(this)).then( function () {
            if (!validateEmail.call(this) || validateEmailAndLogin.call(this))
                this.setLoggedInState(principal);
            this.sendEmail(validateEmail.call(this) ? "register_verify": "register",
                principal.email, principal.firstName + " " + principal.lastName, [
                    {name: "firstName", content: this.firstName},
                    {name: "email", content: this.email},
                    {name: "link", content: url.protocol + "//" + url.host.replace(/:.*/, '') +
                    (url.port > 1000 ? ':' + url.port : '') +
                    "?email=" + encodeURIComponent(this.email) +
                    "&code=" + principal.validateEmailCode + "#verify_email"},
                    {name: "verificationCode", content: this.getPrincipal().validateEmailCode}

                ]);
            if (validateEmail.call(this) && pageInstructions)
                return this.setPage(pageInstructions);
            if (!validateEmail.call(this) && pageConfirmation)
                return this.setPage(pageConfirmation);

        }.bind(this))
    }

    /**
     * login the user
     */
    @remote({validate: function () {return this.validate(document.getElementById('publicLoginFields'))}})
    publicLoginBind (page?, forceChange?) {
        var principal;
        if (this.loggedIn)
            throw {code: "already_loggedin", text: "Already logged in"};

        var query = this.getPrincipal().amorphicClass.getFromPersistWithQuery(
            queryFilter.call(this, {email: { $regex: new RegExp("^" + this.email.toLowerCase().replace(/([^0-9a-zA-Z])/g, "\\$1") + '$'), $options: 'i' }}),
            null, null, null, true);
        return query.then(function (principals) {
            if (principals.length == 0 || principals[0].suspended) {
                log.call(this, "Log In attempt for " + this.email + " failed (invalid email)");
                throw {code: "invalid_email_or_password",
                    text: "Incorrect email or password"};
            }
            principal = principals[0];
            this.amorphicate(principal);
            return principal.authenticate(this.password);
        }.bind(this)).then( function() {
            return this.getPrincipal().amorphicClass.getFromPersistWithId(principal._id);
        }.bind(this)).then( function(p) {
            principal = p;
            this.amorphicate(principal);
            forceChange = forceChange || principal.mustChangePassword;
            if (forceChange && !this.newPassword)
                throw {code: "changePassword", text: "Please change your password"};
            return forceChange ? this.changePasswordForPrincipal(principal) : Q(true);
        }.bind(this)).then( function (status) {
            if (status)
                this.setLoggedInState(principal);
            return page ? this.setPage(page) : Q(true);
        }.bind(this))
    }

    /**
     * login the user
     */
    @remote({validate: function () {return this.validate(document.getElementById('publicLoginFields'))}})
    publicLoginFatArrow (page?, forceChange?) {

        var principal;

        if (this.loggedIn)
            throw {code: "already_loggedin", text: "Already logged in"};

        var query = this.getPrincipal().amorphicClass.getFromPersistWithQuery(
            queryFilter.call(this,
                {email: { $regex: new RegExp("^" + this.email.toLowerCase().replace(/([^0-9a-zA-Z])/g, "\\$1") + '$'), $options: 'i' }}),
            null, null, null, true);

        return query.then( (principals) => {
            if (principals.length == 0 || principals[0].suspended) {
                log.call(this, "Log In attempt for " + this.email + " failed (invalid email)");
                throw {code: "invalid_email_or_password",
                    text: "Incorrect email or password"};
            }
            principal = principals[0];
            this.amorphicate(principal);
            return principal.authenticate(this.password);
        }).then(() => {
            return this.getPrincipal().amorphicClass.getFromPersistWithId(principal._id);
        }).then((p) => {
            principal = p;
            this.amorphicate(principal);
            forceChange = forceChange || principal.mustChangePassword;
            if (forceChange && !this.newPassword)
                throw {code: "changePassword", text: "Please change your password"};
            return forceChange ? this.changePasswordForPrincipal(principal) : true;
        }).then( (status) => {
            if (status)
                this.setLoggedInState(principal);
            return page ? this.setPage(page) : Q(true);
        });
    }

    /**
     * login the user
     */
    @remote({validate: function () {return this.validate(document.getElementById('publicLoginFields'))}})
    async publicLogin (page?, forceChange?) {

        if (this.loggedIn)
            throw {code: "already_loggedin", text: "Already logged in"};

        var query = this.getPrincipal().amorphicClass.getFromPersistWithQuery(
            queryFilter.call(this,
                {email: { $regex: new RegExp("^" + this.email.toLowerCase().replace(/([^0-9a-zA-Z])/g, "\\$1") + '$'),
                    $options: 'i' }}), null, null, null, true);

        var principals = await query;
        if (principals.length == 0 || principals[0].suspended) {
            log.call(this, "Log In attempt for " + this.email + " failed (invalid email)");
            throw {code: "invalid_email_or_password",
                text: "Incorrect email or password"};
        }
        var principal = principals[0];
        this.amorphicate(principal);

        await principal.authenticate(this.password);

        var principal = await this.getPrincipal().amorphicClass.getFromPersistWithId(principal._id);
        this.amorphicate(principal);

        forceChange = forceChange || principal.mustChangePassword;
        if (forceChange && !this.newPassword)
            throw {code: "changePassword", text: "Please change your password"};

        var status = forceChange ?  await this.changePasswordForPrincipal(principal) : true;
        if (status)
            this.setLoggedInState(principal);

        if (page)
            await this.setPage(page);
    }


    /**
     * login the user with changed email. Also verify email code
     */
    @remote({validate: function () {return this.validate(document.getElementById('publicLoginFields'))}})
    publicLoginWithNewEmail (page?)
    {
        var principal;

        return this.getPrincipal().amorphicClass.getFromPersistWithQuery(
            queryFilter.call(this, {newEmail: { $regex: new RegExp("^" + this.email.toLowerCase().replace(/([^0-9a-zA-Z])/g, "\\$1") + '$', "i") }}),
            null, null, null, true
        ).then( function (principals) {
            if (principals.length == 0) {
                log.call(this, "Log In attempt for " + this.email + " failed (invalid email)");
                throw {code: "invalid_email_or_password",
                    text: "Incorrect email or password"};
            }
            principal = principals[0];
            this.amorphicate(principal);
            return principal.authenticate(this.password);
        }.bind(this)).then( function() {
            return this.getPrincipal().amorphicClass.getFromPersistWithId(principal._id);
        }.bind(this)).then( function(p) {
            principal = p;
            this.amorphicate(principal);
            if (principal.mustChangePassword && !this.newPassword)
                throw {code: "changePassword", text: "Please change your password"};
            return principal.mustChangePassword ? this.changePasswordForPrincipal(principal) : Q(true);
        }.bind(this)).then( function (status) {
            return principal.consumeEmailVerificationCode(this.verifyEmailCode);
        }.bind(this)).then(function(){
            this.setLoggedInState(principal);

            principal.email = this.email;
            principal.newEmail = ""; // No need to track the changed email anymore
            principal.persistSave();

            // Send an email changed confirmation email
            this.sendEmail("confirm_emailchange", this.email, principal.email,
                principal.firstName + " " + principal.lastName, [
                    {name: "email", content: this.email},
                    {name: "firstName", content: principal.firstName}
                ]);

            return page ? this.setPage(page) : Q(true);
        }.bind(this))
    }

    /**
     *  Set up all fields to indicate logged in
     */
    setLoggedInState (principal)
    {
        this.loggedIn = true;
        this.loggedInRole = principal.role;
        this.setPrincipal(principal);

        // One way so you can't spoof from client
        this.securityContext = SecurityContext.new(principal, principal.role);
    }

    /**
     *  Set up all fields to indicate logged out
     */
    setLoggedOutState ()
    {
        this.setPrincipal(null);
        this.loggedIn = false;
        this.loggedInRole = null;
        this.securityContext = null;
    }

    /*
     * logout the current user
     */
    @remote()
    publicLogout (page?)
    {
        log.call(this, "Customer " + this.email + " logged out");
        this.setLoggedOutState();
        this.amorphic.expireSession();
        return page? this.setPage(page) : null;
    }

    @remote({on: 'client'})
    setPage (page) {
        // should be overriddent if you want to go to a page
    }

    /**
     * change an email address for a logged in user
     */
    @remote({validate: function () {return this.validate(document.getElementById('changeEmailFields'))}})
    async changeEmail (page, url)
    {
        url = urlparser.parse(url, true);
        var principal = this.getPrincipal();
        var oldEmail = principal.email;
        var newEmail = this.newEmail;



        return Q(true).then(function () {
            return principal.authenticate(this.password, null, true);
        }.bind(this)).then (function () {
            return this.getPrincipal().amorphicClass.countFromPersistWithQuery(queryFilter.call(this, {email: newEmail}))
        }.bind(this)).then(function (count) {
            if (count > 0)
                throw {code: "email_registered", text:"This email already registered"};
        }.bind(this)).then( function() {
            if (validateEmail.call(this))
                return principal.setEmailVerificationCode();
            else {
                return Q(false);
            }
        }.bind(this)).then( function() {
            if (!deferEmailChange.call(this))
                this.email = newEmail;

            principal.newEmail = newEmail;
            principal.persistSave();

            // Send an email to old email address which is purely informational
            this.sendEmail("email_changed", oldEmail, principal.email,
                principal.firstName + " " + principal.lastName, [
                    {name: "oldEmail", content: oldEmail},
                    {name: "email", content: newEmail},
                    {name: "firstName", content: principal.firstName}
                ]);

            // Send an email to new email address asking to verify the new email
            // address
            this.sendEmail(validateEmail.call(this) ? "email_changed_verify" : "email_changed",
                newEmail,  principal.firstName + " " + principal.lastName, [
                    {name: "oldEmail", content: oldEmail},
                    {name: "email", content: newEmail},
                    {name: "firstName", content: principal.firstName},
                    {name: "link", content: url.protocol + "//" + url.host.replace(/:.*/, '') +
                    (url.port > 1000 ? ':' + url.port : '') +
                    "?email=" + encodeURIComponent(newEmail) +
                    "&code=" + principal.validateEmailCode + (deferEmailChange.call(this) ? "#verify_email_change" : "#verify_email")},
                    {name: "verificationCode", content: principal.validateEmailCode}
                ]);

            log.call(this, "Changed email " + oldEmail + " to " + newEmail);

            return page ? this.setPage(page) : Q(true);

        }.bind(this));
    }
    abstract sendEmail (slug, email, name, emails : Array<any>)
    @remote({validate: function () {return this.validate(document.getElementById('changeEmailFields'))}})
    resendChangeEmailValidationCode (url)
    {
        url = urlparser.parse(url, true);
        var principal = this.getPrincipal();
        this.sendEmail("email_verify", principal.email, principal.firstName + " " + principal.lastName, [
            {name: "email", content: principal.email},
            {name: "firstName", content: principal.firstName},
            {name: "link", content: url.protocol + "//" + url.host.replace(/:.*/, '') +
            (url.port > 1000 ? ':' + url.port : '') +
            "?email=" + encodeURIComponent(principal.email) +
            "&code=" + principal.validateEmailCode + "#verify_email"},
            {name: "verificationCode", content: principal.validateEmailCode}
        ]);

        log.call(this, "Resent email validation code to " + principal.email);

        return Q();
    }

    /**
     * Change the password for a logged in user verifying old password
     * Also called from login on a force change password so technically you don't have to be logged in
     */
    @remote({validate: function () {return this.validate(document.getElementById('changePasswordFields'))}})
    changePassword (page)
    {
        if (!this.loggedIn)
            throw {code: "not_loggedin", text:"Not logged in"};
        return this.changePasswordForPrincipal(this.getPrincipal(), page);
    }

    changePasswordForPrincipal(principal, page?)
    {
        return principal.authenticate(this.password, true).then(function()
        {
            return principal.establishPassword(this.newPassword,
                passwordExpiresMinutes.call(this) ?
                    new Date((new Date()).getTime() + passwordExpiresMinutes.call(this) * 1000 * 60) : null).then(function ()
            {
                log.call(this, "Changed password for " + principal.email);
                if (this.sendEmail)
                    this.sendEmail("password_changed",
                        principal.email, principal.firstName,
                        [
                            {name: "firstName", content: principal.firstName}
                        ]);

                return page ? this.setPage(page) : Q(true);

            }.bind(this))

        }.bind(this));
    }

    /**
     * Request that an email be sent with a password change link
     */
    @remote({validate: function () {return this.validate(document.getElementById('publicResetPasswordFields'))}})
    publicResetPassword (url, page)
    {
        url = urlparser.parse(url, true);
        log.call(this, "Request password reset for " + this.email);
        return this.getPrincipal().amorphicClass.getFromPersistWithQuery(queryFilter.call(this, {email: this.email}), null, null, null, true).then(function (principals)
        {
            if (principals.length < 1)
                throw {code: "invalid_email", text:"Incorrect email"};
            var principal = principals[0];
            this.amorphicate(principal);

            return principal.setPasswordChangeHash().then (function (token)
            {
                this.sendEmail("password_reset",
                    this.email, principal.firstName, [
                        {name: "link", content: url.protocol + "//" + url.host.replace(/:.*/, '') +
                        (url.port > 1000 ? ':' + url.port : '') +
                        "?email=" + encodeURIComponent(this.email) +
                        "&token=" + token + "#reset_password_from_code"},
                        {name: "firstName", content: principal.firstName}
                    ]);

                return page ? this.setPage(page) : Q(true);

            }.bind(this));

        }.bind(this))
    }

    /**
     * Change the password given the token and log the user in
     * Token was generated in publicResetPassword and kept in principal entity to verify
     */
    @remote({validate: function () {return this.validate(document.getElementById('publicChangePasswordFromTokenFields'))}})
    publicChangePasswordFromToken (page)
    {
        var principal;

        return this.getPrincipal().amorphicClass.getFromPersistWithQuery(queryFilter.call(this, {email:this.email}), null, null, null, true).then(function (principals)
        {
            if (principals.length < 1)
                throw {code: "ivalid_password_change_token",
                    text: "Invalid password change link - make sure you copied correctly from the email"};

            principal = principals[0];
            this.amorphicate(principal);
            return principal.consumePasswordChangeToken(this.passwordChangeHash, this.newPassword);

        }.bind(this)).then( function() {
            return this.getPrincipal().amorphicClass.getFromPersistWithId(principal._id);
        }.bind(this)).then( function(p) {
            principal = p;
            this.amorphicate(principal);
            return principal.establishPassword(this.newPassword)

        }.bind(this)).then(function () {
            this.setLoggedInState(principal)

            log.call(this, "Changed password for " + principal.email);
            if (this.sendEmail){
                this.sendEmail("password_changed", principal.email, principal.firstName, [
                    {name: "firstName", content: principal.firstName}
                ]);
            }

            return page ? this.setPage(page) : Q(true);
        }.bind(this))
    }

    /**
     * Verify the email code
     */
    @remote()
    publicVerifyEmailFromCode (page?)
    {
        var principal;

        return this.getPrincipal().amorphicClass.getFromPersistWithQuery(queryFilter.call(this, {email:this.email}), null, null, null, true).then(function (principals)
        {
            if (principals.length < 1)
                throw {code: "invalid_email_verification_code",
                    text: "Invalid verification link - make sure you copied correctly from the email"};

            principal = principals[0];
            this.amorphicate(principal);
            return principal.consumeEmailVerificationCode(this.verifyEmailCode);

        }.bind(this)).then(function ()
        {
            return page ? this.setPage(page) : Q(true);

        }.bind(this))
    }

    /**
     * Verify the email code assuming principal already in controller
     */
    @remote()
    privateVerifyEmailFromCode (verifyEmailCode)
    {
        var principal = this.getPrincipal();
        try {
            return principal.consumeEmailVerificationCode(verifyEmailCode);
        } catch (e) {
            return Q(false);
        }
    }
}
