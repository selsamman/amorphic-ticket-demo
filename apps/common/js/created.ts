import {Supertype, supertypeClass, property, remote, Remoteable, Persistable} from 'amorphic';

import {Person} from './person';
class BaseClass extends Remoteable(Persistable(Supertype)) {};
export type Constructable<BC> = new (...args: any[]) => BC;

export function Created<BC extends Constructable<BaseClass>>(Base: BC) {

    @supertypeClass
     abstract class Mixin extends Base {

        @property()
        created:            Date;

        @property({fetch: true, getType: () => {return Person}})
        creator:            Person;

    };
    return Mixin;
}

