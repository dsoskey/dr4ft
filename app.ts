import http from "http";
import schedule from "node-schedule";
import eio from "engine.io";
import express from "express";
import helmet from "helmet";
import fileUpload from "express-fileupload";
import cors from "cors";
import bodyParser from "body-parser";
import { spawn } from "child_process";
import { logger } from "./backend/logger";
import router from "./backend/router";
import apiRouter from "./backend/api/";
import { app as config, version } from "./config";
const app = express();
import "./backend/data-watch";


//Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(bodyParser.json()); // for parsing application/json
app.use(cors());
app.use(fileUpload());

// TODO: Use path to generate this
const PATH_TO_SCRIPTS = 'built/backend/scripts'
const DOWNLOAD_ALL_SETS_PATH = `${PATH_TO_SCRIPTS}/download_allsets.js`
const DOWNLOAD_BOOSTER_RULES_PATH = `${PATH_TO_SCRIPTS}/download_booster_rules.js`;

//routing
app.use(express.static("built/frontend"));
app.use("/api", apiRouter);

// Download Allsets.json if there's a new one and make the card DB
// spawn("node", [DOWNLOAD_ALL_SETS_PATH], { stdio: "inherit" });
// spawn("node", [DOWNLOAD_BOOSTER_RULES_PATH], { stdio: "inherit" });

// Schedule check of a new sets and new boosterRules every hour
// schedule.scheduleJob("0 * * * *", () => {
  // spawn("node", [DOWNLOAD_ALL_SETS_PATH], { stdio: "inherit" });
  // spawn("node", [DOWNLOAD_BOOSTER_RULES_PATH], { stdio: "inherit" });
// });

// Create server
const server = http.createServer(app);
const io = eio(server);
io.on("connection", router);

server.listen(config.PORT);
logger.info(`Started up on port ${config.PORT} with version ${version}`);

