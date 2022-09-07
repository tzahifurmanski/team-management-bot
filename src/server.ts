// Always load consts first
import {ASK_CHANNEL_STATS_CRON, LEADS_SUMMARY_CRON, ONCALL_TICKETS_STATS_CRON, PORT} from "./consts";
import {loadSlackConfig, LEADS_SUMMARY_CHANNEL_ID, LEADS_SUMMARY_CHANNEL_NAME} from "./integrations/slack/consts";
import {getAskChannelStatsForYesterday, getOncallTicketsStatus, postWeeklyLeadsStats} from "./logic/cron_jobs";

const cron = require("node-cron");
import cronstrue from 'cronstrue';

const { createServer } = require("http");
const express_app = require("./server_init");



async function init() {
  // Print server time
  console.log(`Server starting at ${new Date().toUTCString()}, version ${process.env.npm_package_version}`);

  const loadResult = await loadSlackConfig();
  if (!loadResult) {
    console.log("Loading failed!");
    process.exit(0);
  }

  await scheduleCronJobs();

  const server = createServer(express_app);
  server.listen(PORT, () => {
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
// TODO: Move this to be part of a command initialization - AKA if the ASK CHANNEL command is initialized, add the cron
const scheduleCronJobs = async () => {
  if (ASK_CHANNEL_STATS_CRON) {
    console.log(
      `Setting up a cron to update on ask channel stats (cron: ${ASK_CHANNEL_STATS_CRON}, ${cronstrue.toString(ASK_CHANNEL_STATS_CRON)}`
    );
    cron.schedule(ASK_CHANNEL_STATS_CRON, () => {
      getAskChannelStatsForYesterday();
    })
  }

  if (ONCALL_TICKETS_STATS_CRON) {
    console.log(
        `Setting up a cron to update on oncall tickets stats (cron:  ${ONCALL_TICKETS_STATS_CRON}, ${cronstrue.toString(ONCALL_TICKETS_STATS_CRON)}).`
    );
    cron.schedule(ONCALL_TICKETS_STATS_CRON, () => {
      getOncallTicketsStatus();
    });
  }

  if (LEADS_SUMMARY_CHANNEL_ID || LEADS_SUMMARY_CHANNEL_NAME)
  {
    console.log(
        `Setting up a cron to post a leads summary (cron:  ${ONCALL_TICKETS_STATS_CRON}).`
    );

    cron.schedule(LEADS_SUMMARY_CRON, () => {
      postWeeklyLeadsStats();
    });
  }
};

init().then(() => console.log("Finished initialisation"));
