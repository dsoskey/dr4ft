import React, {Component} from "react";
import PropTypes from "prop-types";

import {getCardSrc, getFallbackSrc} from "../../cardimage";

import { app } from "../../router";
import "./CardBase.scss"
import { Card } from "common/src/types/card";
import { Zone } from "../../zones";

interface CardBaseProps {
  zoneName: Zone;
  card: Card;
  children?: React.ReactNode;
}
interface CardBaseState {
  mouseEntered: boolean;
  isFlipped: boolean;
  url: string;
}
export class CardBase extends Component<CardBaseProps, CardBaseState> {
  constructor (props: CardBaseProps) {
    super(props);

    this.state = {
      mouseEntered: false,
      isFlipped: false,
      url: getCardSrc(this.props.card),
    };

    if (this.props.card.isDoubleFaced) {
      this.onMouseEnter = this.onMouseEnter.bind(this);
      this.onMouseLeave = this.onMouseLeave.bind(this);
    }
  }

  onMouseEnter () {
    this.setState({
      mouseEntered: true,
      isFlipped: this.props.card.layout === "flip",
      url: getCardSrc({
        ...this.props.card,
        isBack: this.props.card.flippedIsBack,
        number: this.props.card.flippedNumber,
      })
    });
  }

  onMouseLeave () {
    this.setState({
      mouseEntered: false,
      isFlipped: false,
      url: getCardSrc(this.props.card),
    });
  }

  render () {
    const { card } = this.props;
    // at the moment for Text view, you can't see both sides of a card on hover
    // as the same card is passed into CardBaseText regardless mouseEntered

    if (!this.props.card.isDoubleFaced) return (
      <div className={`CardBase ${card.foil ? "-foil " : ""}`}>
        <CardBaseText {...card}/>
        {
          app.state.cardSize !== "text" &&
            <CardBaseImage mouseEntered={this.state.mouseEntered} imgUrl={this.state.url} card={card} />
        }

        {this.props.children}
      </div>
    )

    return (
      <div 
        className={`CardBase ${card.foil ? "-foil " : ""} ${this.state.isFlipped ? "-flipped " : ""}`}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
      >
        <CardBaseText {...card} />
        {
          app.state.cardSize !== "text" &&
            <CardBaseImage mouseEntered={this.state.mouseEntered} imgUrl={this.state.url} card={card} />
        }
        {this.props.children}
      </div>
    );
  }
}

interface CardBaseImageProps {
  mouseEntered: boolean;
  imgUrl: string;
  card: Card
}
const CardBaseImage = ({ mouseEntered, card }: CardBaseImageProps) => (
  <div className="CardBaseImage">
    <img
      title={card.name}
      onError={() => getFallbackSrc(card)}
      src={
        !mouseEntered
          ? getCardSrc(card)
          : getCardSrc({ ...card, number: card.flippedNumber, isBack: card.flippedIsBack })
      }
    />
  </div>
);

interface CardBaseTextProps {
  card: Card
}
const CardBaseText = ({ name, manaCost, type = "", rarity = "", power = "", toughness = "", text = "", loyalty= "" }:Card) => (
  <div className="CardBaseText" >
    <div className="header">
      <div className="name">{name}</div>
      <div className="cost">{manaCost}</div>
    </div>

    <div className="sub-header">
      <div className="type">{type}</div>
      <div className="rarity">{rarity}</div>
    </div>

    <div className="body">
      {
        text &&
          <div className="text">{text}</div>
      }
    </div>

    <div className="footer">
      {
        power && toughness &&
          <div className="power-toughness">{power}/{toughness}</div>
      }
      {
        loyalty &&
          <div className="loyalty">{loyalty}</div>
      }
    </div>
  </div>
);
