import { EventEmitter } from "events";
import { TimerLength } from '../../common/src/types/state';
import { Card } from '../../common/src/types/card';
import { withSort } from "../../common/src/types/game";
import { Log } from "../../common/src/types/log";

interface PlayerProps {
  id: string;
  isBot: boolean;
  isConnected: boolean;
  name: string;
  gameId: string;
  picksPerPack: number;
  burnsPerPack: number;
}

export interface SelectedCards<CardRep = string> {
  picks: CardRep[];
  burns: CardRep[];
}

interface DraftLog {
  round: Log;
  pack: string[][];
}

/**
 * Abstract class for Human and Bot
 */
export abstract class Player extends EventEmitter {
  id: string;
  isBot: boolean;
  isConnected: boolean;
  name: string;
  isHost: boolean = false;
  time: number = 0;
  selected: SelectedCards = { picks: [], burns: [] };
  draftState: withSort<Card> = {
    sort: 'cmc',
    state: {
      pack: [],
      main: [
        { id: '0', items: [] },
        { id: '1', items: [] },
        { id: '2', items: [] },
        { id: '3', items: [] },
        { id: '4', items: [] },
        { id: '5', items: [] },
        { id: '6+', items: [] },
      ],
      side: [{ id: '0', items: [] }],
      burn: [{ id: '0', items: [] }],
    }
  };
  cap: { packs: { [key: string]: string[] } } = { packs: {} };
  picks: string[] = [];
  draftLog: DraftLog = { round: {}, pack: [] };
  draftStats: any[] = [];
  pickNumber: number = 0;
  packSize: number = 15;
  self: number = 0;
  useTimer: boolean = false;
  timerLength: TimerLength = 'Slow';
  gameId: string;
  picksPerPack: number;
  burnsPerPack: number;

  constructor({id, isBot, isConnected, name, gameId, picksPerPack, burnsPerPack}: PlayerProps) {
    super();
    this.id = id;
    this.isBot = isBot;
    this.isConnected = isConnected;
    this.name = name;
    this.gameId = gameId;
    this.picksPerPack = picksPerPack;
    this.burnsPerPack = burnsPerPack;
  }

  getPlayerDeck() {
    return {
      seatNumber: self,
      playerName: this.name,
      id: this.id,
      pool: this.__pool(),
    };
  }

  __pool(): Card[] {
    const { main, side } = this.draftState.state;
    return main.flatMap((column) => column.items).concat(side.flatMap((column) => column.items));
  }

  isActive() {
    // Note that a player can be transmuted into a bot when they are kicked.
    return this.isConnected && !this.isBot;
  }

  abstract handleTimeout(): void;

  abstract err(errorMessage: string): void;

  abstract send(type: string, ...rest: any[]): void;

  exit() {
    // Implemented on human
  }

  kick() {
    // Implemented on human
  }

  abstract getPack(pack: Card[]): void;
}
