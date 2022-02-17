"use strict";

const pth = require("path");
const fs = require("fs");
const child_process = require("child_process");

function make_thumb(source_path, destination_path, px = 150) {
    // path to img has to be absolute for irfranview. must use forward slashes.
    source_path = pth.resolve(source_path).replace(/\\/g, "/");
    destination_path = pth.resolve(destination_path).replace(/\\/g, "/");
    child_process.spawnSync("i_view64.exe", [
        `"${source_path}"`,
        `/resize_short=${px}`,
        `/aspectratio`,
        `/resample`,
        `/convert="${destination_path}"`
    ], { shell: true });
};

async function app() {
    const dir_path = "./";
    const dir = fs.readdirSync(dir_path, "utf8");
    for (const file_name of dir) {
        const file_path = `${dir_path}/${file_name}`;
        if (/\.jpg$/.test(file_path)) {
            make_thumb(file_path, `${dir_path}/thumbs/${file_name}`);
        }
    }
};

app();
