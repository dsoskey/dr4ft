import React, {Component} from "react";

import { app } from "../../router";
import { Zone } from "../../zones";
import { CardBase } from "./CardBase"
import { CardDefault } from "./CardDefault"
import { SelectionState } from "./SelectionState"
import "./CardGlimpse.scss"
import { Card } from "common/src/types/card";

interface CardGlimpsProps {
  card: Card;
  zoneName: Zone;
  
}
export class CardGlimpse extends Component<CardGlimpsProps> {
  constructor (props: CardGlimpsProps) {
    super(props);

    this.onClickPickCard = this.onClickPickCard.bind(this);
    this.onClickBurnCard = this.onClickBurnCard.bind(this);
  }

  onClickPickCard (e: any) {
    e.stopPropagation();
    app.emit("click", this.props.zoneName, this.props.card);
  }

  onClickBurnCard (e: any) {
    e.stopPropagation();
    app.emit("burn", this.props.card);
  }

  render () {
    const {zoneName, card} = this.props;

    const CardComponent = zoneName === Zone.pack ? CardBase : CardDefault
    const isPick = zoneName === Zone.pack && app.state.gameState.isPick(card.cardId);
    const isBurn = zoneName === Zone.pack && app.state.gameState.isBurn(card.cardId);

    return (
      <div className='CardGlimpse' onClickCapture={() => {}}>
        <CardComponent card={card} zoneName={zoneName}>
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
