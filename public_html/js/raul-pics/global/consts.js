// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("raul-pics/global/consts", [
    "Mary/utils",
    "Mary/parse",
    "Mary/svr/Server_Request"
], function (utils, parse, Server_Request) {

    const consts = {};

    // numbers
    consts.GALLERY_TYPE_ALBUM = 0;
    consts.GALLERY_TYPE_TAG = 1;
    consts.GALLERY_TYPE_FILTER = 2;

    // objects
    consts.message_box_options = {
        message_box_class: "General_Message_Box",
        section_class: "General_Message_Box_Section",
        button_class: "General_Message_Box_Button",
        textarea_class: "General_Message_Box_Textarea",
        input_class: "General_Message_Box_Input",
        checkbox_class: "General_Message_Box_Checkbox",
        text_class: "General_Message_Box_Text",
        dropzone_class: "General_Message_Box_Dropzone"
    };
    Object.freeze(consts.message_box_options);

    consts.context_menu_options = {
        menu_class: ["General_Context_Menu", "Disabled_Text_Selection"],
        section_class: ["General_Context_Menu_Section", "Enabled_Text_Selection"],
        button_class: "General_Context_Menu_Button",
        textarea_class: ["General_Context_Menu_Textarea", "Enabled_Text_Selection"],
        input_class: "General_Context_Menu_Input"
    };
    Object.freeze(consts.context_menu_options);

    // functions
    consts.get_link_url = function (gallery_type, gallery_id, picture_id) {
        let url =
            `${document.location.protocol}//` +
            `${document.location.host}/?`;
        let add_amp = false;

        if (utils.bool.exists(gallery_type)) {
            url = add_amp ? url + "&" : url;
            url += `t=${parse.url.encode_segment(gallery_type.toString(), true)}`;
            add_amp = true;
        }

        if (utils.bool.exists(gallery_id)) {
            url = add_amp ? url + "&" : url;
            url += `g=${parse.url.encode_segment(gallery_id, true)}`;
            add_amp = true;
        }

        if (utils.bool.exists(picture_id)) {
            url = add_amp ? url + "&" : url;
            url += `p=${parse.url.encode_segment(picture_id, true)}`;
            add_amp = true;
        }

        return url;
    };

    consts.get_picture_name = function (gallery_title_str, picture_num) {
        return `${gallery_title_str} ${parse.pad(String(picture_num), "0", 4)}`;
    };

    consts.get_csrf_token = function () {
        return parse.cookies(document.cookie).csrf_token;
    };

    consts.get_file_data_base64 = async function (file) {
        return new Promise(function (res) {
            const file_reader = new FileReader();
            file_reader.onload = () => {
                const split_idx = file_reader.result.indexOf(",");
                res(file_reader.result.slice(split_idx + 1));
            };
            file_reader.onerror = () => res(null);
            file_reader.readAsDataURL(file);
        });
    };

    // requests
    consts.get_pre_session = function () {
        return new Promise(function (res) {
            Server_Request("POST", "/user/pre-session")
                .listen(201, () => res(true))
                .listen(null, () => res(false))
                .send();
        });
    };

    consts.logout = async function () {
        const csrf_token = consts.get_csrf_token();
        return new Promise(function (res) {
            Server_Request("POST", "/user/logout")
                .headers({
                    "Content-Type": "application/json"
                })
                .listen(201, data => {
                    res([true, data]);
                })
                .listen(401, failures => {
                    res([false, JSON.parse(failures)]);
                })
                .send(JSON.stringify({
                    csrf_token: csrf_token
                }));
        });
    };

    consts.get_link_info = async function (link_obj) {
        const [passed, data] = await new Promise(function (res) {
            Server_Request("POST", "/get_link_info")
                .listen(201, data => res([true, JSON.parse(data)]))
                .listen(null, (status, data) => res([false]))
                .send(JSON.stringify({
                    link_obj
                }));
        });
        if (passed) {
            return data.link_info;
        } else {
            return null;
        }
    };

    /* exports */
    Object.freeze(consts);
    return consts;

});
