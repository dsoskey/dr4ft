import React from "react";

import { app } from "../router";
import { Checkbox } from "../components/Checkbox";
import "./GameSettings.scss";

export const GameSettings = () => (
  <div className='GameSettings'>
    <fieldset className='fieldset'>
      <legend className='legend game-legend'>Settings</legend>
      <span>
        <Checkbox side="left" text="Show chat" link="chat" />
        {!app.isSealed() &&
          <Checkbox side="left" text="Enable notifications on new packs" link="beep" />
        }
        {!app.isSealed() &&
          <div style={{paddingLeft: "10px"}} >
            <Checkbox side="left"
              text={app.notificationBlocked() ? "Web notifications blocked in browser" : "Use desktop notifications over beep"}
              link="notify"
              disabled={!app.state.beep || app.notificationBlocked()}
              onChange={app._emit("notification")} />
          </div>
        }
        {!app.isSealed() &&
          <Checkbox side="left" text="Add picks to sideboard" link="side" />}
        {!app.isSealed() &&
          <Checkbox side="left" text="Hide your picks" link="hidepicks" />
        }
        <Checkbox side="left" text="Use column view" link="cols" />
        <SortCards />
        <CardsImageQuality />
        {app.state.cardSize != "text" && <CardsImageLanguage />}
      </span>
    </fieldset>
  </div>
);

const SortCards = () => (
  <div className="sort-cards">
    Sort cards by:
    <div className='connected-container' >
      {["CMC", "Color", "Type", "Rarity"].map((sort, index) => {
        const isActive = sort.toLowerCase() === app.state.sort

        return (
          <label key={index} 
            className={isActive
              ? "active connected-component"
              : "connected-component"
            }
          >
            <input checked= {isActive}
              className='radio-input'
              name= 'sort-order'
              onChange= {e => app.save("sort", e.currentTarget.value)}
              type='radio'
              value={sort.toLowerCase()}
            />
            <div>{sort}</div>
          </label>
        )
      })}
    </div>
  </div>
);

type SizeJawn = 'text' | 'small' | 'normal' | 'large';
const sizeDisplay = {
  "text": "Text-Only",
  "small": "Low",
  "normal": "Medium",
  "large": "High",
};

const CardsImageQuality = () => (
  <div className="card-quality">
    Card image quality:
    <div className='connected-container'>
      {Object.keys(sizeDisplay).map((size, index) => {
        const isActive = size.toLowerCase() === app.state.cardSize

        return (
          <label key={index}
            className={isActive
              ? "active connected-component"
              : "connected-component"
            }
          >
            <input checked={isActive}
              className='radio-input'
              name='card-size'
              onChange={e => app.save("cardSize", e.currentTarget.value)}
              type='radio'
              value={size.toLowerCase()} />
            <div>{sizeDisplay[size as SizeJawn]}</div>
          </label>
        )
      })}
    </div>
  </div>
);

const imgLanguageDisplay = {
  "en": "English",
  "fr": "French (Français)",
  "es": "Spanish (Español)",
  "de": "German (Deutsch)",
  "it": "Italian (Italiano)",
  "pt": "Portuguese (Português)",
  "ja": "Japanese (日本語)",
  "ko": "Korean (한국어)",
  "ru": "Russian (Русский)",
  "zhs": "Simplified Chinese (简体中文)",
  "zht": "Traditional Chinese (繁體中文)"
};

const CardsImageLanguage = () => (
  <div className="cards-language">
    Card image language:
    <div className='connected-container'>
      <select
        value={app.state.cardLang}
        onChange={e => app.save("cardLang", e.currentTarget.value)}>
        {Object.entries(imgLanguageDisplay).map(([value, label]) =>
          <option key={value} value={value}>{label}</option>
        )}
      </select>
    </div>
  </div>
);
