const { sendSlackMessage } = require("./slack");

export const post_init = async function () {
  await sendSlackMessage("unibot is initialising!");
};

// TODO: Add more
const COMPLIMENTS_POOL = [
  "Hey <RECEIVER>, just so you'll know - <@<SENDER>> thinks you're as bright as a button! :purple_heart:",
];
const compliment_action = async function (sender: string, receiver: string) {
  // TODO: Implement random
  const compliment = COMPLIMENTS_POOL[0];
  await sendSlackMessage(
    compliment.replace("<RECEIVER>", receiver).replace("<SENDER>", sender)
  );
};

export const app_mention = async function (event: any) {
  await sendSlackMessage("unibot got a mention command!");
  // const message_text = event.text;

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
      compliment_action(event.user, words[2]);

      break;
    default:
      console.log("Unsupported command", words[1]);
      break;
  }
};
