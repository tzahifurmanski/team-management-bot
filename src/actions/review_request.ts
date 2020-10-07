const { sendSlackMessage } = require("../integrations/slack/messages");

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
  if (event.thread_ts) {
    // This is a thread, do nothing
    return;
  }

  const gif = getRandomGif();

  // Reply in a thread
  await sendSlackMessage(gif, event.channel, event.ts);
};
