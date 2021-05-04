import React, {Component} from "react";
import PropTypes from "prop-types";

import { app } from "../router";
import {getZoneDisplayName, Zone} from "../zones";
import { Spaced } from "../components/Spaced";
import {getCardSrc, getFallbackSrc} from "../cardimage";
import { CardBase } from "./card/CardBase"
import "./Cols.scss"
import { Card } from "common/src/types/card";

interface ColsProps {
  zones: Zone[];
}
interface ColsState {
  className: string;
  card?: Card;
}
export class Cols extends Component<ColsProps, ColsState> {
  constructor(props: ColsProps) {
    super(props);
    this.state={
      className: "right",
      card: undefined
    };
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
  }

  onMouseEnter(card: Card, e: any) {
    let {offsetLeft} = e.target;
    let {clientWidth} = document.documentElement;

    let imgWidth = 240;
    let colWidth = 180;

    let className = offsetLeft + colWidth > clientWidth - imgWidth
      ? "left"
      : "right";

    if ("split" === card.layout) {
      className += " split-card";
    }

    if (card.foil) {
      className += " foil-card "; 
      // mixmix - I broke this by absorbing .foil-card into .CardBase.-foil (see CardBase.scss)
      // personally I don't care about whether pickedc cards in the col view display their foiliness
    }

    this.setState({ card, className });
  }
  onMouseLeave() {
    this.setState({
      card: undefined
    });
  }

  render() {
    return (
      <div className="Cols">
        <Zones onMouseOver={this.onMouseEnter} zoneNames={this.props.zones} onMouseLeave={this.onMouseLeave} />
        <ImageHelper onMouseEnter={this.onMouseEnter} {...this.state} />
      </div>
    );
  }
}

interface ZonesProps { 
  onMouseOver: (card: Card, e: any) => void;
  onMouseLeave: () => void;
  zoneNames: Zone[];
}
const Zones = ({onMouseOver, zoneNames, onMouseLeave}: ZonesProps) => {
  const renderZone = (zoneName: Zone) => {
    const zone = app.getSortedZone(zoneName);
    let sum = 0;
    let cols = [];

    for (let key in zone) {
      let items = zone[key].map((card, index) =>
        <div 
          className="card-container"
          key={index}
          onClick={(e) => {}}
          onMouseOver={e => onMouseOver(card, e)}
          onMouseLeave={onMouseLeave} >

          <CardBase card={card} zoneName='main' />
        </div>
      );

      sum += items.length;
      cols.push(
        <div key={key} className='col'>
          <div>
            <strong>{`${key} (${items.length})`}</strong>
          </div>
          {items}
        </div>
      );
    }

    return (
      <div key={zoneName} className='zone'>
        <h1>
          <Spaced elements={[getZoneDisplayName(zoneName), sum]}/>
        </h1>
        {cols}
      </div>
    );
  };

  return <>{zoneNames.map(renderZone)}</>;
};

interface ImageHelperProps {
  onMouseEnter: (card: Card, e: any) => void;
  className?: string;
  card?: Card;
}
export const ImageHelper = ({onMouseEnter, className, card}: ImageHelperProps) => {
  // This is the on-hover enlarged helper you see in the bottom left when hovering over a card in column view
  if (!card) return <div />

  // TODO - consider text case
  return (
    card.isDoubleFaced
      ? <div className={className} id="doubleimg">
        <img
          className="card"
          src={getCardSrc(card)} 
          onError={getFallbackSrc(card)} 
          onMouseEnter={(e: any) => onMouseEnter(card, e)}
        />
        <img className={`card ${card.layout === "flip" ? "flipped" : ""}`}
          src={getCardSrc({ ...card, isBack: card.flippedIsBack, number: card.flippedNumber, })}
          onError={(e: any) => e.target.src = card.flippedCardURL}
          onMouseEnter={(e: any) => onMouseEnter(card, e)} />
      </div>

      : <div id='img' className = {className}>
        <img
          className = "image-inner"
          onMouseEnter = {e => onMouseEnter(card, e)}
          onError={getFallbackSrc(card)}
          src = {getCardSrc(card)} />
      </div>
  )
};

ImageHelper.propTypes = {
  onMouseEnter: PropTypes.func.isRequired,
  className: PropTypes.string.isRequired,
  card: PropTypes.object
};
