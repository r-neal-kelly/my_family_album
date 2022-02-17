// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

/* requires */
const http = require("http");
const fs = require("fs");
const url = require("url");
const pth = require("path");

async function main() {
    require(pth.resolve("../public_html/js/Mary/init.js"));
    Mary.set_script_folder_path(pth.resolve("../public_html/js"));

    const consts = require("./js/consts.js");
    const Logger = require("./js/Logger.js");
    consts.logger = await Logger();
    consts.logger.log("Starting server.");
    consts.Sessions = require("./js/Sessions.js");
    consts.Filter = require("./js/Filter.js");
    consts.meta = require("./js/meta.js");

    const process_index = require("./js/process_index.js");
    const process_tmp_zip = require("./js/process_tmp_zip.js");
    const process_user = require("./js/process_user.js");
    const process_get = require("./js/process_get.js");
    const process_meta = require("./js/process_meta.js");
    const process_filter = require("./js/process_filter.js");
    const process_link = require("./js/process_link.js");
    const process_upload_photos = require("./js/process_upload_photos.js");

    (function cleanup() {
        const tmp_paths = [
            consts.tmp_img_path,
            consts.tmp_txt_path,
            consts.tmp_zip_path,
            `${consts.public_html}/tmp`,
            `${consts.public_html}/cgi-bin`
        ];
        setInterval(async function () {
            for (const path of tmp_paths) {
                if (await consts.fs_exists(path)) {
                    new Promise(function (res, rej) {
                        fs.readdir(path, "utf8", (err, files) => {
                            err ? rej(err) : res(files);
                        });
                    }).then(files => {
                        if (files.length === 0) {
                            fs.rmdir(path, err => { });
                        }
                    }).catch(err => { });
                }
            }
        }, consts.minutes_to_milliseconds(15));
    }());

    /* server */
    function listen(svr) {
        if (consts.is_local) {
            svr.listen(3000, "127.0.0.1");
        } else {
            svr.listen();
        }
    };

    function restart(svr) {
        svr.close();
        listen(svr);
    };

    const server = http.createServer(async function (req, res) {
        const pathname = url.parse(req.url).pathname;
        if (pathname === "/" || pathname === "/index.html") {
            process_index(req, res, pathname);
        } else if (pathname.includes("/meta/")) {
            process_meta(req, res, pathname);
        } else if (pathname.includes("/user/")) {
            process_user(req, res, pathname);
        } else if (pathname.includes("/tmp/zip/")) {
            process_tmp_zip(req, res, pathname);
        } else if (pathname.includes("/upload/photos/")) {
            process_upload_photos(req, res, pathname);
        } else if (pathname.includes("/filter/")) {
            process_filter(req, res, pathname);
        } else if (pathname === "/get_link_info") {
            process_link(req, res, pathname);
        } else if (req.method === "GET") {
            process_get(req, res, pathname);
        } else {
            consts.write_501(res);
        }
        res.on("end", () => req.connection.destroy());
    });

    server.on("error", function (err) {
        if (err.code === "EADDRINUSE") {
            setTimeout(() => restart(server), 1000);
        }
    });

    listen(server);
}

main();
