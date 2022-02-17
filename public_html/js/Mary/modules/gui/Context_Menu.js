// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("Mary/gui/Context_Menu", [
    "Mary/utils",
    "Mary/locale",
    "Mary/dom",
    "Mary/html"
], function (utils, locale, dom, html) {

    /* constants */
    const _ = Symbol("CONTEXT_MENU_KEY");

    /* constructor */
    function Context_Menu(top_dom, target_dom, options = {}) {
        options = Object.assign({}, options);
        options.menu_class = options.menu_class || "null";
        options.section_class = options.section_class || "null";
        options.button_class = options.button_class || "null";
        options.textarea_class = options.textarea_class || "null";
        options.input_class = options.input_class || "null";
        options[_] = options[_] || {};
        options[_].is_sub_menu = options[_].is_sub_menu || false;

        const inst = utils.newObj(Context_Menu.prototype);
        inst.top_dom = top_dom;
        inst.target_dom = target_dom;
        inst.options = options;
        inst[_] = {};
        inst[_].parent_menu = null;
        inst[_].family_menus = null; // arr that contains nodes of parent and children context_menu_doms
        inst[_].gen_arr = [];
        inst[_].old_target_rect = null;
        inst[_].is_open = false;

        create_context_menu(inst);

        return inst;
    };

    /* private statics */
    function create_context_menu(inst) {
        if (inst.options[_].is_sub_menu) {
            return;
        }

        inst[_].target_dom_on_contextmenu = function (evt_contextmenu) {
            evt_contextmenu.preventDefault();
            evt_contextmenu.stopPropagation();
            open_context_menu(inst, evt_contextmenu.pageX, evt_contextmenu.pageY);
        };

        inst.target_dom.first.addEventListener("contextmenu", inst[_].target_dom_on_contextmenu, { capture: false });

        if (!locale.is_iOS) {
            return;
        }

        // apple won't emulate contextmenu, so we have to do touch.
        // but other browsers don't handle touch properly, and don't
        // give enough info in the event obj. also, there may be conflicts
        // when trying to use both methods, not sure.

        inst[_].touch_timeout_handler = null;
        inst[_].touch_prev_client_x = 0;
        inst[_].touch_prev_client_y = 0;

        inst[_].target_dom_on_touchstart = function (evt_touchstart) {
            const touch_obj = evt_touchstart.touches[0];
            const screen_x = evt_touchstart.screenX || evt_touchstart.pageX;
            const screen_y = evt_touchstart.screenY || evt_touchstart.pageY;
            inst[_].touch_prev_client_x = touch_obj.clientX;
            inst[_].touch_prev_client_x = touch_obj.clientY;
            inst[_].touch_timeout_handler = setTimeout(() => {
                open_context_menu(inst, screen_x, screen_y);
            }, 700);
        };

        inst[_].target_dom_on_touchmove = function (evt_touchmove) {
            const touch_obj = evt_touchmove.changedTouches[0];
            if (
                Math.abs(touch_obj.clientX - inst[_].touch_prev_client_x) > 12 ||
                Math.abs(touch_obj.clientY - inst[_].touch_prev_client_y) > 12
            ) {
                clearTimeout(inst[_].touch_timeout_handler);
            }
        };

        inst[_].target_dom_on_touchend = function (evt_touchend) {
            clearTimeout(inst[_].touch_timeout_handler);
            inst[_].touch_timeout_handler = null;
        };

        inst[_].target_dom_on_gesturestart = function (evt_gesturestart) {
            clearTimeout(inst[_].touch_timeout_handler);
            inst[_].touch_timeout_handler = null;
        };

        inst.target_dom.first.addEventListener("touchstart", inst[_].target_dom_on_touchstart, { capture: false });
        inst.target_dom.first.addEventListener("touchmove", inst[_].target_dom_on_touchmove, { capture: false });
        inst.target_dom.first.addEventListener("touchend", inst[_].target_dom_on_touchend, { capture: false });
        inst.target_dom.first.addEventListener("gesturestart", inst[_].target_dom_on_gesturestart, { capture: false });
    };

    function destroy_context_menu(inst) {
        if (inst.options[_].is_sub_menu) {
            return;
        }

        inst.target_dom.first.removeEventListener("contextmenu", inst[_].target_dom_on_contextmenu, { capture: false });

        if (!locale.is_iOS) {
            return;
        }

        inst.target_dom.first.removeEventListener("touchstart", inst[_].target_dom_on_touchstart, { capture: false });
        inst.target_dom.first.removeEventListener("touchmove", inst[_].target_dom_on_touchmove, { capture: false });
        inst.target_dom.first.removeEventListener("touchend", inst[_].target_dom_on_touchend, { capture: false });
        inst.target_dom.first.removeEventListener("gesturestart", inst[_].target_dom_on_gesturestart, { capture: false });
    };

    async function open_context_menu(inst, x = 0, y = 0) {
        if (inst[_].is_open) {
            return;
        }

        inst.context_menu_dom = dom(html.div)
            .class(inst.options.menu_class)
            .on("click", evt_click => {
                evt_click.stopPropagation();
            })
            .on("contextmenu", evt_contextmenu => {
                evt_contextmenu.stopPropagation();
                evt_contextmenu.preventDefault();
            })
            .on("touchstart", evt_touchstart => {
                evt_touchstart.stopPropagation();
            })
            .on("touchmove", evt_touchmove => {
                evt_touchmove.stopPropagation();
            })
            .on("touchend", evt_touchend => {
                evt_touchend.stopPropagation();
            })
            .on(["wheel", "touchmove"], evt_wheel => {
                setTimeout(() => {
                    const target_rect = inst.target_dom.first.getBoundingClientRect();
                    const old_target_rect = inst[_].old_target_rect;
                    if (target_rect.top !== old_target_rect.top) {
                        close_context_menu(inst);
                    }
                }, 50);
            });
        inst[_].family_menus = [inst.context_menu_dom.first];

        inst.context_menu_dom
            .appendTo(inst.top_dom) // target_dom
            .style([
                "position: fixed",
                "z-index: 10000",
                `left: ${x}px`,
                `top: ${y}px`
            ]);
        inst.context_menu_dom.focus();

        for (const gen of inst[_].gen_arr) {
            gen();
        }

        const top_rect = inst.top_dom.first.getBoundingClientRect();
        const ctx_rect = inst.context_menu_dom.first.getBoundingClientRect();
        if (ctx_rect.right > top_rect.right) {
            inst.context_menu_dom.style(`left: ${x - parseInt(inst.context_menu_dom.width())}px`);
        }
        if (ctx_rect.bottom > top_rect.bottom) {
            inst.context_menu_dom.style(`top: ${y - parseInt(inst.context_menu_dom.height())}px`);
        }

        inst[_].old_target_rect = inst.target_dom.first.getBoundingClientRect();

        // mouse
        inst[_].top_dom_on_click = function (evt_click) {
            const evt_path = evt_click.path || evt_click.composedPath();
            if (!utils.array.includes_any(evt_path, inst[_].family_menus)) {
                evt_click.stopPropagation();
                evt_click.preventDefault();
                close_context_menu(inst);
            }
        };
        inst[_].top_dom_on_contextmenu = function (evt_contextmenu) {
            const evt_path = evt_contextmenu.path || evt_contextmenu.composedPath();
            if (!utils.array.includes_any(evt_path, inst[_].family_menus)) {
                close_context_menu(inst);
            }
        };
        inst[_].top_dom_on_wheel = function (evt_wheel) {
            const evt_path = evt_wheel.path || evt_wheel.composedPath();
            if (!utils.array.includes_any(evt_path, inst[_].family_menus)) {
                close_context_menu(inst);
            }
        };

        // touch
        inst[_].top_dom_on_touchstart = function (evt_touchstart) {
            const evt_path = evt_touchstart.path || evt_touchstart.composedPath();
            if (!utils.array.includes_any(evt_path, inst[_].family_menus)) {
                close_context_menu(inst);
            }
        };

        inst.top_dom.first.addEventListener("click", inst[_].top_dom_on_click, { capture: true });
        inst.top_dom.first.addEventListener("contextmenu", inst[_].top_dom_on_contextmenu, { capture: true });
        inst.top_dom.first.addEventListener("wheel", inst[_].top_dom_on_wheel, { capture: true });
        inst.top_dom.first.addEventListener("touchstart", inst[_].top_dom_on_touchstart, { capture: true });

        inst[_].is_open = true;
    };

    function close_context_menu(inst) {
        if (!inst[_].is_open) {
            return;
        }

        inst.context_menu_dom.remove();
        inst.family_menus = null;

        inst.top_dom.first.removeEventListener("click", inst[_].top_dom_on_click, { capture: true });
        inst.top_dom.first.removeEventListener("contextmenu", inst[_].top_dom_on_contextmenu, { capture: true });
        inst.top_dom.first.removeEventListener("wheel", inst[_].top_dom_on_wheel, { capture: true });
        inst.top_dom.first.removeEventListener("touchstart", inst[_].top_dom_on_touchstart, { capture: true });
        inst.context_menu_dom.remove();

        inst[_].is_open = false;
    };

    function close_parent_menus(inst) {
        let parent_menu;
        for (let parent_menu = inst[_].parent_menu; parent_menu; parent_menu = parent_menu[_].parent_menu) {
            close_context_menu(parent_menu);
        }
    };

    /* methods */
    Context_Menu.prototype.destroy = function () {
        const inst = this;

        close_context_menu(inst);
        destroy_context_menu(inst);

        return inst;
    };

    Context_Menu.prototype.section = function (text = "", callback) {
        this[_].gen_arr.push(() => {
            const section_dom = dom(html.div, this.context_menu_dom)
                .class(this.options.section_class)
                .setText(text);
            if (callback) {
                const data = {};
                data.section_dom = section_dom;
                callback(data);
            }
        });

        return this;
    };

    Context_Menu.prototype.button = function (text, event_callback = () => { }, should_create = undefined) {
        const inst = this;
        
        inst[_].gen_arr.push(async function () {
            if (should_create && !await should_create()) {
                return;
            }
            const button_dom = dom(html.div, inst.context_menu_dom)
                .class(inst.options.button_class)
                .setText(text)
                .on("click", async function (evt_click) {
                    evt_click.stopPropagation();
                    // for user
                    const data = utils.newObj();
                    data.prevent_default = false;
                    data.stop_propagation = false;
                    // for lib
                    data[_] = utils.newObj();
                    data[_].evt_click = evt_click;
                    await event_callback(data);
                    if (!data.prevent_default) {
                        close_context_menu(inst);
                    }
                    if (!data.stop_propagation) {
                        close_parent_menus(inst);
                    }
                });
        });

        return inst;
    };

    Context_Menu.prototype.download = function (text, path, save_name, callback = (() => { })) {
        this.button(text, data => {
            const anchor_dom = dom(html.a, this.context_menu_dom)
                .attr(`href="${path}"`)
                .attr(`download="${save_name}"`)
                .click()
                .remove();
            callback(data);
        });

        return this;
    };

    Context_Menu.prototype.input = function (placeholder, callback = (() => { })) {
        const inst = this;

        inst[_].gen_arr.push(() => {
            const input_dom = dom(html.input, inst.context_menu_dom)
                .class(inst.options.input_class)
                .placeholder(placeholder)
                .on("keyup", evt_keyup => {
                    if (evt_keyup.key === "Enter") {
                        const data = utils.newObj();
                        data.prevent_default = false;
                        data.stop_propagation = false;
                        data.value = input_dom.value();
                        callback(data);
                        if (!data.prevent_default) {
                            input_dom.value("");
                            close_context_menu(inst);
                        }
                        if (!data.stop_propagation) {
                            close_parent_menus(inst);
                        }
                    }
                });
        });

        return inst;
    };

    Context_Menu.prototype.textarea = function (placeholder, callback) {
        this[_].gen_arr.push(() => {
            const textarea_dom = dom(html.textarea, this.context_menu_dom)
                .class(this.options.textarea_class)
                .placeholder(placeholder);
            if (callback) {
                const data = {};
                data.textarea_dom = textarea_dom;
                callback(data);
            }
        });

        return this;
    };

    Context_Menu.prototype.sub_menu = function (button_text) {
        const sub_options = Object.assign({}, this.options);
        sub_options[_] = utils.newObj();
        sub_options[_].is_sub_menu = true;

        const self = this;
        const sub_menu = Context_Menu(this.top_dom, this.target_dom, sub_options);
        sub_menu[_].parent_menu = this;
        this.button(button_text, async function (data) {
            const target_for_top = data[_].evt_click.target;
            const target_for_right = self.context_menu_dom.first;
            const target_top_rect = target_for_top.getBoundingClientRect();
            const target_right_rect = target_for_right.getBoundingClientRect();
            data.prevent_default = true; // don't want parent menu closing.
            await open_context_menu(sub_menu, target_right_rect.right, target_top_rect.top);
            self[_].family_menus.push(sub_menu.context_menu_dom.first);
        });

        return sub_menu;
    };

    Context_Menu.prototype.restore = function () {
        return this[_].parent_menu ? this[_].parent_menu : this;
    };

    /* exports */
    return Context_Menu;

});
