import React, {Component} from "react";

import { app } from "../router";

import { PlayersPanel } from "./PlayersPanel";
import { StartPanel } from "./StartPanel";
import { DeckSettings } from "./DeckSettings";
import { GameSettings } from "./GameSettings";
import { Cols } from "./Cols";
import { Grid } from "./Grid";
import { Chat } from "./Chat";
import {STRINGS} from "../config";

// @ts-ignore
import {vanillaToast} from "vanilla-toast";
import "vanilla-toast/vanilla-toast.css";
import { Zone } from "../zones";
import { Canvas } from "./v5/Canvas";

interface GameProps {
  id: string;
}
export default class Game extends Component<GameProps> {
  constructor(props: GameProps) {
    super(props);
    app.register(this);
  }

  leaveGame() {
    app.send("leave");
  }

  componentDidMount() {
    // Alert to change name
    if (app.state.name === STRINGS.BRANDING.DEFAULT_USERNAME) {
      vanillaToast.warning(`Welcome, ${app.state.name}! Please update your nickname via the 'Players' widget in the upper left.`, {duration: 5000});
    }

    window.addEventListener("beforeunload", this.leaveGame);
  }

  componentWillUnmount() {
    this.leaveGame();
    window.removeEventListener("beforeunload", this.leaveGame);
  }

  render() {
    return (
      <div className='container'>
        <audio id='beep' src='/media/beep.wav'/>
        <div className='game'>
          <div className='game-controls'>
            <div className='game-status'>
              <PlayersPanel/>
              <StartPanel/>
            </div>
            <DeckSettings/>
            <GameSettings/>
          </div>
          <Canvas />
        </div>
        {app.state.chat && <Chat/>}
      </div>
    );
  }
}

const CardsZone = () => {
  const pack = !app.isGameFinished() && app.didGameStart()
    ? <Grid key={"pack"} zones={[Zone.pack]} />
    : <div key={"pack"}/>;

  const props = { zones: [Zone.main, Zone.side, Zone.junk] };
  const pool = app.state.cols
    ? <Cols key={"pool"} {...props}/>
    : <Grid key={"pool"} {...props} />;

  return <>{!app.state.hidepicks || app.isGameFinished()
    ? [pack, pool]
    : [pack]}</>;
};
