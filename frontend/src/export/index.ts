import { cockatrice } from "./cockatrice";
import { mtgo } from "./mtgo";
import { mtga } from "./mtga";
import { text } from "./text";
import { Deck } from "common/src/types/deck";
import { ExportFormat, ExportStrategy } from "common/src/types/export";

const toJSON = (filename: string, deck: Deck) => JSON.stringify(deck, null, 2);
const json: ExportStrategy = {
  name: "JSON",
  download: toJSON,
  downloadExtension: ".json",
  copy: toJSON
};

export const exportDeck: { [key in ExportFormat]: ExportStrategy } = {
  cockatrice,
  mtga,
  mtgo,
  text,
  json
};
