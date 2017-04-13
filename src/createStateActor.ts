import {MailboxTypes} from "./getMailbox";
export function createStateActor(input) {
    return {
        ...input,
        mailboxType: MailboxTypes.state
    };
}