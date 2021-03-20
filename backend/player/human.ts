import { pull, find, pullAllWith, remove, times, sample, chain, Dictionary } from "lodash";

import { Player, SelectedCards } from "./player";
import { deck as _deck } from "../util";
import hash from "../hash";
import { logger } from "../logger";
import { Sock } from "../sock";
import { Card } from "../../common/src/types/card";
import { Deck } from "../../common/src/types/deck";

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
    sock.removeAllListeners("setSelected");
    sock.on("setSelected", this._setSelected.bind(this));
    sock.removeAllListeners("confirmSelection");
    sock.on("confirmSelection", this._confirmSelection.bind(this));
    sock.removeAllListeners("hash");
    sock.on("hash", this._hash.bind(this));
    sock.once("exit", this._farewell.bind(this));
    sock.h = this;

    let [pack] = this.packs;
    if (pack)
      this.send("pack", pack);
    this.send("pool", this.pool);
  }
  err(message: string) {
    this.send("error", message);
  }
  _hash(deck: Deck<Dictionary<number>>) {
    if (!_deck(deck, this.pool)){
      logger.warn(`wrong deck submitted for hashing by ${this.name}`);
      return;
    }
    this.hash = hash(deck);
    this.emit("meta");
  }
  _farewell() {
    this.isConnected = false;
    this.send = () => {};
    this.emit("meta");
  }
  _setSelected({ picks, burns }: SelectedCards) {
    this.selected = { picks, burns };
  }
  _confirmSelection() {
    this.confirmSelection();
  }
  getPack(pack: Card[]) {
    if (this.packs.push(pack) === 1)
      this.sendPack(pack);
  }
  send = (type: string, ...rest: any[]) => {
    if (this.sock) {
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
      if (this.timerLength === "Fast") {
        timer = MTRTimes;
      }
      if (this.timerLength === "Slow") {
        timer = MTGOTimes;
      }
      if (this.timerLength === "Leisurely") {
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

    this.send("pickNumber", ++this.pickNumber);
    this.send("pack", pack);
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
    const pack = this.packs.shift()!;
    this.selected.picks.forEach((cardId) => {
      const card = find(pack, c => c.cardId === cardId);
      if (!card) {
        return;
      }
      pull(pack, card);
      logger.info(`GameID: ${this.gameId}, player ${this.name}, picked: ${card.name}`);
      this.draftLog.pack.push( ...[`--> ${card.name}`].concat(pack.map(x => `    ${x.name}`)) );
      this.pool.push(card);
      const pickcard = card.foil ? "*" + card.name + "*" : card.name ;
      this.picks.push(pickcard);
      this.send("add", card);
    });

    // Remove burned cards from pack
    remove(pack, (card) => this.selected.burns.includes(card.cardId));

    // burn remaining if needed cards
    const remainingToBurn = Math.min(pack.length, this.burnsPerPack - this.selected.burns.length);
    pack.length-=remainingToBurn;

    const [next] = this.packs;
    if (!next)
      this.time = 0;
    else
      this.sendPack(next);

    // reset state
    this.selected = {
      picks: [],
      burns: []
    };

    // @ts-ignore don't know why draft log is both a string rep of the picks and a card object
    this.updateDraftStats(this.draftLog.pack, this.pool);

    this.emit("pass", pack);
  }
  handleTimeout() {
    //TODO: filter instead of removing a copy of a pack
    const pack = Array.from(this.packs[0]);

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
    while(this.packs.length)
      this.handleTimeout();
    this.sendPack = this.handleTimeout;
    this.isBot = true;
  }
};
