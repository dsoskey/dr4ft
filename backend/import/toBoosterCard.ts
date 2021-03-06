import { Card, ExternalCard, MtgJsonCard } from "../../common/src/types/card";
import { upperFirst, find } from "lodash";
import { v1 as uuidV1 } from 'uuid';

export const toBoosterCard = (setCode: string) => (mtgjsonCard: MtgJsonCard, index: number, rawCards: MtgJsonCard[]): ExternalCard => {
  let {
    name,
    faceName,
    frameEffects,
    number,
    layout,
    colors,
    colorIdentity,
    otherFaceIds,
    convertedManaCost,
    types,
    supertypes = [],
    subtypes = [],
    manaCost,
    url,
    identifiers = {},
    rarity,
    power,
    toughness,
    loyalty,
    text,
    uuid = `dr4ft-${uuidV1()}`
  } = mtgjsonCard;
  if (supertypes.includes("Basic")) {
    rarity = "basic";
  }

  const {isDoubleFaced, flippedCardURL, flippedIsBack, flippedNumber} = getDoubleFacedProps(mtgjsonCard, rawCards);
  const color = upperFirst(getColor(mtgjsonCard, rawCards));

  return {
    uuid,
    name,
    faceName,
    otherFaceIds,
    color,
    colors,
    colorIdentity,
    setCode,
    cmc: convertedManaCost || 0,
    number,
    type: types[types.length - 1],
    manaCost: manaCost || "",
    rarity: upperFirst(rarity),
    url: url || `https://api.scryfall.com/cards/${identifiers.scryfallId}?format=image`,
    identifiers: {
      scryfallId: identifiers.scryfallId
    },
    layout,
    isDoubleFaced,
    flippedCardURL,
    flippedIsBack,
    flippedNumber,
    supertypes,
    subtypes,
    power,
    toughness,
    loyalty,
    text,
    frameEffects
  };
};

const COLORS = {
  W: "white",
  U: "blue",
  B: "black",
  R: "red",
  G: "green"
};

function getDoubleFacedProps({layout, name}: ExternalCard, rawCards: ExternalCard[]) {
  const isDoubleFaced = /^modal_dfc$|^double-faced$|^transform$|^flip$|^meld$/i.test(layout);
  let names = name.split(" // ");
  let flippedCardURL = "";
  let flippedIsBack = false;
  let flippedNumber = "";
  if (isDoubleFaced) {
    rawCards.some(x => {
      if (x.faceName === names[1]) {
        const scryfallId = (x.identifiers && x.identifiers.scryfallId) || x.scryfallId;
        if (!scryfallId) throw new Error("cannot find scryfallId");

        flippedCardURL = `https://api.scryfall.com/cards/${scryfallId}?format=image`;
        if (/^modal_dfc$|^double-faced$|^transform$/i.test(layout)) {
          flippedCardURL += "&face=back";
          flippedIsBack = true;
          flippedNumber = x.number;
        }
        if (/^meld$/i.test(layout)) {
          flippedNumber = x.number;
        }
        return true;
      }
    });
  }
  return {
    isDoubleFaced, flippedCardURL, flippedIsBack, flippedNumber
  };
}

function getColor({ colors, layout, name,faceName, frameEffects = [] }: ExternalCard, rawCards: ExternalCard[]) {
  if (frameEffects.includes("devoid")) {
    return "colorless";
  }

  // Handle split cards colors
  if (["split", "aftermath"].includes(layout) && name.split(" // ").length > 1) {
    const otherName = name.split(" // ").filter((n) => n !== faceName)[0];
    const otherCard = find(rawCards, (card) => card.faceName === otherName);
    if (otherCard && otherCard.colors) {
      for (const color of otherCard.colors) {
        if (!colors.includes(color)) {
          return "multicolor";
        }
      }
    }
  }

  switch (colors.length) {
  case 0:
    return "colorless";
  case 1:
    return COLORS[colors[0]];
  default:
    return "multicolor";
  }
}
