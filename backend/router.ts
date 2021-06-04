import { version } from "../config";
import { Game } from "./game";
import Rooms from "./rooms";
import { Sock } from "./sock";
import { prepareGame } from "./util";
import { logger } from "./logger";
import { Socket } from "engine.io";
import { GameOptions } from "../common/src/types/game";

// TODO: Verify "this" is correct
function create(this: Sock, opts: GameOptions) {
  try {
    prepareGame(opts);
  } catch(err) {
    logger.error(`user ${this.name} could not create a game - ${err.message}`);
    return this.err(err.message);
  }

  const g = new Game({ ...opts, hostId: this.id });
  logger.info(`user ${this.name} created a game with id ${g.id}`);
  this.send("route", `g/${g.id}`); // IDEA: use query param to autojoin host
  logger.info('sent route');
}

function join(roomID: string, sock: Sock) {
  const room = Rooms.get(roomID);
  if (!room)
    return sock.err(`No game found with id ${roomID}`);
  sock.exit();
  room.join(sock);
}

export default function (ws: Socket) {
  const sock = new Sock(ws);
  sock.on("join", join);
  sock.on("create", create);

  Game.broadcastGameInfo();
  sock.send("set", { serverVersion: version });
};
