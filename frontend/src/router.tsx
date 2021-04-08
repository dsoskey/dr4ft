/* eslint-disable */
import React, { Suspense } from "react";
import { render } from "react-dom";
import { App } from "./app";
import { events } from './events';

const Lobby = React.lazy(() => import("./lobby/Lobby"));
const Game = React.lazy(() => import("./game/Game"));
export let app: App;

export default function router(_App: App) {
  app = _App;
  Object.entries(events).forEach(([eventName, event]) => app.on(eventName, event));
  console.log('routing!');
  route();
  window.addEventListener("hashchange", route);
}

const Loading = () => <div style={{ padding: 30 }}>Loading...</div>;

function route() {
  let path = location.hash.slice(1);
  let [route, id] = path.split("/");
  let component;

  switch(route) {
  case "g":
    app.state.gameId = id;
    app.initGameState(id);
    app.state.players = [];
    app.send("join", id);
    app.once("gameInfos", app.updateGameInfos);
    component = (
      <Suspense fallback={<Loading/>}>
        <Game id={ id } />
      </Suspense>
    );
    break;
  case "":
    component = (
      <Suspense fallback={<Loading/>}>
        <Lobby />
      </Suspense>
    );
    break;
  default:
    return app.error(`not found: ${path}`);
  }

  render(component, document.getElementById("root"));
}
