import React from "react";

import { app } from "../router";
import { toTitleCase } from "../utils";


export const SetChoices = () => {
  let groups = [];
  for (let setType in app.state.availableSets) {
    const allSets = app.state.availableSets[setType];
    let options: React.ReactNode[] = [];
    allSets.forEach(({ code, name }) => {
      options.push(
        <option value={code} key={code}>{name}</option>
      );
    });
    groups.push(
      <optgroup label={toTitleCase(setType, "_")} key={setType}>{options}</optgroup>
    );
  }
  return (groups);
}
