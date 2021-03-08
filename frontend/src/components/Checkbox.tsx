import React from "react";
import PropTypes from "prop-types";

import { app } from "../router";
import { AppState } from '../app';

interface CheckboxProps extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  link: keyof AppState;
  text: string;
  side: string;
  onChange?: (event: any) => void;
}
export const Checkbox = ({link, text, side, onChange, ...rest}: CheckboxProps) => (
  <div>
    {side === "right" ? text : ""}
    <input
      {...rest}
      type="checkbox"
      onChange={onChange ?? function (e) {
        app.save(link, e.currentTarget.checked);
      }}
      checked={app.state[link]}/>
    {side === "left" ? text : ""}
  </div>
);
