import { FormArray, FormGroup } from "../../domain/form";

export class AbstractControl {
  private parent: FormGroup | FormArray | null;
  touched: boolean;
  dirty: boolean;
  status: 'VALID' | 'INVALID' | 'PENDING' | 'DISABLED';  
  validators: any[];
  syncValidators: any[];
}