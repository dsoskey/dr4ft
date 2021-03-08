
import { Card } from "common/src/types/card";
import { Deck, DeckRow } from "common/src/types/deck";
import { ExportStrategy } from "common/src/types/export";
import { Zone } from "../zones";

function correctName (card: Card) {
  switch (card.layout) {
  case "split":
  case "aftermath":
    return card.name.replace(/\s\/\/\s/g, " /// ");

  case "flip":
  case "transform":
  case "meld":
  case "adventure":
  case "modal_dfc":
    return card.name.replace(/\s\/\/.*$/, "");

  default:
    return card.name;
  }
}

function renderCopyCard ({ card, count }: DeckRow) {
  return `${count} ${correctName(card)} (${card.setCode}) ${card.number}`;
}

export const mtga: ExportStrategy = {
  name: "MTG Arena",
  downloadExtension: '.idk',
  download: (_fileName: string, _deck: Deck) => 'not supported',
  copy: (name: string, deck: Deck): string => [
    "Deck",
    ...deck[Zone.main].map(renderCopyCard),
    "",
    "Sideboard",
    ...deck[Zone.side].map(renderCopyCard)
  ].join("\n"),
}