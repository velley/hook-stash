import React, { PropsWithChildren } from "react";
import { ServiceHook } from "../../domain/di";
export declare function createComponent<C = {
    [prop: string]: any;
}>(Comp: React.FC<C>, hooks: ServiceHook<unknown>[]): React.MemoExoticComponent<(props: PropsWithChildren<C>) => React.JSX.Element>;
export declare const createServiceComponent: typeof createComponent;
