import { getBotSlackId } from "../integrations/slack/consts";

const {
  sendSlackMessage,
  getUserIDInText,
} = require("../integrations/slack/messages");

// TODO: Add more / make it funnier :)
// Got compliments from various sources:
// * Some I thought about
// * https://pairedlife.com/friendship/Funny-Compliments-for-Friends
// * https://www.theodysseyonline.com/compliments-cheer-somebody-up
// * https://www.grammarly.com/blog/compliments-for-any-person/
const GIFS = [
  "https://media.giphy.com/media/xThuWcwceLECkXEkKs/giphy.gif",
  "https://media.giphy.com/media/A1RLR7qFez5du/giphy.gif",
  "https://media.giphy.com/media/xThuWoKw5OEcotAY9O/giphy.gif",
  "https://media.giphy.com/media/l2YOgvtL2Fq8McnJu/giphy.gif",
];

const getRandomGif = function () {
  const random = Math.floor(Math.random() * GIFS.length);
  return GIFS[random];
};

export const review_request_action = async function (event: any) {
  // TODO: Think of a better way to use the sender / receiver in the message
  const gif = getRandomGif();

  // let receiver = getUserIDInText(event.text);
  //
  // // If there is no receiver, ignore the compliment request
  // if (!receiver) {
  //   // Handle a 'compliment yourself' situation
  //   if (event.text.includes("compliment yourself")) {
  //     receiver = `<@${getBotSlackId()}>`;
  //     console.log(receiver);
  //   } else {
  //     console.log(`Did not find a receiver in ${event.text}`);
  //     return;
  //   }
  // }

  // TODO: In this can, we want to only look at none-thread messages and then create a thread
  await sendSlackMessage(gif, event.channel, event.thread_ts);
};
