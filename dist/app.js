"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bot_actions_1 = require("./bot_actions");
const slack_1 = require("./slack");
const config = require("../config.json");
const { createServer } = require("http");
const bodyParser = require("body-parser");
// Initialize
const SERVER_PORT = config.SERVER_PORT || 3000;
// Send a welcome message
bot_actions_1.post_init();
const express = require("express");
const app = express();
app.use("/slack/", slack_1.slackEvents.requestListener());
// Example: If you're using a body parser, always put it after the event adapter in the middleware stack
// TODO: If the JSON body is invalid there's an ugly exception - SyntaxError: Unexpected token { in JSON at position 498
app.use(bodyParser.json());
app.post("/commands", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Got a command");
    const command = req.body;
    if (!command.event) {
        res.send("Bad command!");
        console.log("Bad command!");
        return;
    }
    // TODO: Remove this when I can actually use the Slack events system (right now I have to manually write the logic)
    switch (command.event.type) {
        case "app_mention":
            yield bot_actions_1.app_mention(command.event);
            res.sendStatus(200);
            // Handle an app_mention event
            break;
        default:
            console.log("Unsupported command", command);
            res.sendStatus(400);
            break;
    }
}));
console.log("Zigi");
// const server = app.listen(SERVER_PORT, () =>
//   console.log(`Listening for events on ${server.address().port}`)
// );
const server = createServer(app);
server.listen(SERVER_PORT, () => {
    // Log a message when the server is ready
    console.log(`Listening for events on ${server.address().port}`);
});
process.on("SIGTERM", () => {
    // When SIGTERM is received, do a graceful shutdown
    server.close(() => {
        console.log("Process terminated");
    });
});
//# sourceMappingURL=app.js.map