import { getValue as consumeTag, Cell } from './autotracking';
export declare type Tag = Cell<unknown>;
export declare function createTag(name?: string): Tag;
export { consumeTag };
export declare function dirtyTag(tag: Tag, value: any): void;
export interface Node<T extends Array<unknown> | Record<string, unknown> = Array<unknown> | Record<string, unknown>> {
    collectionTag: Tag | null;
    tag: Tag | null;
    tags: Record<string, Tag>;
    children: Record<string, Node>;
    proxy: T;
    value: T;
    id: number;
}
export declare const consumeCollection: (node: Node) => void;
export declare const dirtyCollection: (node: Node) => void;
