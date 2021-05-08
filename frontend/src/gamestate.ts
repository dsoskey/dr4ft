import { range, remove} from 'lodash';
import _ from './utils';
import _countBy from 'lodash/countBy';
import _findIndex from 'lodash/findIndex';
import _cloneDeep from 'lodash/cloneDeep';
import _pullAt from 'lodash/pullAt';
import _get from 'lodash/get';
import _set from 'lodash/set';
import _isEqual from 'lodash/isEqual'
import { EventEmitter } from 'events';
import { Zone } from './zones';
import { Card, CardId, ColorSign } from 'common/src/types/card';
import { withSort, DraftState, SortType } from 'common/src/types/game';
import { app } from './router';

/**^
   * 2 types of actions
   * any two different droppableIds are a move.
   * any same droppableIds are a reorder.
   * syntax: <UI_COMPONENT-CARD_ZONE-COLUMN_ID>
   * CARD_ZONE: PACK | SIDE | BURN | MAIN
   * UI_COMPONENT: BUTTON | COLUMN
   * COLUMN_ID: string
   */
  const legalMoves = [
    'pack-main',
    'pack-side',
    'pack-burn',
    'main-main',
    'main-side',
    'side-side',
    'side-main',
];

export const COLORS_TO_LANDS_NAME: Record<ColorSign, string> = {
  W: 'Plains',
  U: 'Island',
  B: 'Swamp',
  R: 'Mountain',
  G: 'Forest',
};

type ZoneState = Record<Zone, Card[]>;

const defaultZoneState = (): ZoneState => ({
  [Zone.main]: [],
  [Zone.side]: [],
  [Zone.pack]: [],
  [Zone.junk]: []
});

export interface ColumnState<T> {
  id: string; // By default is the key for the sort order
  items: T[];
}

const initialDraftState: withSort<Card> = {
  sort: 'cmc',
  state: {
    pack: [{ id: '0', items: [] }],
    main: [
      { id: '0', items: [] },
      { id: '1', items: [] },
      { id: '2', items: [] },
      { id: '3', items: [] },
      { id: '4', items: [] },
      { id: '5', items: [] },
      { id: '6', items: [] },
    ],
    side: [{ id: '0', items: [] }],
    burn: [{ id: '0', items: [] }],
  },
}


/**
 * @desc Map<cardId, zoneName>
 * @example { 'cardId': 'main', 'othercardId': 'side}
 */
const defaultCardState = () => ({});

type CardState = { [key: string]: keyof DraftState };

/**
 * @desc Map<zoneName, Map<color, count>
 * @example { 'main': {'W': 2, 'R': 3}, 'side': {'B': 5, 'U': 5} }
 */
const defaultLandDistribution = (): LandDistributionState => ({
  main: {
    W: 0,
    U: 0,
    B: 0,
    R: 0,
    G: 0,
  },
  side: {
    W: 0,
    U: 0,
    B: 0,
    R: 0,
    G: 0,
  },
  pack: {
    W: 0,
    U: 0,
    B: 0,
    R: 0,
    G: 0,
  },
  burn: {
    W: 0,
    U: 0,
    B: 0,
    R: 0,
    G: 0,
  }
});
type LandDistributionState = Record<keyof DraftState, Record<ColorSign, number>>

/**
 * @desc contains the cards in all zone, the pick + burn references and the land distributions
 * it is saved at every App update
 */
export class GameState extends EventEmitter {
  private cardState: CardState;
  private zoneState: ZoneState;
  public draftState: withSort<Card>;
  public landDistribution: LandDistributionState;
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
    this.draftState = _cloneDeep(initialDraftState);
    this.pickCardIds = pickCardIds;
    this.burnCardIds = burnCardIds;
  }

  /**
   * @param zoneName
   * @returns {Card[]} deep copy of all of the the cards present in the zone.
   */
  get(zoneName: keyof DraftState): Card[] {
    return _cloneDeep(this.draftState.state[zoneName].flatMap((col) => col.items));
  }
  getColumn(zoneName: keyof DraftState, columnIndex: number): Card[] {
    return _cloneDeep(this.draftState.state[zoneName][columnIndex].items);
  }
  getAutopickCardIds(){
    return this.pickCardIds;
  }
  countCardsByName(zoneName: keyof DraftState, fun = ({name}: Card) => name) {
    return this.countCardsBy(zoneName, fun);
  }

  countCardsBy(zoneName: keyof DraftState, fun: (card: Card) => string) {
    const zone = this.get(zoneName);
    return _countBy(zone, fun);
  }

  pack(cards: Card[]) {
    this.draftState.state.pack.push({ id: '', items: cards });
    this.updState();
  }

  // TODO: handle changing sort
  add(zoneName: keyof DraftState, card: Card) {
    console.log(JSON.stringify(card));
    const zone = this.draftState.state[zoneName];
    zone[Math.min(card.cmc, zone.length - 1)].items.push(card);
    // This will need to be understood at some point
    if (card.cardId) {
      this.cardState[card.cardId] = zoneName;
    }
    this.updState();
  }

  moveCard(
    srcZone: keyof DraftState, srcColumnId: number,
    destZone: keyof DraftState, destColumnId: number,
    card: Card,
  ) {
    const sourceKeys = [srcZone, srcColumnId, 'items'];
    let sourceCardList: Card[] | undefined = _get(this.draftState.state, sourceKeys);
    const destinationKeys = [destZone, destColumnId, 'items'];
    let destinationCardList: Card[] | undefined = _get(this.draftState.state, destinationKeys);

    if (sourceCardList === undefined) {
      throw Error(`source(${srcZone}-${srcColumnId}) not found.`);
    } else if (destinationCardList === undefined) {
      throw Error(`destination(${destZone}-${destColumnId}) not found.`);
    } else if (legalMoves.includes(`${srcZone}-${destZone}`)) {
      sourceCardList = sourceCardList.filter((c) => !_isEqual(card, c));
      destinationCardList.push(card);
      _set(this.draftState.state, sourceKeys, sourceCardList);
      _set(this.draftState.state, destinationKeys, destinationCardList);
      this.updState();
    }
  }

  reorderCard(
    zone: keyof DraftState, columnId: string,
    srcIndex: number, destIndex: number,
    card: Card,
  ) {
    const columnKeys = [zone, columnId, 'items'];
    let sourceCardList: Card[] | undefined = _get(this.draftState.state, columnKeys);

    if (sourceCardList === undefined) {
      throw Error(`source(${zone}-${columnId}) not found.`);
    } else if (legalMoves.includes(`${zone}-${zone}`)) {
      sourceCardList.splice(srcIndex, 1);
      sourceCardList.splice(destIndex, 0, card);
      _set(this.draftState.state, columnKeys, sourceCardList);
      this.updState();
    }
  }

  getLandDistribution(zoneName: keyof DraftState, color: ColorSign) {
    return this.landDistribution[zoneName][color] ?? 0;
  }

  setLands(zoneName: keyof DraftState, color: ColorSign, n: number) {
    this.landDistribution[zoneName][color] = n;
    this.updState();
  }

  resetLands() {
    this.landDistribution = defaultLandDistribution();
    this.updState();
  }

  getSortedZone(zoneName: keyof DraftState, sort: SortType) {
    const cards = this.get(zoneName);
    const groups = _.group(cards, sort);
    for (const key in groups) {
      _.sort(groups[key], sortLandsBeforeNonLands, 'color', 'cmc', 'name');
    }
    return Key(groups, sort);
  }

  // getSortedColumn

  updState() {
    this.emit('updateGameState', {
      state: this.cardState,
      draftState: this.draftState,
      landDistribution: this.landDistribution,
      pickCardIds: this.pickCardIds,
      picksPerPack: this.picksPerPack,
      burnCardIds: this.burnCardIds
    });
  }

  updateSelection() {
    this.emit('setSelected', {
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
    this.draftState.state.pack[0].items = [];
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
    const packLength = this.draftState.state.pack[0].items.length;

    if (packLength === (this.pickCardIds.length + this.burnCardIds.length)) {
      return true;
    }

    if (picksPerPack !== this.pickCardIds.length) {
      return false;
    }

    if (burnsPerPack !== this.burnCardIds.length) {
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
  case 'cmc':
    arr = [];
    for (let key in groups)
      if (parseInt(key) >= 6) {
        arr.push(...groups[key]);
        delete groups[key];
      }

    if (arr.length) {
      if (groups['6+'] === undefined) {
        groups['6+'] = [];
      }
      groups['6+'].push(...arr);
    }
    return groups;

  case 'color':
    keys =
      ['Colorless', 'White', 'Blue', 'Black', 'Red', 'Green', 'Multicolor']
        .filter(x => keys.indexOf(x) > -1);
    break;
  case 'rarity':
    keys =
      ['Mythic', 'Rare', 'Uncommon', 'Common', 'Basic', 'Special']
        .filter(x => keys.indexOf(x) > -1);
    break;
  case 'type':
    keys = keys.sort();
    break;
  }

  let output: { [key: string]: Card[] } = {};
  for (let key of keys)
    output[key] = groups[key];
  return output;
}
