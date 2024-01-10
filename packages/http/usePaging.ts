import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { HttpState, PagingSetting, PagingState, PAGING_SETTING, RequestOptions } from "../../domain/http";
import { useServiceHook } from "../di/useServiceHook";
import { useHttp } from "./useHttp";
import { useUpdateEffect } from '../common/useUpdateEffect'

interface PagingAction {
  /** 刷新请求(分页重置，清除原有请求的查询参数querys)  */
  fresh: (querys: object) => void;
  /** 刷新请求(分页重置，保留每次请求的查询参数querys) */
  refresh: (querys: object) => void;
  /** 重置请求(分页重置，清除历史查询参数querys，但保留初次调用时的querys) */
  reset: () => void;
  /** 请求下一页数据 */
  nextPage: () => void;
}

interface Page {
  target: number;
  __index: number;
  __size: number;
  total: number;
  [prop: string]: number;
}

const LocalPagingSetting: Partial<PagingSetting> = {
  method: 'POST',
  sizeKey: 'pageSize',
  indexKey: 'pageNo',
  size: 10,
  start: 1,
  scrollLoading: true,
  dataPlucker: res => res.data,
  totalPlucker: res => res?.total || 0
}

export function usePaging<T>(
  url: string,
  querys: object = {},
  localSetting: Partial<PagingSetting & RequestOptions>  = {}
): [T[], PagingAction, {pagingState: PagingState, httpState: HttpState, pageInfo: Partial<Page>}] {

  /** 初始化分页请求配置 */
  const globalSetting = useServiceHook<PagingSetting>(PAGING_SETTING, 'optional');
  const setting = {...LocalPagingSetting, ...(globalSetting || {}), ...localSetting} as PagingSetting & RequestOptions;  

  /** 初始化条件查询对象 */
  const querysRef = useRef(querys);

  /** 初始化分页信息 */
  const pageRef = useRef<Partial<Page>>({});

  useLayoutEffect(() => {
    pageRef.current.target                 = setting.start;
    pageRef.current[setting['indexKey']]   = setting.start;
    pageRef.current[setting['sizeKey']]    = setting.size;

    !pageRef.current.hasOwnProperty('__index') && 
    Object.defineProperty(pageRef.current, '__index', {
      get: () => pageRef.current[setting['indexKey']],
      set: (num: number) => { pageRef.current[setting['indexKey']] = num }
    });
    !pageRef.current.hasOwnProperty('__size') && 
    Object.defineProperty(pageRef.current, '__size', {
      get: () => pageRef.current[setting['sizeKey']]
    });
  }, [])

  /** 定义分页请求逻辑 */
  const [res, request, httpState ] = useHttp<T>(url, {...setting, auto: false});

  const loadData = () => {
    if (httpState === 'pending') return;    
    return request({ ...querysRef.current, [setting['indexKey']]: pageRef.current.target, [setting['sizeKey']]: pageRef.current.__size })
  }

  const fresh = (param = {}) => {
    querysRef.current = { ...querys, ...param };
    pageRef.current.target = setting.start;
    loadData();
  }

  const refresh = (param = {}) => {
    querysRef.current = { ...querys, ...querysRef.current, ...param };
    pageRef.current.target = setting.start;
    loadData();
  }

  const reset = () => {
    querysRef.current = querys;
    pageRef.current.target = setting.start;
    loadData()
  }

  const nextPage = () => {    
    if (pagingState === 'fulled') return;
    pageRef.current.target = pageRef.current.__index + 1;
    loadData();
  }    

  useEffect(() => {
    if(setting.auto) loadData();
  }, [])

  /** 根据请求结果设置分页数据 */
  const currentPagingData = useMemo<T[]>(() => res ? setting.dataPlucker(res) : [], [res]);
  const concatedRef       = useRef<T[]>([]);

  useUpdateEffect(() => {    
    httpState === 'success' && (pageRef.current.__index = pageRef.current.target) // 只有在请求成功时才能将当前页index值更新为目标页target 
  }, [httpState])

  useUpdateEffect(() => {
    if(pageRef.current.target === setting.start) {
      concatedRef.current = currentPagingData;
    } else {
      if(setting.scrollLoading) concatedRef.current = concatedRef.current.concat(currentPagingData);
    }
  }, [currentPagingData])    

  useUpdateEffect(() => {
    pageRef.current.total = setting.totalPlucker(res);
  }, [res])   
  
  /** 根据请求结果设置分页请求状态 */
  const pagingState: PagingState = useMemo(() => {
    switch(httpState) {
      default:
        return 'refreshing';
      case 'pending':
        if(pageRef.current.target === setting.start) {
          return 'refreshing';
        } else {
          return 'loading'
        }
      case 'success':
        if(pageRef.current.target === setting.start && !currentPagingData?.length) return 'empty';
        if(currentPagingData.length < pageRef.current.__size) return 'fulled';
        if(concatedRef.current.length >= pageRef.current.total) return 'fulled';
        return 'unfulled';
    }
  }, [httpState])
  

  return [    
    setting.scrollLoading ? concatedRef.current : currentPagingData,
    { fresh, refresh, reset, nextPage },    
    {pagingState, httpState, pageInfo: pageRef.current}
  ]
}
