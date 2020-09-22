const { sendSlackMessage } = require("../slack");

export const what_can_you_do_action = async function (event: any) {
  await sendSlackMessage(
    "Well, at the moment you can ask me to:\n• Introduce myself (`introduce yourself`)\n• Compliment someone (`compliment @Tzahi`)\n• Get you some stats about what goes on in your team channel (`ask channel stats`)\nBut I'm learning new stuff as I grow old :smiley:",
    event.channel,
    event.thread_ts
  );
};
