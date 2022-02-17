// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("raul-pics/css/info", [
    "Mary/css"
], function (css) {

    function constructor({ funcs, vars }) {
        const view = css("Raul_Pics__View_Info");

        // fixed viewport
        view.define("", `
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
        `);

        view.define(".Info_Wrapper", `
            position: relative;
            width: 100%;
            height: 100%;
            overflow: auto;
            -webkit-overflow-scrolling: touch;
        `);

        view.define(".Options_Wrap, .News_Wrap, .Stats_Wrap, .License_Wrap", `
            position: relative;
            width: 85%;
            margin: 24px auto;
            border: 1px solid ${funcs.white(0.5)};
            border-radius: 6px;
        `);

        view.define(".Wrap_Header, .Wrap_Footer", `
            text-align: center;
            font-size: 26px;
            color: white;
            font-family: "Orkney Regular Italic";
            width: 100%;
            padding: 6px;
            cursor: pointer;
        `);

        view.define(".Options_Body, .Stats_Body", `
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            margin: auto;
            max-width: max-content;
            padding: 24px;
        `);

        view.define(".Option_Button", `
            display: block;
            font-size: 20px;
            background-color: rgba(48, 203, 77, 0.22);
            color: rgba(255, 255, 255, 0.95);
            border-radius: 24px;
            padding: 12px;
            text-align: center;
            cursor: pointer;
            width: 200px;
            margin: 12px;
            border: 2px solid rgba(192, 192, 192, 0.3);
            font-family: "Orkney Regular";
            height: max-content;
        `);

        view.define(".Download_Site_Link", `
            visibility: hidden;
        `);

        view.define(".Stats_Entry", `
            font-family: "Orkney Regular";
            font-size: 16px;
            text-align: center;
            color: white;
            margin: 6px;
            padding: 12px;
            /*border: 2px solid rgba(48, 203, 77, 0.22);*/
            border-radius: 18px;
            background-color: ${funcs.black(0.5)};
        `);

        view.define(".News_Text", `
            text-align: center;
            font-family: "Carlito Regular";
            font-size: 18px;
            color: white;
            margin: 24px 12px;
        `);

        view.define(".Font_Licenses_Link", `
            display: block;
            font-size: 17px;
            margin: 12px auto;
            width: max-content;
            text-align: center;
        `);
    }

    /* exports */
    return constructor;

});
