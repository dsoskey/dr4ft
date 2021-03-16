import { EventEmitter } from "events";
import { TimerLength } from '../../common/src/types/state';
import { Card } from '../../common/src/types/card';

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

interface DraftLog<CardRep = string> {
  round: { [key: string]: CardRep[] };
  pack: CardRep[];
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
  packs: Card[][] = [];
  selected: SelectedCards = { picks: [], burns: [] };
  pool: Card[] = [];
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
      pool: this.pool.map(card => card.name)
    };
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
