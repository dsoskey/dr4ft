
import express from "express";
import games from "./games";
import sets from "./sets";
const apiRouter = express.Router();

apiRouter
  .use("/games", games)
  .use("/sets", sets);

export default apiRouter;
