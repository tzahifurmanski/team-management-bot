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
Object.defineProperty(exports, "__esModule", { value: true });
exports.app_mention = exports.post_init = void 0;
const { sendSlackMessage } = require("./slack");
exports.post_init = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield sendSlackMessage("unibot is initialising!");
    });
};
exports.app_mention = function (event) {
    return __awaiter(this, void 0, void 0, function* () {
        yield sendSlackMessage("unibot got a command!");
        yield sendSlackMessage(event);
    });
};
//# sourceMappingURL=bot_actions.js.map