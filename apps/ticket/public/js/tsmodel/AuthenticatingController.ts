import {Supertype, supertypeClass, property, remote} from 'amorphic';
import {Principal} from "./Principal";

@supertypeClass
export class AuthenticatingController extends Supertype {

    @property({length: 50, rule: ["name", "required"]})
    firstName: string = '';

    @property({length: 50, rule: ["name", "required"]})
    lastName: string = '';

    @property({ length: 50, rule: ["text", "email", "required"]})
    email: string = '';

    @property({toServer: false})
    loggedIn:  boolean = false;

    isAdmin () {return false};

    @remote()
    publicLogin () {
        console.log('publicLogin ' + (this['__objectTemplate__'] ? 'has objectTemplate' : ''));
        return Principal.getFromPersistWithQuery({email: this.email})
        .then(function (principals : Array<Principal>) {
            if (principals.length > 0) {
                console.log(principals[0]['email'] + ' logged in');
                this.registerPrincipal(principals[0])
                this.loggedIn = true;
                console.log('publicLogin exit' + (this['__objectTemplate__'] ? this['__objectTemplate__'].sessions.length : ''));
            } else {
                throw "No Such User"
            }
        }.bind(this));
    }

}