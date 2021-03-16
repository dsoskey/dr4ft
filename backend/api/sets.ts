import fs from "fs";
import express from "express";
const setsRouter = express.Router();
import { getSets, saveSetAndCards } from "../data";
import { doSet } from "../import/doSet";
import { logger } from "../logger";
import parser from "../import/xml/parser";
import path from "path";
import { getDataDir } from "../data";

const customDataDir = path.join(getDataDir(), "custom");
if (!fs.existsSync(customDataDir)) {
  fs.mkdirSync(customDataDir);
}

const CUSTOM_TYPE = "custom";

setsRouter
  .post("/upload", (req: any, res: any) => {
    let file = req.files.filepond;
    const content = file.data.toString();

    if (/\.xml$/.test(file.name)) {
      try {
        Object.values(parser.parse(content)).forEach(json => {
          integrateJson(json); // used to have res
        });
      } catch(err) {
        logger.error(`Could not parse XML file: ${err} - ${err.stack}`);
        res.status(400).json(`the xml submitted is not valid: ${err.message}`);
        return;
      }
    } else if( /\.json/.test(file.name)) {
      try {
        const json = JSON.parse(content);
        integrateJson(json); // used to have res
      } catch (err) {
        logger.error(`Could not parse JSON file because ${err} - ${err.stack}`);
        res.status(400).json(`the json submitted is not valid: ${err.message}`);
      }
    }
    res.json({ "message": "file integrated successfully" });
  });

/**
 * Utility to delete unwanted attributes before saving the set
 * @param {JSON} json
 */
const sanitize = (json: any) => {
  json.type = CUSTOM_TYPE; //Force set as custom
  json.cards = json.cards.map(({ //take only values that we need
    name,
    frameEffects,
    number,
    layout,
    colors,
    colorIdentity,
    otherFaceIds,
    convertedManaCost,
    types,
    supertypes = [],
    subtypes = [],
    manaCost,
    url,
    identifiers = {},
    rarity,
    power,
    toughness,
    loyalty,
    text
  }: any
  ) => ({
    name,
    frameEffects,
    number,
    layout,
    colors,
    colorIdentity,
    otherFaceIds,
    convertedManaCost,
    types,
    supertypes,
    subtypes,
    manaCost,
    url,
    identifiers,
    rarity,
    power,
    toughness,
    loyalty,
    text
  }));
} ;

function integrateJson(json: any) {
  if(!json.code) {
    throw new Error("Custom set should have a code");
  }
  const sets = getSets();

  if ((json.code in sets)) {
  // Unless it's a custom set. In this case, we allow overriding
    if (sets[json.code].type !== CUSTOM_TYPE) {
      throw new Error(`Set existing already. Not saving again set with code "${json.code}" to database`);
    } else {
      logger.info(`Custom set ${json.code} already existing. Overriding with new file...`);
    }
  }

  //TODO: that should be done done by a service -> parse and save (and write file)
  sanitize(json);
  const [set, cards] = doSet(json);
  saveSetAndCards({ set, cards });
  logger.info(`adding new set with code "${json.code}" to database`);

  //TODO: That should be done by something else. Move out of controller
  //Moving custom set to custom directory
  const customDataDir = path.join(getDataDir(), "custom");
  if (!fs.existsSync(customDataDir)) {
    fs.mkdirSync(customDataDir);
  }
  fs.writeFile(path.join(customDataDir, `${json.code}.json`), JSON.stringify(json, undefined, 4), (err) => {
    if (err) {
      logger.error(`Could not save file ${json.code}.json. ${err}`);
    } else {
      logger.info(`Saved custom set as file ${json.code}.json`);
    }
  });
}

export default setsRouter;
