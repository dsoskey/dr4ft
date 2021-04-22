import React from 'react';
import _ from './utils';
import { EventEmitter } from 'events';
import {STRINGS} from './config';
import eio, { SocketOptions } from 'engine.io-client';
import {times, constant} from 'lodash';
import { GameState } from './gamestate';
import { Zone } from './zones';
import { ExportFormat } from 'common/src/types/export';
import { Message } from 'common/src/types/message';
import { Log } from 'common/src/types/log';
import { TimerLength } from 'common/src/types/state';
import { DraftState, SortType } from 'common/src/types/game';
import { Card } from 'common/src/types/card';

export type SetType = 'setsDraft' | 'setsSealed' | 'setsDecadentDraft';
export interface MTGJsonVersion {
  version: string;
  date: string;
}

interface Game {
  type?: any;
  sets?: any;
  packsInfo?: any;
  burnsPerPack?: number;
  picksPerPack?: number;
}

export interface AppState {
  round?: number;
  latestSet?: any;
  players?: any[];
  notificationResult?: string;
  self?: number;
  isHost?: boolean;

  id: string | null;
  name: string;

  serverVersion: string;
  numUsers: number;
  numPlayers: number;
  numActiveGames: number;
  roomInfo: any[];

  seats: number;
  title: string;
  gameId: string;
  isPrivate: boolean;
  modernOnly: boolean;
  totalChaos: boolean;
  chaosDraftPacksNumber: number;
  chaosSealedPacksNumber: number;
  gametype: 'draft' | 'sealed'; // TODO: Make an enum
  picksPerPack: number;
  burnsPerPack: number;
  DoubleMasters: number;
  gamesubtype: string; // Enum?
  sets: any[];
  setsDraft: any[];
  setsSealed: any[];
  setsDecadentDraft: any[];
  availableSets: { [key: string]: any[] }; // TODO: make it so you can only pass in SetType.
  list: string;
  cards: number;
  packs: number;
  cubePoolSize: number;

  addBots: boolean;
  shufflePlayers: boolean;
  useTimer: boolean;
  timerLength: TimerLength;

  beep: boolean;
  notify: boolean;
  notificationGranted: boolean;
  chat: boolean;
  cols: boolean;
  hidepicks: boolean;
  deckSize: number;

  exportDeckFormat: ExportFormat;
  exportDeckFilename: string;

  side: boolean;
  sort: SortType;
  log: Log;
  cardSize: 'normal' | 'text' | string;
  cardLang: 'en' | string;
  game: Game;
  mtgJsonVersion: MTGJsonVersion;
  boosterRulesVersion: string;
  messages: Message[];
  pickNumber: number;
  packSize: number;
  gameSeats: number;
  gameState: GameState;
  gameStates: { [key: string]: any };
}

export class App extends EventEmitter {
  public state: AppState = {
    id: null,
    name: STRINGS.BRANDING.DEFAULT_USERNAME,

    serverVersion: '',
    numUsers: 0,
    numPlayers: 0,
    numActiveGames: 0,
    roomInfo: [],

    seats: 8,
    title: '',
    gameId: '',
    isPrivate: true,
    modernOnly: false,
    totalChaos: false,
    chaosDraftPacksNumber: 3,
    chaosSealedPacksNumber: 6,
    gametype: 'draft',
    picksPerPack: 1,
    burnsPerPack: 0,
    DoubleMasters: -1,
    gamesubtype: 'regular',
    sets: [],
    setsDraft: [],
    setsSealed: [],
    setsDecadentDraft: [],
    availableSets: {},
    list: '',
    cards: 15,
    packs: 3,
    cubePoolSize: 90,

    addBots: true,
    shufflePlayers: true,
    useTimer: true,
    timerLength: 'Moderate', // Fast Moderate or Slow

    beep: true,
    notify: false,
    notificationGranted: false,
    chat: false,
    cols: false,
    hidepicks: false,
    deckSize: 40,

    // export deck
    exportDeckFormat: 'cockatrice',
    exportDeckFilename: 'filename',

    side: false,
    sort: 'rarity',
    log: {},
    cardSize: 'normal',
    cardLang: 'en',
    game: {},
    mtgJsonVersion: {
      version: '0.0.0',
      date: '1970-01-01'
    },
    boosterRulesVersion: '',
    messages: [],
    pickNumber: 0,
    packSize: 15,
    gameSeats: 8, // seats of the game being played
    gameState: new GameState(), // records the current state of cards is a GameState
    gameStates: {}, // Object representation of the gameState
  }
  private component: React.Component | null = null;
  private websocket: eio.Socket | null = null;
  err: any = null;

  _emit = (...args: any[]) => {
    return this.emit.bind(this, ...args); // TODO: Understand what this does.
  }
  init = (router: (app: App) => void) => {
    this.on('set', this.set);
    this.on('error', this.error);
    this.on('route', this.route);

    this.restore();
    this.connect();
    router(this);
  }

  register = (component: any) => {
    this.connect();

    this.on('set', this.set);
    this.on('error', this.error);
    this.on('route', this.route);

    this.component = component;
  }

  restore = () => {
    Object.keys(this.state).forEach((key) => {
      const localValue = localStorage.getItem(key);
      if (localValue !== null) {
        try {
          // @ts-ignore
          this.state[key] = JSON.parse(localValue);
        } catch (error) {
          localStorage.removeItem(key);
        }
      }
    });

    if (this.state.id === null) {
      this.state.id = _.uid();
      localStorage.setItem('id', JSON.stringify(this.state.id));
    }
  }

  message = (msg: string | ArrayBuffer) => {
    // TODO: handle ArrayBuffer
    console.log(msg);
    const value: any[] = JSON.parse(msg as string);
    this.emit(value[0], ...value.slice(1));
  }

  connect = () => {
    const { id, name } = this.state;
    // TODO: What should these options be?
    const options: any = { query: { id, name }};
    if (this.websocket === null) {
      this.websocket = eio(location.href, options);
      this.websocket.on('message', this.message);
    }
  }

  send = (...args: any[]) => {
    const message = JSON.stringify(args);
    console.log(`Sending message: ${message}`);
    this.websocket!.send(message);
  }

  initGameState = (id: string) => {
    const { gameStates } = this.state;
    if (gameStates[id] === undefined) {
      this.state.gameState = new GameState();
    } else {
      this.state.gameState = new GameState(gameStates[id]);
    }
    this.state.gameState.on('updateGameState', (gameState) => {
      this.save('gameStates', {
          ...this.state.gameStates,
          [id]: gameState
        });
      }
    );
    this.state.gameState.on('setSelected', (state) => {
      this.send('setSelected', state);
    });
  }

  error = (err: any) => {
    this.err = err;
    this.route('');
  }

  route = (path: string) => {
    if (path === location.href.slice(1)) {
      this.update();
    } else {
      location.hash = path;
    }
  }

  save = (key: keyof AppState, val: any) => {
    // @ts-ignore
    this.state[key] = val;
    localStorage.setItem(key, JSON.stringify(val));
    this.update();
  }

  set = (state: Partial<AppState>) => {
    Object.assign(this.state, state);
    if (this.state.latestSet) {
      const defaultSetCode = this.state.latestSet?.code;
      const replicateDefaultSet = (desiredLength: number) => times(desiredLength, constant(defaultSetCode));
      const initializeIfEmpty = (sets: any[], desiredLength: number) => {
        if (sets.length === 0) {
          sets.push(...replicateDefaultSet(desiredLength));
        }
      };
      initializeIfEmpty(this.state.setsSealed, 6);
      initializeIfEmpty(this.state.setsDraft, 3);
      initializeIfEmpty(this.state.setsDecadentDraft, 36);
    }
    this.update();
  }

  update = () => {
    if (this.component) {
      this.component.setState(this.state);
    }
  }

  link = (key: any, index: any) => {
    console.log(key);
    console.log(index);
  }

  updateGameInfos = ({ type, sets, packsInfo, picksPerPack, burnsPerPack}: any) => {
    const savename = type === 'draft' ? sets[0] + '-draft' : type;
    const date = new Date();
    const currentTime = date.toISOString().slice(0, 10).replace('T', ' ') + '_' + date.toString().slice(16, 21).replace(':', '-');
    this.set({
      exportDeckFilename: `${savename.replace(/\W/, '-')}_${currentTime}`,
      game: { type, sets, packsInfo, burnsPerPack },
      picksPerPack,
    });
  }

  getZone = (zone: Zone) => {
    return this.state.gameState.get(zone);
  }

  getSortedZone = (zone: Zone) => {
    return this.state.gameState.getSortedZone(zone, this.state.sort);
   }

  didGameStart = () => this.state.round !== undefined && this.state.round !== 0;
  isSealed = () => /sealed/.test(this.state.game.type);
  isGameFinished = () => this.state.round === -1;
  isDecadentDraft = () => /decadent draft/.test(this.state.game.type);
  notificationBlocked = () => ['denied', 'notsupported'].includes(this.state.notificationResult ?? '');

  moveCard = (srcZone: keyof DraftState, srcColumnIndex: number, destZone: keyof DraftState, destColumnIndex: number, card: Card) => {
    // Local state
    this.state.gameState.moveCard(srcZone, srcColumnIndex, destZone, destColumnIndex, card);
    // Backend state
    this.send('moveCard', {
      srcZone,
      srcColumnIndex,
      destZone,
      destColumnIndex,
      card,
    })
  };

  reorderCard = (zone: keyof DraftState, columnIndex: string, sourceIndex: number, destinationIndex: number, card: Card) => {
    // Local state
    this.state.gameState.reorderCard(zone, columnIndex, sourceIndex, destinationIndex, card);
    // Backend state
    this.send('reorderCard', {
      srcZone: zone,
      srcColumnId: Number.parseInt(columnIndex),
      sourceIndex,
      destinationIndex,
      card,
    });
  }
}

// //==========================================================================

// function message(msg) {
//   let args = JSON.parse(msg);
//   App.emit(...args);
// }

// let App = {
//   __proto__: new EventEmitter,

//   state: {
//     id: null,
//     name: STRINGS.BRANDING.DEFAULT_USERNAME,

//     serverVersion: null,
//     numUsers: 0,
//     numPlayers: 0,
//     numActiveGames: 0,
//     roomInfo: [],

//     seats: 8,
//     title: '',
//     gameId: '',
//     isPrivate: true,
//     modernOnly: false,
//     totalChaos: false,
//     chaosDraftPacksNumber: 3,
//     chaosSealedPacksNumber: 6,
//     gametype: 'draft',
//     picksPerPack: 1,
//     burnsPerPack: 0,
//     DoubleMasters: -1,
//     gamesubtype: 'regular',
//     sets: [],
//     setsDraft: [],
//     setsSealed: [],
//     setsDecadentDraft: [],
//     availableSets: {},
//     list: '',
//     cards: 15,
//     packs: 3,
//     cubePoolSize: 90,

//     addBots: true,
//     shufflePlayers: true,
//     useTimer: true,
//     timerLength: 'Moderate', // Fast Moderate or Slow

//     beep: true,
//     notify: false,
//     notificationGranted: false,
//     chat: false,
//     cols: false,
//     hidepicks: false,
//     deckSize: 40,

//     // export deck
//     exportDeckFormat: 'cockatrice',
//     exportDeckFilename: 'filename',

//     side: false,
//     sort: 'rarity',
//     log: {},
//     cardSize: 'normal',
//     cardLang: 'en',
//     game: {},
//     mtgJsonVersion: {
//       version: '0.0.0',
//       date: '1970-01-01'
//     },
//     boosterRulesVersion: '',
//     messages: [],
//     pickNumber: 0,
//     packSize: 15,
//     gameSeats: 8, // seats of the game being played
//     gameState: null, // records the current state of cards is a GameState
//     gameStates: {}, // Object representation of the gameState

//     get didGameStart() {
//       // both round === 0 and round is undefined
//       return App.state.round;
//     },
//     get isSealed() {
//       return /sealed/.test(App.state.game.type);
//     },
//     get isGameFinished() {
//       return App.state.round === -1;
//     },
//     get isDecadentDraft() {
//       return /decadent draft/.test(App.state.game.type);
//     },

//     get notificationBlocked() {
//       return ['denied', 'notsupported'].includes(App.state.notificationResult);
//     }
//   },
//   init(router) {
//     App.on('set', App.set);
//     App.on('error', App.error);
//     App.on('route', App.route);

//     App.restore();
//     App.connect();
//     router(App);
//   },
//   register(component) {
//     App.connect();

//     App.on('set', App.set);
//     App.on('error', App.error);
//     App.on('route', App.route);

//     App.component = component;
//   },
//   restore() {
//     for (let key in this.state) {
//       let val = localStorage[key];
//       if (val) {
//         try {
//           this.state[key] = JSON.parse(val);
//         } catch(e) {
//           delete localStorage[key];
//         }
//       }
//     }

//     if (!this.state.id) {
//       this.state.id = _.uid();
//       localStorage.id = JSON.stringify(this.state.id);
//     }
//   },
//   connect() {
//     let {id, name} = App.state;
//     let options = {
//       query: { id, name }
//     };
//     if(!this.ws) {
//       this.ws = eio(location.href, options);
//       this.ws.on('message', message);
//     }
//   },
//   send(...args) {
//     let msg = JSON.stringify(args);
//     this.ws.send(msg);
//   },
//   initGameState(id) {
//     const { gameStates } = App.state;
//     if (!gameStates[id]) {
//       App.state.gameState = new GameState();
//     } else {
//       App.state.gameState = new GameState(gameStates[id]);
//     }
//     App.state.gameState.on('updateGameState', (gameState) => {
//       App.save('gameStates', {
//         // ...App.state.gameStates,
//         [id]: gameState
//       });
//     });
//     App.state.gameState.on('setSelected', (state) => {
//       App.send('setSelected', state);
//     });
//   },
//   error(err) {
//     App.err = err;
//     App.route('');
//   },
//   route(path) {
//     if (path === location.hash.slice(1))
//       App.update();
//     else
//       location.hash = path;
//   },
//   save(key, val) {
//     this.state[key] = val;
//     localStorage[key] = JSON.stringify(val);
//     App.update();
//   },
//   set(state) {
//     Object.assign(App.state, state);
//     if (App.state.latestSet) {
//       // Default sets to the latest set.
//       const defaultSetCode = App.state.latestSet.code;
//       const replicateDefaultSet = (desiredLength) => times(desiredLength, constant(defaultSetCode));
//       const initializeIfEmpty = (sets, desiredLength) => {
//         if (sets.length === 0) {
//           sets.push(...replicateDefaultSet(desiredLength));
//         }
//       };
//       initializeIfEmpty(App.state.setsSealed, 6);
//       initializeIfEmpty(App.state.setsDraft, 3);
//       initializeIfEmpty(App.state.setsDecadentDraft, 36);
//     }
//     App.update();
//   },
//   update() {
//     if(App.component) {
//       App.component.setState(App.state);
//     }
//   },
//   _emit(...args) {
//     return App.emit.bind(App, ...args);
//   },
//   _save(key, val) {
//     return App.save.bind(App, key, val);
//   },
//   link(key, index) {
//     let hasIndex = index !== void 0;

//     let value = App.state[key];
//     if (hasIndex)
//       value = value[index];

//     function requestChange(val) {
//       if (hasIndex) {
//         let tmp = App.state[key];
//         tmp[index] = val;
//         val = tmp;
//       }
//       App.save(key, val);
//     }

//     return { requestChange, value };
//   },
//   updateGameInfos({type, sets, packsInfo, picksPerPack, burnsPerPack}) {
//     const savename = type === 'draft' ? sets[0] + '-draft' : type;
//     const date = new Date();
//     const currentTime = date.toISOString().slice(0, 10).replace('T', ' ') + '_' + date.toString().slice(16, 21).replace(':', '-');
//     App.set({
//       exportDeckFilename: `${savename.replace(/\W/, '-')}_${currentTime}`,
//       game: { type, sets, packsInfo, burnsPerPack },
//       picksPerPack,
//     });
//   },
//   getZone(zoneName){
//     return App.state.gameState.get(zoneName);
//   },
//   getSortedZone(zoneName) {
//     return App.state.gameState.getSortedZone(zoneName, App.state.sort);
//   }
// };

// export default App;
