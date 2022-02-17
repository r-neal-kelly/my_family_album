// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("Mary/gui/Message_Box", [
    "Mary/utils",
    "Mary/dom",
    "Mary/html"
], function (utils, dom, html) {

    // consts
    const _ = Symbol("MESSAGE_BOX_KEY");

    // constructor
    function Message_Box(top_dom, target_dom, options = {}) {
        options = Object.assign({}, options);
        options.message_box_class = options.message_box_class || "null";
        options.section_class = options.section_class || "null";
        options.button_class = options.button_class || "null";
        options.textarea_class = options.textarea_class || "null";
        options.input_class = options.input_class || "null";
        options.checkbox_class = options.checkbox_class || "null";
        options.text_class = options.text_class || "null";
        options.dropzone_class = options.dropzone_class || "null";
        options.auto_close = options.hasOwnProperty("auto_close") ?
            options.auto_close : true;

        const inst = utils.newObj(Message_Box.prototype);
        inst[_] = {};
        inst[_].options = options;
        inst[_].top_shield_dom = null;
        inst[_].top_was_static = false;
        inst[_].top_dom = top_dom;
        inst[_].target_dom = target_dom;
        inst[_].message_box_dom = null;

        open_message_box(inst);

        return inst;
    };

    // private statics
    const open_message_box = function (inst) {
        if (inst[_].top_dom.getStyle("position") === "static") {
            inst[_].top_was_static = true;
            inst[_].top_dom.style("position: relative");
        }
        inst[_].top_shield_dom = dom(html.div, inst[_].top_dom)
            .style(`
                position: absolute;
                top: 0;
                left: 0;
                background-color: transparent;
                width: 100%;
                height: 100%;
                z-index: 10000;
            `);
        if (inst[_].options.auto_close === true) {
            inst[_].top_shield_dom.on("click", evt_click => {
                close_message_box(inst);
            });
        }

        inst[_].message_box_dom = dom(html.div, inst[_].target_dom)
            .class(inst[_].options.message_box_class);
    };

    const close_message_box = function (inst) {
        inst[_].message_box_dom.remove();
        if (inst[_].top_was_static) {
            inst[_].top_dom.style("position");
        }
        inst[_].top_shield_dom.remove();
    };

    // methods
    Message_Box.prototype.close = function () {
        close_message_box(this);
    };

    Message_Box.prototype.section = function (text = "", callback) {
        const section_dom = dom(html.div, this[_].message_box_dom)
            .class(this[_].options.section_class)
            .setText(text);
        if (callback) {
            const data = {};
            data.section_dom = section_dom;
            callback(data);
        }

        return this;
    };

    Message_Box.prototype.button = function (text = "", callback = () => { }, callback2) {
        const inst = this;
        const button_dom = dom(html.div, inst[_].message_box_dom)
            .class(inst[_].options.button_class)
            .setText(text)
            .on("click", evt_click => {
                evt_click.stopPropagation();
                // for user
                const data = utils.newObj();
                data.button = button_dom;
                data.self = inst;
                data.prevent_default = false;
                data.stop_propagation = false;
                // for lib
                data[_] = utils.newObj();
                data[_].evt_click = evt_click;
                callback(data);
                if (!data.prevent_default) {
                    close_message_box(inst);
                }
                if (!data.stop_propagation) {

                }
            });

        if (callback2) {
            const data = {};
            data.button = button_dom;
            callback2(data);
        }

        return inst;
    };

    Message_Box.prototype.download = function (text, path, save_name, callback) {
        const inst = this;
        inst.button(text, data => {
            const anchor_dom = dom(html.a, inst[_].message_box_dom)
                .attr(`href="${path}"`)
                .attr(`download="${save_name}"`)
                .click()
                .remove();
            if (callback) {
                callback(data);
            }
        });

        return this;
    };

    Message_Box.prototype.textarea = function (placeholder, callback) {
        const textarea_dom = dom(html.textarea, this[_].message_box_dom)
            .class(this[_].options.textarea_class)
            .placeholder(placeholder);
        if (callback) {
            const data = {};
            data.textarea = textarea_dom;
            callback(data);
        }

        return this;
    };

    Message_Box.prototype.input = function (placeholder, callback) {
        const input_dom = dom(html.input, this[_].message_box_dom)
            .class(this[_].options.input_class)
            .placeholder(placeholder);
        if (callback) {
            const data = {};
            data.input = input_dom;
            callback(data);
        }

        return this;
    };

    Message_Box.prototype.checkbox = function (checked, text = "", callback) {
        const inst = this;
        const wrapper_dom = dom(html.div, inst[_].message_box_dom)
            .class(inst[_].options.checkbox_class)
            .style("position: relative");
        const checkbox_dom = dom(html.checkbox, wrapper_dom)
            .style("margin: 0 7px");
        const text_dom = dom(html.div, wrapper_dom)
            .setText(text);
        const glass_dom = dom(html.div, wrapper_dom)
            .style(`
                position: absolute;
                top: 0;
                left: 0;
                z-index: 1;
                width: 100%;
                height: 100%;
                cursor: pointer;
            `);
        if (checked) {
            checkbox_dom.check();
        }
        if (callback) {
            const data = {};
            data.wrapper_dom = wrapper_dom;
            data.checkbox_dom = checkbox_dom;
            data.text_dom = checkbox_dom;
            data.glass_dom = glass_dom;
            callback(data);
        }

        return this;
    };

    Message_Box.prototype.text = function (text, callback) {
        const inst = this;

        const text_dom = dom(html.div, inst[_].message_box_dom)
            .class(inst[_].options.text_class)
            .setText(text);

        if (callback) {
            const data = {};
            data.text_dom = text_dom;
            callback(data);
        }

        return inst;
    };

    Message_Box.prototype.div = function (options = {}, callback) {
        const inst = this;

        const div_dom = dom(html.div, inst[_].message_box_dom);

        if (options.class) {
            div_dom.class(options.class);
        }

        if (callback) {
            const data = {};
            data.div_dom = div_dom;
            callback(data);
        }

        return this;
    };

    Message_Box.prototype.dropzone = function ({ text = "Drop Here", on_drop = () => {}, on_create = undefined }) {
        const inst = this;

        const dropzone_dom = dom(html.div, inst[_].message_box_dom)
            .class(inst[_].options.dropzone_class)
            .setText(text)
            .on("dragover", evt_dragover => {
                evt_dragover.preventDefault();
                evt_dragover.dataTransfer.dropEffect = "copy";
            })
            .on("drop", evt_drop => {
                evt_drop.preventDefault();
                on_drop(Array.from(evt_drop.dataTransfer.files));
            });

        if (on_create) {
            on_create(dropzone_dom);
        }

        return inst;
    };

    /* exports */
    return Message_Box;

});
