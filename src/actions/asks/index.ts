import { BotAction } from "../base_action";
import { Compliment } from "./compliment";
import { IntroduceYourself } from "./introduce_yourself";
import { AskChannelStats } from "./ask_channel_stats";
import { MeaningOfLife } from "./meaning_of_life";
import { GroupAskChannelMonthlyStats } from "./group_ask_channel_monthly_stats";
import { MonitoredChannelSummaryStats } from "./monitored_channel_stats";
import { AskChannelStatsForYesterday } from "./ask_channel_stats_for_yesterday";
import { OncallTicketsStatus } from "./oncall_tickets_status";
import {Help} from "./help";

const ACTIONS_LIST : BotAction[] = [
  new Help(),
  new Compliment(),
  new IntroduceYourself(),
  new AskChannelStats(),
  new GroupAskChannelMonthlyStats(),
  new AskChannelStatsForYesterday(),
  new MeaningOfLife(),
  new MonitoredChannelSummaryStats(),
  new OncallTicketsStatus()];

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