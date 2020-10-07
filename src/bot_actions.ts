import { what_can_you_do_action } from "./actions/what_can_you_do";

const { sendSlackMessage } = require("./integrations/slack/messages");
import { compliment_action } from "./actions/compliment";
import { introduce_yourself_action } from "./actions/introduce_yourself";
import { ask_channel_stats_action } from "./actions/ask_channel_stats";
import { review_request_action } from "./actions/review_request";
import { genuine_compliment_action } from "./actions/genuine_compliment";

// TODO: Convert to new format: https://api.slack.com/changelog/2020-09-15-events-api-truncate-authed-users

export const handle_channel_event = async function (event: any) {
  // TODO: Limit to specific channels?

  console.log("Got new event", event);

  // // TODO: In progress
  // if (
  //   event.text.toLowerCase().startsWith("hi") ||
  //   event.text.toLowerCase().startsWith("can")
  // ) {
  //   await ask_channel_stats_action(event);
  //   return;
  // }

  // TODO: Convert it to be holding
  if (event.text.toLowerCase().startsWith("folks")) {
    await sendSlackMessage(
      "https://media.giphy.com/media/C5eDFesCSregw/giphy.gif",
      event.channel,
      event.thread_ts
    );
    return;
  }

  // When someone asks for a review
  if (
    event.text.toLowerCase().startsWith("can i") ||
    event.text.toLowerCase().includes("please") ||
    event.text.toLowerCase().includes("help") ||
    event.text.toLowerCase().includes("review")
  ) {
    await review_request_action(event);
    return;
  }

  if (
    event.text.toLowerCase().includes("good") ||
    event.text.toLowerCase().includes("nice") ||
    event.text.toLowerCase().includes("job")
  ) {
  }

  //
  // await ask_channel_stats_action(event);
  console.log("Unsupported event", event);
};

// This method handles events that are with direct interaction with the bot (like a DM or when the bot is tagged)
export const handle_direct_event = async function (event: any) {
  console.log("Got new event", event);

  if (event.text.includes("introduce yourself")) {
    await introduce_yourself_action(event);
    return;
  }

  if (event.text.includes("what can you do")) {
    await what_can_you_do_action(event);
    return;
  }

  if (event.text.includes("meaning of life")) {
    await sendSlackMessage(`42`, event.channel, event.thread_ts);
    return;
  }

  if (
    event.text.includes("compliment") ||
    event.text.includes("hug") ||
    event.text.includes("say something nice")
  ) {
    await compliment_action(event);
    return;
  }

  if (event.text.includes("genuine compliment")) {
    await genuine_compliment_action(event);
    return;
  }

  if (event.text.includes("ask channel stats")) {
    await ask_channel_stats_action(event);
    return;
  }

  // TODO: In progress
  if (
    event.text.toLowerCase().startsWith("hi") ||
    event.text.toLowerCase().startsWith("can")
  ) {
    await ask_channel_stats_action(event);
    return;
  }

  // TODO: Convert it to be holding
  if (event.text.toLowerCase().startsWith("folks")) {
    await sendSlackMessage(
      "https://media.giphy.com/media/C5eDFesCSregw/giphy.gif",
      event.channel,
      event.thread_ts
    );
    //
    // await ask_channel_stats_action(event);
    return;
  }

  // When we ship something
  // // TODO: In progress
  // https://media.giphy.com/media/3oKIPiW5jADxCcwVXi/giphy.gif

  // TODO: When someone submits a PR, Bojack will reply in a 'why do you do this to me'
  //https://slack-imgs.com/?c=1&o1=ro&url=https%3A%2F%2Fmedia3.giphy.com%2Fmedia%2F3orieT6Hpsj44lo35K%2Fgiphy.gif%3Fcid%3D6104955e5698170d785206405fcfee113bee4e52c5b30a99%26rid%3Dgiphy.gif

  console.log("Unsupported event", event);
};
