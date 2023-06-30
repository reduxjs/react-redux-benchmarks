import type { Store } from 'redux';
import type { Node } from './autotracking/tracking';
import { TrackingCache } from './autotracking/autotracking';
declare type VoidFunc = () => void;
export interface CacheWrapper {
    cache: TrackingCache;
}
declare type Listener = {
    callback: VoidFunc;
    next: Listener | null;
    prev: Listener | null;
    trigger: 'always' | 'tracked';
    selectorCache?: CacheWrapper;
};
declare function createListenerCollection(): {
    clear(): void;
    notify(): void;
    get(): Listener[];
    subscribe(callback: () => void, options?: AddNestedSubOptions): () => void;
};
declare type ListenerCollection = ReturnType<typeof createListenerCollection>;
interface AddNestedSubOptions {
    trigger: 'always' | 'tracked';
    cache?: CacheWrapper;
}
export interface Subscription {
    addNestedSub: (listener: VoidFunc, options?: AddNestedSubOptions) => VoidFunc;
    notifyNestedSubs: VoidFunc;
    handleChangeWrapper: VoidFunc;
    isSubscribed: () => boolean;
    onStateChange?: VoidFunc | null;
    trySubscribe: (options?: AddNestedSubOptions) => void;
    tryUnsubscribe: VoidFunc;
    getListeners: () => ListenerCollection;
}
export declare function createSubscription(store: Store, parentSub?: Subscription, trackingNode?: Node<any>): Subscription;
export {};
