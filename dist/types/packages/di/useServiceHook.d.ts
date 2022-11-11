import { ServiceHook } from "../../domain/di";
interface ServiceOptions {
    optional?: boolean;
    skipOne?: boolean;
}
export declare function useServiceHook<C>(input: ServiceHook<C> | symbol, options?: ServiceOptions): C;
export {};
