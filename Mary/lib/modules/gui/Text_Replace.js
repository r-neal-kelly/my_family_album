// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("Mary/gui/Text_Replace.js", [
    "Mary/utils",
    "Mary/dom",
    "Mary/html"
], function (utils, dom, html) {

    // consts
    const _ = Symbol();

    // constructor
    function Text_Replace(top_dom, text_dom, options = {}) {
        options.placeholder = options.placeholder || "type here";
        options.cancel_text = options.cancel_text || text_dom.getText();
        options.input_class = options.input_class || "null";

        const inst = utils.newObj(Text_Replace.prototype);
        inst[_] = utils.newObj();
        inst.top_dom = top_dom;
        inst.text_dom = text_dom;
        inst.options = options;
        inst.old_info = {
            position: text_dom.first.style.position,
            visibility: text_dom.first.style.visibility,
            width: text_dom.first.style.width
        };

        inst.top_dom.on("mousewheel", Text_Replace[_].top_dom_on_scrollwheel, { capture: true, args: { inst } });
        inst.top_dom.on("click", Text_Replace[_].top_dom_on_click, { capture: true, args: { inst } });

        inst.text_dom.style([
            "position: relative",
            "visibility: hidden"
        ]);

        inst.hidden_dom = dom(html.div, inst.text_dom)
            .style([
                "position: absolute",
                "left: 1000%",
                "visibility: hidden",
                "padding: inherit",
                "min-width: max-content"
            ]);

        inst.input_dom = dom(html.input, inst.text_dom)
            .class(options.input_class)
            .placeholder(options.placeholder)
            .value(inst.options.cancel_text)
            .style([
                "visibility: visible",
                "position: absolute",
                "z-index: 1",
                "top: 0",
                "left: 0",
                "width: 100%",
                "height: 100%"
            ])
            .on("click", evt_click => {
                evt_click.stopPropagation();
            })
            .on("contextmenu", evt_contextmenu => {
                evt_contextmenu.stopPropagation();
            })
            .on("keyup", evt_keyup => {
                evt_keyup.stopPropagation();
                if (evt_keyup.key === "Enter") {
                    const return_data = {
                        prevent_default: false,
                        accept_text: inst.input_dom.value().trim().replace(/\s+/g, " ")
                    };
                    if (inst[_].on_accept) {
                        inst[_].on_accept(return_data);
                    }
                    if (!return_data.prevent_default) {
                        inst.text_dom.setText(return_data.accept_text);
                    }
                    close_text_replace(inst);
                } else if (evt_keyup.key === "Escape") {
                    const return_data = {
                        prevent_default: false
                    };
                    if (inst[_].on_cancel) {
                        inst[_].on_cancel(return_data);
                    }
                    if (!return_data.prevent_default) {
                        inst.text_dom.setText(inst.options.cancel_text);
                    }
                    close_text_replace(inst);
                } else {
                    // we do this on text_dom and not input_dom because it covers more css cases
                    inst.hidden_dom.setText(inst.input_dom.value());
                    inst.text_dom.first.style.width = inst.hidden_dom.width();
                }
            });

        inst.input_dom.focus();

        return inst;
    };

    // private statics
    Text_Replace[_] = utils.newObj();

    Text_Replace[_].top_dom_on_scrollwheel = function (evt_mousewheel, dom_info, { inst }) {
        evt_mousewheel.preventDefault();
        evt_mousewheel.stopPropagation();
    };

    Text_Replace[_].top_dom_on_click = function (evt_click, dom_info, { inst }) {
        if (!evt_click.path.includes(inst.input_dom.first)) {
            evt_click.stopPropagation();
            close_text_replace(inst);
        }
    };

    function close_text_replace(inst) {
        inst.top_dom.off(Text_Replace[_].top_dom_on_scrollwheel);
        inst.top_dom.off(Text_Replace[_].top_dom_on_click);
        inst.input_dom.remove();
        inst.hidden_dom.remove();
        inst.text_dom.first.style.position = inst.old_info.position;
        inst.text_dom.first.style.visibility = inst.old_info.visibility;
        inst.text_dom.first.style.width = inst.old_info.width;
    };

    // methods
    Text_Replace.prototype.on_accept = function (callback) {
        this[_].on_accept = callback;
        return this;
    };

    Text_Replace.prototype.on_cancel = function (callback) {
        this[_].on_cancel = callback;
        return this;
    };

    /* exports */
    return Text_Replace;

});
