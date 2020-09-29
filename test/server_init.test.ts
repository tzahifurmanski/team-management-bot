const supertest = require("supertest");
const tested_app = require("../src/server_init");

let tested_server: any;
let agent: any;

describe("Server endpoints", () => {
  beforeAll(async (done) => {
    tested_server = tested_app.listen(4000, () => {
      agent = supertest.agent(tested_server);
      done();
    });
  });

  afterEach(async () => {
    await tested_server.close();
  });

  describe("Heartbeat", () => {
    test("Successful response", async () => {
      const response = await agent.get("/status");
      expect(response.status).toBe(200);
    });
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(() => resolve(), 500)); // avoid jest open handle error
  });
});
