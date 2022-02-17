// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("raul-pics/dialog/Link", [
    "Mary/gui/Message_Box",
    "raul-pics/global/consts"
], function (Message_Box, consts) {

    /* constructor */
    function Link(viewport, link_str) {
        let textarea_node;
        Message_Box(viewport, viewport, consts.message_box_options)
            .section("Copy this!")
            .textarea("", data => {
                data.textarea.attr("readonly=true");
                textarea_node = data.textarea.first;
                textarea_node.value = link_str;
                textarea_node.focus();
                textarea_node.setSelectionRange(0, link_str.length);
            })
            .button("copy", data => {
                textarea_node.focus();
                textarea_node.setSelectionRange(0, link_str.length);
                document.execCommand("copy");
            })
            .button("close");
    };

    /* exports */
    return Link;

});
