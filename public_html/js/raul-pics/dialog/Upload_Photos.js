// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("raul-pics/dialog/Upload_Photos.js", [
    "Mary/dom",
    "Mary/html",
    "Mary/css",
    "Mary/gui/Message_Box",
    "Mary/svr/Server_Request",
    "raul-pics/dialog/Error",
    "raul-pics/global/consts",
    "raul-pics/meta.js"
], function (dom, html, CSS, Message_Box, Server_Request, Dialog_Error, consts, meta) {

    /* consts */
    const css_id = "Raul_Pics__View_Dialog_Upload_Photos";
    const message_box_options = Object.assign({ auto_close: false }, consts.message_box_options);

    /* css */
    const css = CSS(css_id);

    css.define("", `
        height: 50%;
    `);

    css.define(".Upload_Button", `
        border: 2px solid ${css.white(0.8)};
        border-radius: 12px;
        margin: 6px auto;
        padding: 12px;
        width: 100%;
        font-family: "Orkney Regular";
        font-size: 16px;
        text-align: center;
        cursor: pointer;
    `);

    css.define(".Photos_List", `
        width: 100%;
        height: 100%;
        text-align: left;
        
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
    `);

    css.define(".Photos_List_Item", `
        margin: 2px;
        font-size: 12px;
    `);

    /* constructor */
    async function Upload_Photos(viewport, album_id) {
        const [create_passed, create_data] = await post_create(album_id);
        if (!create_passed) {
            Dialog_Error(viewport, "Error:", create_data.error);
            return;
        }
        const request_id = create_data.request_id;
        const jobs_arr = [];
        choose_defaults();

        // defaults
        async function choose_defaults() {
            dialog_choose({ photo_folder: "defaults", confirm_func: confirm_defaults });
        };
        async function confirm_defaults(files) {
            dialog_confirm({ photo_folder: "defaults", files, add_func: add_defaults, choose_func: choose_defaults });
        };
        async function add_defaults(files) {
            const default_type = await typify_defaults();
            if (default_type) {
                dialog_add({ photo_folder: "defaults", files, default_type, next_func: choose_thumbs });
            }
        };
        // thumbs
        async function choose_thumbs() {
            dialog_choose({ photo_folder: "thumbs", confirm_func: confirm_thumbs });
        };
        async function confirm_thumbs(files) {
            dialog_confirm({ photo_folder: "thumbs", files, add_func: add_thumbs, choose_func: choose_thumbs });
        };
        async function add_thumbs(files) {
            dialog_add({ photo_folder: "thumbs", files, next_func: choose_opposites });
        };
        // opposites
        async function choose_opposites() {
            dialog_choose({ photo_folder: "opposites", confirm_func: confirm_opposites, skip_func: choose_overlays });
        };
        async function confirm_opposites(files) {
            dialog_confirm({ photo_folder: "opposites", files, add_func: add_opposites, choose_func: choose_opposites });
        };
        async function add_opposites(files) {
            dialog_add({ photo_folder: "opposites", files, next_func: choose_overlays });
        };
        // overlays
        async function choose_overlays() {
            dialog_choose({ photo_folder: "overlays", confirm_func: confirm_overlays, skip_func: choose_alternates });
        };
        async function confirm_overlays(files) {
            dialog_confirm({ photo_folder: "overlays", files, add_func: add_overlays, choose_func: choose_overlays });
        };
        async function add_overlays(files) {
            dialog_add({ photo_folder: "overlays", files, next_func: choose_alternates });
        };
        // alternates
        async function choose_alternates() {
            dialog_choose({ photo_folder: "alternates", confirm_func: confirm_alternates, skip_func: choose_originals });
        };
        async function confirm_alternates(files) {
            dialog_confirm({ photo_folder: "alternates", files, add_func: add_alternates, choose_func: choose_alternates });
        };
        async function add_alternates(files) {
            dialog_add({ photo_folder: "alternates", files, next_func: choose_originals });
        };
        // originals
        async function choose_originals() {
            dialog_choose({ photo_folder: "originals", confirm_func: confirm_originals, skip_func: confirm_jobs });
        };
        async function confirm_originals(files) {
            dialog_confirm({ photo_folder: "originals", files, add_func: add_originals, choose_func: choose_originals });
        };
        async function add_originals(files) {
            dialog_add({ photo_folder: "originals", files, next_func: confirm_jobs });
        };

        // jobs
        async function confirm_jobs() {
            const msg_box = Message_Box(viewport, viewport, message_box_options)
                .section(`Are you ready to upload the images?`)
                .button("Yes", () => fulfill_jobs())
                .button("Cancel", async function () {
                    const [cancel_passed, cancel_data] = await post_cancel(request_id);
                    if (!cancel_passed) {
                        Dialog_Error(viewport, "Error:", cancel_data.error);
                    }
                });
        };

        async function fulfill_jobs() {
            let top_div;
            const msg_box = Message_Box(viewport, viewport, message_box_options)
                .section(`Uploading Photos`)
                .div(undefined, data => top_div = data.div_dom.attr(`id=${css_id}`))
                .button("Cancel", async function () {
                    const [cancel_passed, cancel_data] = await post_cancel(request_id);
                    if (!cancel_passed) {
                        Dialog_Error(viewport, "Error:", cancel_data.error);
                    }
                });
            for (const [job_id, file] of jobs_arr) {
                top_div.setText(file.name);
                const photo_data = await consts.get_file_data_base64(file);
                const [job_passed, job_data] = await put_job({ request_id, job_id, photo_data });
                if (!job_passed) {
                    const [cancel_passed, cancel_data] = await post_cancel(request_id);
                    if (!cancel_passed) {
                        Dialog_Error(viewport, "Error:", [job_data.error, cancel_data.error]);
                    } else {
                        Dialog_Error(viewport, "Error:", job_data.error);
                    }
                    msg_box.close();
                    return;
                }
            }

            msg_box.close();

            const [destroy_passed, destroy_data] = await post_destroy(request_id);
            if (!destroy_passed) {
                Dialog_Error(viewport, "Error:", destroy_data.error);
            } else {
                report();
            }
        };

        async function report() {
            const msg_box = Message_Box(viewport, viewport, message_box_options)
                .section("Added Photos!")
                .button("Okay");
        };

        /* dialogs */
        async function dialog_choose({ photo_folder, confirm_func, skip_func }) {
            let top_div;
            const msg_box = Message_Box(viewport, viewport, message_box_options)
                .section(`Choose ${photo_folder}`)
                .div(undefined, data => top_div = data.div_dom.attr(`id=${css_id}`));
            if (skip_func) {
                msg_box.button("Skip", () => skip_func())
            }
            msg_box.button("Cancel", async function () {
                const [cancel_passed, cancel_data] = await post_cancel(request_id);
                if (!cancel_passed) {
                    Dialog_Error(viewport, "Error:", cancel_data.error);
                }
            });
            const photos_input = dom(html.input, top_div)
                .attr(["type=file", "multiple", "accept=image/jpeg"])
                .on("change", () => {
                    const files = Array.from(photos_input.first.files).sort();
                    confirm_func(files);
                    msg_box.close();
                })
                .hide();
            const photos_input_button = dom(html.button, top_div)
                .class("Upload_Button")
                .setText(`Choose ${photo_folder}`)
                .on("click", () => photos_input.click());
        };

        async function dialog_confirm({ files, photo_folder, add_func, choose_func }) {
            let top_div;
            const msg_box = Message_Box(viewport, viewport, message_box_options)
                .section(`Add these ${photo_folder}?`)
                .div(undefined, data => top_div = data.div_dom.attr(`id=${css_id}`))
                .button("Yes", () => add_func(files))
                .button("No", () => choose_func())
                .button("Cancel", async function () {
                    const [cancel_passed, cancel_data] = await post_cancel(request_id);
                    if (!cancel_passed) {
                        Dialog_Error(viewport, "Error:", cancel_data.error);
                    }
                });
            const photos_list = dom(html.div, top_div)
                .class("Photos_List");
            for (const file of files) {
                dom(html.div, photos_list)
                    .class("Photos_List_Item")
                    .setText(`- ${file.name}`);
            }
        };

        async function dialog_add({ files, photo_folder, default_type, next_func }) {
            let top_div;
            const msg_box = Message_Box(viewport, viewport, message_box_options)
                .section(`Adding ${photo_folder}`)
                .div(undefined, data => top_div = data.div_dom.attr(`id=${css_id}`))
                .button("Cancel", async function () {
                    const [cancel_passed, cancel_data] = await post_cancel(request_id);
                    if (!cancel_passed) {
                        Dialog_Error(viewport, "Error:", cancel_data.error);
                    }
                });
            for (const file of files) {
                const photo_name = file.name;
                top_div.setText(file.name);
                const job_data = { request_id, photo_name, photo_folder };
                if (default_type) {
                    job_data.default_type = default_type;
                }
                const [post_job_passed, post_job_data] = await post_job(job_data);
                if (!post_job_passed) {
                    const [cancel_passed, cancel_data] = await post_cancel(request_id);
                    if (!cancel_passed) {
                        Dialog_Error(viewport, "Error:", [post_job_data.error, cancel_data.error]);
                    } else {
                        Dialog_Error(viewport, "Error:", post_job_data.error);
                    }
                    msg_box.close();
                    return;
                }
                jobs_arr.push([post_job_data.job_id, file]);
            }
            msg_box.close();
            next_func();
        };

        async function typify_defaults() {
            return new Promise(function (res) {
                Message_Box(viewport, viewport, message_box_options)
                    .section("Are these digital or physical?")
                    .button("Digital", () => res("digital"))
                    .button("Physical", () => res("physical"))
                    .button("Cancel", async function () {
                        const [cancel_passed, cancel_data] = await post_cancel(request_id);
                        if (!cancel_passed) {
                            Dialog_Error(viewport, "Error:", cancel_data.error);
                        }
                        res(null);
                    });
            });
        };
    };

    /* requests */
    async function post_create(album_id) {
        return new Promise(function (res) {
            Server_Request("POST", "/upload/photos/create")
                .headers({ "csrf-token": consts.get_csrf_token() })
                .listen(201, data => res([true, data ? JSON.parse(data) : undefined]))
                .listen(null, (status, data) => res([false, data ? JSON.parse(data) : undefined]))
                .listen("error", () => res([false]))
                .listen("abort", () => res([false]))
                .timeout(10000)
                .send(JSON.stringify({ album_id }));
        });
    };

    async function post_destroy(request_id) {
        return new Promise(function (res) {
            Server_Request("POST", "/upload/photos/destroy")
                .headers({ "csrf-token": consts.get_csrf_token() })
                .listen(201, data => res([true, data ? JSON.parse(data) : undefined]))
                .listen(null, (status, data) => res([false, data ? JSON.parse(data) : undefined]))
                .listen("error", () => res([false]))
                .listen("abort", () => res([false]))
                .timeout(10000)
                .send(JSON.stringify({ request_id }));
        });
    };

    async function post_cancel(request_id) {
        return new Promise(function (res) {
            Server_Request("POST", "/upload/photos/cancel")
                .headers({ "csrf-token": consts.get_csrf_token() })
                .listen(201, data => res([true, data ? JSON.parse(data) : undefined]))
                .listen(null, (status, data) => res([false, data ? JSON.parse(data) : undefined]))
                .listen("error", () => res([false]))
                .listen("abort", () => res([false]))
                .timeout(10000)
                .send(JSON.stringify({ request_id }));
        });
    };

    async function post_job(request_data) {
        return new Promise(function (res) {
            Server_Request("POST", "/upload/photos/job")
                .headers({ "csrf-token": consts.get_csrf_token() })
                .listen(201, data => res([true, data ? JSON.parse(data) : undefined]))
                .listen(null, (status, data) => res([false, data ? JSON.parse(data) : undefined]))
                .listen("error", () => res([false]))
                .listen("abort", () => res([false]))
                .send(JSON.stringify(request_data));
        });
    };

    async function put_job(request_data) {
        return new Promise(function (res) {
            Server_Request("PUT", "/upload/photos/job")
                .headers({ "csrf-token": consts.get_csrf_token() })
                .listen(200, data => res([true, data ? JSON.parse(data) : undefined]))
                .listen(null, (status, data) => res([false, data ? JSON.parse(data) : undefined]))
                .listen("error", () => res([false]))
                .listen("abort", () => res([false]))
                .send(JSON.stringify(request_data));
        });
    };

    /* exports */
    return Upload_Photos;

});
