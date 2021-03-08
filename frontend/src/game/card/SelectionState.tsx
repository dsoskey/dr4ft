import React from "react";
import "./SelectionState.scss";

interface SelectionStateProps {
  isPick?: boolean;
  isBurn?: boolean;
}
export const SelectionState = ({ isPick, isBurn }: SelectionStateProps) => {
  if (isPick && isBurn) throw new Error("Cannot pick and burn same card")

  if (isPick) {
    return (
      <div className="SelectionState -pick">
        <i className="action icon ion-android-checkbox" />
      </div>
    )
  }

  if (isBurn) {
    return (
      <div className="SelectionState -burn">
        <i className="action icon ion-flame" />
      </div>
    )
  }

  return null;
}
