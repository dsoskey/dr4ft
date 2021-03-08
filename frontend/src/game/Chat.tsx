import React, {Component, Fragment, RefObject} from "react";

import _ from "../utils";
import { app } from "../router";

import "vanilla-toast/vanilla-toast.css";
import { Message } from "common/src/types/message";

interface ChatProps {

}
export class Chat extends Component<ChatProps> {
  private messagesEnd: RefObject<HTMLDivElement>;
  constructor(props: ChatProps) {
    super(props);
    this.messagesEnd = React.createRef();
  }

  scrollToBottom = () => {
    this.messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  };

  componentDidMount() {
    this.scrollToBottom();
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  onClickChat() {
    document.getElementById("chat-input")?.focus();
  }

  render() {
    // must be mounted to receive messages
    return (
      <div className={"chat-container"}>
        <div className='chat' onClick={this.onClickChat}>
          <div className='messages' >
            <Messages />
            <div style={{ float:"left", clear: "both" }} ref={this.messagesEnd} />
          </div>
          <Entry />
        </div>
      </div>
    );
  }
}

const Messages = () => {
  const groupBy = (messages: Message[], key: (message: Message) => string) => (
    messages.reduce(function(returnValue: { [key: string]: Message[] }, message: Message) {
      const v = key(message);
      (returnValue[v] = returnValue[v] || []).push(message);
      return returnValue;
    }, {})
  );

  const groupedDates: { [key: string]: Message[] } = groupBy(app.state.messages, ({time}: Message) => new Date(time).toDateString());

  return Object.keys(groupedDates).length
    ? <>{Object.entries(groupedDates)
      .map(([date, msgs], index) => (
        <Fragment key={date + index}>
          <MessagesHeader date={date} />
          {msgs.map((msg, index) =>
            <MessageComponent key={index} {...msg} />
          )}
        </Fragment>
      ))}</>
    : <MessagesHeader date={new Date().toDateString()} />;
};

const Entry = () => {
  const onKeyDown = (event: any) => {
    if (event.key !== "Enter")
      return;

    let element = event.target;
    let text = element.value.trim();
    element.value = "";

    if (!text)
      return;

    if (text[0] === "/")
      command(text.slice(1));
    else
      app.send("say", text);
  };

  const command = (raw: string) => {
    let [, command, arg] = raw.match(/(\w*)\s*(.*)/)!;
    arg = arg.trim();
    let text, name;

    switch(command) {
    case "name":
    case "nick":
      name = arg.slice(0, 15);

      if (!name) {
        text = "enter a name";
        break;
      }

      text = `hello, ${name}`;
      app.save("name", name);
      app.send("name", name);
      break;
    default:
      text = `unsupported command: ${command}`;
    }

    app.emit("command", { text,
      time: Date.now(),
      name: ""
    });
  };

  return <input id='chat-input' autoFocus className='chat-input' type='text' onKeyDown={onKeyDown} placeholder='/nick name' />;
};

interface MessagesHeaderProps {
  date: string;
}
const MessagesHeader = ({date}: MessagesHeaderProps) => (
  <div style={{textAlign: "center"}}>{date}</div>
);

const MessageComponent = ({time, name, text}: Message) => {
  const date: Date = new Date(time);
  const hours   = _.pad(2, "0", date.getHours());
  const minutes = _.pad(2, "0", date.getMinutes());
  const timestamp = `${hours}:${minutes}`;

  return (
    <div>
      <time>{timestamp}</time>
      {" "}
      <span className='name'>{name}</span>
      {" "}
      {text}
    </div>
  );
};
