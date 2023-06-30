import type { Context } from 'react';
import type { Action, AnyAction, Store } from 'redux';
import type { Subscription } from '../utils/Subscription';
import type { CheckFrequency } from '../hooks/useSelector';
import type { Node } from '../utils/autotracking/tracking';
export interface ReactReduxContextValue<SS = any, A extends Action = AnyAction> {
    store: Store<SS, A>;
    subscription: Subscription;
    getServerState?: () => SS;
    stabilityCheck: CheckFrequency;
    noopCheck: CheckFrequency;
    trackingNode: Node<Record<string, unknown>>;
}
export declare const ReactReduxContext: Context<ReactReduxContextValue<any, AnyAction>>;
export declare type ReactReduxContextInstance = typeof ReactReduxContext;
export default ReactReduxContext;
