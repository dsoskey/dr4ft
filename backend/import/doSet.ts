import { toBoosterCard } from "./toBoosterCard";
import { keyCardsUuidByNumber, groupCardsUuidByRarity, keyCardsByUuid } from "./keyCards";
import { MtgSet } from "backend/data";
import { MtgJsonCard } from "../../common/src/types/card";

interface SetProps {
  code: string;
  baseSetSize: number;
  name: string;
  type: string;
  releaseDate: string;
  boosterV3: any;
  cards: MtgJsonCard[];
}

export function doSet({code, baseSetSize, name, type, releaseDate, boosterV3, cards: mtgJsonCards}: SetProps): [MtgSet, any] {
  const cards = mtgJsonCards
    .filter((card) => !card.isAlternative)
    .map(toBoosterCard(code));
  const size = !boosterV3 ? 4 : boosterV3.filter((x: any) => x === "common").length;

  return [{
    code,
    name,
    type,
    releaseDate,
    baseSetSize,
    size,
    cardsByNumber: keyCardsUuidByNumber(cards),
    ...groupCardsUuidByRarity(cards)
  }, {
    ...keyCardsByUuid(cards)
  }];
}
