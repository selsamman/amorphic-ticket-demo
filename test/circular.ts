import {expect} from 'chai';
import {Fruit} from './circular/fruit';
import {Peach} from './circular/peach';
import {Pear} from './circular/pear';
import {Basket} from "./circular/basket";

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
