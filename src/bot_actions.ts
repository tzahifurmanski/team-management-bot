const { sendSlackMessage } = require("./slack");

export const post_init = async function () {
  await sendSlackMessage("unibot is initialising!");
};

export const app_mention = async function (event: any) {
  await sendSlackMessage("unibot got a command!");
  await sendSlackMessage(event);
};
