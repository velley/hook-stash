import { GetStash } from "./useStash";

interface RenderProps<T> {
  target: GetStash<T>;
  children: (value: T) => JSX.Element;
}

export function Render<T>(props: RenderProps<T>) {
  const { target, children } = props;
  const value = target.useState();
  return children(value);
}