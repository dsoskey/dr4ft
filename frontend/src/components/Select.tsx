import React, { ChangeEventHandler } from "react";
import PropTypes from "prop-types";

import { app } from "../router";
import { AppState } from "../app";

interface SelectProps extends React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement> {
  link?: keyof AppState;
  opts: any[];
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  value?: string | number;
}

export const Select = (props: SelectProps) => {
  const {
    link,
    opts,
    value,
    onChange,
    ...rest
  } = props;

  let realVal = value; 
  let realChange = onChange;
  if (link) {
    realVal = app.state[link];
    realChange = (e: any) => app.save(link, e.currentTarget.value);
  }

  return (
    <select
      onChange={realChange}
      value={realVal}
      {...rest}
    >
      {opts.map((opt, index) =>
        <option value={opt} key={index}>{opt}</option>
      )}
    </select>
  );
}
