export interface ServiceHook<C> {
    (): C;
    token?: symbol;
}
export declare const SERVICE_CONTEXT: import("react").Context<any>;
export declare const CACHE_MAP: Record<symbol, any>;
