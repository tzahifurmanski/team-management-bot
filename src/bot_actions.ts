const { sendSlackMessage } = require("./slack");
import { getRandomCompliment } from "./actions/compliment";

export const post_init = async function () {
  await sendSlackMessage("unibot is initialising!");
};

const compliment_action = async function (sender: string, receiver: string) {
  // TODO: Think of a better way to use the sender / receiver in the message
  const compliment = getRandomCompliment();
  await sendSlackMessage(`${receiver} ${compliment}`);
};

export const app_mention = async function (event: any) {
  // TODO: This assumes that the command is the second word - as the first word is the bot mention. For example "@unibot compliment @Yossi"
  const words = event.text.split(" ");

  if (words.length < 3) {
    console.log(
      "A command must have at least 3 words but it had less",
      words.length
    );
    return;
  }

  if (words[0] != "@unibot") {
    console.log("First word must be @unibot but it wasn't", words[0]);
    return;
  }

  switch (words[1]) {
    case "compliment":
      // TODO: Verify that the third argument is a valid username
      await compliment_action(event.user, words[2]);

      break;
    default:
      console.log("Unsupported command", words[1]);
      break;
  }
};
