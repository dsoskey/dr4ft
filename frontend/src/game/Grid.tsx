import React from "react";

import _ from "../utils";
import { app } from "../router";
import { App } from '../app';
import { Spaced } from "../components/Spaced";
import { Card } from 'common/src/types/card';
import { Zone } from "../zones";
import { CardDefault } from "./card/CardDefault";
import { CardGlimpse } from "./card/CardGlimpse";
import "./Grid.scss"
import { DraftState } from "./v5/Canvas";

interface GridProps {
  zones: Array<keyof DraftState>;
}
export const Grid = ({zones}: GridProps) => (
  <div>
    {zones.map(zone)}
  </div>
);

const getZoneDetails = (bpp: App, zoneName: keyof DraftState, cards: Card[]) => {
  if (!app.didGameStart()) {
    return 0;
  }

  if (zoneName === 'pack') {
    if (app.isDecadentDraft()) {
      // Only 1 pick in decadent draft.
      return `Pick 1 / 1`;
    } else {
      let turns = Math.ceil(app.state.packSize / app.state.picksPerPack  );
      return `Pick ${app.state.pickNumber} / ${turns}`
    }
  } else {
    return cards.length;
  }
}

const zone = (zoneName: keyof DraftState, index: number) => {
  const zone = app.getSortedZone(zoneName);
  const zoneDisplayName = zoneName;
  const cards = Object.values(zone).flat();
  const isPackZone = zoneName === Zone.pack;

  const zoneTitle = `${zoneDisplayName}${(isPackZone ? ` ${app.state.round}` : "")}`;
  const zoneDetails = getZoneDetails(app, zoneName, cards);

  const remainingCardsToSelect = Math.min(app.state.picksPerPack, cards.length);
  const remainingCardsToBurn = Math.min(app.state.burnsPerPack, cards.length);
  const canConfirm = app.state.gameState.isSelectionReady(remainingCardsToSelect, remainingCardsToBurn)

  return (
    <div className='Grid zone' key={index}>
      <div className='header'>
        <h1>
          <Spaced elements={[zoneTitle, zoneDetails]} />
        </h1>

        <div className='pick-burn-detail'>
          {
            (
              app.state.picksPerPack > 1 ||
              app.state.burnsPerPack > 0
            ) &&
              <span className="picks">{`Pick ${remainingCardsToSelect}`}</span>
          }
          {
            app.state.burnsPerPack > 0 &&
              <span className="burns">{`Burn ${remainingCardsToBurn}`}</span>
          }
        </div>

        {
          cards.length > 0 && isPackZone &&
            <button
              className="confirm-btn"
              disabled={!canConfirm}
              onClick={() => app.emit("confirmSelection")}
            >
              Confirm
            </button>
        }
      </div>

      <div className="cards">
        {cards.map((card, i) =>
          isPackZone && app.state.burnsPerPack > 0
            ? <CardGlimpse key={i+zoneName+card.name+card.foil} card={card} zoneName='pack' column='' />
            : <CardDefault key={i+zoneName+card.name+card.foil} card={card} zoneName='pack' column='' />
        )}

      </div>

      {cards.length === 0 && isPackZone &&
        <h2 className='waiting'>Waiting for the next pack...</h2>
      }
    </div>
  );
};
