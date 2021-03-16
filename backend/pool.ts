import { Card, ExternalCard } from '../common/src/types/card';
import { sample, shuffle, random, range, times, constant, pull } from 'lodash';
import { makeBoosterFromRules } from './boosterGenerator';
import { getCardByUuid, getCubableCardByName as getCardByName, getRandomSet, getExpansionOrCoreModernSets as getModernList, getExansionOrCoreSets as getSetsList, MtgSet } from './data';
import { v1 as uuidv1 } from 'uuid'

/**
 * @desc add a unique id to a card
 * @param card
 * @returns {{...card, cardId: string}}
 */
const addCardId = (card: ExternalCard): Card => ({
  ...card,
  cardId: uuidv1(),
});

const addCardIdsToBoosterCards = (pack: ExternalCard[]) => pack.map(addCardId);

interface SealedCubeProps {
  cubeList: string[];
  playersLength: number;
  playerPoolSize: number;
}
const SealedCube = ({ cubeList, playersLength, playerPoolSize = 90 }: SealedCubeProps) => {
  return DraftCube({
    cubeList,
    playersLength,
    packsNumber: 1,
    playerPackSize: playerPoolSize
  });
};

interface DraftCubeProps {
  packsNumber: number;
  cubeList: string[];
  playersLength: number;
  playerPackSize: number;
}
const DraftCube = ({ cubeList, playersLength, packsNumber = 3, playerPackSize = 15 }: DraftCubeProps) => {
  let list = shuffle(cubeList); // copy the list to work on it

  return range(playersLength * packsNumber)
    .map(() => list.splice(0, playerPackSize).map(getCardByName))
    .map(addCardIdsToBoosterCards);
};

// Replace RNG set with real set
const replaceRNGSet = (sets: string[]): string[] => (
  sets.map(set => set === 'RNG' ? getRandomSet().code : set)
);

interface NormalProps {
  playersLength: number;
  sets: string[];
}
const SealedNormal = ({ playersLength, sets }: NormalProps) => (
  times(playersLength , constant(replaceRNGSet(sets)))
    .map(sets => sets.flatMap(makeBoosterFromRules))
    .map(addCardIdsToBoosterCards)
);

const DraftNormal = ({ playersLength, sets }: NormalProps) => (
  replaceRNGSet(sets)
    .flatMap(set => times(playersLength, constant(set)))
    .map(makeBoosterFromRules)
    .map(addCardIdsToBoosterCards)
);
// Get a random set and transform it to pack
function getRandomPack(setList: MtgSet[]) {
  const code = chooseRandomSet(setList).code;
  return makeBoosterFromRules(code);
}

const chooseRandomSet = (setList: MtgSet[]): MtgSet => {
  const set = sample(setList)!;
  if (!set.Uncommon || !set.Common)
    return chooseRandomSet(pull(setList, set));
  return set;
};

// Create a complete random pack
function getTotalChaosPack(setList: MtgSet[]) {
  const chaosPool: string[] = [];
  const randomSet = chooseRandomSet(setList);

  // Check if set has at least rares
  if (randomSet.Rare && randomSet.Rare.length > 0) {
    const isMythic = randomSet.Mythic && random(7);
    chaosPool.push(sample(isMythic ? randomSet.Mythic : randomSet.Rare)!);
  } else {
    //If no rare exists for the set, we pick an uncommon
    chaosPool.push(sample(randomSet.Uncommon)!);
  }

  for (let k = 0; k < 3; k++) {
    chaosPool.push(sample(chooseRandomSet(setList).Uncommon)!);
  }

  for (let k = 0; k < 11; k++) {
    chaosPool.push(sample(chooseRandomSet(setList).Common)!);
  }

  return chaosPool.map(getCardByUuid);
}

interface ChaosProps {
  playersLength: number;
  packsNumber: number;
  modernOnly: boolean;
  totalChaos: boolean;
}
const DraftChaos = ({ playersLength, packsNumber = 3, modernOnly, totalChaos }: ChaosProps) => {
  const setList = modernOnly ? getModernList() : getSetsList();

  return range(playersLength * packsNumber)
    .map(() => totalChaos ? getTotalChaosPack(setList) : getRandomPack(setList))
    .map(addCardIdsToBoosterCards);
};

const SealedChaos = ({ playersLength, packsNumber = 6, modernOnly, totalChaos }: ChaosProps) => {
  const pool = DraftChaos({playersLength, packsNumber, modernOnly, totalChaos});
  return range(playersLength)
    .map(() => pool.splice(0, packsNumber).flat())
    .map(addCardIdsToBoosterCards);
};

export default {
  SealedCube,
  DraftCube,
  SealedNormal,
  DraftNormal,
  SealedChaos,
  DraftChaos
};
