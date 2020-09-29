const config = require("../config.json");
const { createServer } = require("http");
const express_app = require("./server_init");

const SERVER_PORT = config.SERVER_PORT || 3000;

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
