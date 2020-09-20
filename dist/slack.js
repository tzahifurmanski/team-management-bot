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
exports.sendSlackMessage = exports.slackEvents = void 0;
const config = require("../config.json");
const { WebClient } = require("@slack/web-api");
const BOT_TEST_CHANNEL = config.UNICORN_BOT_CHANNEL_ID;
const token = config.BOT_USER_OAUTH_ACCESS_TOKEN;
console.log("Token", config.BOT_USER_OAUTH_ACCESS_TOKEN);
const { createEventAdapter } = require("@slack/events-api");
const slackSigningSecret = config.SLACK_SIGNING_SECRET;
exports.slackEvents = createEventAdapter(slackSigningSecret);
exports.slackEvents.on("message", (event) => {
    // Oops! This throws a TypeError.
    event.notAMethod();
});
// All errors in listeners are caught here. If this weren't caught, the program would terminate.
exports.slackEvents.on("error", (error) => {
    console.log(error.name); // TypeError
});
const web = new WebClient(token);
exports.sendSlackMessage = function (text) {
    return __awaiter(this, void 0, void 0, function* () {
        // Post a message to the channel, and await the result.
        // Find more arguments and details of the response: https://api.slack.com/methods/chat.postMessage
        const result = yield web.chat.postMessage({
            text: text,
            channel: BOT_TEST_CHANNEL,
        });
        // The result contains an identifier for the message, `ts`.
        console.log(`Successfully send message ${result.ts} in conversation ${BOT_TEST_CHANNEL}`);
    });
};
// export const slackEvents = slackEvents;
//# sourceMappingURL=slack.js.map