// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("Mary/modules/pubsub", [
    "Mary/utils"
], function ({ newObj, isFunction }) {

    /* constants */
    const _ = Symbol();
    const pubsubs = newObj();

    /* functions */
    const warn = (id, msg) => {
        if (console && console.warn) {
            console.warn(`Mary_Pubsub: No subs for '${id}: ${msg}' msg.`);
        }
    };

    /* constructor */
    const Pubsub = id => {
        if (pubsubs[id]) {
            return pubsubs[id];
        } else {
            const pubsub = newObj(proto);
            if (id) {
                // if no id, then it's a private pubsub
                // and we don't track it
                pubsubs[id] = pubsub;
            }
            pubsub[_] = newObj();
            pubsub[_].msgs = newObj();
            pubsub[_].id = id || "instance";
            return pubsub;
        }
    };

    /* statics */
    Pubsub.key = _;
    Pubsub.type_str = "MaryPubsub";

    /* methods */
    const proto = newObj();
    proto.constructor = Pubsub;
    proto[Symbol.toStringTag] = Pubsub.type_str;

    proto.sub = function (msg, sub_call, options = {}) {
        const { thisObj, once } = options;
        const { msgs } = this[_];
        if (!msgs[msg]) {
            msgs[msg] = [];
        }
        sub_call[_] = { thisObj, once };
        msgs[msg].push(sub_call);
    };

    proto.pub = async function (msg, data, pub_call, options = {}) {
        const { thisObj } = options;
        const { id, msgs } = this[_];
        if (!msgs[msg]) return; // warn(id, msg);
        for (let sub_call of msgs[msg]) {
            const subThisObj = sub_call[_].thisObj;
            const returnData = await sub_call.call(subThisObj, data);
            if (pub_call) {
                pub_call.call(thisObj, returnData);
            }
        }
        msgs[msg] = msgs[msg].filter(sub_call => !sub_call[_].once);
    };

    proto.view = function () {
        const msgs = {};
        for (let [msg, subs] of Object.entries(this[_].msgs)) {
            msgs[msg] = subs.length;
        }
        return msgs;
    };

    /* exports */
    return Pubsub;

});
