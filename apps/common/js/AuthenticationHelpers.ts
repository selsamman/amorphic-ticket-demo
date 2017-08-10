export function validateEmail () {
    return this.amorphic.config.nconf.get('authentication').validateEmail || 0;
}

export function validateEmailAndLogin () {
    return this.amorphic.config.nconf.get('authentication').validateEmailAndLogin;
}

export function passwordChangeExpiresHours () {
    return this.amorphic.config.nconf.get('authentication').passwordChangeExpiresHours;
}

export function validateEmailForce () {
    return this.amorphic.config.nconf.get('authentication').validateEmailForce;
}

export function defaultEmail () {
    return this.amorphic.config.nconf.get('authentication').defaultEmail;
}

export function defaultPassword () {
    return this.amorphic.config.nconf.get('authentication').defaultPassword;
}

export function defaultRole () {
    return this.amorphic.config.nconf.get('authentication').defaultRole;
}

export function validateEmailHumanReadable () {
    return this.amorphic.config.nconf.get('authentication').validateEmailHumanReadable;
}

export function maxLoginAttempts () {
    return this.amorphic.config.nconf.get('authentication').maxLoginAttempts || 0;
}

export function maxLoginPeriodMinutes () {
    return (this.amorphic.config.nconf.get('authentication').maxLoginPeriodMinutes || 10) * 60;
}

export function defaultAdminRole  () {
    return this.amorphic.config.nconf.get('authentication').defaultAdminRole;
}

export function maxPreviousPasswords  () {
    return this.amorphic.config.nconf.get('authentication').maxPreviousPasswords;
}

export function temporaryPasswordExpiresMinutes  () {
    return  this.amorphic.config.nconf.get('authentication').temporaryPasswordExpiresMinutes;
}

export function deferEmailChange  () {
    return this.amorphic.config.nconf.get('authentication').deferEmailChange;
}

export function passwordExpiresMinutes () {
    return this.amorphic.config.nconf.get('authentication').passwordExpiresMinutes;
}

export function log(message) {
    this.__objectTemplate__.logger.info(message);
}

export function filterProperty () {
    return this.amorphic.config.nconf.get('authentication').filterProperty;
}

export function filterValue () {
    return this.amorphic.config.nconf.get('authentication').filterValue;
}

// Add the property filter on a query
export function queryFilter(query) {
    if (filterProperty.call(this) && filterValue.call(this)) {
        query[filterProperty.call(this)] = filterValue.call(this);
    }
    return query;
}
// Add the property value to an object (principal)
export function insertFilter(obj) {
    if (filterProperty.call(this) && filterValue.call(this)) {
        obj[filterProperty.call(this)] = filterValue.call(this);
    }
}
