import { useRef } from "react";
import { AbstractControl, FormArrayModel, FormGroupModel } from "../../domain/form";
import { createServiceComponent } from "../di/createServiceComponent";
import { useServiceHook } from "../di/useServiceHook";
// import { AbstractControl } from "./abstractControl";

interface FormGroupProps {
  onChange: (val: any) => void;
}

export const FORM_GROUP_CONTEXT = Symbol('')

export function useFormGroupContext() {
  const group = useRef< Partial<FormGroupModel>>({});

  function createFormGroup (parent: FormGroupModel | FormArrayModel, handles: any) {
    group.current.parent = parent;
    group.current.setValue = (val: any) => {
      handles.onChange(val);
    }
    Object.defineProperty(group, 'value', {
      get: () => {
  
      }
    })
  }
  return { group, createFormGroup }
}

useFormGroupContext.token = FORM_GROUP_CONTEXT;



export const FormGroup = createServiceComponent<FormGroupProps>(
  props => {


    const { group } = useServiceHook(useFormGroupContext);

    createFormGroup(group);

    return <>{props.children}</>
  },
  [useFormGroupContext]
)e44