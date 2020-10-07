const { sendSlackMessage } = require("../integrations/slack/messages");

const GIFS = [
  "https://media.giphy.com/media/3o7aCVYdxJUQmWI0z6/giphy.gif",
  "https://media.giphy.com/media/uVz7iwTMSDR5e/giphy.gif",
  "https://media.giphy.com/media/3o7WTwUXv4hsQ5bhEk/giphy.gif",
];

const getRandomGif = function () {
  const random = Math.floor(Math.random() * GIFS.length);
  return GIFS[random];
};

export const bug_action = async function (event: any) {
  if (event.thread_ts) {
    // This is a thread, do nothing
    return;
  }

  const gif = getRandomGif();

  // Reply in a thread
  await sendSlackMessage(gif, event.channel, event.ts);
};
