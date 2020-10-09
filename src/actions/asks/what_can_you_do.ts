import { BotAction } from "../base_action";

const { sendSlackMessage } = require("../../integrations/slack/messages");

export class WhatCanYouDo implements BotAction {
  doesMatch(event: any): boolean {
    return event.text.includes("what can you do");
  }

  async performAction(event: any): Promise<void> {
    // TODO: Convert this to use the descriptions of actions / responses
    await sendSlackMessage(
      "Well, at the moment you can ask me to:\n• Introduce myself (`introduce yourself`)\n• Compliment someone (`compliment @Tzahi`)\n• Get you some stats about what goes on in your team channel (`ask channel stats`)\nBut I'm learning new stuff as I grow old :smiley:",
      event.channel,
      event.thread_ts
    );
  }
}
