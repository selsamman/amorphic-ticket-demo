import {expect} from 'chai';

import {Basket} from "./circular/basket";
import {Peach} from './circular/peach';
import {Pear} from './circular/pear';
import {Fruit} from './circular/fruit';

/***
 * Circular referencese
 *
 * You will get a run-time error "Object prototype may only be an Object or null: undefined at line 7 of peach.js" if your
 * imports are such that Fruit is imported first as in ....
 import {Fruit} from './circular/fruit';
 import {Peach} from './circular/peach';
 import {Pear} from './circular/pear';
 import {Basket} from "./circular/basket";
 *
 * This is because the order or processing will be:
 * 1) Fruit is invoked. Fruit imports basket.
 * 2) Basket then imports Peach and Pear
 * 3) Peach and Pear then import Fruit (which is already in process of being imported and so undefined is returned)
 * 4) Since Peach extends Fruit and Fruit is undefined an incorrect class is generated
 * 5) When an instance Fruit is created it fails
 *
 * However by importing Basket first, Basket and Fruit are ready by the time the extends comes along
 *
 */

describe('Create fruit', () => {
    it('Can identify types of fruit', () => {
        const peach : Fruit = new Peach();
        const pear : Fruit = new Pear();
        expect(peach instanceof Fruit).to.equal(true);
        expect(pear instanceof Fruit).to.equal(true);
    });
    it('Can make a basket', () => {
        const basket = new Basket();
        basket.addPeach();
        basket.addPear();
    });
    it('Fruit can make its own basket', () => {
        const peach = new Peach();
        peach.addNewBasket();
    });
});
