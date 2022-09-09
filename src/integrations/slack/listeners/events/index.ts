const {messageCallback} = require("./message");
const {appMentionCallback} = require("./app_mention");

module.exports.register = (app : any) => {
    console.log("Setting up events...")

    app.event("message", messageCallback);
    app.event("app_mention", appMentionCallback);

    // All errors in listeners are caught here. If this weren't caught, the program would terminate.
    app.error((error: any ) => {
        // TODO: Add better error handling
        console.error(error);
    });

    console.log("Done setting up events.")
};