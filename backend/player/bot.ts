import { sample, pull, times } from 'lodash';

import { Player } from './player';
import { logger } from '../logger';
import { Card } from '../../common/src/types/card';

export default class Bot extends Player {
  constructor(picksPerPack: number, burnsPerPack: number, gameId: string) {
    super({
      isBot: true,
      isConnected: true,
      name: 'bot',
      id: '',
      gameId,
      picksPerPack,
      burnsPerPack,
    });
  }

  getPack(pack: Card[]) {
    const cardsToPick = Math.min(this.picksPerPack, pack.length);
    times(cardsToPick, () => {
      const randomPick = sample(pack)!;
      logger.info(`GameID: ${this.gameId}, Bot, picked: ${randomPick.name}`);
      this.picks.push(randomPick.name);
      pull(pack, randomPick);
    });

    // burn cards
    const cardsToBurn = Math.min(this.burnsPerPack, pack.length);
    times(cardsToBurn, () => {
      const randomPick = sample(pack)!;
      logger.info(`GameID: ${this.gameId}, Bot, burnt: ${randomPick.name}`);
      pull(pack, randomPick);
    });

    this.emit('pass', pack);
  }

  handleTimeout = () => {}
  err = () => {}
  send = () => {}
};
