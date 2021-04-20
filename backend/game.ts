import crypto from 'crypto';
import path from 'path';
import { shuffle, truncate } from 'lodash';
import { v1 as uuidv1, v4 as uuidv4 } from 'uuid';
import jsonfile from 'jsonfile';
import Bot from './player/bot';
import Human from './player/human';
import Pool from './pool';
import { Room } from './room';
import Rooms from './rooms';
import { logger } from './logger';
import { HasSock, Sock } from './sock';
import { saveDraftStats, getDataDir } from './data';
import { Player } from './player/player';
import { Logger } from 'winston';
import { TimerLength } from '../common/src/types/state';
import { Cube } from '../common/src/types/cube';
import { GameProps, GameType, StartOptions } from '../common/src/types/game';

const hasSock = (player: Player): player is Human => {
  return (player as any).attach !== undefined;
}

export class Game extends Room {
  readonly id: string = uuidv1();
  readonly secret: string = uuidv4();

  private hostId: string;

  private delta: number = -1;
  private title: string;
  private seats: number;
  private type: GameType;
  private sets: string[];
  private cube?: Cube;
  private modernOnly: boolean;
  private totalChaos: boolean;
  private chaosPacksNumber: number;
  private picksPerPack: number;
  private packsInfo: string;
  // Total number of rounds
  private rounds: number = -1;
  // Current round
  round: number = 0;
  private bots: number = 0;
  private addBots: boolean = false;
  private isDecadent: boolean = false;
  players: Player[] = [];
  expires: number = -1;
  private useTimer: boolean = false;
  private timerLength: TimerLength = 'Leisurely';

  private logger: Logger = logger.child({ id: this.id });

  /**
   * Current number of packs open at the table.
   * Starting at 1 because of pass() 
   */
  private packCount: number = 1;
  pool: any;

  
  constructor({ hostId, title, seats, type, sets, cube, isPrivate, modernOnly, totalChaos, chaosPacksNumber, picksPerPack }: GameProps) {
    super({ isPrivate });

    this.hostId = hostId;
    this.title = title;
    this.seats = seats;
    this.type = type;
    this.modernOnly = modernOnly;
    this.totalChaos = totalChaos;
    this.cube = cube;
    this.sets = sets ?? [];
    this.chaosPacksNumber = chaosPacksNumber ?? -1;
    this.picksPerPack = picksPerPack;
    // Handle packsInfos to show various informations about the game
    switch(type) {
    case 'draft':
    case 'sealed':
      this.packsInfo = this.sets.join(' / ');
      this.rounds = this.sets.length;
      break;
    case 'decadent draft':
      // Sets should all be the same and there can be a large number of them.
      // Compress this info into e.g. '36x IKO' instead of 'IKO / IKO / ...'.
      this.packsInfo = `${this.sets.length}x ${this.sets[0]}`;
      this.rounds = this.sets.length;
      this.isDecadent = true;
      break;
    case 'cube draft':
      this.packsInfo = `${this.cube?.packs} packs with ${this.cube?.cards} cards from a pool of ${this.cube?.list.length} cards`;
      if (this.cube && this.cube.burnsPerPack > 0) {
        this.packsInfo += ` and ${this.cube.burnsPerPack} cards to burn per pack`;
      }
      this.rounds = this.cube?.packs ?? -1;
      break;
    case 'cube sealed':
      this.packsInfo = `${this.cube?.cubePoolSize} cards per player from a pool of ${this.cube?.list.length} cards`;
      this.rounds = this.cube?.packs ?? -1;
      break;
    case 'chaos draft':
    case 'chaos sealed': {
      const chaosOptions = [];
      chaosOptions.push(`${this.chaosPacksNumber} Packs`);
      chaosOptions.push(modernOnly ? 'Modern sets only' : 'Not modern sets only');
      chaosOptions.push(totalChaos ? 'Total Chaos' : 'Not Total Chaos');
      this.packsInfo = `${chaosOptions.join(', ')}`;
      this.rounds = this.chaosPacksNumber;
      break;
    }
    default:
      this.packsInfo = '';
    }

    if (cube) {
      Object.assign(this, {
        cubePoolSize: cube.cubePoolSize,
        packsNumber: cube.packs,
        playerPackSize: cube.cards
      });
    }

    this.renew();
    Rooms.add(this.id, this);
    this.once('kill', () => Rooms.delete(this.id));
    Game.broadcastGameInfo();
  }

  renew = () => {
    const NINETY_MINUTES = 1000 * 60 * 90;
    this.expires = Date.now() + NINETY_MINUTES;
  }

  isActive = () => {
    return this.players.some(x => x.isActive());
  }

  didGameStart = () => {
    return this.round !== 0;
  }

  isGameFinished = () => {
    return this.round === -1;
  }

  isGameInProgress = () => {
    return this.didGameStart() && !this.isGameFinished();
  }

  // The number of total games. This includes ones that have been long since
  // abandoned but not yet garbage-collected by the `renew` mechanism.
  static numGames() {
    return Rooms.getAll().length;
  }

  // The number of games which have a player still in them.
  static numActiveGames() {
    return Rooms.getAll()
      .filter(({isActive}) => isActive())
      .length;
  }

  // The number of players in active games.
  static totalNumPlayers() {
    return Rooms.getAll()
      .filter(({isActive}) => isActive())
      .reduce((count, {players}) => {
        return count + players.filter(x => x.isConnected && !x.isBot).length;
      }, 0);
  }

  static broadcastGameInfo() {
    Sock.broadcast('set', {
      numPlayers: Game.totalNumPlayers(),
      numGames: Game.numGames(),
      numActiveGames: Game.numActiveGames(),
    });
    Game.broadcastRoomInfo();
  }

  static broadcastRoomInfo() {
    Sock.broadcast('set', { roomInfo: Game.getRoomInfo() });
  }

  // TODO: if doesn't work, write a regression test!
  static getRoomInfo() {
    const rooms = Rooms.getAll();
    return rooms
      .filter(({isPrivate, didGameStart, isActive, players, seats}) =>
       !isPrivate && !didGameStart() && isActive() && players.length !== seats)
      .map((game) => ({
        id: game.id,
        title: game.title,
        usedSeats: game.players.length,
        totalSeats: game.seats,
        name: game.name, // This one's weird. not sure where game.name is coming from
        packsInfo: game.packsInfo,
        type: game.type,
        timeCreated: game.timeCreated,
      }));
  }

  name(name: string, sock: Sock) {
    logger.info(name)
    super.name(name, sock);
    sock.h.name = sock.name;
    this.meta();
  }

  join(sock: Sock) {
    // Reattach sock to player based on his id
    const existingPlayer = this.players.find((p: Player) => p.id === sock.id);

    if (existingPlayer) {
      this.logger.debug(`${sock.name} re-joined the game`);
      // kick any existing connections with the same ID
      existingPlayer.err('only one window active');
      if (hasSock(existingPlayer)) {
        existingPlayer.attach(sock);
        this.greet(existingPlayer);
      }
      if (!this.didGameStart()) {
        this.players.push(existingPlayer);
      }
      this.meta();
      super.join(sock);
    } else {
      if (this.didGameStart()) {
        return sock.err('game already started');
      }
  
      if (this.players.length >= this.seats) {
        return sock.err('game is full');
      }
  
      super.join(sock);
      this.logger.debug(`${sock.name} joined the game`);
  
      const human = new Human(sock, this.picksPerPack, this.getBurnsPerPack(), this.id);
      if (human.id === this.hostId) {
        human.isHost = true;
        sock.once('start', this.start.bind(this));
        sock.removeAllListeners('kick');
        sock.on('kick', this.kick.bind(this));
        sock.removeAllListeners('swap');
        sock.on('swap', this.swap.bind(this));
      }
      human.on('meta', this.meta.bind(this));
      this.players.push(human);
  
      this.greet(human);
      this.meta();
    }
  }

  // IDEA: Decouple the GameInstance from the RulesEngine
  getBurnsPerPack() {
    switch (this.type) {
    case 'decadent draft':
      return Number.MAX_VALUE;
    case 'cube draft':
      return this.cube!.burnsPerPack;
    default:
      return 0;
    }
  }

  swap([i, j]: number[]) {
    const l = this.players.length;

    if (j < 0 || j >= l)
      return;

    [this.players[i], this.players[j]] = [this.players[j], this.players[i]];

    this.players.forEach((p, i) => p.send('set', { self: i }));
    this.meta();
  }

  kick(i: number) {
    const h = this.players[i];
    if (!h || h.isBot)
      return;

    this.logger.debug(`${h.name} is being kicked from the game`);
    if (this.didGameStart())
      h.kick();
    else
      h.exit();

    h.err('you were kicked');
    h.kick();
  }

  greet(human: Human) {
    human.isConnected = true;
    human.send('set', {
      isHost: human.isHost,
      round: this.round,
      self: this.players.indexOf(human),
      sets: this.sets,
      gameId: this.id
    });
    human.send('gameInfos', {
      type: this.type,
      packsInfo: this.packsInfo,
      sets: this.sets,
      picksPerPack: this.picksPerPack,
      burnsPerPack: this.type === 'cube draft' ? this.cube!.burnsPerPack : 0
    });

    if (this.isGameFinished()) {
      human.send('log', human.draftLog.round);
    }
  }

  exit(sock: Sock) {
    super.exit(sock);
    if (this.didGameStart())
      return;

    sock.removeAllListeners('start');
    const index = this.players.indexOf(sock.h);
    this.players.splice(index, 1);

    this.players.forEach((p, i) => p.send('set', { self: i }));
    this.meta();
  }

  meta(state: any = {}) {
    state.players = this.players.map(p => ({
      // @ts-ignore
      hash: p.hash,
      name: p.name,
      time: p.time,
      packs: p.draftState.state.pack.length,
      isBot: p.isBot,
      isConnected: p.isConnected,
    }));
    state.gameSeats = this.seats;
    this.players.forEach((p) => p.send('set', state));
    Game.broadcastGameInfo();
  }

  kill(message: string) {
    if (!this.isGameFinished()) {
      this.players.forEach(p => p.err(message));
    }

    Rooms.delete(this.id);
    Game.broadcastGameInfo();
    this.logger.debug('is being shut down');

    this.emit('kill');
  }

  uploadDraftStats() {
    const draftStats: any = this.cube
      ? { list: this.cube.list }
      : { sets: this.sets };
    draftStats.id = this.id;
    draftStats.draft = {};

    this.players.forEach((p) => {
      if (!p.isBot) {
        draftStats.draft[p.id] = p.draftStats;
      }
    });

    saveDraftStats(this.id, draftStats);
  }

  end() {
    this.logger.debug('game ended');
    this.players.forEach((p) => {
      if (!p.isBot) {
        p.send('log', p.draftLog.round);
      }
    });
    const cubeHash = /cube/.test(this.type)
      ? crypto.createHash('SHA512').update(this.cube!.list.join('')).digest('hex')
      : '';

    const draftcap = {
      'gameID': this.id,
      'players': this.players.length - this.bots,
      'type': this.type,
      'sets': this.sets,
      'seats': this.seats,
      'time': Date.now(),
      'cap': this.players.map((player, seat) => ({
        'id': player.id,
        'name': player.name,
        'seat': seat,
        'picks': player.cap.packs,
        'cubeHash': cubeHash
      }))
    };

    const file = path.join(getDataDir(), 'cap.json');
    jsonfile.writeFile(file, draftcap, { flag: 'a' }, function (err) {
      if (err) logger.error(err);
    });

    this.renew();
    this.round = -1;
    this.meta({ round: -1 });
    if (['cube draft', 'draft'].includes(this.type)) {
      this.uploadDraftStats();
    }
  }

  pass(p: Player, pack: any[]) {
    if (!pack.length) {
      if (!--this.packCount)
        this.startRound();
      else
        this.meta();
      return;
    }

    const index = this.players.indexOf(p) + this.delta;
    const nextPlayer = this.getNextPlayer(index);
    nextPlayer.getPack(pack);
    if (!nextPlayer.isBot) {
      this.meta();
    }
  }

  startRound() {
    const { players } = this;
    if (this.round !== 0) {
      players.forEach((p: Player) => {
        p.cap.packs[this.round] = p.picks;
        p.picks = [];
        if (!p.isBot) {
          p.draftLog.round[this.round] = p.draftLog.pack;
          p.draftLog.pack = [];
        }
      });
    }

    if (this.round++ === this.rounds) {
      return this.end();
    }

    this.logger.debug('new round started');

    this.packCount = players.length;
    this.delta *= -1;

    players.forEach((p) => {
      if (!p.isBot) {
        p.pickNumber = 0;
        const pack = this.pool.shift();
        p.getPack(pack);
        p.send('set', { packSize: pack.length });
      }
    });

    //let the bots play
    this.meta = () => { };
    let index = players.findIndex(p => !p.isBot);
    let count = players.length;
    while (--count) {
      index -= this.delta;
      const p = this.getNextPlayer(index);
      if (p.isBot)
        p.getPack(this.pool.shift());
    }
    this.meta = Game.prototype.meta;
    this.meta({ round: this.round });
  }

  getStatus() {
    const { players, didGameStart, round } = this;
    return {
      didGameStart: didGameStart(),
      currentPack: round,
      players: players.map((player, index) => ({
        playerName: player.name,
        id: player.id,
        seatNumber: index
      }))
    };
  }

  getDecks({ seat, id }: any) {
    if (typeof seat == 'number') {
      const player = this.players[seat];
      return player.getPlayerDeck();
    }

    if (typeof id == 'string') {
      const player = this.players.find(p => p.id === id);
      return player?.getPlayerDeck();
    }

    return this.players.map((player) => player.getPlayerDeck());
  }


  createPool() {
    switch (this.type) {
    case 'cube draft': {
      this.pool = Pool.DraftCube({
        cubeList: this.cube!.list,
        playersLength: this.players.length,
        packsNumber: this.cube!.packs,
        playerPackSize: this.cube!.cards
      });
      break;
    }
    case 'cube sealed': {
      this.pool = Pool.SealedCube({
        cubeList: this.cube!.list,
        playersLength: this.players.length,
        playerPoolSize: this.cube!.cubePoolSize
      });
      break;
    }
    case 'draft':
    case 'decadent draft': {
      this.pool = Pool.DraftNormal({
        playersLength: this.players.length,
        sets: this.sets
      });
      break;
    }

    case 'sealed': {
      this.pool = Pool.SealedNormal({
        playersLength: this.players.length,
        sets: this.sets
      });
      break;
    }
    case 'chaos draft': {
      this.pool = Pool.DraftChaos({
        playersLength: this.players.length,
        packsNumber: this.chaosPacksNumber,
        modernOnly: this.modernOnly,
        totalChaos: this.totalChaos
      });
      break;
    }
    case 'chaos sealed': {
      this.pool = Pool.SealedChaos({
        playersLength: this.players.length,
        packsNumber: this.chaosPacksNumber,
        modernOnly: this.modernOnly,
        totalChaos: this.totalChaos
      });
      break;
    }
    default: throw new Error(`Type ${this.type} not recognized`);
    }
  }

  handleSealed() {
    this.round = -1;
    throw Error('sealed has not migrated to v5 yet.');
    this.players.forEach((player) => {
      const pool = this.pool.shift();
      // add pool to appropriate main column
      player.send('draftState', player.draftState);
      player.send('set', { round: -1 });
    });
  }

  handleDraft() {
    const {players, useTimer, timerLength} = this;

    players.forEach((p, self) => {
      p.useTimer = useTimer;
      p.timerLength = timerLength;
      p.self = self;
      p.on('pass', this.pass.bind(this, p));
      p.send('set', { self });
    });

    this.startRound();
  }

  shouldAddBots() {
    return this.addBots && !this.isDecadent;
  }

  start({ addBots, useTimer, timerLength, shufflePlayers }: StartOptions) {
    try {
      Object.assign(this, { addBots, useTimer, timerLength, shufflePlayers });
      this.renew();

      if (this.shouldAddBots()) {
        while (this.players.length < this.seats) {
          const burnsPerPack = this.type === 'cube draft'
            ? this.cube!.burnsPerPack
            : 0;
          this.players.push(new Bot(this.picksPerPack, burnsPerPack, this.id));

          this.bots++;
        }
      }

      if (shufflePlayers) {
        this.players = shuffle(this.players);
      }

      this.createPool();

      if (/sealed/.test(this.type)) {
        this.handleSealed();
      } else {
        this.handleDraft();
      }

      this.logger.info(`Game ${this.id} started.\n${this.toString()}`);
      Game.broadcastGameInfo();
    } catch(err) {
      this.logger.error(`Game ${this.id} encountered an error while starting: ${err.stack} GameState: ${this.toString()}`);
      this.players.forEach(player => {
        if (!player.isBot) {
          player.exit();
          player.err(`Whoops! An error occurred while starting the game. Please try again later. If the problem persists, you can open an issue on the Github repository: <a href='https://github.com/dr4fters/dr4ft/issues'>https://github.com/dr4fters/dr4ft/issues</a>`);
        }
      });
      Rooms.delete(this.id);
      Game.broadcastGameInfo();
      this.emit('kill');
    }
  }

  toString() {
    return `
    Game State
    ----------
    id: ${this.id}
    hostId: ${this.hostId}
    title: ${this.title}
    seats: ${this.seats}
    type: ${this.type}
    sets: ${this.sets}
    isPrivate: ${this.isPrivate}
    picksPerPack: ${this.picksPerPack}
    modernOnly: ${this.modernOnly}
    totalChaos: ${this.totalChaos}
    chaosPacksNumber: ${this.chaosPacksNumber}
    packsInfos: ${this.packsInfo}
    players: ${this.players.length} (${this.players.filter(pl => !pl.isBot).map(pl => pl.name).join(', ')})
    bots: ${this.bots}
    ${this.cube ?
    `cubePoolSize: ${this.cube.cubePoolSize}
    packsNumber: ${this.cube.packs}
    playerPackSize: ${this.cube.cards}
    cube: ${this.cube.list.slice(0, 30)}`
    : ''}`;
  }

  getNextPlayer(index: number) {
    const {length} = this.players;
    return this.players[(index % length + length) % length];
  }
};
