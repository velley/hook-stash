import { HttpState, RequestOptions } from "../../domain/http";
/**
 * @description ajax请求，默认通过fetch发送请求，可通过di依赖注入提供自定义请求方法覆盖
 * @param url
 * @param options
 * @returns
 */
export declare function useHttp<T>(url: string, options?: Partial<RequestOptions>): [(query?: any) => Promise<void | T>, T, HttpState, any];
