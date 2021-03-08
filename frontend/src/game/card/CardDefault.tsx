import React, {Component} from "react";

import { app } from '../../router';
import { Zone } from "../../zones";
import { CardBase } from "./CardBase";
import { SelectionState } from "./SelectionState"
import "./CardDefault.scss";
import { Card } from "common/src/types/card";


interface CardDefaultProps {
  card: Card;
  zoneName: Zone;
}
export const CardDefault = ({ card, zoneName }: CardDefaultProps) =>  {
  const isPick = zoneName === Zone.pack && app.state.gameState.isPick(card.cardId);

  return (
    <div
      className="CardDefault"
      title={isPick ? "This card will be automatically picked if your time expires." : ""}
      onClick={(e) => app.emit("click", zoneName, card, e)}
    >
      <CardBase card={card} zoneName={zoneName}>
        <SelectionState isPick={isPick} />
      </CardBase>
    </div>
  );
};
