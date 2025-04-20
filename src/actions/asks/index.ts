import { BotAction } from "../base_action.js";
import { Compliment } from "./compliment.js";
import { IntroduceYourself } from "./introduce_yourself.js";
import { AskChannelStatusStatsOrSummary } from "./ask_channel_status_stats_or_summary.js";
import { MeaningOfLife } from "./meaning_of_life.js";
import { GroupAskChannelMonthlyStats } from "./group_ask_channel_monthly_stats.js";
import { MonitoredChannelSummaryStats } from "./monitored_channel_stats.js";
import { AskChannelStatusForYesterday } from "./ask_channel_status_for_yesterday.js";
import { ZendeskTicketsStatus } from "./zendesk_tickets_status.js";
import { Help } from "./help.js";
import { Status } from "./status.js";
import { logger } from "../../settings/server_consts.js";
import { TeamAdmin } from "./team_admin.js";

const helpCommand = new Help();
const ACTIONS_LIST: BotAction[] = [
  new AskChannelStatusForYesterday(),
  new AskChannelStatusStatsOrSummary(),
  new GroupAskChannelMonthlyStats(),
  new ZendeskTicketsStatus(),
  new MonitoredChannelSummaryStats(),
  new Compliment(),
  new MeaningOfLife(),
  new Status(),
  new TeamAdmin(),
  helpCommand,
  new IntroduceYourself(helpCommand),
];

export const ASKS_ACTIONS: BotAction[] = [];

logger.info("Loading actions list...");
ACTIONS_LIST.forEach((action) => {
  if (action.isEnabled()) {
    ASKS_ACTIONS.push(action);
    logger.info(`* '${action.constructor.name}' action is enabled.`);
  } else {
    logger.info(`* '${action.constructor.name}' action is skipped.`);
  }
});
logger.info("Actions list loading is complete.");

helpCommand.setActionsList(ASKS_ACTIONS);
