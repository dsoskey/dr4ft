import React from "react";
import PropTypes from "prop-types";

import { app } from "../router";
import {getZoneDisplayName, Zone } from "../zones";
import {COLORS_TO_LANDS_NAME} from "../gamestate";
import { exportDeck } from "../export";

import "./DeckSettings.scss";
import { ColorSign } from "common/src/types/card";

export const DeckSettings = () => {
  if (app.didGameStart() || app.isGameFinished()) {
    return (
      <div className='DeckSettings'>
        {/* <LandsPanel /> */}
        <ExportDeckPanel />

        {
          app.isGameFinished() && /draft/.test(app.state.gametype)
            ? <DraftLogPanel />
            : null
        }
      </div>
    )
  }
  return null
};

const LandsPanel = () => (
  <fieldset className='LandsPanel fieldset'>
    <legend className='legend game-legend'>Lands</legend>
    <table>
      <thead>
        <ManaSymbols />
      </thead>
      <tbody>
        <LandsRow zoneName={Zone.main}/>
        <LandsRow zoneName={Zone.side}/>
      </tbody>
      <tfoot>
        <SuggestLands />
      </tfoot>
    </table>
  </fieldset>
);

const ManaSymbols = () => {
  const manaSymbols: ColorSign[] = ["W", "U", "B", "R", "G"];
  const path = (color: ColorSign) => `../../media/${color}.svg`;

  return (
    <tr>
      <td />
      {manaSymbols.map((color, index) =>
        <td key={index}>
          <img src={path(color)} alt={color}/>
        </td>)
      }
    </tr>
  );
};

interface LandsRowProps {
  zoneName: Zone
}
const LandsRow = ({zoneName}: LandsRowProps) => (
  <tr>
    <td>{getZoneDisplayName(zoneName)}</td>
    {Object.keys(COLORS_TO_LANDS_NAME).map((color, index) =>
      <td key={index}>
        <input
          className='number'
          min={0}
          onChange={app._emit("land", zoneName, color)}
          type='number'
          value={app.state.gameState.getLandDistribution(zoneName, color) || 0}/>
      </td>)}
  </tr>
);

const SuggestLands = () => (
  <tr>
    <td>Deck size</td>
    <td>
      <input
        className='number'
        min={0}
        onChange={app._emit("deckSize")}
        type='number'
        value={app.state.deckSize}/>
    </td>
    <td colSpan={2}>
      <button className='land-suggest-button' onClick={app._emit("resetLands")}>
        Reset lands
      </button>
    </td>
    <td colSpan={2}>
      <button className='land-suggest-button' onClick={app._emit("suggestLands")}>
        Suggest lands
      </button>
    </td>
  </tr>
);

const ExportDeckPanel = () => {
  const activeFormatKey = app.state.exportDeckFormat
  const activeFormat = exportDeck[activeFormatKey]

  return (
    <fieldset className='ExportDeckPanel fieldset'>
      <legend className='legend game-legend'>Deck Export</legend>

      <div className="formats">
        {
          Object.entries(exportDeck).map(([formatKey, format]) => {
            if (!format) return null
            return (
              <div
                className={`format ${formatKey} ${formatKey === activeFormatKey ? "-active" : ""}`}
                onClick={() => app.save("exportDeckFormat", formatKey)}
                key={formatKey}
              >
                {format.name}
              </div>
            )
          })
        }
      </div>

      <div className='exports'>

        { /* Download */ }
        {
          activeFormat && activeFormat.download
            ? (
              <div className='download'>
                {/* <span>Download</span> */}
                <input
                  type='text'
                  className=''
                  placeholder='filename'
                  value={app.state.exportDeckFilename}
                  onChange={e => app.save("exportDeckFilename", e.currentTarget.value) }
                />
                
                <div className="extension">
                  {activeFormat.downloadExtension}
                </div>

                <button onClick={app._emit("download")}>
                  <i className="icon ion-android-download" /> Download
                </button>
              </div>
            )
            : null
        }

        { /* Copy */ }
        {
          activeFormat && activeFormat.copy
            ? (
              <div className='copy'>
                <span>Copy to clipboard</span>
                <button onClick={app._emit("copy")}>
                  <i className="icon ion-android-clipboard" /> Copy
                </button>
              </div>
            )
            : null
        }

      </div>
    </fieldset>
  )
};

const DraftLogPanel = () => (
  <fieldset className='DraftLogPanel fieldset'>
    <legend className='legend game-legend'>Draft Log</legend>

    <div className="draft-log">
      <div className='filename'>
        {app.state.exportDeckFilename + '-draftlog.txt' }
      </div>

      <button onClick={app._emit("getLog")}>
        <i className="icon ion-android-download" /> Download
      </button>
    </div>
  </fieldset>
);
