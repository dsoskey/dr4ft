import React, {Component} from "react";

import { app } from '../../router';
import { Zone } from "../../zones";
import { CardBase } from "./CardBase";
import { SelectionState } from "./SelectionState"
import "./CardDefault.scss";
import { Card } from "common/src/types/card";
import { DraftState } from "common/src/types/game";

interface CardDefaultProps {
  card: Card;
  zoneName: keyof DraftState;
  column: string;
}
export const CardDefault = ({ card, zoneName, column }: CardDefaultProps) =>  {
  const isPick = zoneName === Zone.pack && app.state.gameState.isPick(card.cardId);

  return (
    <div
      className="CardDefault"
      title={isPick ? "This card will be automatically picked if your time expires." : ""}
      onClick={(e) => app.emit("clickButForDraftState", zoneName, column, card)}
    >
      <CardBase card={card}>
        <SelectionState isPick={isPick} />
      </CardBase>
    </div>
  );
};
