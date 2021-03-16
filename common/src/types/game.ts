import { TimerLength } from './state';
import { Cube } from './cube';

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