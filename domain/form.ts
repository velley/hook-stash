
export interface AbstractControl<T = any> {
  value: T;    
  status: 'VALID' | 'INVALID' | 'PENDING' | 'DISABLED';
  parent: FormGroupModel<T> | FormArrayModel<T> | null;
  validators: any[];
  syncValidators: any[];
  setValue?: (val: T) => void;
}

export interface FormControlModel<T = any> extends AbstractControl {
  touched: boolean;
  dirty: boolean;
}

export interface FormGroupModel<T = any> extends AbstractControl{
  readonly value: T;
  patchValue?: (val: T) => void;
  setDisabled?: (state: boolean) => void;
  controls: {
    [P in keyof T]: AbstractControl<T[P]>;
  }
}

export interface FormArrayModel<T = any> {
  readonly value: T[];
  controls: Array<AbstractControl<T>>;
}
