// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("raul-pics/css/general", [
    "Mary/css"
], function (css) {

    function constructor(fonts_path) {
        const funcs = {};
        const vars = {};

        funcs.color = function (r, g, b, a) {
            return `rgba(${String(r)}, ${String(g)}, ${String(b)}, ${String(a)})`;
        }
        funcs.white = function (alpha) {
            return this.color(255, 255, 255, alpha || 1.0);
        }
        funcs.black = function (alpha) {
            return this.color(0, 0, 0, alpha || 1.0);
        }
        Object.freeze(funcs);

        vars.main_border_color = "rgba(192, 192, 192, 0.3)";
        vars.album_back_color = vars.main_border_color;
        vars.tag_back_color = "rgba(48, 203, 77, 0.22)";
        vars.main_back_color = "rgba(14, 31, 57, 1.0)";

        /* global */
        const global = css();

        global.define("@font-face", `
            font-family: "Carlito Regular";
            src: url("${fonts_path}/Carlito/Carlito-Regular.ttf");
        `);

        global.define("@font-face", `
            font-family: "Orkney Regular";
            src: url("${fonts_path}/Orkney/Orkney Regular.ttf");
        `);

        global.define("@font-face", `
            font-family: "Orkney Regular Italic";
            src: url("${fonts_path}/Orkney/Orkney Regular Italic.ttf");
        `);

        global.define("@font-face", `
            font-family: "Petit Formal Script";
            src: url("${fonts_path}/Petit Formal Script/PetitFormalScript-Regular.ttf");
        `);

        global.define("@font-face", `
            font-family: "Dancing Script";
            src: url("${fonts_path}/Dancing Script/DancingScript-Regular.ttf");
        `);

        global.define("@font-face", `
            font-family: "Quivira";
            src: url("${fonts_path}/Quivira/Quivira.otf");
        `);

        global.define("*, *:before, *:after", `
            box-sizing: inherit;
        `);

        global.define("*:focus", `
            outline: 0;
        `);

        global.define("html", `
            height: 100%;
            width: 100%;
        `);

        global.define("button, select, input", `
            border-color: ${vars.main_border_color};
            border-style: solid;
            margin: 0 3px 0 3px;
            padding: 3px;
            border-width: 0px;
            background-color: transparent;
            color: inherit;
        `);

        global.define("a", `
            color: silver;
        `);

        /* main */
        const view = css("Raul_Pics__View_Top");
        
        // top
        view.define("", `
            position: relative;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-size: 16px;
            background-color: ${vars.main_back_color};
            overflow: hidden;
        `);

        view.define(".Disabled_Text_Selection", `
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        `);

        view.define(".Enabled_Text_Selection", `
            -webkit-touch-callout: text;
            -webkit-user-select: text;
            -khtml-user-select: text;
            -moz-user-select: text;
            -ms-user-select: text;
            user-select: text;
        `);

        view.define(".Main_Button", `
            display: block;
            position: absolute;
            background-color: rgba(0, 0, 0, 0.6);
            border-radius: 180px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 240%;
            font-family: "Carlito Regular";
            margin: 6px;
            z-index: 200;
            cursor: pointer;
            height: 54px;
            width: 54px;
            line-height: 1.3;
            vertical-align: middle;
        `);

        view.define(".Back_Button", `
            left: 0;
            bottom: 0;
        `);

        view.define(".Next_Button", `
            right: 0;
            bottom: 0;
        `);

        view.define(".Up_Button", `
            right: 0;
            top: 0;
        `);

        view.define(".Info_Button", `
            right: 0;
            bottom: 0;
        `);

        view.define(".Message_Box", `
            position: absolute;
            left: 0;
            z-index: 1000;
            width: 100%;
            background-color: ${funcs.black(0.8)};
            color: white;
            font-size: 16px;
            text-align: center;
        `);

        /* Context_Menu */
        view.define(".General_Context_Menu", `
            background-color: ${funcs.white(0.9)};
            color: black;
            min-width: 150px;
            max-width: 250px;
            min-height: 100px;
            max-height: 156px;
            overflow: auto;
            -webkit-overflow-scrolling: touch;
            font-family: "Orkney Regular";
            font-size: 16px;
            cursor: default;
        `);

        view.define(".General_Context_Menu_Section", `
            padding: 6px;
            border-bottom: 1px solid ${funcs.black(0.9)};
            margin: 6px 0;
            text-align: center;
        `);

        view.define(".General_Context_Menu_Button", `
            display: block;
            border-radius: 12px;
            background-color: ${funcs.black(0.9)};
            color: white;
            text-align: center;
            margin: 6px;
            cursor: pointer;
            padding: 6px;
            text-decoration: none;
        `);

        view.define(".General_Context_Menu_Textarea", `
            resize: none;
            font-size: 14px;
            font-family: "Orkney Regular";
            height: 150px;
            width: 100%;
        `);

        view.define(".General_Context_Menu_Input", `
            margin: 6px 0;
        `);

        /* Message Box */
        view.define(".General_Message_Box", `
            position: fixed;
            top: calc(50% - 150px);
            left: calc(50% - 150px);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-content: center;
            padding: 12px;
            width: 300px;
            height: 300px;
            background-color: ${funcs.black(0.8)};
            color: white;
            font-size: 16px;
            font-family: "Orkney Regular";
        `);

        view.define(".General_Message_Box_Section", `
            color: white;
            text-align: center;
            padding-bottom: 7px;
            border-bottom: 2px solid ${funcs.white(0.8)};
        `);

        view.define(".General_Message_Box_Button", `
            border-radius: 12px;
            background-color: ${funcs.white(0.8)};
            color: black;
            font-size: 16px;
            font-family: "Orkney Regular";
            text-align: center;
            padding: 5px 12px;
            cursor: pointer;
            margin: auto 0;
        `);

        view.define(".General_Message_Box_Textarea", `
            resize: none;
            width: 100%;
            height: 120px;
            font-size: 14px;
            font-family: "Orkney Regular";
        `);

        view.define(".General_Message_Box_Input", `
            font-size: 16px;
            font-family: "Orkney Regular";
            background-color: white;
            color: black;
            width: 100%;
            padding: 5px 12px;
            margin: auto 0;
            text-align: center;
        `);

        view.define(".General_Message_Box_Checkbox", `
            display: flex;
            flex-direction: row;
            justify-content: center;
            width: 100%;
            cursor: pointer;
        `);

        view.define(".General_Message_Box_Text", `
            margin: auto;
            text-align: center;
            font-family: "Orkney Regular";
            font-size: 18px;
            color: white;
        `);

        view.define(".General_Message_Box_Dropzone", `
            margin: auto;
            width: 100%;
            height: 50%;
            border: 1px solid ${funcs.white(0.8)};
            border-radius: 0;
            text-align: center;
            vertical-align: middle;
            line-height: 125px;
        `);

        /* Bubbles */
        view.define(".Bubble_Album, .Bubble_Tag", `
            display: inline-block; /* neccessary? */
            margin: 5px;
            padding: 5px 7px;
            font-family: sans-serif;
            font-size: 15px;
            text-align: center;
            line-height: 1.5;
            vertical-align: middle;
            border-radius: 12px;
            cursor: pointer;
        `);

        view.define(".Bubble_Album", `
            background-color: ${vars.album_back_color};
            color: ${funcs.white(0.95)};
        `);

        view.define(".Bubble_Tag", `
            background-color: ${vars.tag_back_color};
            color: ${funcs.white(0.95)};
        `);

        /* Thumbs */
        view.define(".Thumb", `
            display: block;
            border: 1px solid ${vars.main_border_color};
            cursor: pointer;
            width: 100%;
            height: 100%;
            background-position: center;
            background-repeat: no-repeat;
        `);

        view.define(".Thumb_Square", `
            background-size: auto;
        `);

        view.define(".Thumb_Wide_Square", `
            background-size: auto 100%;
        `);

        view.define(".Thumb_Tall_Square", `
            background-size: 100% auto;
        `);

        view.define(".Thumb_Wide_Rectangle", `
            background-size: 100% auto;
        `);

        view.define(".Thumb_Tall_Rectangle", `
            background-size: auto 100%;
        `);

        view.define(".Thumb_Wide_Circle", `
            background-size: 100% auto;
            border-radius: 60px;
        `);

        view.define(".Thumb_Tall_Circle", `
            background-size: auto 100%;
            border-radius: 60px;
        `);

        /* Dialogs */
        view.define(".Dialog_Error_Item", `
             width: 100%;
             text-align: center;
             border: 1px solid ${funcs.white(0.8)};
             border-radius: 12px;
             padding: 7px;
             margin: 7px 0;
        `);

        return { funcs, vars };
    }

    /* exports */
    return constructor;

});
