import { Card } from '../common/src/types/card';
import fs from 'fs';
import _ from 'lodash';
import path from 'path';
const readFile = (path: string) => JSON.parse(fs.readFileSync(path, 'UTF-8'));
import { keyCardsUuidByNumber, groupCardsBySet, groupCardsByName } from './import/keyCards';

const DATA_DIR = 'data';
const DRAFT_STATS_DIR = 'draftStats';
const CARDS_PATH = 'cards.json';
const CUBABLE_CARDS_PATH = 'cubable_cards_by_name.json';
const SETS_PATH = 'sets.json';
const BOOSTER_RULES_PATH = 'boosterRules.json';

export interface MtgSet {
  code: string;
  type: string; // TODO: enum
  name: string;
  releaseDate: string;
  baseSetSize: number;
  size: number;
  cardsByNumber: SetNumToID;
  Basic?: string[];
  Common?: string[]
  Uncommon?: string[];
  Rare?: string[];
  Mythic?: string[];
}

type SetMap = { [setCode: string]: MtgSet };


interface SetCodeToSetNum {
  [setCode: string]: SetNumToID;
}
export interface SetNumToID {
  [setNum: string]: string;
}
// TODO: Add this to my typescript learnings book
/**
 * Type intersection can be used to add fields to an index type
 */
type HasDefault<T> = T & { default: string; };
interface CubableCardsByName { 
  [cardName: string]: HasDefault<SetCodeToSetNum>;
}

type CardMap = { [uuid: string]: Card };

interface BoosterVariant {
  sheets: { [sheetName: string]: number };
  weight: number;
}
export interface Sheet {
  balance_colors: boolean;
  totalWeight: number;
  cards: { [uuid: string]: number };
  cardsByColor: { [colorName: string]: string[] };
}
export interface BoosterRule {
  boosters: BoosterVariant[];
  totalWeight: number;
  sheets: { [sheetName: string]: Sheet };
}

interface BoosterRuleMap {
  [setCode: string]: BoosterRule;
}
type HasRepoHash<T> = T & { repoHash: string; }

let
 jawns: CardMap | null, // cards
 cubableCardsByName: CubableCardsByName | null,
 sheds: SetMap | null, // sets
 playableSets: { [setType: string]: MtgSet[] } | null,
 latestSet: MtgSet | null,
 boosterRules: HasRepoHash<BoosterRuleMap> | null;

export const getDataDir = (): string => {
  const repoRoot = process.cwd();
  const dataDir = path.join(repoRoot, DATA_DIR);
  return dataDir;
};

export const reloadData = (filename: string) => {
  switch (filename) {
  case CARDS_PATH: {
    jawns = null;
    break;
  }
  case CUBABLE_CARDS_PATH: {
    cubableCardsByName = null;
    break;
  }
  case SETS_PATH: {
    sheds = null;
    playableSets = null;
    latestSet = null;
    break;
  }
  case BOOSTER_RULES_PATH: {
    boosterRules = null;
    break;
  }
  }
};

export const getSets = (): SetMap => {
  if (!sheds) {
    sheds = readFile(`${getDataDir()}/${SETS_PATH}`);
  }
  return sheds!;
};

export const getSet = (setCode: string) => getSets()[setCode];

const getCards = (): { [uuid: string]: Card } => {
  if (!jawns) {
    jawns = readFile(`${getDataDir()}/${CARDS_PATH}`);
  }
  return jawns!;
};

const mergeCardsTogether = (oldCards: CardMap, newCards: CardMap) => ({
  ...oldCards,
  ...newCards
});

//TODO: someone should handle this? Maybe a service?
export const saveSetAndCards = ({set: newSet, cards: newCards}: any) => {
  saveSetsAndCards(
    { ...sheds, [newSet.code]: newSet },
    mergeCardsTogether(getCards(), newCards),
  );
};

const saveSetsAndCards = (allSets: SetMap, allCards: CardMap) => {
  writeSets(allSets);
  writeCards(allCards);
  writeCubeCards(allSets, allCards);
};

export const getCardByUuid = (uuid: string) => {
  return getCards()[uuid];
};

const parseCubableCardName = (cardName: string) => {
  // Cube cards can be written as:
  //
  // * 'Abrade' (just card name)
  // * 'Abrade (CMR)' (card name + set code)
  // * 'Abrade (CMR 410)' (card name + set code + number within set)
  const match = cardName.match(/^(.*?)(?: +\((\w+)(?: +(\w+))?\))? *$/);
  if (!match) return null;

  return {name: match[1], set: match[2], number: match[3]};
};

const getCubableCardUuidByName = (cardName: string): string | null => {
  if (!cubableCardsByName) {
    cubableCardsByName = readFile(`${getDataDir()}/${CUBABLE_CARDS_PATH}`);
  }

  const card = parseCubableCardName(cardName);
  if (!card) return null;

  const options = cubableCardsByName![card.name];
  if (!options) return null;
  if (!card.set) return options.default;

  const byNumber = options[card.set];
  if (!byNumber) return options.default;
  if (card.number && byNumber[card.number]) return byNumber[card.number];

  return byNumber[Object.keys(byNumber).sort()[0]];
};

export const getCubableCardByName = (cardName: string) => {

  return getCardByUuid(getCubableCardUuidByName(cardName)!);
};

const writeCards = (newCards: any) => {
  fs.writeFileSync(`${getDataDir()}/${CARDS_PATH}`, JSON.stringify(newCards, undefined, undefined));
};

const sortByPriority = (allSets: SetMap) => (card1: Card, card2: Card) => {
  const set1 = allSets[card1.setCode];
  const set2 = allSets[card2.setCode];

  if (isReleasedExpansionOrCoreSet(set1.type, set1.releaseDate)) {
    if(isReleasedExpansionOrCoreSet(set2.type, set2.releaseDate)) {
      return new Date(set2.releaseDate).getMilliseconds() - new Date(set1.releaseDate).getMilliseconds();
    } else {
      return -1;
    }
  } else if(isReleasedExpansionOrCoreSet(set2.type, set2.releaseDate)) {
    return 1;
  }

  return 0;
};

const writeCubeCards = (allSets: SetMap, allCards: CardMap) => {
  const groupedCards = groupCardsByName(Object.values(allCards));
  const groupedCardsArray = Object.values(groupedCards);
  const mySort = sortByPriority(allSets);
  groupedCardsArray.forEach((cards: any) => {
    cards.sort(mySort);
  });

  // Group cubable cards so they're easy to look up. A single card ends up
  // looking like:
  //
  // 'abrade': {
  //     'default': '4b921a1e-853d-50f7-9d76-d7f107c6c7e3',
  //     'cmr': {
  //         '410': '7aad9d6f-4cef-5e79-a2c2-2491ae3a5498',
  //         '659': '5f43d620-b3a9-5f52-a6ce-325d63199131'
  //     },
  //     ...
  // }
  //
  // Split cards are listed multiple times, once for their combined name and
  // once each for each half of the split name.
  const cubableCards = groupedCardsArray
    .map((cards: any) => {
      return [cards[0].name.toLowerCase(), {
        default: cards[0].uuid,
        ..._.mapValues(groupCardsBySet(cards), keyCardsUuidByNumber)
      }];
    })
    /* Create entries for each side of split or double cards.
       E.g Fire // Ice will create 3 entries :
        - Fire // Ice
        - Fire
        - Ice
    */
    .flatMap(([cardName, cardValues]) => {
      const names = cardName.split(' // ');
      if (names.length <= 1) return [[cardName, cardValues]];

      return [
        [cardName, cardValues],
        ...names.map((name: string) => [name, cardValues])
      ];
    })
    /* It may happen that double cards have side's name clashing with other double cards names.
      E.g. 'fire' name may clash with Fire // Ice and Start // Fire.
      To understand which is the true 'default', we sort the cards by priority and choose the first one.
    */
    .reduce((cubableCards, [cardName, cardValues]) => {
      if (!cubableCards[cardName]) {
        cubableCards[cardName] = cardValues;
      } else {
        const card1 = getCardByUuid(cardValues.default);
        const card2 = getCardByUuid(cubableCards[cardName].default);
        const array = [card1, card2];
        array.sort(mySort);
        cubableCards[cardName] = {
          ...cubableCards[cardName],
          ...cardValues,
          default: array[0].uuid
        };
      }
      return cubableCards;
    }, {});
  fs.writeFileSync(`${getDataDir()}/${CUBABLE_CARDS_PATH}`, JSON.stringify(cubableCards, undefined, 4));
};

const writeSets = (newSets: any) => {
  fs.writeFileSync(`${getDataDir()}/${SETS_PATH}`, JSON.stringify(newSets, undefined, 4));
};

export const getPlayableSets = () => {
  if (playableSets) {
    return playableSets;
  }
  playableSets = {};

  const AllSets = getSets();
  for (let code in AllSets) {
    const set = AllSets[code];
    const { type, name, releaseDate } = set;

    //We do not want to play with these types of set
    if (!['core', 'draft_innovation', 'expansion', 'funny', 'starter', 'masters', 'custom'].includes(type)) {
      continue;
    }

    if (isReleasedExpansionOrCoreSet(type, releaseDate)) {
      if (!latestSet) {
        latestSet = set;
      } else if (new Date(releaseDate).getTime() > new Date(latestSet.releaseDate).getTime()) {
        latestSet = set;
      }
    }

    if (!playableSets[type]) {
      playableSets[type] = [set];
    } else {
      playableSets[type].push(set);
    }
  }

  //Add random possibility
  // playableSets['random'] = [{ code: 'RNG', name: 'Random Set', releaseDate: '', type: 'random' }];

  // sort all keys depending on releaseDate
  for (let type in playableSets) {
    playableSets[type].sort((a, b) => {
      return Number(b.releaseDate.replace(/-/g, '')) - Number(a.releaseDate.replace(/-/g, ''));
    });
  }

  return playableSets;
};

const SET_TYPES_EXCLUDED_FROM_RANDOM_SET = new Set(['custom', 'funny', 'draft_innovation', 'starter', 'random']);
export const getRandomSet = () => {
  const allSets = getPlayableSets();
  const allTypes = Object.keys(allSets)
    .filter(setType => !SET_TYPES_EXCLUDED_FROM_RANDOM_SET.has(setType));

  const randomType = allTypes[allTypes.length * Math.random() << 0];

  const randomSets = allSets[randomType];
  return randomSets[randomSets.length * Math.random() << 0];
};

export const getLatestReleasedSet = () => {
  if (!latestSet) {
    getPlayableSets();
  }
  return latestSet;
};

export const getExpansionOrCoreModernSets = () => {
  const sets = [];
  for (const setCode in getSets()) {
    const set = getSets()[setCode];
    if (isReleasedExpansionOrCoreSet(set.type, set.releaseDate)
      && Date.parse('2003-07-26') <= Date.parse(set.releaseDate)) {
      set.code = setCode;
      sets.push(set);
    }
  }
  return sets;
};

export const getExansionOrCoreSets = () => {
  const sets = [];
  for (const setCode in getSets()) {
    const set = getSets()[setCode];
    if (isReleasedExpansionOrCoreSet(set.type, set.releaseDate)) {
      set.code = setCode;
      sets.push(set);
    }
  }
  return sets;
};

const isReleasedExpansionOrCoreSet = (type: string, releaseDate: string) => (
  ['expansion', 'core'].includes(type) &&
  Date.parse(releaseDate) <= Date.now()
);

export function saveDraftStats(id: string, stats: any) {
  if (!fs.existsSync(`${getDataDir()}/${DRAFT_STATS_DIR}`)) {
    fs.mkdirSync(`${getDataDir()}/${DRAFT_STATS_DIR}`);
  }

  fs.writeFileSync(`${getDataDir()}/${DRAFT_STATS_DIR}/${id}.json`, JSON.stringify(stats, undefined, 4));
}

export const getBoosterRules = (setCode: string): BoosterRule => {
  if (!boosterRules) {
    boosterRules = readFile(`${getDataDir()}/${BOOSTER_RULES_PATH}`);
  }
  return boosterRules![setCode];
};

export const getBoosterRulesVersion = (): string => {
  if (!boosterRules) {
    try {
      boosterRules = readFile(`${getDataDir()}/${BOOSTER_RULES_PATH}`);
    } catch(error) {
      return '';
    }
  }
  return boosterRules!.repoHash;
};

const saveBoosterRules = (boosterRules: any) => {
  fs.writeFileSync(`${getDataDir()}/${BOOSTER_RULES_PATH}`, JSON.stringify(boosterRules, undefined, 4));
};
