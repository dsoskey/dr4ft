import React, {Component} from "react";


import { app } from "../router";

export const PlayersPanel = () => (
  <div>
    <PlayersTable />
    <div id='self-time-fixed' hidden>
      <u>Time Left</u>
      <div id='self-time-fixed-time' />
    </div>
  </div>
);

const PlayersTable = () => (
  <table id='players'>
    <tbody>
      <PlayerTableHeader />
      <PlayerEntries />
    </tbody>
  </table>
);

const PlayerTableHeader = () => (
  <tr>
    <th key="1">#</th>
    <th key="2"/>
    <th key="3">Drafter</th>
    <th key="4" className={columnVisibility("packs")}>Packs</th>
    <th key="5" className={columnVisibility("timer")}>Timer</th>
    <th key="6" className={columnVisibility("trice")}>Hash</th>
  </tr>
);

class PlayerEntries extends Component {
  private timer: any;
  decrement() {
    for (let p of app.state.players ?? [])
      if (p.time)
        p.time--; this.forceUpdate();
  }
  componentDidMount() {
    this.timer = window.setInterval(this.decrement.bind(this), 1e3);
  }
  componentWillUnmount() {
    window.clearInterval(this.timer);
  }
  render() {
    return <>{app.state.players?.map((p,i) => <PlayerEntry key ={i} player={p} index={i} />)}</>;
  }
}

window.onscroll = () => {
  fixPackTimeToScreen();
};

const fixPackTimeToScreen = () => {
  const selfTime = document.getElementById("self-time");
  const selfTimeFixed = document.getElementById("self-time-fixed");
  const {[0]: zone} = document.getElementsByClassName("zone");
  if (selfTime && selfTimeFixed && zone) {
    const selfRect = selfTime.getBoundingClientRect();
    const zoneRect = zone.getBoundingClientRect();
    const selfTimeRect = selfTimeFixed.getBoundingClientRect();
    selfTimeFixed.hidden = !(app.state.round && app.state.round > 0 && selfRect.top < 0);
    selfTimeFixed.style.left = `${zoneRect.right - selfTimeRect.width - 5}px`;
    selfTimeFixed.style.top
    = zoneRect.top > 0
        ? `${zoneRect.top + 5}px`
        : "5px";
  }
};

const columnVisibility = (columnName: string) => {
  switch(columnName) {
  case "packs":
    return app.isGameFinished() || !app.didGameStart() || app.isSealed() ? "hidden" : "";
  case "timer":
    return app.isGameFinished() || !app.didGameStart() || app.isSealed() ? "hidden" : "";
  case "trice":
    return !app.isGameFinished() ? "hidden" : "";
  default:
    return "";
  }
};

interface PlayerEntryProps {
  player: any;
  index: number;
}
const PlayerEntry = ({player, index}: PlayerEntryProps) => {
  const {players, self, isHost} = app.state;
  const {isBot, name, packs, time, hash} = player;

  const opp
  = length % 2 === 0
    ? (self ?? 0 + length/2) % length
    : null;

  const className
  = index === self
    ? "self"
    : index === opp
      ? "opp"
      : undefined;

  const connectionStatusIndicator
  = <span className={isBot ? "icon-bot" : "icon-connected"}
    title={isBot ? "This player is a bot.": ""} />;

  const columns = [
    <td key={0}>{index + 1}</td>,
    <td key={1}>{connectionStatusIndicator}</td>,
    <td key={2}>{index === self ? <SelfName name={app.state.name} /> : name}</td>,
    <td key={3} className={columnVisibility("packs")} >{packs}</td>,
    <td key={4} id={className==="self" ? "self-time":""} className={columnVisibility("timer")}>{time}</td>,
    <td key={5} className={columnVisibility("trice")}>{hash && hash.cock}</td>,
  ];

  const selfTimeFixed = document.getElementById("self-time-fixed-time");
  if (selfTimeFixed && className==="self") {
    selfTimeFixed.innerHTML = time;
    fixPackTimeToScreen();
  }

  if (isHost) {
    //Move Player
    if (!app.didGameStart() && length > 1)
      columns.push(
        <td key={6}>
          <button onClick={()=> app.send("swap", [index, index - 1])}>
            <img src="../../media/arrow-up.png" width="16px"/>
          </button>
          <button onClick={()=> app.send("swap", [index, index + 1])}>
            <img src="../../media/arrow-down.png" width="16px"/>
          </button>
        </td>);
    //Kick button
    if (index !== self && !isBot)
      columns.push(
        <td key={7}>
          <button onClick={()=> app.send("kick", index)}>
            Kick
          </button>
        </td>);
    else
      columns.push(<td key={8}/>);

  }

  return <tr className={className}>{columns}</tr>;
};

interface SelfNameProps {
  name: string;
}
const SelfName = ({ name }: SelfNameProps) => (
  <input
    style={{ width: "150px" }}
    type='text'
    maxLength={15}
    value={name}
    onChange={(e) => {
      app.save("name", e.currentTarget.value);
    }}
    onBlur={(e) => {
      app.send("name", e.currentTarget.value);
    }}
  />
);
