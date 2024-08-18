const receivers = require("./endpoints_listeners");

module.exports.registerReceivers = (receiver: any) => {
  receivers.register(receiver);
};
