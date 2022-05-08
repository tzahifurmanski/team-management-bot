import { BOT_ID } from "../../integrations/slack/consts";
import { BotAction } from "../base_action";
import { getRandomFromArray } from "../utils";

import {botConfig, TEAM_SPECIFIC_COMPLIMENTS} from "../../consts";

const {
  sendSlackMessage,
  getUserIDInText,
} = require("../../integrations/slack/messages");

// Use a predefined compliments pool and anything that is team specific
const COMPLIMENTS = botConfig.ACTION_COMPLIMENT_POOL.concat((TEAM_SPECIFIC_COMPLIMENTS || "").split(",")
);

export class Compliment implements BotAction {
  getHelpText(): string {
    return "Compliment someone (`compliment @Tzahi`)";
  }

  isEnabled(): boolean {
    // This action should always be available
    return true;
  }

  doesMatch(event: any): boolean {
    return (
      event.text.includes("compliment") ||
      event.text.includes("say something nice")
    );
  }

  async performAction(event: any): Promise<void> {
    // TODO: Think of a better way to use the sender / receiver in the message
    const compliment = getRandomFromArray(COMPLIMENTS);

    let receiver = getUserIDInText(event.text);

    // If there is no receiver, ignore the compliment request
    if (!receiver) {
      // Handle a 'compliment yourself' situation
      if (event.text.includes("compliment yourself")) {
        receiver = `<@${BOT_ID}>`;
        console.log(receiver);
      } // TODO: Add a compliment me scenario - https://snyk.slack.com/archives/CL2KB07KN/p1606746944139700?thread_ts=1606746775.138700&cid=CL2KB07KN
      else {
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
