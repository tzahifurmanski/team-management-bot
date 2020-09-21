const { sendSlackMessage } = require("./slack");
import { compliment_action } from "./actions/compliment";
import { introduce_yourself_action } from "./actions/introduce_yourself";

export const post_init = async function () {
  await sendSlackMessage("unibot is initialising!");
};

export const app_mention = async function (event: any) {
  // TODO: This assumes that the command is the second word - as the first word is the bot mention. For example "@unibot compliment @Yossi"
  //         probably should replace it with something like if (event.text.includes("tell me a joke")) {
  const words = event.text.split(" ");

  // if (words.length < 3) {
  //   console.log(
  //     "A command must have at least 3 words but it had less",
  //     words.length,
  //     words
  //   );
  //   return;
  // }
  console.log(event.text);
  if (event.text.includes("introduce yourself")) {
    await introduce_yourself_action(event);
    return;
  }

  if (event.text.includes("compliment")) {
    await compliment_action(event);
    return;
  }

  console.log("Unsupported command", words[1]);
  //
  //
  // // if (words[0] != "@unibot") {
  // //   console.log("First word must be @unibot but it wasn't", words[0]);
  // //   return;
  // // }
  //
  // switch (words[1]) {
  //   case "compliment":
  //     // TODO: Verify that the third argument is a valid username
  //     await compliment_action(event.user, words[2]);
  //
  //     break;
  //   default:
  //     break;
  // }
};
