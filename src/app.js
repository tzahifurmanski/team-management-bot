"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var bot_actions_1 = require("./bot_actions");
var slack_1 = require("./slack");
var config = require("../config.json");
var createServer = require("http").createServer;
var bodyParser = require("body-parser");
// Initialize
var SERVER_PORT = config.SERVER_PORT || 3000;
// Send a welcome message
bot_actions_1.post_init();
var express = require("express");
var app = express();
app.use("/slack/", slack_1.slackEvents.requestListener());
// Example: If you're using a body parser, always put it after the event adapter in the middleware stack
// TODO: If the JSON body is invalid there's an ugly exception - SyntaxError: Unexpected token { in JSON at position 498
app.use(bodyParser.json());
app.post("/commands", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var command, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log("Got a command");
                command = req.body;
                if (!command.event) {
                    res.send("Bad command!");
                    console.log("Bad command!");
                    return [2 /*return*/];
                }
                _a = command.event.type;
                switch (_a) {
                    case "app_mention": return [3 /*break*/, 1];
                }
                return [3 /*break*/, 3];
            case 1: return [4 /*yield*/, bot_actions_1.app_mention(command.event)];
            case 2:
                _b.sent();
                res.sendStatus(200);
                // Handle an app_mention event
                return [3 /*break*/, 4];
            case 3:
                console.log("Unsupported command", command);
                res.sendStatus(400);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
console.log("Zigi");
// const server = app.listen(SERVER_PORT, () =>
//   console.log(`Listening for events on ${server.address().port}`)
// );
var server = createServer(app);
server.listen(SERVER_PORT, function () {
    // Log a message when the server is ready
    console.log("Listening for events on " + server.address().port);
});
process.on("SIGTERM", function () {
    // When SIGTERM is received, do a graceful shutdown
    server.close(function () {
        console.log("Process terminated");
    });
});
