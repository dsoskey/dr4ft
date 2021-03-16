import { EventEmitter } from "events";
import { Sock } from "./sock";
import { Message } from '../common/src/types/message';
interface RoomProps {
  isPrivate: boolean;
}
export class Room extends EventEmitter {
  protected messages: Message[];
  protected socks: Sock[];
  protected isPrivate: boolean;
  protected timeCreated: Date;

  constructor({isPrivate}: RoomProps) {
    super();
    this.messages = [];
    this.socks = [];
    this.isPrivate = isPrivate;
    this.timeCreated = new Date();
  }
  join(sock: Sock) {
    this.socks.push(sock);
    sock.once("exit", this.exit.bind(this));
    sock.on("say", this.say.bind(this));
    sock.on("name", this.name.bind(this));
    sock.send("chat", this.messages);
  }
  name(name: string, sock: Sock) {
    sock.name = name.slice(0, 15);
  }
  exit(sock: Sock) {
    sock.removeAllListeners("say");
    this.socks = this.socks.filter(s => s !== sock);
  }
  say(text: string, sock: Sock) {
    const msg: Message = {
      text,
      time: Date.now(),
      name: sock.name
    };

    this.messages.push(msg);
    this.socks.forEach((s) => s.send("hear", msg));
  }
};
