import { slackEvents } from "./integrations/slack/events";

const config = require("../config.json");
const { createServer } = require("http");
const bodyParser = require("body-parser");

const express = require("express");
// Initialize
const SERVER_PORT = config.SERVER_PORT || 3000;

const app = express();

// TODO: Change slack settings to match /slack/ instead of /?
app.use("/", slackEvents.requestListener());

// TODO: CHECK THIS - This is a 'one time' API to respond to a Slack challenge. (to be able to deploy it on a server)
app.post("/", async (req: any, res: any) => {
  console.log("Got a challenge verification request!");

  // Request from Slack
  const { challenge } = req.body;

  // Response from You
  res.send({ challenge });
});

// Example: If you're using a body parser, always put it after the event adapter in the middleware stack
// TODO: If the JSON body is invalid there's an ugly exception - SyntaxError: Unexpected token { in JSON at position 498
app.use(bodyParser.json());

const server = createServer(app);
server.listen(SERVER_PORT, () => {
  // Log a message when the server is ready
  console.log(`Listening for events on ${server.address().port}`);
  // post_init();
});

// TODO: This does not fire when I abort the server with CTRL+C
process.on("SIGTERM", () => {
  // When SIGTERM is received, do a graceful shutdown

  server.close(() => {
    console.log("Process terminated");
  });
});
