const events = require("./../integrations/slack/events_listeners");
const endpoints = require("./../integrations/web/endpoints_listeners");

module.exports.registerListeners = (app: any, receiver: any) => {
  events.register(app);
  endpoints.register(receiver);
};
