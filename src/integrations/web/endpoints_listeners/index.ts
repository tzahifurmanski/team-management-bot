import healthcheck from "./healthcheck";

// Solution based off of: https://github.com/slackapi/bolt-js/issues/212
module.exports.register = (receiver : any) => {
  console.log("Setting up routes...")

  // Other web requests are methods on receiver.router
  receiver.router.get('/healthcheck', healthcheck);

  console.log("Done setting up routes.")
};