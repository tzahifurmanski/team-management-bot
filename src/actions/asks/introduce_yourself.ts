import { BotAction } from "../base_action";
import { BOT_NAME, BOT_SLACK_ID, botConfig } from "../../settings/server_consts";
import { AskChannelStatusForYesterday } from "./ask_channel_status_for_yesterday";
import { Help } from "./help";
import { getTeamByIndex } from "../../settings/team_utils";

const { sendSlackMessage } = require("../../integrations/slack/messages");

export class IntroduceYourself implements BotAction {
  private helpCommand: Help;

  constructor(helpCommand: Help) {
    this.helpCommand = helpCommand;
  }
  getHelpText(): string {
    return "`introduce yourself` - Introduce the bot and it's capabilities";
  }

  isEnabled(): boolean {
    // This action should always be available
    return true;
  }

  doesMatch(event: any): boolean {
    return (
      event.text.includes("introduce yourself") || event.text.includes("hello")
    );
  }

  async performAction(event: any, slackClient: any): Promise<void> {
    // Send welcome message
    await sendSlackMessage(
      slackClient,
      `${botConfig.ACTION_INTRODUCE_YOURSELF_TEXT}\n` +
        "Here are some things you should know about me :in-progress:",
      event.channel,
      event.thread_ts,
    );

    // Send details (in thread)

    // If asks channel status feature is enabled:
    const askChannelStatusForYesterdayCommand =
      new AskChannelStatusForYesterday();
    if (askChannelStatusForYesterdayCommand.isEnabled()) {
      const asksMessage = await sendSlackMessage(
        slackClient,
        "Most people use me for managing your asks channel. Here is some useful information: (:thread:)",
        event.channel,
        event.thread_ts,
      );
      
      const team = getTeamByIndex();

      await sendSlackMessage(
        slackClient,
        `I track the requests in your asks channel and can post a status report, helping you track the open asks you currently have. For example:`,
        event.channel,
        asksMessage.ts,
      );
      const newEvent = {...event, text: `ask channel status for yesterday <#${team.ask_channel_id}|${team.ask_channel_name}>`};

      await askChannelStatusForYesterdayCommand.performAction(
        { ...newEvent, thread_ts: asksMessage.ts },
        slackClient,
      );
      
      await sendSlackMessage(
        slackClient,
        `Cool huh? :smiley:\nThis can be done by running ${askChannelStatusForYesterdayCommand.getHelpText()}`,
        event.channel,
        asksMessage.ts,
      );
      await sendSlackMessage(
        slackClient,
        "How does it work? In order to determine what is pending, in-progress or done, I look for :white_check_mark: for a completed task, and :in-progress: for in progress (the rest is ‘unhandled’). Most teams find this sufficient, but in case you prefer to use different emojis, these are configurable :slightly_smiling_face:",
        event.channel,
        asksMessage.ts,
      );
      await sendSlackMessage(
        slackClient,
        "One last thing - By default, I don't count messages from bots/workflows. If you want me to track messages from a bot/workflow, please reach out to your bot administrator, and they will enable it.",
        event.channel,
        asksMessage.ts,
      );
    }

    const result = await sendSlackMessage(
      slackClient,
      "More things to know about me! :excited: (:thread:)",
      event.channel,
      event.thread_ts,
    );
    await sendSlackMessage(
      slackClient,
      `You can communicate with me everywhere - Either by DMing me with what you'd like me to run (DM <@${BOT_SLACK_ID}> with \`help\`) or tagging me in a message (\`@${BOT_NAME} help\`) in a channel I'm in.`,
      event.channel,
      result.ts,
    );
    await this.helpCommand.performAction(
      { ...event, thread_ts: result.ts },
      slackClient,
    );
  }
}
