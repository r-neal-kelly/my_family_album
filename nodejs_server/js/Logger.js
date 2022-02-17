// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

/* requires */
const fs = require("fs");

const consts = require("./consts.js");

/* constructor */
function Logger() {
    const inst = Object.create(Logger.prototype);
    inst.path = undefined;
    inst.stream = undefined;
    return get_new_stream(inst).then(() => inst);
};

Logger.prototype = {};

/* statics */
async function get_curr_log_path() {
    const now = new Date();
    const curr_log_name = `log_${now.getMonth() + 1}_${now.getDate()}_${now.getFullYear()}.txt`;
    const curr_log_path = `./log/${curr_log_name}`;
    return curr_log_path;
};

async function get_new_stream(inst) {
    const curr_log_path = await get_curr_log_path();
    if (!await consts.fs_exists(curr_log_path)) {
        await consts.fs_writeFile(curr_log_path, "", "utf8");
    }
    const log_stream = fs.createWriteStream(curr_log_path, {
        flags: "a",
        encoding: "utf8"
    });
    inst.path = curr_log_path;
    inst.stream = log_stream;
    return inst;
};

async function validate_stream(inst) {
    if (inst.path !== get_curr_log_path()) {
        if (inst.stream) {
            inst.stream.end();
        }
        await get_new_stream(inst);
    }
};

/* methods */
Logger.prototype.log = async function (header = "", body = undefined, error_stack_str = undefined) {
    const inst = this;
    const stack_str = error_stack_str ?
        error_stack_str.replace(/^[^\n]+\n/, "") : undefined;
    await validate_stream(inst);
    inst.stream.write(
        `${new Date().toString()}\n` +
        `${header}\n` +
        (body ? `${body}\n` : ``) +
        (stack_str ? `${stack_str}\n\n` : `\n`),
        "utf8"
    );
};

/* exports */
module.exports = Logger;
