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
import { Modal } from "../components/Modal";

interface GameProps {
  id: string;
}
interface GameState {
  openModal: 'closed' | 'settings' | 'players';
}
export default class Game extends Component<GameProps, GameState> {
  constructor(props: GameProps) {
    super(props);
    app.register(this);
    this.state = {
      openModal: 'closed',
    }
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
    let modalChild = null;
    let modalHeader = '';
    switch (this.state.openModal) {
      case 'settings':
        modalChild = <GameSettings/>;
        modalHeader = 'Settings';
        break;
      case 'players':
        modalChild = <PlayersPanel/>;
        modalHeader= `Players (${app.state.numPlayers}/${app.state.gameSeats})`;
        break;
    }

    return (
      <div className='container'>
        <audio id='beep' src='/media/beep.wav'/>
        <div className='game'>
          <div className='menu-bar'>
            <button onClick={() => this.setState({openModal: 'settings'})}>Settings</button>
            {app.didGameStart() && <button onClick={() => this.setState({openModal: 'players'})}>Players</button>}
          </div>
          <div className='game-controls'>
            <StartPanel/>
            {!app.didGameStart() && <PlayersPanel/>}
            {app.isGameFinished() && <DeckSettings/>}
          </div>
          {app.didGameStart() && <Canvas />}
        </div>
        {app.state.chat && <Chat/>}
        {this.state.openModal !== 'closed' && (
          <Modal
            headerText={modalHeader}
            show
            onClose={() => this.setState({openModal: 'closed'})}
            onConfirm={() => this.setState({openModal: 'closed'})}
          >
            {modalChild}
          </Modal>
        )}
      </div>
    );
  }
}
