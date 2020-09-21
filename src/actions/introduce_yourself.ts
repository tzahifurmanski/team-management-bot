const { sendSlackMessage } = require("../slack");
const config = require("../../config.json");

const TEAM_NAME = config.TEAM_NAME;
const BOT_NAME = config.BOT_NAME;
const BOT_DESCRIPTION = config.BOT_DESCRIPTION;

export const introduce_yourself_action = async function (event: any) {
  await sendSlackMessage(
    `Hi, I'm ${BOT_NAME}, ${BOT_DESCRIPTION} I serve at the pleasure of ${TEAM_NAME}`
  );
};
