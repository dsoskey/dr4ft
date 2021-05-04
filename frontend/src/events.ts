import _ from "./utils";
import _cloneDeep from 'lodash/cloneDeep';
// @ts-ignore
import {vanillaToast} from "vanilla-toast";
import DOMPurify from "dompurify";
import {range, times, constant} from "lodash";

import { app } from "./router";
import { Zone } from "./zones";
import { exportDeck } from "./export";
import { Card } from "common/src/types/card";
import { Deck, DeckRow } from "common/src/types/deck";
import { Message } from "common/src/types/message";
import { SetType } from "./app";
import { Cube } from "common/src/types/cube";
import { DraftState, GameOptions, GameType, withSort } from "common/src/types/game";

/**
 * @desc this is the list of all the events that can be triggered by the app
 * the rule is that the function name is the event to be triggered
 * e.g: add(card) is triggered by app.emit("add", card)
 */
export const events = {
  add(card: Card) {
    throw Error('Event(add) is deprecated');
    const zoneName = app.state.side ? Zone.side : Zone.main;
    app.state.gameState.add(zoneName, card);
    app.state.gameState.resetPack();
    app.update();
  },
  burn(card: Card) {
    if (!app.state.gameState.isBurn(card.cardId)) {
      app.state.gameState.updateCardBurn(card.cardId, app.state.burnsPerPack);
    } else if (app.state.gameState.isSelectionReady(app.state.picksPerPack, app.state.burnsPerPack)) {
      app.state.gameState.resetPack();
      app.update();
      app.send("confirmSelection");
    }
  },
  confirmSelection () {
    if (app.state.gameState.isSelectionReady(app.state.picksPerPack, app.state.burnsPerPack)) {
      app.send("confirmSelection");
    }
  },
  clickButForDraftState(zoneName: keyof DraftState, srcColumn: string, card: Card) {
    if (zoneName === 'pack') {
      clickPack(card);
    } else {
      const dest = zoneName === Zone.side ? Zone.main : Zone.side;

      app.moveCard(
        zoneName,
        Number.parseInt(srcColumn),
        dest,
        dest === 'side' ? 0 : Math.min(card.cmc, 6), // TODO: Add to zone's default column.
        card
      )
    }
  },
  copy() {
    const {exportDeckFormat: format, exportDeckFilename: filename} = app.state;
    const textField = document.createElement("textarea");
    textField.value = exportDeck[format].copy!(filename, collectDeck());

    document.body.appendChild(textField);
    textField.select();
    document.execCommand("copy");
    textField.remove();

    hash();
  },
  download() {
    const {exportDeckFormat: format, exportDeckFilename: filename} = app.state;
    const data = exportDeck[format].download!(filename, collectDeck());

    _.download(data, filename + exportDeck[format].downloadExtension);

    hash();
  },
  start() {
    const {addBots, useTimer, timerLength, shufflePlayers} = app.state;
    const options = {addBots, useTimer, timerLength, shufflePlayers};
    app.send("start", options);
  },
  pickNumber(pick: number) {
    app.save("pickNumber", pick);
  },
  pack(cards: Card[]) {
    app.state.gameState.pack(cards);
    app.update();
    if (app.state.beep) {
      if (app.state.notify) {
        if (document.hidden) {
          new Notification("Pack awaiting", {
            icon: "/4-hq.png",
            body: "A new pack is available!"
          });
        }
      } else {
        const beep = document.getElementById("beep") as HTMLAudioElement;
        if (beep) {
          beep.play();
        }
      }
    }
  },
  log(draftLog: any) {
    app.save("log", draftLog);
  },
  getLog() {
    const {gameId, log, players, self, sets, gamesubtype, exportDeckFilename} = app.state;
    const isCube = /cube/.test(gamesubtype);
    const date = new Date().toISOString().slice(0, -5).replace(/-/g, "").replace(/:/g, "").replace("T", "_");
    const data = [
      `Event #: ${gameId}`,
      `Time: ${date}`,
      "Players:"
    ];

    players?.forEach((player, i) =>
      data.push(i === self ? `--> ${player.name}` : `    ${player.name}`)
    );

    Object.values(log).forEach((round, index) => {
      data.push("", `------ ${isCube ? "Cube" : sets.shift()} ------`);
      round.forEach(function (pick, i) {
        data.push("", `Pack ${index + 1} pick ${i + 1}:`);
        pick.forEach((card) => data.push(card));
      });
    });

    _.download(data.join("\n"), `${exportDeckFilename}-draftlog.txt`);
  },

  create() {
    let {gametype, gamesubtype, seats, title, isPrivate, modernOnly, totalChaos, chaosDraftPacksNumber, chaosSealedPacksNumber, picksPerPack} = app.state;
    seats = Number(seats);

    //TODO: either accept to use the legacy types (draft, sealed, chaos draft ...) by  keeping it like this
    // OR change backend to accept "regular draft" instead of "draft" and "regular sealed" instead of "sealed"
    const type = `${/regular/.test(gamesubtype) ? "" : gamesubtype + " "}${gametype}` as GameType;

    let options: GameOptions = {type, seats, title, isPrivate, modernOnly, totalChaos, picksPerPack};

    switch (gamesubtype) {
    case "regular": {
      const {setsDraft, setsSealed} = app.state;
      options.sets = gametype === "sealed" ? setsSealed : setsDraft;
      break;
    }
    case "decadent":
      options.sets = app.state.setsDecadentDraft;
      break;
    case "cube":
      options.cube = parseCubeOptions();
      break;
    case "chaos":
      options.chaosPacksNumber = /draft/.test(gametype) ? chaosDraftPacksNumber : chaosSealedPacksNumber;
      break;
    }
    app.send("create", options);
  },
  changeSetsNumber(type: SetType, event: any) {
    event.preventDefault();
    const packsNumber = event.currentTarget.value;
    const sets = app.state[type];

    if (sets.length < packsNumber) {
      const toAdd = packsNumber - sets.length;
      const lastSet = sets.slice(-1)[0];
      sets.push(...times(toAdd, constant(lastSet)));
    } else if (sets.length > packsNumber) {
      sets.splice(packsNumber);
    }

    app.save(type, sets);
  },
  changePicksPerPack(event: any) {
    app.state.picksPerPack = event.currentTarget.value;
    app.update();
  },
  draftState(draftState: withSort<Card>) {
    app.state.gameState.draftState = _cloneDeep(draftState);
    app.update();
    app.state.gameState.updState();
  },
  land(zoneName: Zone, color: string, e: any) {
    const n = Number(e.target.value);
    app.state.gameState.setLands(zoneName, color, n);
    app.update();
  },
  deckSize(e: any) { // TODO: What events are these?
    const n = Number(e.target.value);
    if (n && n > 0) {
      app.state.deckSize = n;
    }
    app.update();
  },
  suggestLands() {
    // Algorithm: count the number of mana symbols appearing in the costs of
    // the cards in the pool, then assign lands roughly commensurately.
    const colors = ["W", "U", "B", "R", "G"];
    const colorRegex = /{[^}]+}/g;
    const manaSymbols: { [key: string]: number } = {};
    colors.forEach(x => manaSymbols[x] = 0);

    // Count the number of mana symbols of each type.
    app.state.gameState.get(Zone.main).forEach((card) => {
      if (!card.manaCost)
        return;
      const cardManaSymbols = card.manaCost.match(colorRegex);

      if (cardManaSymbols) {
        colors.forEach((color) => {
          Object.values(cardManaSymbols).forEach((symbol) => {
            // Test to see if '{U}' contains 'U'. This also handles things like
            // '{G/U}' triggering both 'G' and 'U'.
            if (symbol.indexOf(color) !== -1)
              manaSymbols[color] += 1;
          });
        });
      }
    });

    app.state.gameState.resetLands();
    // NB: We could set only the sideboard lands of the colors we are using to
    // 5, but this reveals information to the opponent on Cockatrice (and
    // possibly other clients) since it tells the opponent the sideboard size.
    colors.forEach(color => {
      app.state.gameState.setLands(Zone.side, color, 5);
    });

    const mainColors = colors.filter(x => manaSymbols[x] > 0);
    mainColors.forEach(x => manaSymbols[x] = Math.max(3, manaSymbols[x]));
    mainColors.sort((a, b) => manaSymbols[b] - manaSymbols[a]);

    // Round-robin choose the lands to go into the deck. For example, if the
    // mana symbol counts are W: 2, U: 2, B: 1, cycle through the sequence
    // [Plains, Island, Swamp, Plains, Island] infinitely until the deck is
    // finished.
    //
    // This has a few nice effects:
    //
    //   * Colors with greater mana symbol counts get more lands.
    //
    //   * When in a typical two color deck adding 17 lands, the 9/8 split will
    //   be in favor of the color with slightly more mana symbols of that
    //   color.
    //
    //   * Every color in the deck is represented, if it is possible to do so
    //   in the remaining number of cards.
    //
    //   * Because of the minimum mana symbol count for each represented color,
    //   splashing cards doesn't add exactly one land of the given type
    //   (although the land count may still be low for that color).
    //
    //   * The problem of deciding how to round land counts is now easy to
    //   solve.
    const manaSymbolsToAdd = mainColors.map(color => manaSymbols[color]);
    const colorsToAdd: string[] = [];
    const emptyManaSymbols = () => !manaSymbolsToAdd.every(x => x === 0);

    for (let i = 0; emptyManaSymbols(); i = (i + 1) % mainColors.length) {
      if (manaSymbolsToAdd[i] === 0) {
        continue;
      }
      colorsToAdd.push(mainColors[i]);
      manaSymbolsToAdd[i]--;
    }

    if (colorsToAdd.length > 0) {
      const mainDeckSize = app.state.gameState.draftState.state.main.flatMap((col) => col.items).length;

      let j = 0;
      const basicLandsMap: { [key: string]: number } = {};
      range(app.state.deckSize - mainDeckSize).forEach(() => {
        const color = colorsToAdd[j];
        basicLandsMap[color] = ++basicLandsMap[color] || 1;
        j = (j + 1) % colorsToAdd.length;
      });

      Object.entries(basicLandsMap).forEach(([color, number]) => {
        app.state.gameState.setLands(Zone.main, color, number);
      });
    }

    app.update();
  },
  resetLands() {
    app.state.gameState.resetLands();
    app.update();
  },
  chat(messages: any[]) {
    app.set({
      messages
    });
  },
  hear(message: Message) {
    console.log(JSON.stringify(message));
    app.set({
      messages: [...app.state.messages, message]
    });
    if (!app.state.chat) {
      vanillaToast.info(`${message.name}: ${DOMPurify.sanitize(message.text)}`);
    }
  },
  command(message: Message) {
    app.set({
      messages: [...app.state.messages, message]
    });
  },
  notification(e: any) {
    if (!e.target.checked) {
      app.save("notify", false);
    } else if ("Notification" in window) {
      Notification.requestPermission().then((result) => {
        app.save("notificationResult", result);
        app.save("notify", result === "granted");
      });
    } else {
      app.save("notificationResult", "notsupported");
      app.save("notify", false);
    }
  },
};

const parseCubeOptions = (): Cube => {
  let {list, cards, packs, cubePoolSize, burnsPerPack} = app.state;
  cards = Number(cards);
  packs = Number(packs);
  cubePoolSize = Number(cubePoolSize);

  const jawns = list
    .split("\n")
    .map(x => x
      .trim()
      .replace(/^\d+.\s*/, "")
      .replace(/\s*\/+\s*/g, " // ")
      .toLowerCase())
    .filter(x => x)

  return {list: jawns, cards, packs, cubePoolSize, burnsPerPack};
};

const clickPack = (card: Card) => {
  if (!app.state.gameState.isPick(card.cardId)) {
    app.state.gameState.updateCardPick(card.cardId, app.state.picksPerPack);
  } else if (app.state.gameState.isSelectionReady(app.state.picksPerPack, app.state.burnsPerPack)) {
    app.state.gameState.resetPack();
    app.update();
    app.send("confirmSelection");
  }
};

// TODO: use draftState
const hash = () => {
  app.send("hash", {
    main: app.state.gameState.countCardsByName(Zone.main),
    side: app.state.gameState.countCardsByName(Zone.side),
  });
};
// Why is the hash version of the deck a different type than the collectDeck version??????
const collectDeck = (): Deck => ({
  main: collectByName(app.state.gameState.draftState.state.main.flatMap((col) => col.items)),
  side: collectByName(app.state.gameState.draftState.state.side.flatMap((col) => col.items), true)
});

function collectByName (cards: Card[], sideboard = false): DeckRow[] {
  const collector = cards.reduce((acc: { [key: string]: DeckRow }, card) => {
    if (acc[card.name]) {
      acc[card.name].count += 1;
    } else {
      acc[card.name] = { card, count: 1, sideboard };
    } 

    return acc;
  }, {});

  return Object.values(collector);
}
