// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("raul-pics/dialog/Zip", [
    "Mary/utils",
    "Mary/dom",
    "Mary/html",
    "Mary/gui/Message_Box",
    "Mary/gui/Context_Menu",
    "Mary/svr/Server_Request",
    "raul-pics/global/consts"
], function (utils, dom, html, Message_Box, Context_Menu, Server_Request, consts) {

    /* consts */
    const msg_box_zip_options = Object.assign({ auto_close: false }, consts.message_box_options);

    /* constructor */
    function Zip(viewport, gallery_name, photos_arr, add_related) {
        let cancel_zip_id = null;
        let zip_progress_div;
        const please_wait_msg_box = Message_Box(viewport, viewport, msg_box_zip_options)
            .section("Please wait...")
            .text("", data => {
                zip_progress_div = data.text_dom;
            })
            .button("Cancel Download", evt_button => {
                evt_button.prevent_default = true;
                if (cancel_zip_id === null) {
                    return;
                }
                const req = Server_Request("PUT", `/tmp/zip/cancel/${cancel_zip_id}`)
                    .listen(400, err => console.log(err))
                    .send();
            });
        new Promise(function (res, rej) {
            const req = Server_Request("POST", "/tmp/zip/generate")
                .headers({
                    "Content-Type": "application/json",
                    "Accept": "text/plain"
                })
                .listen(201, zip_id => res(zip_id))
                .listen(400, err => rej([400, err]))
                .listen(429, err => rej([429, err]))
                .send(JSON.stringify({
                    photos_arr: photos_arr,
                    add_related: add_related
                }));
        }).then(zip_id => {
            cancel_zip_id = zip_id;
            function get_zip_progress_until_done(callback_when_done) {
                new Promise(function (res, rej) {
                    const req = Server_Request("GET", `/tmp/zip/progress/${zip_id}`)
                        .listen(200, msg => res([200, msg]))
                        .listen(201, msg => res([201, msg]))
                        .listen(204, msg => res([204, msg]))
                        .listen(500, err => rej([500, err]))
                        .send();
                }).then(([code, msg]) => {
                    if (code === 201) {
                        zip_progress_div.setText(msg);
                        callback_when_done();
                    } else if (code === 200) {
                        zip_progress_div.setText(msg);
                        setTimeout(() => {
                            get_zip_progress_until_done(callback_when_done);
                        }, 1000);
                    } else if (code === 204) {
                        please_wait_msg_box.close(); // canceled
                    }
                }).catch(([code, err]) => {
                    please_wait_msg_box.close();
                    Message_Box(viewport, viewport, msg_box_zip_options)
                        .section(`Error: ${code}`)
                        .text(err)
                        .button("Close");
                });
            };
            get_zip_progress_until_done(function when_done() {
                const zip_name = `${gallery_name}.zip`;
                const zip_path = `/tmp/zip/${zip_id}.zip`;
                please_wait_msg_box.close();
                Message_Box(viewport, viewport, msg_box_zip_options)
                    .section(zip_name)
                    .text("Your zip is now ready for download!")
                    .download("Download", zip_path, zip_name, evt_button => {
                        const req = Server_Request("DELETE", `/tmp/zip/${zip_id}`)
                            .send();
                    })
                    .button("Cancel Download", evt_button => {
                        const req = Server_Request("DELETE", `/tmp/zip/${zip_id}`)
                            .send();
                    });
            });
        }).catch(([code, err]) => {
            please_wait_msg_box.close();
            Message_Box(viewport, viewport, msg_box_zip_options)
                .section(`Error: ${code}`)
                .text(err)
                .button("Close");
        });
    };

    /* exports */
    return Zip;

});
