import { useUpdateEffect } from "../../packages";
import { useHttp } from "../../packages/http/useHttp";

export function DemoA() {

  const [, res, state] = useHttp<any>('/api/queryOrganization', {auto: true});

  useUpdateEffect(() => {
    console.log(res)
  }, [res])

  useUpdateEffect(() => {
    console.log(state)
  }, [state])

  return (
    <div>demo A</div>
  )
}