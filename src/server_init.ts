import { slackEvents } from "./integrations/slack/events";
const bodyParser = require("body-parser");
const express = require("express");

const app = express();

// Add the Slack Events middleware
app.use("/events/slack", slackEvents.requestListener());

app.get("/status", async (req: any, res: any) => {
  console.log("Got a status request!");

  res.sendStatus(200);
});

// Need to put the body parser after the event adapter in the middleware stack
// TODO: If the JSON body is invalid there's an ugly exception - SyntaxError: Unexpected token { in JSON at position 498
app.use(bodyParser.json());

module.exports = app;
