// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

const path_to_mary = "./Mary/lib";
const file_sys = require(`${path_to_mary}/node_modules/file_sys`);

file_sys.folder.copy(`${path_to_mary}/node_modules`, "./nodejs_server/Mary/node_modules", {
    delete_destination: true
});

file_sys.folder.copy(`${path_to_mary}/modules`, "./public_html/js/Mary/modules", {
    delete_destination: true
});

file_sys.file.copy(`${path_to_mary}/init.js`, "./public_html/js/Mary/init.js");
