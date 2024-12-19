import React from "react";
import { useEffect } from "react";
import { createServiceComponent, useProviderHook, useUpdateEffect } from "../../packages";
import { useHttp } from "../../packages/http/useHttp";
import { usePaging } from "../../packages/http/usePaging";
import { useCount } from "../hooks/useCount";

export const DemoA = createServiceComponent(
  function () {

    // const [, res, state] = useHttp<any>('/api/queryOrganization', {auto: true});
    const [res, {nextPage}, state] = usePaging<any>('/api/queryOrganization', {}, {auto: true});
    const {count} = useProviderHook(useCount, {skipOne: true})
  
    useUpdateEffect(() => {
      console.log(res)
    }, [res])
  
    useUpdateEffect(() => {
      console.log(state)
    }, [state])
    
    return (
      <div>
        demo A, count is {count}
        {state.httpState}
        <button onClick={_ => nextPage()}>下一页</button>
      </div>
    )
  },
  [useCount]
)