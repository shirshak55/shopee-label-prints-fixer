import chalk from "chalk";
import fs from "fs";
let timestamp = () => chalk.bgWhite.black(`[${get_human_date_time()}]`.padEnd(15));
function logToFile(type, text) {
    let data = `${get_human_date_time()} === ${type} === ${JSON.stringify(text).replaceAll(/\r?\n/g, "  ")}\n`;
    fs.appendFileSync("./logs.txt", data);
}
export const logger = {
    error: (...s) => {
        logToFile("err", s);
        return console.log(timestamp(), chalk.bgRed.green(`===`), s);
    },
    info: (...s) => {
        logToFile("info", s);
        console.log(timestamp(), chalk.bgBlue.red(`===`), ...s);
    },
    warning: (...s) => {
        logToFile("warn", s);
        console.log(timestamp(), chalk.bgYellow.red(`===`), ...s);
    },
    warn: (...s) => {
        logToFile("warn", s);
        console.log(timestamp(), chalk.bgYellow.red(`===`), ...s);
    },
    success: (...s) => {
        logToFile("success", s);
        console.log(timestamp(), chalk.bgGreen.red(`===`), ...s);
    },
};
export function get_human_date_time(today = null) {
    if (today === null) {
        today = new Date();
    }
    let date = today.getFullYear().toString().padStart(4, "0") +
        "-" +
        (today.getMonth() + 1).toString().padStart(2, "0") +
        "-" +
        today.getDate().toString().padStart(2, "0");
    let time = today.getHours().toString().padStart(2, "0") +
        ":" +
        today.getMinutes().toString().padStart(2, "0") +
        ":" +
        today.getSeconds().toString().padStart(2, "0");
    return `${date} ${time}`;
}
//# sourceMappingURL=log.js.map