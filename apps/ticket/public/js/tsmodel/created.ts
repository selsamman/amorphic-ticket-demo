import {Supertype, supertypeClass, property, remote} from 'amorphic';
import {Person} from './person';

export type Constructable<BC> = new (...args: any[]) => BC;

export function Created<BC extends Constructable<{}>>(Base: BC) {

    @supertypeClass
     class Mixin extends Base {

        @property()
        created:            Date;

        @property({fetch: true, getType: () => {return Person}})
        creator:            Person;

    };
    return Mixin;
}

