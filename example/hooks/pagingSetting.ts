import { PagingSetting, PAGING_SETTING } from "../../packages";

export function usePagingSetting(): Partial<PagingSetting>  {
  return {
    method: 'GET',
    dataPlucker: res => res.data
  }
}

usePagingSetting.token = PAGING_SETTING;