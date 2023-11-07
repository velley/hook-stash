import { HttpState, RequestOptions } from "../../domain/http";
/**
 * @description ajax请求，默认通过fetch发送请求，可通过di依赖注入方式提供自定义请求方法
 * @param url 请求地址，必传
 * @param localOptions 请求配置项 选传
 * @returns  [请求结果, 请求方法, 请求状态, 错误信息]
 */
export declare function useHttp<T>(url: string, localOptions?: Partial<RequestOptions>): [T | undefined, (query?: any) => Promise<void | T>, HttpState, any];
