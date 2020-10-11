import { BOT_ID } from "../../integrations/slack/consts";
import { BotAction } from "../base_action";
import { getRandomFromArray } from "../utils";

const config = require("../../../config.json");

const {
  sendSlackMessage,
  getUserIDInText,
} = require("../../integrations/slack/messages");

// Use a predefined compliments pool and anything that is team specific
const CHEEKY_COMPLIMENTS_POOL = [
  "I would delete your browser history for you if you suddenly died.",
  "You have the capacity to do worse, so this is actually a good result for you",
  "You almost did such a great job!",
  "You are so impressive to some people",
  "It takes a lot of strength to admit that you're average",
  "I think you said something funny once",
  "There's no shame in being just OK",
  "One day you might succeed",
  "You bring a lot to the team. I'm not sure what it is, but you do",
  "You're mostly not a burden",
].concat(config.TEAM_SPECIFIC_CHEEKY_COMPLIMENTS);

export class Compliment implements BotAction {
  doesMatch(event: any): boolean {
    return (
      event.text.includes("compliment") ||
      event.text.includes("say something nice")
    );
  }

  async performAction(event: any): Promise<void> {
    // TODO: Think of a better way to use the sender / receiver in the message
    const compliment = getRandomFromArray(CHEEKY_COMPLIMENTS_POOL);

    let receiver = getUserIDInText(event.text);

    // If there is no receiver, ignore the compliment request
    if (!receiver) {
      // Handle a 'compliment yourself' situation
      if (event.text.includes("compliment yourself")) {
        receiver = `<@${BOT_ID}>`;
        console.log(receiver);
      } else {
        console.log(`Did not find a receiver in ${event.text}`);
        return;
      }
    }

    // If this is part of a thread then keep the original thread, otherwise compliment in a thread
    await sendSlackMessage(
      `${receiver} ${compliment}`,
      event.channel,
      event.thread_ts ? event.thread_ts : event.ts
    );
  }
}
