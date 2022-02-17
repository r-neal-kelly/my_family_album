// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

/* requires */
const consts = require("./consts.js");


/* process */
async function process_index(req, res, pathname) {
    if (req.method === "GET") {
        return get_index(req, res);
    } else {
        return consts.write_501(res);
    }
};

/* handlers */
async function get_index(req, res) {
    const index_html = await get_index_html();
    consts.write_200(res, index_html, "text/html; charset=utf-8");
};

async function get_index_html() {
    return `
        <!-- Copyright Neal Raulerson 2019. All Rights Reserved. -->
        <!DOCTYPE html>
        <html>
        <head>
            <title>Raulerson-Pictures</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="mobile-web-app-capable" content="yes" />
            <link rel="shortcut icon" href="./favicon.ico" type="image/x-icon" />
            <script type="text/javascript" src="js/Mary/init.js" defer></script>
            <script type="text/javascript" src="js/main.js" defer></script>
        </head>
        <body>
        </body>
        </html>
    `;
};

/* exports */
module.exports = process_index;
