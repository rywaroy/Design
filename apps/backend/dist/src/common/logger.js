"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
require("winston-daily-rotate-file");
const logger = (0, winston_1.createLogger)({
    level: 'info',
    format: winston_1.format.combine(winston_1.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
    }), winston_1.format.json()),
    transports: [
        new winston_1.transports.Console(),
        new winston_1.transports.DailyRotateFile({
            level: 'info',
            dirname: 'logs',
            filename: '%DATE%.log',
            datePattern: 'YYYY-MM-DD',
        }),
    ],
});
exports.default = logger;
//# sourceMappingURL=logger.js.map