import React, {Component} from 'react';

import { app } from '../router';
import {STRINGS} from '../config';

import Header from './Header';
import { JoinPanel } from './JoinPanel';
import { NewsPanel } from './NewsPanel';
import { CreatePanel } from './CreatePanel';
import FileUpload from './FileUpload';
import { Version } from './Version';

interface LobbyProps {}

export default class Lobby extends Component {

  constructor(props: LobbyProps) {
    super(props);
    app.register(this);
  }
  render() {
    document.title = STRINGS.BRANDING.SITE_TITLE;
    const { roomInfo, serverVersion, mtgJsonVersion, boosterRulesVersion } = app.state;

    return (
      <div className='container'>
        <div className='lobby'>
          <div className='lobby-header-container'>
            <Header/>
            <CreatePanel/>
          </div>
          <JoinPanel roomInfo={roomInfo}/>
          <FileUpload />
          <NewsPanel motd={STRINGS.PAGE_SECTIONS.MOTD}/>
          {STRINGS.BRANDING.PAYPAL}
          {STRINGS.PAGE_SECTIONS.FOOTER}
          <Version version={serverVersion} MTGJSONVersion={mtgJsonVersion} boosterRulesVersion={boosterRulesVersion}/>
        </div>
      </div>
    );
  }
}
