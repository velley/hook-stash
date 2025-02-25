import React from "react";
import { useEffect } from "react";
import { useHttp } from "../../packages/http/useHttp";
import { usePaging } from "../../packages/http/usePaging";
import { useCount } from "../hooks/useCount";
import { createComponent, useInjector } from "../../packages";

export const DemoA = createComponent(
  function () {
    const [res, {nextPage}, state] = usePaging<any>('/api/queryOrganization', {}, {auto: true});
    const { count } = useInjector(useCount,)  
   
    return (
      <div>
        demo A, count is {count}
        <button onClick={_ => nextPage()}>下一页</button>
      </div>
    )
  },
  [useCount]
)

