import React, { ChangeEventHandler } from "react";

import { app } from "../router";
import { AppState } from "../app";

interface RadioOptionProps {
  label: string;
  name: string;
  value: string | number; // TODO: handle boolean
  tooltip?: string;
  isChecked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
}
export const RadioOption = ({
  label,
  name,
  value,
  tooltip,
  onChange,
  isChecked
}: RadioOptionProps) => {
  const id = `radio-button-${name}-${value}`;

  return (
    <label htmlFor={id} className='radio-label connected-component' data-tip={tooltip || ""}>
      {label} <span className="vhidden">({tooltip})</span>
      <input
        id={id}
        className="radio-input connected-component"
        name={name}
        type='radio'
        value={value}
        onChange={onChange}
        checked={isChecked}/>
      <span className="radio-button-replacement"></span>
    </label>
  );
};

interface Option {
  label: string;
  value: string | number | boolean;
  tooltip?: string;
}

interface RadioOptionsProps {
  name: string;
  description: string;
  appProperty: keyof AppState;
  options: Option[];
  onChange?: () => void;
}
export const RadioOptions = ({name, description, appProperty, options, onChange}: RadioOptionsProps) => {
  return (
    <fieldset>
      <legend className="vhidden">{description}</legend>
      {options.map((option, key) =>
        <RadioOption
          name={name}
          key={key}
          label={option.label}
          value={option.value as string}
          tooltip={option.tooltip}
          isChecked={app.state[appProperty] === option.value}
          onChange={() => {
            app.save(appProperty, option.value);

            if (onChange) {
              onChange();
            }
          }}
        ></RadioOption>
      )}
    </fieldset>
  );
};
