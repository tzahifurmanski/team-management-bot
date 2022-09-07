import { BotAction } from '../base_action';
import {BOT_NAME, botConfig, TEAM_NAME} from "../../consts";
import {BOT_ID, TEAM_ASK_CHANNEL_ID} from "../../integrations/slack/consts";
import {AskChannelStatusForYesterday} from "./ask_channel_status_for_yesterday";
import {Help} from "./help";

const { sendSlackMessage } = require('../../integrations/slack/messages');

export class IntroduceYourself implements BotAction {
  getHelpText(): string {
    return "`introduce yourself` - Introduce the bot and it's capabilities";
  }

  isEnabled(): boolean {
    // This action should always be available
    return true;
  }

  doesMatch(event: any): boolean {
    return (
      event.text.includes('introduce yourself') || event.text.includes('hello')
    );
  }

  async performAction(event: any): Promise<void> {
    // Send welcome message
    await sendSlackMessage(`${botConfig.ACTION_INTRODUCE_YOURSELF_TEXT} I serve at the pleasure of the ${TEAM_NAME} team :wave:\n` +
        "Here are some things you should know about me :in-progress:", event.channel, event.thread_ts);

    // Send details (in thread)

    // If asks channel status feature is enabled:
    const askChannelStatusForYesterdayCommand = new AskChannelStatusForYesterday()
    if (askChannelStatusForYesterdayCommand.isEnabled()) {
      const asksMessage = await sendSlackMessage("Most people use me for managing your asks channel. Here is some useful information: (:thread:)", event.channel, event.thread_ts);
      await sendSlackMessage(`I track the requests in your asks channel (<#${TEAM_ASK_CHANNEL_ID}>) and can post a status report, helping you track the open asks you currently have. For example:`, event.channel, asksMessage.ts);
      await askChannelStatusForYesterdayCommand.performAction({...event, thread_ts: asksMessage.ts});
      await sendSlackMessage(`Cool huh? :smiley:\nThis can be done by running ${askChannelStatusForYesterdayCommand.getHelpText()}`, event.channel, asksMessage.ts);
      await sendSlackMessage("How does it work? In order to determine what is pending, in-progress or done, I look for :white_check_mark: for a completed task, and :in-progress: for in progress (the rest is ‘unhandled’). Most teams find this sufficient, but in case you prefer to use different emojis, these are configurable :slightly_smiling_face:", event.channel, asksMessage.ts);
    }

    const result = await sendSlackMessage("More things to know about me! :excited: (:thread:)", event.channel, event.thread_ts);
    await sendSlackMessage(`You can communicate with me everywhere - Either by DMing me with what you'd like me to run (DM <@${BOT_ID}> with \`help\`) or tagging me in a message (\`@${BOT_NAME}> help\`) in a channel I'm in.`, event.channel, result.ts);
    await new Help().performAction({...event, thread_ts: result.ts});
  }
}