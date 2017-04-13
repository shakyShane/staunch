import {createDefaultMailbox} from "./createDefaultMailbox";
import {createStateMailbox} from "./createStateMailbox";

export enum MailboxTypes {
    default = <any>'default',
    state = <any>'state'
}

export default function getMailbox(actor, type: MailboxTypes) {
    if (type === MailboxTypes.default) {
        return createDefaultMailbox(actor);
    }
    if (type === MailboxTypes.state) {
        return createStateMailbox(actor);
    }
}