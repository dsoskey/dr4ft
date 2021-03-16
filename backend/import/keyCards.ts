import { SetNumToID } from 'backend/data';
import { ExternalCard } from '../../common/src/types/card';

const keyBy = (getGroup: (card: ExternalCard) => string, getValue: (card: ExternalCard) => any, cards: ExternalCard[] = []) => (
  cards.reduce((acc, card) => {
    // @ts-ignore
    acc[getGroup(card)] = getValue(card);
    return acc;
  }, {})
);

const groupCardsBy = (
  getGroup: (card: ExternalCard) => string,
  getValue: (card: ExternalCard) => any,
  cards: ExternalCard[] = [],
) => (
  cards.reduce((acc, card) => {
    const group = getGroup(card);
    // @ts-ignore
    (acc[group] = acc[group] || []).push(getValue(card));
    return acc;
  }, {})
);

const rarityPlucker = ({rarity}: ExternalCard) => rarity;
const numberPlucker = ({number}: ExternalCard) => number;
const uuidPlucker = ({uuid}: ExternalCard) => uuid;
const namePlucker = ({name}: ExternalCard) => name.toLowerCase();
const setPlucker = ({setCode}: ExternalCard) => setCode.toLowerCase();

export const groupCardsUuidByRarity = (cards: ExternalCard[] = []) =>
  groupCardsBy(rarityPlucker, uuidPlucker,cards);

export const groupCardsByName = (cards: ExternalCard[] = []) =>
  groupCardsBy(namePlucker, (card: ExternalCard) => card, cards);

export const groupCardsBySet = (cards: ExternalCard[] = []) =>
  groupCardsBy(setPlucker, card => card, cards);

export const keyCardsUuidByNumber = (cards: ExternalCard[] = []): SetNumToID =>
  keyBy(numberPlucker, uuidPlucker, cards);

const keyCardsUuidByName = (cards: ExternalCard[] = []) =>
  keyBy(namePlucker, uuidPlucker, cards);

export const keyCardsByUuid = (cards: ExternalCard[] = []) =>
  keyBy(uuidPlucker, card => card, cards);
