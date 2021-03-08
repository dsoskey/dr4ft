import {countBy, findIndex, pullAt, range, remove} from "lodash";
import _ from "./utils";
import { EventEmitter } from "events";
import { Zone } from "./zones";
import { BASIC_LANDS_BY_COLOR_SIGN } from "./basiclands";
import { Card, CardId } from "common/src/types/card";
import { SortType } from "./app";

export const COLORS_TO_LANDS_NAME = {
  "W": "Plains",
  "U": "Island",
  "B": "Swamp",
  "R": "Mountain",
  "G": "Forest",
};

type ZoneState = Record<Zone, Card[]>;

const defaultZoneState = (): ZoneState => ({
  [Zone.main]: [],
  [Zone.side]: [],
  [Zone.pack]: [],
  [Zone.junk]: []
});

/**
 * @desc Map<cardId, zoneName>
 * @example { "cardId": "main", "othercardId": "side}
 */
const defaultCardState = () => ({});

type CardState = { [key: string]: Zone };

/**
 * @desc Map<zoneName, Map<color, count>
 * @example { "main": {"W": 2, "R": 3}, "side": {"B": 5, "U": 5} }
 */
const defaultLandDistribution = (): LandDistributionState => ({
  [Zone.main]: {},
  [Zone.side]: {},
  [Zone.junk]: {},
  [Zone.pack]: {},
});
type LandDistributionState = { [key in Zone]: {[ley: string]: number } }

/**
 * @desc contains the cards in all zone, the pick + burn references and the land distributions
 * it is saved at every App update
 */
export class GameState extends EventEmitter {
  private cardState: CardState;
  private zoneState: ZoneState;
  private landDistribution: LandDistributionState;
  private pickCardIds: CardId[];
  private burnCardIds: CardId[];
  private picksPerPack: number = 0;

  constructor({
    state = defaultCardState(),
    landDistribution = defaultLandDistribution(),
    pickCardIds = [],
    burnCardIds = []
  } = {
    state: defaultCardState(),
    landDistribution: defaultLandDistribution(),
    pickCardIds: [],
    burnCardIds: []
  }) {
    super();
    this.cardState = state;
    this.landDistribution = landDistribution;
    this.zoneState = defaultZoneState();
    this.pickCardIds = pickCardIds;
    this.burnCardIds = burnCardIds;
  }

  /**
   * @param zoneName
   * @returns {Card[]} the cards present in the zone
   */
  get(zoneName: Zone): Card[] {
    return this.zoneState[zoneName];
  }
  getAutopickCardIds(){
    return this.pickCardIds;
  }
  countCardsByName(zoneName: Zone, fun = ({name}: Card) => name) {
    return this.countCardsBy(zoneName, fun);
  }

  countCardsBy(zoneName: Zone, fun: (card: Card) => string) {
    const zone = this.get(zoneName);
    return countBy(zone, fun);
  }

  pack(cards: Card[]) {
    this.zoneState[Zone.pack] = cards;
    this.updState();
  }

  add(zoneName: Zone, card: Card) {
    const zone = this.get(zoneName);
    zone.push(card);
    if (card.cardId) {
      this.cardState[card.cardId] = zoneName;
    }
  }

  move(fromZone: Zone, toZone: Zone, card: Card) {
    const src = this.get(fromZone);
    const cardIndex = findIndex(src, card);
    pullAt(src, cardIndex);
    this.add(toZone, card);
    this.updState();
  }

  /**
   *
   * @param zone
   * @param cards
   */
  addToPool(zone: Zone, cards: Card[]) {
    Object.entries(this.landDistribution).forEach(([zoneName, landsRepartition]) => {
      Object.entries(landsRepartition).forEach(([colorSign, number]) => {
        // TODO: Feature: selecting basic lands in app.
        const basicLand = BASIC_LANDS_BY_COLOR_SIGN[colorSign];
        this._setLands(zoneName as Zone, basicLand, number);
      });
    });

    cards
      .forEach((card) => {
        const knownZone = this.cardState[card.cardId ?? ''];
        this.add(knownZone || zone, card);
      });
    this.updState();
  }

  getLandDistribution(zoneName: Zone, color: string) {
    return this.landDistribution[zoneName][color] ?? 0;
  }

  _setLands(zoneName: Zone, card: Card, n: number) {
    const zone = this.get(zoneName);
    remove(zone, (c) => c.name === card.name);
    // add n land
    range(n).forEach(() => zone.push(card));
    this.landDistribution[zoneName][card.colorIdentity[0]] = n;
  }

  setLands(zoneName: Zone, color: string, n: number) {
    this._setLands(zoneName, BASIC_LANDS_BY_COLOR_SIGN[color], n);
    this.updState();
  }

  resetLands() {
    Object.values(COLORS_TO_LANDS_NAME).forEach((basicLandName) => {
      [Zone.main, Zone.side, Zone.junk].forEach((zoneName) => {
        remove(this.get(zoneName), ({name}) => basicLandName.toLowerCase() === name.toLowerCase());
      });
    });
    this.landDistribution = defaultLandDistribution();
    this.updState();
  }

  getMainDeckSize() {
    return this.get(Zone.main).length;
  }

  getSortedZone(zoneName: Zone, sort: SortType) {
    const cards = this.get(zoneName);
    const groups = _.group(cards, sort);
    for (const key in groups) {
      _.sort(groups[key], sortLandsBeforeNonLands, "color", "cmc", "name");
    }
    return Key(groups, sort);
  }

  updState() {
    this.emit("updateGameState", {
      state: this.cardState,
      landDistribution: this.landDistribution,
      pickCardIds: this.pickCardIds,
      picksPerPack: this.picksPerPack,
      burnCardIds: this.burnCardIds
    });
  }

  updateSelection() {
    this.emit("setSelected", {
      picks: this.pickCardIds,
      burns: this.burnCardIds
    });
  }

  isPick(cardId: CardId) {
    return this.pickCardIds.includes(cardId.toString());
  }

  isBurn(cardId: CardId) {
    return this.burnCardIds.includes(cardId.toString());
  }

  updateCardPick(cardId: CardId, picksPerPack: number) {
    if (this.pickCardIds.length == picksPerPack) {
      this.pickCardIds.shift();
    }

    if (this.isBurn(cardId)) {
      remove(this.burnCardIds, (id) => id === cardId);
    }

    this.pickCardIds.push(cardId);
    this.updState();
    this.updateSelection();
  }

  resetPack() {
    this.get(Zone.pack).length = 0;
    this.pickCardIds = [];
    this.burnCardIds = [];
  }

  updateCardBurn(cardId: CardId, burnsPerPack: number) {
    if (burnsPerPack <= 0) {
      return false;
    }

    if (this.burnCardIds.length == burnsPerPack) {
      this.burnCardIds.shift();
    }

    if (this.isPick(cardId)) {
      remove(this.pickCardIds, id => id === cardId);
    }

    this.burnCardIds.push(cardId);
    this.updState();
    this.updateSelection();
  }

  isSelectionReady(picksPerPack: number, burnsPerPack: number) {
    const packLength = this.get(Zone.pack).length;

    if (packLength === (this.pickCardIds.length + this.burnCardIds.length)) {
      return true;
    }

    if (picksPerPack != this.pickCardIds.length) {
      return false;
    }

    if (burnsPerPack != this.burnCardIds.length) {
      return false;
    }

    return true;
  }
}

const isLand = ({type}: Card): number => /land/i.test(type) ? 1 : 0;

const sortLandsBeforeNonLands = (lhs: Card, rhs: Card) => {
  const lhsIsLand = isLand(lhs);
  const rhsIsLand = isLand(rhs);
  return rhsIsLand - lhsIsLand;
};

/**
 * What do you do?
 * @param groups 
 * @param sort 
 */
function Key(groups: { [key: string]: Card[] }, sort: SortType) {
  let keys = Object.keys(groups);
  let arr: Card[];

  switch (sort) {
  case "cmc":
    arr = [];
    for (let key in groups)
      if (parseInt(key) >= 6) {
        arr.push(...groups[key]);
        delete groups[key];
      }

    if (arr.length) {
      if (groups['6+'] === undefined) {
        groups["6+"] = [];
      }
      groups["6+"].push(...arr);
    }
    return groups;

  case "color":
    keys =
      ["Colorless", "White", "Blue", "Black", "Red", "Green", "Multicolor"]
        .filter(x => keys.indexOf(x) > -1);
    break;
  case "rarity":
    keys =
      ["Mythic", "Rare", "Uncommon", "Common", "Basic", "Special"]
        .filter(x => keys.indexOf(x) > -1);
    break;
  case "type":
    keys = keys.sort();
    break;
  }

  let output: { [key: string]: Card[] } = {};
  for (let key of keys)
    output[key] = groups[key];
  return output;
}
