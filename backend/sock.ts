import { Socket } from "engine.io";
import { EventEmitter } from "events";
import { app } from '../config';
import { getPlayableSets, getLatestReleasedSet, getBoosterRulesVersion } from "./data";
import { getVersion } from "./mtgjson";

// All sockets currently connected to the server.
let allSocks: Sock[] = [];

function broadcastNumUsers() {
  Sock.broadcast("set", {
    numUsers: allSocks.length
  });
}

export interface HasSock {
  sock: Sock;
}

export class Sock extends EventEmitter {
  readonly id: string;
  name: string;
  readonly websocket: Socket;
  h: any; // Host Id?
  constructor(ws: Socket) {
    super();
    this.websocket = ws;
    // @ts-ignore
    const {id = "", name = app.DEFAULT_USERNAME} = ws.request._query;
    this.id = id.slice(0, 25);
    this.name = name.slice(0, 15);

    this.send("set", {
      availableSets: getPlayableSets(),
      latestSet: getLatestReleasedSet(),
      mtgJsonVersion: getVersion(),
      boosterRulesVersion: getBoosterRulesVersion()
    });
    allSocks.push(this);
    broadcastNumUsers();
    // @ts-ignore this.exit matches EventEmitter.on
    ws.on("message", this.message.bind(this));
    // @ts-ignore this.exit matches EventEmitter.on
    ws.on("leave", this.exit);
    ws.on("close", this.exit);

    // `this.exit` may be called for other reasons than the socket closing.
    let sock = this;
    ws.on("close", () => {
      let index = allSocks.indexOf(sock);
      if (index !== -1) {
        allSocks.splice(index, 1);
        broadcastNumUsers();
      }
    });
  }
  
  message = (msg: string) => {
    const [type, data] = JSON.parse(msg);
    this.emit(type, data, this);
  }
  err(msg: string) {
    this.send("error", msg);
  }
  send(type: string, ...data: any[]) {
    this.websocket.send(JSON.stringify([type, ...data]));
  }
  exit = (...args: any[]) => {
    this.emit("exit", this);
  }
  static broadcast(type: string, ...args: any[]) {
    allSocks.forEach((sock) => sock.send(type, ...args));
  }
}
