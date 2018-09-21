
import Chance from 'chance'
import * as c from './constants'

const chance = new Chance();

function createPairs () {
  const pairs = [];
  const entries = Math.floor(c.NUM_ENTRIES / c.NUMBER_OF_SLICES);
  for (let i = 0; i < entries; i++) {
    const pair = chance.currency_pair()
    pairs.push({
      id: i,
      value: Math.random(),
      name: pair[0].code + pair[1].code
    })
  }
  return pairs
}

export function fillPairs (id) {
  return {
    type: `${c.FILL_PAIRS}_${id}`,
    pairs: createPairs()
  }
}

function getRandIndex () {
    return Math.floor(Math.random() * Math.floor(c.NUM_ENTRIES / c.NUMBER_OF_SLICES))
}

export function updatePair (id) {
    return {
        type: `${c.UPDATE_PAIR}_${id}`,
        id: getRandIndex(),
        value: Math.random()
    }
}
