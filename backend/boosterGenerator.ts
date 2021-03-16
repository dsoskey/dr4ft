import { getCardByUuid, getSet, getBoosterRules, Sheet, MtgSet } from "./data";
import { logger } from "./logger";
import weighted from "weighted";
import { sample, sampleSize, random, concat } from "lodash";
import { Card } from "../common/src/types/card";

export const makeBoosterFromRules = (setCode: string) => {
  const set = getSet(setCode);
  if (!set) {
    throw new Error(`${setCode} does not exist`);
  }

  const setRules = getBoosterRules(setCode);
  if (!setRules) {
    return getDefaultBooster(set);
  }

  try {
    const { boosters, totalWeight, sheets } = setRules;
    const boosterSheets = weighted(
      boosters.map(({sheets}) => sheets),
      boosters.map(({weight}) => weight),
    );
    return Object.entries(boosterSheets)
      .flatMap(chooseCards(sheets));
  } catch (error) {
    logger.error(`could not produce a booster of ${setCode}. Falling back to default booster. ${error.stack}`);
    return getDefaultBooster(set);
  }
};

const getDefaultBooster = (set: MtgSet) => {
  let { Basic, Common, Uncommon, Rare, Mythic, size } = set;

  if (Mythic && !random(7))
    Rare = Mythic;

  if (!Rare) {
    Rare = Uncommon; //In some sets rare didn't exist. So we replace them with uncommons
  }

  //make small sets draftable.
  if (size < 10)
    size = 10;

  const cardNames = concat(
    sampleSize(Common, size),
    sampleSize(Uncommon, 3),
    sampleSize(Rare, 1)
  );

  if (Basic) {
    cardNames.push(sample(Basic)!);
  }

  return cardNames.map(getCardByUuid);
};

const chooseCards = (sheets: { [sheetName: string]: Sheet }) => ([sheetCode, numberOfCardsToPick]: [string, number]) => {
  const sheet = sheets[sheetCode];

  const randomCards = sheet.balance_colors
    ? getRandomCardsWithColorBalance(sheet, numberOfCardsToPick)
    : getRandomCards(sheet, numberOfCardsToPick);

  return randomCards.map(toCard(sheetCode));
};

function getRandomCardsWithColorBalance({cardsByColor, cards}: Sheet, numberOfCardsToPick: number) {
  const ret = new Set<string>();

  // Pick one card of each color
  ["G", "U", "W", "B", "R"].forEach((color) => {
    ret.add(sample(cardsByColor[color])!);
  });

  const n = Object.keys(cards).length;
  const nums = {
    "W": cardsByColor["W"].length * numberOfCardsToPick - n,
    "B": cardsByColor["B"].length * numberOfCardsToPick - n,
    "U": cardsByColor["U"].length * numberOfCardsToPick - n,
    "R": cardsByColor["R"].length * numberOfCardsToPick - n,
    "G": cardsByColor["G"].length * numberOfCardsToPick - n,
    "c": cardsByColor["c"].length * numberOfCardsToPick,
  };
  const total = Object.values(nums).reduce((total, num) => total + num);
  while (ret.size < numberOfCardsToPick) {
    const randomColor = weighted.select(nums);//, { total });
    ret.add(sample(cardsByColor[randomColor])!);
  }
  return [...ret];
}

function getRandomCards({cards, totalWeight: total}: Sheet, numberOfCardsToPick: number): string[] {
  const ret = new Set<string>();

  // Fast way to avoid duplicate
  while (ret.size < numberOfCardsToPick) {
    ret.add(weighted.select(cards));//, { total }));
  }

  return [...ret];
}

const toCard = (sheetCode: string) => (uuid: string): Card => ({
  ...getCardByUuid(uuid),
  foil: /foil/.test(sheetCode)
});

export default makeBoosterFromRules;
