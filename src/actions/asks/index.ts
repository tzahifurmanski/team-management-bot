import { BotAction } from "../base_action";
import { Compliment } from "./compliment";
import { IntroduceYourself } from "./introduce_yourself";
import { WhatCanYouDo } from "./what_can_you_do";
import { AskChannelSummaryStats } from "./ask_channel_stats";
import { MeaningOfLife } from "./meaning_of_life";
import { AskChannelWeeklyStats } from "./ask_channel_weekly_stats";
import { AskChannelDailyStats } from "./ask_channel_daily_stats";
import { AskChannelMonthlyStats } from "./ask_channel_monthly_stats";
import { GroupAskChannelMonthlyStats } from "./group_ask_channel_monthly_stats";
import { MonitoredChannelSummaryStats } from "./monitored_channel_stats";
import { AskChannelStatsForYesterday } from "./ask_channel_stats_for_yesterday";
import {OncallTicketsStatus} from "./oncall_tickets_status";

export const ASKS_ACTIONS: BotAction[] = [
  new Compliment(),
  new IntroduceYourself(),
  new WhatCanYouDo(),
  new MonitoredChannelSummaryStats(),
  new GroupAskChannelMonthlyStats(),
  new AskChannelStatsForYesterday(),
  new AskChannelSummaryStats(),
  new AskChannelDailyStats(),
  new AskChannelWeeklyStats(),
  new AskChannelMonthlyStats(),
  new MeaningOfLife(),
  new OncallTicketsStatus()
];
