import { BotAction } from "../base_action";
import { Compliment } from "./compliment";
import { IntroduceYourself } from "./introduce_yourself";
import { AskChannelStatus } from "./ask_channel_status";
import { AskChannelStats } from "./ask_channel_stats";
import { MeaningOfLife } from "./meaning_of_life";
import { GroupAskChannelMonthlyStats } from "./group_ask_channel_monthly_stats";
import { MonitoredChannelSummaryStats } from "./monitored_channel_stats";
import { AskChannelStatusForYesterday } from "./ask_channel_status_for_yesterday";
import { OncallTicketsStatus } from "./oncall_tickets_status";
import { Help } from "./help";

const ACTIONS_LIST : BotAction[] = [
  new AskChannelStatus(),
  new AskChannelStats(),
  new GroupAskChannelMonthlyStats(),
  new AskChannelStatusForYesterday(),
  new OncallTicketsStatus(),
  new MonitoredChannelSummaryStats(),
  new IntroduceYourself(),
  new Compliment(),
  new MeaningOfLife(),
  new Help(),
  ];

export let ASKS_ACTIONS: BotAction[] = [];

console.log("Loading actions list...");
ACTIONS_LIST.forEach( (action) => {
  if(action.isEnabled())
  {
    ASKS_ACTIONS.push(action);
    console.log(`'${action.constructor.name}' enabled.`)
  }
  else
  {
    console.log(`'${action.constructor.name}' skipped.`)
  }
})
console.log("Actions list loading is complete.");