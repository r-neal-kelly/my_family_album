// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("raul-pics/css/galleries", [
    "Mary/css"
], function (css) {

    function constructor({ funcs, vars }) {
        const view = css("Raul_Pics__View_Galleries");

        // fixed viewport
        view.define("", `
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
        `);

        view.define(".Galleries_Wrapper", `
            position: relative;
            width: 100%;
            height: 100%;
            overflow: auto;
            -webkit-overflow-scrolling: touch;
        `);

        /* User */
        view.define(".Login_Button, .User_Button", `
            left: 0;
            bottom: 0;
            font-size: 15px;
        `);

        const user_menu_padding = "7px";

        view.define(".User_Menu_Outer", `
            position: absolute;
            bottom: 0;
            z-index: 1000;
            height: 300px;
            max-height: 90%;
            width: 240px;
            background-color: ${funcs.black(0.6)};
            cursor: default;
            padding: ${user_menu_padding};
            border-radius: 24px 24px 24px 0px;
            overflow: auto;
            -webkit-overflow-scrolling: touch;
        `);

        view.define(".User_Menu_Inner", `
            display: flex;
            flex-direction: column;
            margin-bottom: ${user_menu_padding};
        `);

        view.define(".User_Menu_Button", `
            font-size: 14px;
            color: ${funcs.white(0.8)};
            border: 1px solid ${funcs.white(0.8)};
            border-radius: 60px;
            padding: 7px;
            cursor: pointer;
            margin: 3px 0;
            height: 36px;
        `);

        view.define(".User_Menu_Name_Div", `
            color: ${funcs.white(0.8)};
            text-align: center;
            font-size: 16px;
            font-family: "Orkney Regular";
        `);

        /* Albums */
        view.define(".Album", `
            position: relative;
            display: flex;
            justify-content: space-around;
            align-items: center;
            align-content: space-around;
            width: 100%;
            text-align: center;
            margin-top: 7px;
            cursor: pointer;
            font-family: "Orkney Regular Italic";
            color: white;
            border: 3px solid ${vars.main_border_color};
        `);

        view.define(".Album_Text", `
            width: 67%;
            margin-left: 12px;
            margin-right: 12px;
            font-size: 1.5em;
        `);

        const album_peek_size = 120;
        view.define(".Album_Peek", `
            width: ${album_peek_size}px;
            height: ${album_peek_size}px;
        `);
        
        /* Tag Filtering */
        view.define(".Tags_Filter_Div", `
            width: 86%;
            min-width: 276px;
            margin: auto;
            margin-top: 24px;
            padding: 28px 16px;
            border: 2px solid ${vars.main_border_color};
            border-radius: 48px;
        `);

        view.define(".Tags_Input_Div, .Variables_Input_Div", `
            position: relative;
            display: flex;
            width: 100%;
            border: 1px solid ${funcs.white(0.7)};
            border-radius: 0;
        `);

        view.define(".Tags_Input", `
            width: 100px;
            margin: 0;
            padding: 0 3px;
            background-color: ${funcs.white(0.7)};
            color: black;
            font-size: 16px;
            text-align: center;
            border-radius: 0;
            flex-grow: 1;
        `);

        const tags_input_placeholder = `
            color: ${funcs.black(0.6)};
            opacity: 1;
        `;
        view.define(".Tags_Input::placeholder", tags_input_placeholder);
        view.define(".Tags_Input::-moz-placeholder", tags_input_placeholder);
        view.define(".Tags_Input::-webkit-input-placeholder", tags_input_placeholder);

        view.define(".Tags_Input_Button, .Variables_Input_Button", `
            width: 40px;
            margin: 0;
            padding: 0;
            background-color: ${funcs.white(0.85)};
            color: black;
            font-size: 16px;
            text-align: center;
            line-height: 1.5;
            vertical-align: middle;
            border: 0;
            border-left: 2px solid ${vars.main_border_color};
            cursor: pointer;
            font-family: "Carlito Regular";
        `);

        view.define(".Variables_Input_Button", `
            margin: 6px;
        `);

        view.define(".Filter_View_Div", `
            position: relative;
            margin-top: 18px;
            border: 2px solid ${vars.main_border_color};
            /*border-radius: 60px;
            overflow: hidden;*/
        `);

        view.define(".Filter_Toggle_Button", `
            background-color: ${vars.main_border_color};
            color: white;
            line-height: 1.3;
            vertical-align: middle;
            text-align: center;
            font-size: 14px;
            font-family: "Carlito Regular";
            padding: 2px;
            cursor: pointer;
            /*border-radius: 60px;*/
        `);

        view.define(".Options_Inner_Div", `
            padding: 24px;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            max-width: max-content;
            margin: auto;
        `);
        view.define(".Filter_Option_Wrap", `
            position: relative;
            display: flex;
            width: max-content;
            border: 1px solid ${vars.main_border_color};
            border-radius: 60px;
            padding: 12px;
        `);
        view.define(".Filter_Option_Checkbox", `
            margin: 2px;
        `);
        view.define(".Filter_Option_Text", `
            margin: 2px;
            font-family: "Orkney Regular";
            font-size: 15px;
            color: white;
        `);
        view.define(".Filter_Option_Glass", `
            position: absolute;
            top: 0;
            left: 0;
            z-index: 1;
            width: 100%;
            height: 100%;
            cursor: pointer;
        `);

        view.define(".Variables_Inner_Div", `
            padding: 12px;
        `);

        view.define(".Variables_Set_Div", `
            display: flex;
            flex-wrap: wrap;
            margin-top: 6px;
        `);

        view.define(".Variable_Name_Wrap, .Variable_Expression_Wrap", `
            display: flex;
            flex-basis: 100px;
        `);

        view.define(".Variable_Name_Wrap", `
            flex-grow: 1;
        `);

        view.define(".Variable_Expression_Wrap", `
            display: flex;
            flex-basis: 100px;
            flex-grow: 2;
        `);

        view.define(".Variables_Text", `
            font-family: "Orkney Regular";
            color: white;
            margin: 6px;
            flex-basis: 20px;
            text-align: center;
        `);

        view.define(".Variables_Input_Div", `
            width: 40%;
            min-width: 144px;
            flex-grow: 1;
            margin: 6px;
        `);

        view.define(".Variables_View_Div", `
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
        `);

        view.define(".Variables_View_Expansion", `
            position: relative;
            display: inline-block;
            background-color: #ffe900cc;
            color: ${funcs.black(0.95)};
            margin: 5px;
            padding: 5px 7px 5px 31px;
            line-height: 1;
            vertical-align: middle;
            font-size: 16px;
            text-align: center;
            border-radius: 12px;
            overflow: hidden;
        `);

        view.define(".Variables_View_Expansion_Destroy_Button", `
            position: absolute;
            top: 3.5px;
            left: 3.5px;
            width: 24px;
            line-height: 1;
            vertical-align: middle;
            text-align: center;
            font-size: 12px;
            background-color: ${funcs.white(0.7)};
            border: 1px solid ${vars.main_border_color};
            border-radius: 12px;
            padding: 3px;
            cursor: pointer;
        `);

        view.define(".Help_Inner_Div", `
            margin-top: 6px;
            color: white;
        `);

        view.define(".Help_Section_Div", `
            margin: auto;
            padding: 12px;
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            /*border: 1px solid ${vars.main_border_color};*/
        `);

        view.define(".Help_Header", `
            width: 100%;
            margin: auto;
            margin-bottom: 7px;
            padding: 7px;
            text-align: center;
            font-family: "Orkney Regular";
            font-size: 20px;
        `);

        view.define(".Operator_Bubble_Div", `
            border: 1px solid ${funcs.white(0.7)};
            border-radius: 24px;
            flex-basis: 25%;
            flex-grow: 3;
            margin: 7px;
            padding: 7px;
            display: flex;
            align-items: center;
            width: 100%;
        `);

        view.define(".Operator_Symbol_Div", `
            width: 33%;
            font-family: "Carlito Regular";
            font-size: 48px;
            text-align: center;
            padding: 12px;
            flex-shrink: 0;
        `);

        view.define(".Operator_Explain_Div", `
            width: 67%;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        `);

        view.define(".Operator_Title_Div", `
            width: 100%;
            text-align: center;
            font-size: 20px;
            border-bottom: 1px solid ${funcs.white(0.7)};
            flex-basis: 25%;
            flex-shrink: 0;
        `);

        view.define(".Operator_Talk_Div", `
            width: 100%;
            padding: 3px;
            text-align: center;
        `);

        view.define(".Example_Bubble_Div", `
            border: 1px solid ${funcs.white(0.7)};
            border-radius: 24px;
            width: 100%;
            flex-shrink: 0;
            margin: 7px;
            padding: 7px;
            display: flex;
            flex-direction: column;
        `);

        view.define(".Example_Title_Div", `
            font-size: 18px;
            font-family: "Orkney Regular";
            text-align: center;
            width: 100%;
            padding: 3px;
        `);

        view.define(".Example_Thumbs_Div", `
            display: flex;
            flex-direction: row;
            width: 100%;
            justify-content: space-around;
            align-items: center;
            padding: 7px 3px;
        `);

        view.define(".Example_Thumb_Wrap", `
            width: ${album_peek_size}px;
            height: ${album_peek_size}px;
        `);

        view.define(".Likely_Tags_Div", `
            position: absolute;
            bottom: 100%;
            left: 0;
            z-index: 100;
            width: 100%;
            background-color: ${funcs.white(0.9)};
            color: black;
            font-size: 16px;
            max-height: 240px;
            overflow: auto;
        `);

        view.define(".Likely_Tag", `
            text-align: center;
            cursor: pointer;
            border-top: 1px solid black;
            padding: 2px;
            vertical-align: middle;
            line-height: 30px;
        `);

        // tags
        view.define(".Wrap_Tags", `
            display: flex;
            flex-wrap: wrap;
            margin: 24px auto;
            min-width: 276px;
            width: 100%;
            justify-content: center;
        `);

        view.define(".Alphabet_Tag_Div", `
            display: flex;
            flex-wrap: wrap;
            flex-direction: column;
            /*justify-content: center;
            align-content: flex-start;*/
            width: 40%;
            min-width: 276px;
            border: 3px solid ${vars.main_border_color};
            border-radius: 60px;
            margin: 6px;
            padding: 0;
            overflow: hidden;
        `);

        view.define(".Alphabet_Tag_Header", `
            width: 100%;
            color: white;
            font-size: 24px;
            font-family: "Carlito Regular";
            text-align: center;
            background-color: ${vars.main_border_color};
        `);

        view.define(".Alphabet_Tag_Body", `
            width: 100%;
            padding: 6px;
            display: flex;
            flex-wrap: wrap;
            flex-direction: row;
            justify-content: center;
            align-content: flex-start;
        `);

    }

    /* exports */
    return constructor;

});
