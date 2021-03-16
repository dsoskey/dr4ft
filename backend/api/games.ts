import express from "express";
const gamesRouter = express.Router();
import { Game } from "../game";
import Rooms from "../rooms";
import { prepareGame, start } from "../util";
import assert from "assert";
import { logger } from "../logger";

const checkGameId = (req: any, res: any, next: any) => {
  req.game = Rooms.get(req.params.gameId);
  if (!req.game) {
    res.status(404).json({
      message: `No game found with Id ${req.params.gameId}`
    });
  } else {
    next();
  }
};

const checkGameSecret = (req: any, res: any, next: any) => {
  try {
    assert(req.game.secret === req.query.secret, "The secret provided doesn't fit gameId's secret");
    next();
  } catch (err) {
    res.status(400).json(err.message);
  }
};

const checkGameStartParams = (req: any, res: any, next: any) => {
  try {
    start(req.body);
    next();
  } catch (err) {
    res.status(400).json(err.message);
  }
};

const checkGameCreateParams = (req: any, res: any, next: any) => {
  try {
    logger.info(req.body);
    prepareGame(req.body);
    next();
  } catch (err) {
    res.status(400).json(err.message);
  }
};

gamesRouter

  /*
    Request Params:
      title[string],
      seats[int],
      type[enum:"draft","sealed","cube sealed","cube draft","chaos draft", "chaos sealed"],
      sets[stringArray(for example "XLN,XLN,XLN"],
      cube[object],
      isPrivate[boolean],
      modernOnly[boolean],
      totalChaos[boolean]
  */
  .post("/", checkGameCreateParams, (req: any, res: any) => {
    const game = new Game(req.body);
    res.json({
      "link": `#g/${game.id}`,
      "secret": game.secret
    });
  })

  /* start => {addBots, useTimer, timerLength, shufflePlayers} */
  .post("/:gameId/start", checkGameId, checkGameSecret, checkGameStartParams, (req: any, res: any) => {
    req.game.start(req.body);
    res.json({
      "message": `Game ${req.params.gameId} successfully started`,
      "bots": req.game.bots
    });
  })
  /**
   * sends an object according to the endpoint api/games/:gameId/status.
   * It shows if the game started, the current pack and players' infos.
   */
  .get("/:gameId/status", checkGameId, (req: any, res: any) => {
    res.send(req.game.getStatus());
  })

  /**
   * can accept a `seat`(from 0 to X) or an `id` (playerId) to get informations,
   * according to the endoint api/games/:gameId/decks.
   * If no `seat` and `id` are requested,
   * then it returns an array of the decks of all players.
   */
  // secret=[string]&seat=[int]&id[string]
  .get("/:gameId/deck", checkGameId, checkGameSecret, (req: any, res: any) => {
    res.send((req.game as Game).getDecks(req.query));
  });

export default gamesRouter;
