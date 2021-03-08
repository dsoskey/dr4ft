import { Card } from "common/src/types/card";
import { Deck, DeckRow } from "common/src/types/deck";
import { ExportStrategy } from "common/src/types/export";

function generateText (name: string, deck: Deck) {
  return [
    "Deck",
    ...deck.main.map(renderCopyCard),
    "",
    "Sideboard",
    ...deck.side.map(renderCopyCard),
  ].join("\n");
}

function renderCopyCard ({ count, card }: DeckRow) {
  return `${count} ${correctName(card)}`;
}

function correctName (card: Card) {
  return card.name;
}

export const text: ExportStrategy = {
  name: "Text",
  download: generateText,
  downloadExtension: ".txt",
  copy: generateText
}