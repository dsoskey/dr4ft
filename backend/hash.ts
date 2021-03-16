import { Deck, DeckRow } from "../common/src/types/deck";
import crypto from "crypto";
import { Dictionary } from "lodash";

type Digest = string;
interface HashOptions {
  algo: string;
  separator: string;
  prefix: string,
  name: (v: string) => string;
  digest: (d: Digest) => string;
}
const opts: { [optName: string]: HashOptions } = {
  cock: {
    algo: "sha1",
    separator: ";",
    prefix: "SB:",
    name(name: string) {
      return name.toLowerCase();
    },
    digest(digest: Digest) {
      // 10 digits of base 16 -> 8 digits of base 32
      return parseInt(digest.slice(0, 10), 16).toString(32);
    }
  },
};

const extractZoneJawns = (zone: Dictionary<number>, opts: HashOptions, prefix: string = ''): string[] => {
  const items: string[] = [];
  for (let cardName in zone) {
    let count = zone[cardName];
    const item = prefix + opts.name(cardName);
    while (count--)
      items.push(item);
  }
  return items;
}
function hash(deck: Deck<Dictionary<number>>, opts: HashOptions) {
  const items = [
    ...extractZoneJawns(deck.main, opts),
    ...extractZoneJawns(deck.side, opts, opts.prefix),
  ];
  const data = items.sort().join(opts.separator);
  const digest = crypto
    .createHash(opts.algo)
    .update(data)
    .digest("hex");
  return opts.digest(digest);
}

export default function (deck: Deck<Dictionary<number>>) {
  return {
    cock: hash(deck, opts.cock),
  };
};
