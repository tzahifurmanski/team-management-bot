import { BotAction } from "../base_action";
import { Compliment } from "./compliment";
import { IntroduceYourself } from "./introduce_yourself";
import { WhatCanYouDo } from "./what_can_you_do";
import { AskChannelStats } from "./ask_channel_stats";
import { MeaningOfLife } from "./meaning_of_life";

export const ASKS_ACTIONS: BotAction[] = [
  new Compliment(),
  new IntroduceYourself(),
  new WhatCanYouDo(),
  new AskChannelStats(),
  new MeaningOfLife(),
];
