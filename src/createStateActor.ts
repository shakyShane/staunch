import uuid = require('uuid/v4');
import Rx = require('rx');

export function createStateActor(input: IncomingStateActor): StateActor {
    const name = input.name || uuid();
    return {
        ...input,
        name,
        mailboxType: 'state'
    };
}