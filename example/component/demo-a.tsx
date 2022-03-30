import { useEffect } from "react";
import { useUpdateEffect } from "../../packages";
import { useHttp } from "../../packages/http/useHttp";
import { usePaging } from "../../packages/http/usePaging";

export function DemoA() {

  // const [, res, state] = useHttp<any>('/api/queryOrganization', {auto: true});
  const [res, {nextPage}, state] = usePaging<any>('/api/queryOrganization', {}, {auto: true})

  useUpdateEffect(() => {
    console.log(res)
  }, [res])

  useUpdateEffect(() => {
    console.log(state)
  }, [state])
  
  return (
    <div>demo A
      {state}
      <button onClick={_ => nextPage()}>下一页</button>
      </div>
  )
}