/* eslint-disable */
import { Card } from 'common/src/types/card';
import React, { Suspense } from 'react';
import { render } from 'react-dom';
import { App } from './app';
import { events } from './events';
import { Canvas } from './game/v5/Canvas';
import { SAMPLE_PACK } from './samplePack';

const Lobby = React.lazy(() => import('./lobby/Lobby'));
const Game = React.lazy(() => import('./game/Game'));
export let app: App;

export default function router(_App: App) {
  app = _App;
  Object.entries(events).forEach(([eventName, event]) => app.on(eventName, event));
  console.log('routing!');
  route();
  window.addEventListener('hashchange', route);
}

const Loading = () => <div style={{ padding: 30 }}>Loading...</div>;

function route() {
  let path = location.hash.slice(1);
  let [route, id] = path.split('/');
  let component;

  switch(route) {
  case 'g':
    app.state.gameId = id;
    app.initGameState(id);
    app.state.players = [];
    app.send('join', id);
    app.once('gameInfos', app.updateGameInfos);
    component = <Game id={ id } />;
    break;
  case 'x':
   
    app.state.gameState.pack(SAMPLE_PACK);
    component = <Canvas />;
    break
  case '':
    component = <Lobby />;
    break;
  default:
    return app.error(`not found: ${path}`);
  }

  render(
    <Suspense fallback={<Loading />}>
      {component}
    </Suspense>
    , document.getElementById('root'));
}
