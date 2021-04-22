import { 
  cloneDeep,
  pull,
  find,
  pullAllWith,
  get,
  set,
  remove, times, sample, chain, Dictionary, isEqual } from 'lodash';

import { Player, SelectedCards } from './player';
import { deck as _deck } from '../util';
import hash from '../hash';
import { logger } from '../logger';
import { Sock } from '../sock';
import { Card } from '../../common/src/types/card';
import { Deck } from '../../common/src/types/deck';
import { DraftState } from '../../common/src/types/game';

/**^
   * 2 types of actions
   * any two different droppableIds are a move.
   * any same droppableIds are a reorder.
   * syntax: <UI_COMPONENT-CARD_ZONE-COLUMN_ID>
   * CARD_ZONE: PACK | SIDE | BURN | MAIN
   * UI_COMPONENT: BUTTON | COLUMN
   * COLUMN_ID: string
   */
  export const legalMoves = [
    'pack-main',
    'pack-side',
    'pack-burn',
    'main-main',
    'main-side',
    'side-side',
    'side-main',
];

interface MoveEvent {
  srcZone: keyof DraftState;
  srcColumnIndex: number;
  destZone: keyof DraftState;
  destColumnIndex: number;
  card: Card;
}

interface ReorderEvent {
  zone: keyof DraftState;
  columnIndex: number;
  srcIndex: number;
  destIndex: number;
  card: Card;
}

export default class Human extends Player {
  sock?: Sock;
  hash: any;

  constructor(sock: Sock, picksPerPack: number, burnsPerPack: number, gameId: string) {
    super({
      isBot: false,
      isConnected: true,
      name: sock.name,
      id: sock.id,
      gameId,
      picksPerPack,
      burnsPerPack,
    });
    this.attach(sock);
  }

  attach(sock: Sock) {
    if (this.sock && this.sock !== sock)
      this.sock.websocket.close(); // TODO: Delegate?

    this.sock = sock;
    sock.removeAllListeners('setSelected');
    sock.on('setSelected', this._setSelected.bind(this));
    sock.removeAllListeners('confirmSelection');
    sock.on('confirmSelection', this._confirmSelection.bind(this));
    sock.on('moveCard', this._moveCard.bind(this));
    sock.on('reorderCard', this._reorderCard.bind(this));
    sock.removeAllListeners('hash');
    sock.on('hash', this._hash.bind(this));
    sock.once('exit', this._farewell.bind(this));
    sock.h = this;

    logger.info('Sending Draft state');
    logger.info(this.draftState);
    this.send('draftState', this.draftState);
    // for some reason pack isn't being read on frontend

  }
  err(message: string) {
    this.send('error', message);
  }
  _hash(deck: Deck<Dictionary<number>>) {
    if (!_deck(deck, this.__pool())){
      logger.warn(`wrong deck submitted for hashing by ${this.name}`);
      return;
    }
    this.hash = hash(deck);
    this.emit('meta');
  }
  _farewell() {
    this.isConnected = false;
    this.emit('meta');
  }
  _setSelected({ picks, burns }: SelectedCards) {
    this.selected = { picks, burns };
  }
  _confirmSelection() {
    this.confirmSelection();
  }
  _moveCard({ srcZone, srcColumnIndex, destZone, destColumnIndex, card }: MoveEvent) {
    const sourceKeys = [srcZone, srcColumnIndex, 'items'];
    let sourceCardList: Card[] | undefined = get(this.draftState.state, sourceKeys);
    const destinationKeys = [destZone, destColumnIndex, 'items'];
    let destinationCardList: Card[] | undefined = get(this.draftState.state, destinationKeys);

    if (sourceCardList === undefined) {
      throw Error(`source(${srcZone}-${srcColumnIndex}) not found.`);
    } else if (destinationCardList === undefined) {
      throw Error(`destination(${destZone}-${destColumnIndex}) not found.`);
    } else if (legalMoves.includes(`${srcZone}-${destZone}`)) {
      sourceCardList = sourceCardList.filter((c) => !isEqual(card, c));
      destinationCardList.push(card);
      set(this.draftState.state, sourceKeys, sourceCardList);
      set(this.draftState.state, destinationKeys, destinationCardList);
      if (srcZone === 'pack' && this.picksPerPack === 1 && this.burnsPerPack === 0) {
        // do the pack passing
        const pack = this.draftState.state.pack.shift();
        this.selected = { picks: [], burns: [] };
        // WHUT
        logger.info(JSON.stringify(this.draftState));
        // @ts-ignore don't know why draft log is both a string rep of the picks and a card object
        this.updateDraftStats(this.draftLog.pack, this.__pool());

        this.emit('pass', pack!.items);
      }
      this.send('draftState', this.draftState);
    }
  }
  _reorderCard({ zone, columnIndex, srcIndex, destIndex, card }: ReorderEvent) {
    const columnKeys = [zone, columnIndex, 'items'];
    let sourceCardList: Card[] | undefined = get(this.draftState.state, columnKeys);

    if (sourceCardList === undefined) {
      throw Error(`source(${zone}-${columnIndex}) not found.`);
    } else if (legalMoves.includes(`${zone}-${zone}`)) {
      sourceCardList.splice(srcIndex, 1);
      sourceCardList.splice(destIndex, 0, card);
      set(this.draftState.state, columnKeys, sourceCardList);
      this.send('draftState', this.draftState);
    }
  }
  getPack(pack: Card[]) {
    this.draftState.state.pack.push({ id: '', items: pack });
    this.send('draftState', this.draftState);
  }
  send(type: string, ...rest: any[]) {
    if (this.sock) {
      logger.debug(`Sending ${type}: ${JSON.stringify(rest)} to ${this.sock.id}.`)
      this.sock.send(type, ...rest);
    } else {
      logger.error(`Tried to send message with no sock: ${type}: ${JSON.stringify(rest)}`)
    }
  }
  exit = () => {
    this.emit('exit', this);
  }

  sendPack(pack: Card[]) {
    if (this.useTimer) {
      let timer = [];
      // http://www.wizards.com/contentresources/wizards/wpn/main/documents/magic_the_gathering_tournament_rules_pdf1.pdf pp43
      // official WOTC timings are
      // pick #, time in seconds)
      // (1,40)(2,40)(3,35)(4,30)(5,25)(6,25)(7,20)(8,20)(9,15)(10,10)(11,10)(12,5)(13,5)(14,5)(15,0)
      const MTRTimes = [40, 40, 35, 30, 25, 25, 20, 20, 15, 10, 10, 5, 5, 5, 5];
      // whereas MTGO starts @ 75s and decrements by 5s per pick
      const MTGOTimes = [75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 12, 10];
      // and here's a happy medium
      timer = [55, 51, 47, 43, 38, 34, 30, 26, 22, 18, 14, 13, 11, 9, 7];
      if (this.timerLength === 'Fast') {
        timer = MTRTimes;
      }
      if (this.timerLength === 'Slow') {
        timer = MTGOTimes;
      }
      if (this.timerLength === 'Leisurely') {
        timer = [90,85,80,75,70,65,60,55,50,45,40,35,30,25];
      }
      // if a pack has more than 15 cards in it, add the average decrement on to the first picks
      if (pack.length + this.picks.length > 15) {
        for (let x = 15; x < (pack.length + this.picks.length); x++) {
          timer.splice(0, 0, ((timer[0] + ((timer[0] + timer[timer.length - 1]) / timer.length))) | 0);
        }
      }
      this.time = timer[this.picks.length];
    }
    else {
      this.time = 0;
    }

    this.send('pickNumber', ++this.pickNumber);
    // this.send('pack', pack);
    this.send('draftState', this.draftState);
  }
  updateDraftStats(pack: Card[], pool: Card[]) {
    this.draftStats.push({
      picked: chain(pack)
        .filter(card => this.selected.picks.includes(card.cardId))
        .map(card => card.name)
        .value(),
      notPicked: chain(pack)
        .filter(card => !this.selected.picks.includes(card.cardId))
        .map(card => card.name)
        .value(),
      pool: pool.map(card => card.name)
    });
  }
  confirmSelection() {
    const packColumn = this.draftState.state.pack.shift();
    if (packColumn) {
      const pack = cloneDeep(packColumn.items);
      this.selected.picks.forEach((cardId) => {
        const card = find(pack, c => c.cardId === cardId);
        if (!card) {
          return;
        }
        pull(pack, card);
        logger.info(`GameID: ${this.gameId}, player ${this.name}, picked: ${card.name}`);
        this.draftLog.pack.push( ...[`--> ${card.name}`].concat(pack.map(x => `    ${x.name}`)) );
        this.draftState.state.main[Math.min(card.cmc, this.draftState.state.main.length - 1)].items.push(card);
        const pickcard = card.foil ? '*' + card.name + '*' : card.name ;
        this.picks.push(pickcard);
        this.send('draftState', this.draftState);
      });
  
      // Remove burned cards from pack
      remove(pack, (card) => this.selected.burns.includes(card.cardId));
  
      // burn remaining if needed cards
      const remainingToBurn = Math.min(pack.length, this.burnsPerPack - this.selected.burns.length);
      pack.length-=remainingToBurn;
  
      const [next] = this.draftState.state.pack;
      if (next) {
        this.sendPack(next.items);
      } else {
        this.time = 0;
      }
  
      // reset state
      this.selected = { picks: [], burns: [] };
  
      logger.info(JSON.stringify(this.draftState));
      // @ts-ignore don't know why draft log is both a string rep of the picks and a card object
      this.updateDraftStats(this.draftLog.pack, this.__pool());
  
      this.emit('pass', pack);
    } else {
      throw Error('confirmed without any pack to confirm');
    }
  }
  handleTimeout() {
    // TODO: Test handleTimeout()
    //TODO: filter instead of removing a copy of a pack
    const pack = cloneDeep(this.draftState.state.pack[0].items);

    pullAllWith(pack, this.selected.picks, (card, cardId) => card.cardId === cardId);
    pullAllWith(pack, this.selected.burns, (card, cardId) => card.cardId === cardId);

    // pick cards
    const remainingToPick = Math.min(pack.length, this.picksPerPack - this.selected.picks.length);
    times(remainingToPick, () => {
      const randomCard = sample(pack)!;
      this.selected.picks.push(randomCard.cardId);
      pull(pack, randomCard);
    });

    this.confirmSelection();
  }
  kick() {
    this.send = () => {};
    while(this.draftState.state.pack.length)
      this.handleTimeout();
    this.sendPack = this.handleTimeout;
    this.isBot = true;
  }
};
