import React, {Fragment} from "react";

import { RadioOptions } from "../components/RadioOptions";
import { toTitleCase } from "../utils";
import { app } from "../router";

const gameDescriptions = {
  regular: "Conventional 15 card booster packs",
  cube: "A user curated draft set",
  chaos: "Randomized booster packs",
  decadent: "Packs are discarded after first pick"
};

export const GameTypes = () => {
  const gameOptions = {
    draft: ["regular", "cube", "chaos", "decadent"],
    sealed: ["regular", "cube", "chaos"]
  };

  return (
    <div>
      <span className='connected-container'>
        <RadioOptions
          name="subtype"
          description="Game subtype"
          appProperty="gamesubtype"
          options={
            gameOptions[app.state.gametype].map(type => {
              return {
                label: toTitleCase(type),
                value: type,
                // @ts-ignore
                tooltip: gameDescriptions[type]
              };
            })
          }
        />
      </span>
    </div>
  );
};
