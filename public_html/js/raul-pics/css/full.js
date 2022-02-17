// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("raul-pics/css/full", [
    "Mary/css"
], function (css) {

    function constructor({ funcs, vars }) {
        const view = css("Raul_Pics__View_Full");

        // fixed viewport
        view.define("", `
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
        `);

        view.define(".Full_Wrapper", `
            position: relative;
            display: flex;
            flex-wrap: wrap;
            width: 100%;
            height: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        `);

        view.define(".Full_Picture", `
            display: block;
            margin: auto;
            padding: 0;
            height: 100%;
            border: 2px solid ${vars.main_border_color};
            border-radius: 12px;
        `);

        /* Menu */
        view.define(".Menu_Toggle_Button", `
            left: 0;
            top: 0;
            z-index: 1000;
            text-align: center;
        `);

        view.define(".Menu_Toggle_Button_Opened", `
            border-radius: 180px 0 0 180px;
        `);

        const menu_div_padding = "7px"; // strange, but I can't figure how to make it work elsewise.

        view.define(".Menu_Div", `
            position: absolute;
            left: 100%;
            top: 0;
            z-index: 1000;
            height: 300px;
            max-height: 90%;
            width: 240px;
            background-color: ${funcs.black(0.6)};
            cursor: default;
            padding: ${menu_div_padding};
            border-radius: 0 24px 24px 24px;
            overflow: auto;
            -webkit-overflow-scrolling: touch;
        `);
        view.define(".Menu_Wrap", `
            display: flex;
            flex-direction: column;
            margin-bottom: ${menu_div_padding};
        `);

        view.define(".Menu_Title_Wrap", `
            font-size: 14px;
            font-family: "Orkney Regular Italic";
            color: ${funcs.white(0.8)};
            text-align: center;
        `);

        view.define(".Menu_Loading_Text", `
            font-size: 14px;
            font-family: "Orkney Regular";
            color: ${funcs.white(0.8)};
            text-align: center;
            margin: 12px auto;
        `);

        view.define(".Menu_Button", `
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.8);
            border-radius: 60px;
            padding: 7px;
            cursor: pointer;
            margin: 3px 0;
            height: 36px;
        `);

        view.define(".Menu_Comment_Text", `
            border: 0;
            margin: 5px;
            padding: 5px;
            resize: none;
            font-family: "Carlito Regular";
            font-size: 16px;
            background-color: white;
            color: black;
            text-align: left;
        `);

        view.define(".Menu_Comment_Para", `
            min-height: 1em;
        `);

        view.define(".Menu_Wrap_Albums, .Menu_Wrap_Tags", `
            display: flex;
            flex-wrap: wrap;
            margin: auto;
            justify-content: center;
        `);

        /* edit */

        // tags
        const edit_tags_div_width = "70%";
        const edit_tags_div_margin = "60px";
        view.define(".Edit_Tags_Div, .Edit_Comment_Div", `
            position: fixed;
            left: calc(50% - ${edit_tags_div_width} / 2 - ${edit_tags_div_margin});
            bottom: 0;
            display: flex;
            justify-content: center;
            width: ${edit_tags_div_width};
            margin: 0 ${edit_tags_div_margin};
        `);

        view.define(".Edit_Tags_Div", `
            flex-direction: row;
            flex-wrap: wrap;
        `);

        view.define(".Edit_Comment_Div", `
            flex-direction: column;
            flex-wrap: nowrap;
            height: 40%;
            border: 2px solid ${funcs.white(0.7)};
        `);

        view.define(".Edit_Tags_List_Div, .Edit_Likely_Tags_Div", `
            position: absolute;
            z-index: 10000;
            bottom: 100%;
            left: 0;
            max-height: 150px;
            overflow-y: auto;
            width: 100%;
            background-color: ${funcs.black(0.3)};
        `);

        view.define(".Edit_Tag_Div", `
            margin: 1px 0;
            background-color: ${funcs.black(0.3)};
            color: white;
            padding: 3px;
            font-size: 14px;
            font-family: "Orkney Regular";
        `);

        view.define(".Edit_Likely_Tag_Div", `
            background-color: ${funcs.white(0.8)};
            color: black;
            font-size: 15px;
            font-family: "Orkney Regular";
            cursor: pointer;
            padding: 3px;
            border-bottom: 1px solid ${funcs.white(0.8)};
            padding-left: 12px;
        `);

        view.define(".Edit_Tags_Input", `
            position: relative;
            background-color: ${funcs.white(0.8)};
            color: black;
            flex-basis: 300px;
            flex-grow: 1;
            margin: 0;
            padding: 7px;
            font-size: 16px;
            font-family: "Orkney Regular";
        `);

        view.define(".Edit_Tags_Input_Button", `
            background-color: ${funcs.white(0.8)};
            color: black;
            padding: 5px;
            min-width: 36px;
            font-family: "Orkney Regular";
            font-size: 14px;
            text-align: center;
            cursor: pointer;
        `);

        view.define(".Edit_Tags_Input_Button_Left", `
            border-right: 1px solid ${funcs.white(0.9)};
        `);

        view.define(".Edit_Tags_Input_Button_Right", `
            border-left: 1px solid ${funcs.white(0.9)};
        `);

        view.define(".Edit_Tags_Input_Button:hover", `
            background-color: ${funcs.white(0.9)};
        `);

        view.define(".Edit_Comment_Textarea", `
            background-color: ${funcs.white(0.8)};
            color: black;
            padding: 7px;
            border: 0;
            font-size: 16px;
            font-family: "Orkney Regular";
            width: 100%;
            resize: none;
            flex-basis: 100%;
        `);

        view.define(".Edit_Comment_Button", `
            background-color: ${funcs.white(0.8)};
            color: black;
            width: 100%;
            padding: 5px;
            font-family: "Orkney Regular";
            font-size: 14px;
            text-align: center;
            cursor: pointer;
            border-top: 1px solid ${funcs.black(0.3)};
        `);

        view.define(".Edit_Comment_Button:hover", `
            background-color: ${funcs.white(0.9)};
        `);

        view.define(".Edit_Comment_Saved_Message", `
            position: absolute;
            z-index: 20000;
            bottom: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            color: rgba(255, 255, 255, 0.7);
            border: 2px solid black;
            font-family: "Orkney Regular";
            font-size: 16px;
            text-align: center;
            width: 100%;
            padding: 12px;
            cursor: default;
        `);
    }

    /* exports */
    return constructor;

});
