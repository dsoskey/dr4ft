import React from "react";

import { AppState } from "../app";
import { app } from '../router';

interface TextAreaProps extends React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement> {
  link: keyof AppState;
}
export const TextArea = ({link, ...rest}: TextAreaProps) => (
  <textarea
    onChange={(e) => { app.save(link, e.currentTarget.value); }}
    value={app.state[link]}
    {...rest}
  />
);
