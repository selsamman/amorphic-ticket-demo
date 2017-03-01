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

    @remote()
    publicLogin () {
        return Principal.getFromPersistWithQuery({email: this.email})
            .then(function (principals : Array<Principal>) {
                if (principals.length > 0) {
                    principals[0].loggedIn(principals[0])
                    this.loggedIn = true;
                } else {
                    throw "No Such User"
                }
        });
    }

}