import { App } from "./app";
import { default as router } from "./router";

const app = new App();
app.init(router);

// @ts-ignore
module.hot?.accept();
