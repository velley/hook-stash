import { useRef} from "react";
import { PagingSetting, PagingState, PAGING_SETTING, RequestOptions } from "../../domain/http";
import { useServiceHook } from "../core/di/useServiceHook";
import { useHttpClient } from "./useHttpClient";
import { useStash } from "../core/stash/useStash";
import { useLoad } from "../common/useLoad";
import { useComputed } from "../core/stash/useComputed";
import { Stash } from "../../domain/stash";

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
) {

  /** 初始化分页请求配置 */
  const globalSetting = useServiceHook<PagingSetting>(PAGING_SETTING, {optional: true});
  const setting = {...LocalPagingSetting, ...(globalSetting || {}), ...localSetting} as PagingSetting & RequestOptions;  

  /** 初始化条件查询对象 */
  const querysRef = useRef(querys);

  /** 初始化分页信息 */
  const pageRef = useRef<Page>({} as Page);

  useLoad(() => {
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
  })

  /** 定义分页请求逻辑 */
  const [, request, httpState ] = useHttpClient<T>(url, {...setting, auto: false});
  const [currentPagingData, setCurrentPagingData] = useStash<T[]>([]);

  const loadData = () => {
    if (httpState() === 'pending') return;    
    return request({ ...querysRef.current, [setting['indexKey']]: pageRef.current.target, [setting['sizeKey']]: pageRef.current.__size })
      .then(res => {
        if(!res) return;
        pageRef.current.total = setting.totalPlucker(res);
        const list = setting.dataPlucker(res) as T[];
        if(pageRef.current.target === setting.start || !setting.scrollLoading) {
          setCurrentPagingData(list);
        } else {
          setCurrentPagingData(val => val.concat(list));
        }
      })
  }

  const fresh = (param = {}) => {
    querysRef.current = { ...querys, ...param };
    pageRef.current.target = setting.start;
    setCurrentPagingData([]);
    loadData();
  }

  const refresh = (param = {}) => {
    querysRef.current = { ...querys, ...querysRef.current, ...param };
    pageRef.current.target = setting.start;
    setCurrentPagingData([]);
    loadData();
  }

  const reset = () => {
    querysRef.current = querys;
    pageRef.current.target = setting.start;
    setCurrentPagingData([]);
    loadData();
  }

  const nextPage = () => {    
    if (pagingState() === 'fulled') return;
    pageRef.current.target = pageRef.current.__index + 1;
    loadData();
  }    

  useLoad(() => {
    if(setting.auto) loadData();
  })  

  httpState.watchEffect(val => {
    if(val === 'success') {
      pageRef.current.__index = pageRef.current.target;
    }
  })  
  
  /** 根据请求结果设置分页请求状态 */
  const pagingState: Stash<PagingState | null> = useComputed(() => {
    switch(httpState()) {
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
        if(currentPagingData.length >= pageRef.current.total) return 'fulled';
        return 'unfulled';
    }
  })  

  return [    
    currentPagingData,
    { fresh, refresh, reset, nextPage },    
    {pagingState, httpState, pageInfo: pageRef.current}
  ] as const
}
