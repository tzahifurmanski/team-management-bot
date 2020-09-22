import { post_init, post_shutdown, handle_event } from "./bot_actions";
import { slackEvents } from "./slack";

const config = require("../config.json");
const { createServer } = require("http");
const bodyParser = require("body-parser");

// Initialize
const SERVER_PORT = config.SERVER_PORT || 3000;

// Send a welcome message
post_init();
const express = require("express");

const app = express();

// TODO: Change slack settings to match /slack/ instead of /?
//app.use("/slack/", slackEvents.requestListener());
app.use("/", slackEvents.requestListener());

// TODO: CHECK THIS - An API to respond to a challenge. (to be able to deploy it on a server)
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

// TODO: Remove this when I can actually use the Slack events system (right now I have to manually write the logic).
app.post("/commands", async (req: any, res: any) => {
  console.log("Got a command");

  const command = req.body;

  if (!command.event) {
    res.send("Bad command!");
    console.log("Bad command!");
    return;
  }

  switch (command.event.type) {
    case "app_mention":
      await handle_event(command.event);
      res.sendStatus(200);
      // Handle an app_mention event
      break;
    default:
      console.log("Unsupported command", command);
      res.sendStatus(400);
      break;
  }
});

// const server = app.listen(SERVER_PORT, () =>
//   console.log(`Listening for events on ${server.address().port}`)
// );

const server = createServer(app);
server.listen(SERVER_PORT, () => {
  // Log a message when the server is ready
  console.log(`Listening for events on ${server.address().port}`);
});

// TODO: This does not fire when I abort the server with CTRL+C
process.on("SIGTERM", () => {
  // When SIGTERM is received, do a graceful shutdown

  server.close(() => {
    console.log("Process terminated");
    post_shutdown();
  });
});
