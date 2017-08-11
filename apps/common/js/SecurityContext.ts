import {
    Supertype,
    supertypeClass,
    property,
    remote,
    Remoteable,
    Persistable,
    Bindable
} from 'amorphic';
import {Principal} from './Principal';
import {defaultAdminRole} from './AuthenticationHelpers';

@supertypeClass
export class SecurityContext extends Remoteable(Persistable(Supertype)) {

    @property({toServer: false})
    principal: Principal;

    @property({toServer: false})
    role: string;

    @property({toServer: false})
    defaultAdminRole: string;

    constructor() {
        super();
    }

    static new(principal, role) {
        return new SecurityContext().init(principal, role);
    }

    init (principal, role) {
        this.principal = principal;
        this.role = role;
        this.defaultAdminRole = defaultAdminRole.call(principal);
        return this;
    }

    isLoggedIn () {
        return !!this.role;
    }
    isAdmin () {
        return this.isLoggedIn() && this.principal.role == this.defaultAdminRole;
    }
}