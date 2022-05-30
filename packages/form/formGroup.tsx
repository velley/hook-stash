import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { AbstractControl, FormArrayModel, FormGroupModel } from "../../domain/form";
import { createServiceComponent } from "../di/createServiceComponent";
import { useServiceHook } from "../di/useServiceHook";
// import { AbstractControl } from "./abstractControl";

interface FormGroupProps {
  onChange?: (val: any) => void;
  onCreated?: (group: FormGroupModel) => void;
}

export const FORM_GROUP_CONTEXT = Symbol('')

export function useFormGroupContext() {
  const group = useRef<FormGroupModel>();

  useMemo(() => {
    group.current = {} as FormGroupModel;
    group.current.controls = {};
    Object.defineProperty(group.current, 'value', {
      get: () => {
        const res = {};
        for(let key in group.current.controls) {
          res[key] = group.current.controls[key].value;
        }
        return res
      }
    })
  }, [])

  function createFormGroup (parent: FormGroupModel | FormArrayModel, handles?: any) {    
    group.current.parent = parent;    
    group.current.patchValue = (val: any) => {
      // handles?.onChange(val);
      const controls = group.current.controls;
      for(let key in val) {
        controls[key].setValue(val[key]);
      }
    }    
  }
  return { group: group.current, createFormGroup }
}

// useFormGroupContext.token = FORM_GROUP_CONTEXT;

// const ForwadFormGroup = forwardRef((props, ref) => {

// })


export const FormGroup = createServiceComponent<FormGroupProps>(
  props => {

    const { group: local_group, createFormGroup } = useServiceHook(useFormGroupContext);
    const parent = useServiceHook(useFormGroupContext, {skipOne: true, optional: true});

    useMemo(() => {
      createFormGroup(parent?.group,);
    }, [])

    useEffect(() => {
      props.onCreated?.(local_group);
      console.log('loca', local_group, props)
    }, [])
    

    return <>{props.children}</>
  },
  [useFormGroupContext]
)

// export const Form = forwardRef(FormGroup)