
export interface AbstractControl<T = any> {
  value: any;
  touched: boolean;
  dirty: boolean;
  status: 'VALID' | 'INVALID' | 'PENDING' | 'DISABLED';
  parent: FormGroup | FormArray | null;
  validators: any[];
  syncValidators: any[];
  addValidators: (fn: any) => void;
}

export interface FormGroup {

}

export interface FormArray {}