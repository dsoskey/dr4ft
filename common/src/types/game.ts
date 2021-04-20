import { TimerLength } from './state';
import { Cube } from './cube';
import { Card } from './card';

export interface StartOptions {
  addBots: boolean;
  useTimer: boolean;
  timerLength: TimerLength;
  shufflePlayers: boolean;
}

export type GameType = 'draft' | 'sealed' | 'cube draft' | 'cube sealed' | 'chaos draft' | 'chaos sealed' | 'decadent draft';
export interface GameOptions {
    title: string;
    seats: number;
    type: GameType;
    sets?: string[];
    cube?: Cube;
    isPrivate: boolean;
    modernOnly: boolean,
    totalChaos: boolean;
    chaosPacksNumber?: number;
    picksPerPack: number;
  }

export interface GameProps extends GameOptions {
  hostId: string;
}

export type SortType = "cmc" | "color" | "rarity" | "type";
export interface ColumnState<T> {
  id: string; // By default is the key for the sort order
  items: T[];
}
export interface withSort<C=Card> {
  sort: SortType;
  state: DraftState<C>
}
export interface DraftState<C=Card> {
  pack: Array<ColumnState<C>>;
  main: Array<ColumnState<C>>;
  // Design for plurality: I need one column for the draft but the deckbuilding screen should eventually have multiple columns
  side: Array<ColumnState<C>>;
  burn: Array<ColumnState<C>>;
}