import { Card } from "common/src/types/card";
import { Deck, DeckRow } from "common/src/types/deck";
import { ExportStrategy } from "common/src/types/export";
import { Zone } from "../zones";

function correctName (card: Card) {
  switch (card.layout) {
  case "split":
  case "aftermath":
  case "adventure":
    return card.name;

  case "flip":
  case "transform":
  case "meld":
  case "modal_dfc":
    return card.name.replace(/\s\/\/.*$/, "");

  default:
    return card.name;
  }
}

function renderDownloadCard ({ count, card }: DeckRow): string {
  return `    <card number="${count}" name="${correctName(card)}"/>`;
}

function renderCopyCard ({ count, card }: DeckRow): string {
  return `${count} ${correctName(card)}`;
}

export const cockatrice: ExportStrategy = {
  name: "Cockatrice",
  download: (name: string, deck: Deck) => {
    return `\
<?xml version="1.0" encoding="UTF-8"?>
<cockatrice_deck version="1">
  <deckname>${name}</deckname>
  <zone name="main">
${
  deck.main
    .map(renderDownloadCard)
    .join("\n")
}
  </zone>
  <zone name="side">
${
  deck.side
    .map(renderDownloadCard)
    .join("\n")
}
  </zone>
</cockatrice_deck>`;
  },
  downloadExtension: ".cod",
  copy: (name: string, deck: Deck): string => [
      ...deck[Zone.main].map(renderCopyCard),
      "",
      "Sideboard",
      ...deck[Zone.side].map(renderCopyCard),
    ].join("\n"),
};