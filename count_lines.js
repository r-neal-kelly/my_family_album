// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

/* requires */
const fs = require("fs");

/* funcs */
const fs_stat = async function (path) {
    return await new Promise(function (res, rej) {
        fs.stat(path, function (err, stats_obj) {
            err ? res(null) : res(stats_obj);
        });
    }).catch(err => { });
};

const fs_readdir = async function (path, options) {
    return await new Promise(function (res) {
        fs.readdir(path, options, function (err, files) {
            err ? res(null) : res(files);
        });
    }).catch(err => { });
};

const fs_readFile = async function (path, options) {
    return await new Promise(function (res, rej) {
        fs.readFile(path, options, function (err, data) {
            err ? res(null) : res(data);
        });
    }).catch(err => { });
};

// app
async function app() {
    const dir_paths = ["./"];
    let total_lines = 0;

    for (const dir_path of dir_paths) {
        const file_paths = await fs_readdir(dir_path, "utf8");
        for (const file_path of file_paths) {
            const abs_path = `${dir_path}/${file_path}`;
            const stats = await fs_stat(abs_path);
            if (stats.isDirectory()) {
                dir_paths.push(abs_path);
            } else if (/\.js$/.test(abs_path)) {
                const file_str = await fs_readFile(abs_path, "utf8");
                const matches = file_str.match(/\n/g);
                if (matches) {
                    total_lines += matches.length;
                }
            }
        }
    }

    console.log(total_lines);
};

app();
