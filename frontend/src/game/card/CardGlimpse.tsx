import React, {Component} from "react";

import { app } from "../../router";
import { Zone } from "../../zones";
import { CardBase } from "./CardBase"
import { CardDefault } from "./CardDefault"
import { SelectionState } from "./SelectionState"
import "./CardGlimpse.scss"
import { Card } from "common/src/types/card";
import { DraftState } from "../v5/Canvas";

interface CardGlimpsProps {
  card: Card;
  zoneName: keyof DraftState;
  column: string;
}
export class CardGlimpse extends Component<CardGlimpsProps> {
  constructor (props: CardGlimpsProps) {
    super(props);

    this.onClickPickCard = this.onClickPickCard.bind(this);
    this.onClickBurnCard = this.onClickBurnCard.bind(this);
  }

  onClickPickCard (e: any) {
    const { zoneName, column, card } = this.props;
    e.stopPropagation();
    app.emit("clickButForDraftState", zoneName, column, card);
  }

  onClickBurnCard (e: any) {
    e.stopPropagation();
    app.emit("burn", this.props.card);
  }

  render () {
    const {zoneName, card, column} = this.props;

    const CardComponent = zoneName === Zone.pack ? CardBase : CardDefault
    const isPick = zoneName === Zone.pack && app.state.gameState.isPick(card.cardId);
    const isBurn = zoneName === Zone.pack && app.state.gameState.isBurn(card.cardId);

    return (
      <div className='CardGlimpse' onClickCapture={() => {}}>
        <CardComponent card={card} zoneName={zoneName} column={column}>
          <SelectionState isPick={isPick} isBurn={isBurn} />
        </CardComponent>

        <div className="glimpse-options">
          <div className="pick" onClick={this.onClickPickCard} >
            <i className="icon ion-android-checkbox" />
          </div>

          <div className="burn" onClick={this.onClickBurnCard} >
            <i className="icon ion-flame" />
          </div>
        </div>
      </div>
    );
  }
}
