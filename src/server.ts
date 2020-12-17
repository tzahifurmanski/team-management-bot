import { loadSlackConfig } from "./integrations/slack/events";
import {
  getAskChannelStatsForYesterday,
  postWeeklyLeadsStats,
} from "./logic/cron_jobs";

// import config from

const config = require("../config.json");
const cron = require("node-cron");

const { createServer } = require("http");
const express_app = require("./server_init");

const SERVER_PORT = config.SERVER_PORT || 3000;

async function init() {
  // TODO: Loading takes time now - I think this is the issue
  const loadResult = await loadSlackConfig();
  if (!loadResult) {
    console.log("Loading failed!");
    process.exit(0);
  }

  // Schedule a cron job to post a daily summary of the requests from yesterday every morning at 10 AM (IL time)
  // Post in the chatter channel every sun-friday at 10 PM
  // cron.schedule("25 21 * * * *", () => {
  cron.schedule("0 10 * * 0-5", () => {
    getAskChannelStatsForYesterday();
  });

  // 0 12 * * 2
  // cron.schedule("25 21 * * * *", () => {
  // Post in the leads channel every tuesday at 12 PM
  cron.schedule("0 12 * * 2", () => {
    postWeeklyLeadsStats();
  });

  const server = createServer(express_app);
  server.listen(SERVER_PORT, () => {
    // Log a message when the server is ready
    console.log(`Listening for events on ${server.address().port}`);
  });

  server.on("close", async () => {
    try {
      console.log("Server is now closing");
    } finally {
      process.exit(0);
    }
  });

  // TODO: This does not fire when I abort the server with CTRL+C
  process.on("SIGTERM", () => {
    // When SIGTERM is received, do a graceful shutdown

    server.close(() => {
      console.log("Process terminated");
    });
  });
}

init().then(() => console.log("Finished initialisation"));
