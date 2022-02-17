// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

/* requires */
const fs = require("fs");
const path_ = require("path");

const consts = require("./consts.js");

/* process */
async function process_get(req, res, pathname) {
    const results = await get_res_data(pathname, true);
    if (results) {
        return consts.write_200(res, results.data, results.content_type);
    } else {
        return consts.write_404(res);
    }
};

/* handlers */
async function get_res_data(pathname, is_public = true) {
    pathname = is_public ?
        consts.resolve_public_path(pathname) :
        consts.resolve_private_path(pathname);

    const stats_obj = await consts.fs_stat(pathname);

    if (!stats_obj) {
        return undefined;
    }

    if (stats_obj.isDirectory()) {
        return {
            data: await get_dir_html(pathname),
            content_type: "text/html; charset=utf-8"
        };
    } else {
        const ext = path_.parse(pathname).ext;
        const content_type = consts.get_ext_mime(ext);
        const data_type = consts.binary_exts.includes(ext) ? null : "utf8";
        return {
            data: await consts.fs_readFile(pathname, data_type),
            content_type: content_type
        };
    }
};

async function get_dir_html(path) {
    const actual_path = path.replace(/\\/g, "/").replace(/\/$/, "");
    const seen_path = actual_path.replace(/\.\.\/public_html/, ""); // make variable
    const dir_arr = fs.readdirSync(path).map(function (item) {
        if (fs.statSync(`${actual_path}/${item}`).isDirectory()) {
            // "/" has a low unicode value, so it sorts high
            item = "/" + item;
        }
        return item;
    }).sort();
    const links = dir_arr.map(item => {
        if (item[0] === "/") {
            return `<a href="${seen_path}${item}">${item}</a><br>\n`;
        } else {
            return `<a href="${seen_path}/${item}">${item}</a><br>\n`;
        }
    });
    const parent_path = seen_path.replace(/\/[^\/]*$/, "") || "/";
    return (`
        <!-- Copyright Neal Raulerson 2019. All Rights Reserved. -->
        <!DOCTYPE html>
        <html>
        <head>
            <title>${seen_path}</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
            <style>a { font-family: sans-serif }</style>
        </head>
        <body>
            <h1>${seen_path}</h1>
            <a href="/">/</a><br>\n
            <a href="${parent_path}">../</a><br>\n
            ${links.join("")}
        </body>
        </html>
    `);
};

/* exports */
module.exports = process_get;
