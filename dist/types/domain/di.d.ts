export interface ServiceHook<C> {
    (): C;
    token?: symbol;
}
export declare type ChainNodes<T = any> = {
    data: T;
    id: symbol;
    name: string;
    parent: ChainNodes<T> | null;
};
export declare const SERVICE_CONTEXT: import("react").Context<ChainNodes<any> | null>;
export declare const CACHE_MAP: Record<symbol, any>;
