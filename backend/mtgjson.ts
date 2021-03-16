import fs from "fs";
import path from "path";
import { getDataDir } from "../backend/data";
const VERSION_FILE = path.join(getDataDir(), "version.json");
import { logger } from "./logger";
import semver from "semver";
type Version = { version: string, date: string};
let version: Version | null;

export const getVersion = () => {
  if(!version) {
    refresh();
  }
  return version || { version: "N/A", date: "N/A" };
};

export const refresh = () => {
  if (fs.existsSync(VERSION_FILE)) {
    try {
      version = JSON.parse(fs.readFileSync(VERSION_FILE).toString());

      // #692: clean version from build metadata to appear nicely in changelog
      version!.version = semver.clean(version!.version)!;
    } catch(error) {
      logger.error("could not parse mtgjson version file " + error);
      version = null;
    }
  }
};

export default {
  getVersion,
  refresh
};
