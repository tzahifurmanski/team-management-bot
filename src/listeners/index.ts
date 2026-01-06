import { App, ExpressReceiver } from "@slack/bolt";
import * as events from "../integrations/slack/events_listeners/index.js";
import * as endpoints from "../integrations/web/endpoints_listeners/index.js";

export const registerListeners = (app: App, receiver: ExpressReceiver) => {
  events.register(app);
  endpoints.register(receiver);
};
