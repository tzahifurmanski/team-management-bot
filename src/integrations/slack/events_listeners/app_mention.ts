import { handleDirectEvent } from "../../../bot_actions";

const appMentionCallback = async ({event, client, logger}: any) => {
    try {
        // If this is an edit to an existing mention, don't reply anything
        if (event.reply_count) {
            return;
        }
        await handleDirectEvent(event, client);
    }
    catch (error) {
        logger.error(error);
    }
};

module.exports = { appMentionCallback };