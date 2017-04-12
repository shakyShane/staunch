import { createActor } from './createActor';
export declare function createStore(): {
    register(actor: any): void;
    ask: (action: any, id: any) => any;
    tell: (action: any, id: any) => void;
};
export { createActor };
