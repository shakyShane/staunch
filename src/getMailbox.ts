import Rx = require('rx');
import {createDefaultMailbox} from "./createDefaultMailbox";
import {createStateMailbox} from "./createStateMailbox";

export default function getMailbox(actor, type: MailboxType): Mailbox {
    if (type === 'default') {
        return createDefaultMailbox(actor);
    }
    if (type === 'state') {
        return createStateMailbox(actor);
    }
}