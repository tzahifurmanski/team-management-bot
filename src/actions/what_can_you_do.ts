const { sendSlackMessage } = require("../slack");

export const what_can_you_do_action = async function (event: any) {
  await sendSlackMessage(
    "Well, at the moment you can ask me to:\n• Introduce myself (`introduce yourself`)\n• Compliment someone (`compliment @Tzahi`)\nBut I'm learning new stuff as I grow old :smiley:",
    event.thread_ts
  );
};
