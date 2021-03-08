import React from "react";
import PropTypes from "prop-types";

import { app } from "../router";
import { SetChoices } from "./SetChoices";

interface SetProps {
  index: number;
  selectedSet: string;
  type: "setsDraft" | "setsSealed" | "setsDecadentDraft";
}

export const Set = ({ index, selectedSet, type }: SetProps) => {
  const onSetChange = (e: React.ChangeEvent<any>) => {
    const chosenSet = e.currentTarget.value;
    let sets = app.state[type];
    sets[index] = chosenSet;
    app.save(type, app.state[type]);
  };
  return (
    <div>
      {/* TODO pull down set icons */}
      <select value={selectedSet} onChange={onSetChange} key={index}>
        <SetChoices />
      </select>
    </div>
  );
};
