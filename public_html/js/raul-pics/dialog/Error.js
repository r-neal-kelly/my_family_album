// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("raul-pics/dialog/Error", [
    "Mary/dom",
    "Mary/html",
    "Mary/gui/Message_Box",
    "raul-pics/global/consts"
], function (dom, html, Message_Box, consts) {

    /* constructor */
    function Error(viewport, message, errors_arr) {
        errors_arr = [].concat(errors_arr);
        let error_div;
        Message_Box(viewport, viewport, consts.message_box_options)
            .section(message)
            .div(undefined, mb_div => {
                error_div = mb_div.div_dom;
            })
            .button("Okay");
        for (const error_str of errors_arr) {
            dom(html.div, error_div)
                .class("Dialog_Error_Item")
                .setText(error_str);
        }
    };

    /* exports */
    return Error;

});
