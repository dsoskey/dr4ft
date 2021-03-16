import fs from "fs";
import { reloadData } from "./data";
import { logger } from "./logger";

/**
 * Add a watch on fs to get updated even from external process
 */
fs.watch("data", (eventType, filename) => {
  logger.debug(`filewatch - ${eventType} on ${filename}`);
  reloadData(filename);
});
