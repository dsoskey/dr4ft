import schedule from "node-schedule";
import { Game } from "./game";

const rooms: { [key: string]: Game } = {};

schedule.scheduleJob("0 * * * * *", () => {
  const now = Date.now();
  Object.values(rooms)
    .forEach((game) => {
      if (game.expires < now) {
        game.kill("game over");
      }
    });
});

schedule.scheduleJob("* * * * * *", () => {
  Object.values(rooms)
    .forEach(({round, players}) => {
      if (round < 1) {
        return;
      }
      players.forEach((player) => {
        if (player.time && !--player.time)
          player.handleTimeout();
      });
    });
});

export default {
  add: (roomId: string, room: Game) => rooms[roomId] = room,
  get: (roomId: string) => rooms[roomId],
  delete: (roomId: string) => delete rooms[roomId],
  getAll: () => Object.values(rooms)
};
