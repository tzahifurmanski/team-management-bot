// import { slackEvents } from "./integrations/slack/events";
// import {SLACK_SIGNING_SECRET} from "./integrations/slack/consts";
import {PORT} from "./consts";

const bodyParser = require("body-parser");
// const express = require("express");

const SLACK_SIGNING_SECRET: string = process.env.SLACK_SIGNING_SECRET || "";
const slackToken: string = process.env.BOT_USER_OAUTH_ACCESS_TOKEN || "";

const { App } = require('@slack/bolt');

const app = new App({
  signingSecret: SLACK_SIGNING_SECRET,
  token: slackToken,
  deferInitialization: true,
});



// BOLT_APP.event()


// const app = express();

// Add the Slack Events middleware
// TODO: Use a new router
// app.use("/slack/events", slackEvents.requestListener());


// TODO: Get it working
// app.get("/status", async (req: any, res: any) => {
//   console.log("Got a status request!");
//
//   res.sendStatus(200);
// });

// Need to put the body parser after the event adapter in the middleware stack
// TODO: If the JSON body is invalid there's an ugly exception - SyntaxError: Unexpected token { in JSON at position 498
// TODO: Why do I need this?
// app.use(bodyParser.json());

module.exports = app;
