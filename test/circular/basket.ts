import {Fruit} from './fruit';
import {Peach} from "./peach";
import {Pear} from "./pear";

export class Basket {
    fruit: Array<Fruit> = [];
    addPeach () {
        this.fruit.push(new Peach);
    }
    addPear () {
        this.fruit.push(new Pear);
    }
}