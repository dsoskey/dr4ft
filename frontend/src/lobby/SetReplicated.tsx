import React from "react";
import PropTypes from "prop-types";

import { app } from "../router";
import { SetChoices } from "./SetChoices";
import { SetType } from "../app";

interface SetReplicatedProps {
  selectedSet: string;
  type: SetType;
}
export const SetReplicated = ({ selectedSet, type }: SetReplicatedProps) => {
  // A single dropdown which is used to fill an entire array
  // of sets with the same selection.
  const onSetChange = (e: React.ChangeEvent<any>) => {
    const chosenSet = e.currentTarget.value;
    let sets = app.state[type];
    for (let i = 0; i < sets.length; i++) {
      sets[i] = chosenSet;
    }
    app.save(type, app.state[type]);
  };
  return (
    <select value={selectedSet} onChange={onSetChange} key={0}>
      {SetChoices()}
    </select>
  );
};
