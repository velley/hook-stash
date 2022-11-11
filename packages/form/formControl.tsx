import { cloneElement, isValidElement, PropsWithChildren, ReactChild, ReactElement, useEffect, useMemo, useState } from "react";
import { AbstractControl, FormArrayModel, FormControlModel, FormGroupModel } from "../../domain/form";
import { useServiceHook } from "../di/useServiceHook";
import { useFormGroupContext } from "./formGroup";

interface FormControlProps {
  name?: string;
  index?: number;
  changeFnName?: string;
  dirtyFnName?: string;
  touchedFnName?: string;
  format?: (val: any) => any;
}

function createFormControl(parent?: FormArrayModel<any> | FormGroupModel<any>): FormControlModel {
  return {
    value: null,
    dirty: false,
    touched: false,
    status: 'PENDING',
    parent,
    validators: [],
    syncValidators: []
  }
}

export function FormControl(props: PropsWithChildren<FormControlProps>) {
  const { 
    name, 
    children, 
    dirtyFnName = 'onBlur', 
    changeFnName = 'onChange',
    touchedFnName = 'onTouched',
    format
   } = props;

  const [, setValue] = useState(null);

  const {group: parent_group} = useServiceHook(useFormGroupContext, {optional: true});

  useMemo(() => {
    if(name && !parent_group) {
      throw new Error(`名为${name}的FormControl没有FormGroup容器，请将其包裹在一个FormGroup中`)
    }
    if(name && !parent_group.controls[name]) {
      const control = createFormControl(parent_group);
      parent_group.controls[name] = control;
      return control;
    } 
  }, [name])
  

  const controlInstance = useMemo(() => parent_group.controls[name] as FormControlModel, [name, parent_group])

  let finalChildren: React.ReactElement;
  
  const setControlled = (children: ReactElement) => {
    const cProps = {...children.props} ;
    const _onChange = cProps[changeFnName];
    const _onDirty = cProps[dirtyFnName];
    const _onTouched = cProps[touchedFnName]

    const onChange = (val: any) => {
      console.log('control', val)
      const finalVal = format ? format(val) : val;
      setValue(finalVal);
      _onChange?.(finalVal);
      controlInstance.value = format ? format(val) : val;
      controlInstance.dirty = true;      
    }
    controlInstance.setValue = (val: any) => {
      setValue(val);
      controlInstance.value = val;
      controlInstance.dirty = true;  
    };

    const onDirty = () => {
      _onDirty?.(true);
      controlInstance.dirty = true;
    }

    const onTouched = () => {
      _onTouched?.(true);
      controlInstance.touched = true;
    }    

    cProps[changeFnName]  = onChange;
    cProps[dirtyFnName]   = onDirty;
    cProps[touchedFnName] = onTouched;
    cProps['defaultValue']= controlInstance.value;
    return cProps;
  }

  if(isValidElement(children)) finalChildren = cloneElement(children, setControlled(children))

  return finalChildren
}