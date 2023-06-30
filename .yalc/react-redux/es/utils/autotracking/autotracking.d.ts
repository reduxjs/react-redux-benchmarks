export declare let $REVISION: number;
declare type EqualityFn = (a: any, b: any) => boolean;
export declare class Cell<T> {
    revision: number;
    _value: T;
    _lastValue: T;
    _isEqual: EqualityFn;
    _name: string | undefined;
    constructor(initialValue: T, isEqual?: EqualityFn, name?: string);
    get value(): T;
    set value(newValue: T);
}
export declare class TrackingCache {
    _cachedValue: any;
    _cachedRevision: number;
    _deps: Cell<any>[];
    hits: number;
    _needsRecalculation: boolean;
    fn: (...args: any[]) => any;
    constructor(fn: (...args: any[]) => any);
    clear(): void;
    getValue: () => any;
    needsRecalculation(): boolean;
    get value(): any;
    get revision(): number;
}
export declare function getValue<T>(cell: Cell<T>): T;
declare type CellValue<T extends Cell<unknown>> = T extends Cell<infer U> ? U : never;
export declare function setValue<T extends Cell<unknown>>(storage: T, value: CellValue<T>): void;
export declare function createCell<T = unknown>(initialValue: T, isEqual?: EqualityFn, name?: string): Cell<T>;
export declare function createCache<T = unknown>(fn: (...args: any[]) => T): TrackingCache;
export {};
