import { useRef } from "react";
import { AbstractControl } from "../../domain/form";
import { createServiceComponent } from "../di/createServiceComponent";
// import { AbstractControl } from "./abstractControl";

interface FormProps {

}

export const FORM_GROUP_CONTEXT = Symbol('')

export function useFormGroupContext() {
  const group = useRef<Record<string, AbstractControl>>({});
  return group
}

useFormGroupContext.token = FORM_GROUP_CONTEXT;

export const FormGroup = createServiceComponent<FormProps>(
  props => {
    return <>{props.children}</>
  },
  [useFormGroupContext]
)