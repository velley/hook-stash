import { cloneElement, isValidElement, PropsWithChildren, ReactChild, ReactElement, useEffect, useState } from "react";
import { AbstractControl } from "../../domain/form";
import { useServiceHook } from "../di/useServiceHook";
import { FORM_GROUP_CONTEXT } from "./formGroup";

interface FormControlProps extends AbstractControl {
  name?: string;
}

function createFormControl(): AbstractControl {
  return Object.create({
    
  })
}

export function FormControl(props: PropsWithChildren<FormControlProps>) {
  const { name, children } = props;

  const [value, setValue] = useState(null);

  const parent_group = useServiceHook<React.MutableRefObject<Record<string, AbstractControl>>>(FORM_GROUP_CONTEXT, 'optional');

  useEffect(() => {
    if(name && !parent_group) {
      throw new Error(`名为${name}的FormControl没有FormGroup容器，请将其包裹在一个FormGroup中`)
    }
    if(name) parent_group.current[name] = createFormControl();
  }, [name])

  let finalChildren: React.ReactElement;
  
  const setControlled = (children: ReactElement) => {
    const cProps = children.props;
    const _onChange = cProps.onChange;
    const onChange = (val: any) => {
      setValue(val);
      _onChange?.(val);
      parent_group.current[name].value = val;
      parent_group.current[name].dirty = true;
    }
    cProps['onChange'] = onChange;
    return cProps
  }

  if(isValidElement(children)) finalChildren = cloneElement(children, setControlled(children))

  return finalChildren
}