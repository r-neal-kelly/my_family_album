// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("raul-pics/dialog/Login", [
    "Mary/utils",
    "Mary/dom",
    "Mary/html",
    "Mary/gui/Message_Box",
    "Mary/svr/Server_Request",
    "raul-pics/global/consts",
    "raul-pics/dialog/Error"
], function (utils, dom, html, Message_Box, Server_Request, consts, Dialog_Error) {

    /* constructor */
    function Login(viewport, on_login) {
        let login_name_input, login_pass_input, login_button;
        const login_box = Message_Box(viewport, viewport, consts.message_box_options)
            .section("Login")
            .input("enter user name", data => {
                login_name_input = data.input
            })
            .input("enter password (or passphrase)", data => {
                login_pass_input = data.input;
                data.input.attr("type=password");
                data.input.on("keyup", evt_keyup => {
                    if (evt_keyup.key === "Enter") {
                        login_button.click();
                    }
                });
            })
            .checkbox(true, "hide password", data => {
                data.glass_dom.on("click", evt_click => {
                    evt_click.stopPropagation();
                    if (data.checkbox_dom.is_checked()) {
                        data.checkbox_dom.uncheck();
                        login_pass_input.attr("type");
                    } else {
                        data.checkbox_dom.check();
                        login_pass_input.attr("type=password");
                    }
                });
            })
            .button("Login", async function (evt_button) {
                evt_button.prevent_default = true;
                const user_name = login_name_input.value();
                const password = login_pass_input.value();
                const please_wait_msg = Message_Box(viewport, viewport, consts.message_box_options)
                    .section("Please Wait");
                const [passed, data] = await login(user_name, password);
                please_wait_msg.close();
                if (passed === true) {
                    evt_button.self.close();
                    on_login(data);
                } else {
                    const failures_arr = data;
                    Dialog_Error(viewport, "Please fix the following:", failures_arr);
                }
            }, function (data) {
                login_button = data.button;
            })
            .button("Register As New User", () => {
                let register_name_input, register_pass_input, register_pass2_input;
                let register_pass_arr = [], register_pass2_arr = [];
                const register_box = Message_Box(viewport, viewport, consts.message_box_options)
                    .section("Register As New User")
                    .input("choose user name", data => {
                        register_name_input = data.input;
                        data.input.value(login_name_input.value());
                    })
                    .input("chose password (or passphrase)", data => {
                        register_pass_input = data.input;
                        data.input.value(login_pass_input.value());
                        data.input.attr("type=password");
                    })
                    .input("confirm password", data => {
                        register_pass2_input = data.input;
                        data.input.attr("type=password");
                    })
                    .checkbox(true, "hide password", data => {
                        data.glass_dom.on("click", evt_click => {
                            evt_click.stopPropagation();
                            if (data.checkbox_dom.is_checked()) {
                                data.checkbox_dom.uncheck();
                                register_pass_input.attr("type");
                                register_pass2_input.attr("type");
                            } else {
                                data.checkbox_dom.check();
                                register_pass_input.attr("type=password");
                                register_pass2_input.attr("type=password");
                            }
                        });
                    })
                    .button("Register", async function (evt_button) {
                        evt_button.prevent_default = true;
                        const user_name = register_name_input.value();
                        const password = register_pass_input.value();
                        const confirm_password = register_pass2_input.value();

                        const please_wait_msg = Message_Box(viewport, viewport, consts.message_box_options)
                            .section("Please Wait");
                        const [passed, data] = await register(user_name, password, confirm_password);
                        if (passed === true) {
                            evt_button.self.close();
                            const [__, data] = await login(user_name, password);
                            please_wait_msg.close();
                            on_login(data);
                        } else {
                            please_wait_msg.close();
                            const failures_arr = data;
                            Dialog_Error(viewport, "Please fix the following:", failures_arr);
                        }
                    })
                    .button("Cancel", () => {
                        Login(viewport); // regens itself
                    });
            })
            .button("Cancel");
    };

    /* private statics */
    async function login(user_name, password) {
        const csrf_token = consts.get_csrf_token();

        return new Promise(function (res, rej) {
            Server_Request("POST", "/user/login")
                .headers({
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                })
                .listen(201, data => {
                    res([true, data]);
                })
                .listen(null, (status, failures) => {
                    res([false, JSON.parse(failures)]);
                })
                .send(JSON.stringify({
                    csrf_token: csrf_token,
                    user_name: user_name,
                    password: password
                }));
        });
    };

    async function register(user_name, password, confirm_password) {
        const csrf_token = consts.get_csrf_token();

        return new Promise(function (res, rej) {
            Server_Request("POST", "/user/register")
                .headers({
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                })
                .listen(201, data => {
                    res([true, data]);
                })
                .listen(null, (status, failures) => {
                    res([false, JSON.parse(failures)]);
                })
                .send(JSON.stringify({
                    csrf_token: csrf_token,
                    user_name: user_name,
                    password: password,
                    confirm_password: confirm_password
                }));
        });
    };

    /* exports */
    return Login;
});
