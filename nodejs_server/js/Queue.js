// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

/* constructor */
function Queue() {
    const inst = Object.create(Queue.prototype);
    inst.queue = [];
    return inst;
};

Queue.prototype = {};

/* methods */
Queue.prototype.push = async function (callback) {
    const inst = this;

    inst.queue.push(async () => {
        await callback();
        await inst.pop();
    });

    if (inst.queue.length === 1) {
        inst.exec();
    }

    return inst;
};

Queue.prototype.pop = async function () {
    const inst = this;
    inst.queue = inst.queue.slice(1);
};

Queue.prototype.exec = async function () {
    const inst = this;
    while (inst.queue.length !== 0) {
        await inst.queue[0]();
    }
};

/* exports */
module.exports = Queue;
