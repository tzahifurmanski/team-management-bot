// Load the .env file config
require("dotenv").config();

import { loadSlackConfig } from "./integrations/slack/events";
import {getAskChannelStatsForYesterday, getOncallTicketsStatus} from "./logic/cron_jobs";

const cron = require("node-cron");

const { createServer } = require("http");
const express_app = require("./server_init");

const SERVER_PORT = process.env.PORT || 3000;

async function init() {
  const loadResult = await loadSlackConfig();
  if (!loadResult) {
    console.log("Loading failed!");
    process.exit(0);
  }

  await scheduleCronJobs();

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

// Cool website for scheduling
// https://crontab.guru/#0_12_*_*_2
const scheduleCronJobs = async function () {
  const askChannelStatsCron = process.env.ASK_CHANNEL_STATS_CRON;
  if (askChannelStatsCron) {
    console.log(
      `Setting up a cron to update on ask channel stats (cron:  ${askChannelStatsCron}).`
    );
    cron.schedule(askChannelStatsCron, () => {
      getAskChannelStatsForYesterday();
    })
  }

  const oncallTicketsStatsCron = process.env.ONCALL_TICKETS_STATS_CRON;
  if (oncallTicketsStatsCron) {
    console.log(
        `Setting up a cron to update on oncall tickets stats (cron:  ${oncallTicketsStatsCron}).`
    );
    cron.schedule(oncallTicketsStatsCron, () => {
      getOncallTicketsStatus();
    });
  }

  // Post in the leads channel every tuesday at 12 PM - DISABLED
  // cron.schedule("0 12 * * 2", () => {
  //   postWeeklyLeadsStats();
  // });
};

init().then(() => console.log("Finished initialisation"));
