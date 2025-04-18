import * as receivers from "./endpoints_listeners/index.js";
export const registerReceivers = (receiver: any) => {
  receivers.register(receiver);
};
