import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { get } from "https";
import { Extract } from "unzipper";
import { compareBuild } from "semver";
import updateDatabase from "./update_database";
import { logger } from "../backend/logger";
import { refresh as refreshVersion } from "../backend/mtgjson";
import { getDataDir } from "../backend/data";

const mtgJsonURL = "https://www.mtgjson.com/api/v5/AllSetFiles.zip";
const versionURL = "https://www.mtgjson.com/api/v5/Meta.json";
const setsVersion = join(getDataDir(), "version.json");

const setsDataDir = join(getDataDir(), "sets");

interface HasVersion {
  version: string;
}
const isVersionNewer = ({ version: remoteVer }: HasVersion, { version: currentVer }: HasVersion) => (
  compareBuild(remoteVer, currentVer) > 0
);

const isVersionUpToDate = () => (
  new Promise<string | undefined>((resolve, reject) => {
    get(versionURL, res => {
      let json = "";
      res.on("data", chunk => { json += chunk; });
      res.on("end", function () {
        try {
          const remoteVersion = JSON.parse(json).data;

          if (existsSync(setsVersion)) {
            const version = JSON.parse(readFileSync(setsVersion, "UTF-8"));
            if (!isVersionNewer(remoteVersion, version)) {
              return resolve(undefined);
            }
          }

          const version = JSON.stringify(remoteVersion);
          logger.info(`Found a new version ${version}`);
          return resolve(version);
        } catch(err) {
          logger.error(`Error while fetching version to ${versionURL}: ${err.stack}`);
          reject();
        }
      });
    })
      .on("error", reject);
  })
);

const fetchZip = () => (
  new Promise((resolve, reject) => {
    get(mtgJsonURL, response => {
      logger.info("Updating AllSets.json");
      response
        .pipe(Extract({ path: setsDataDir, concurrency: 4 }))
        .on("finish", resolve)
        .on("error", reject);
    });
  }));

const download = async () => {
  logger.info("Checking if AllSets.json is up to date");
  const version = await isVersionUpToDate();
  if (version !== undefined) {
    await fetchZip();
    logger.info("Fetch AllSets.json finished. Updating the cards and sets data");
    updateDatabase();
    logger.info("Update DB finished");
    writeFileSync(setsVersion, version);
    refreshVersion();
  } else {
    logger.info("AllSets.json is up to date");
  }
};

export default {
  download
};

//Allow this script to be called directly from commandline.
if (!module.parent) {
  download();
}
