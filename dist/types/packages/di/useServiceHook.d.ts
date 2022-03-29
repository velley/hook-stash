import { ServiceHook } from "../../domain/di";
export declare function useServiceHook<C>(input: ServiceHook<C> | symbol, optional: 'optional'): C | null;
export declare function useServiceHook<C>(input: ServiceHook<C> | symbol): C;
