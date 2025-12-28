import { Injectable, inject } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';

const CCX_ADDRESS_RE = /^[Cc][Cc][Xx][a-zA-Z0-9]{95}$/;
const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const AMOUNT_RE = /^[0-9]+\.?[0-9]*$/;

@Injectable()
export class SwapFormService {
  readonly #fb = inject(NonNullableFormBuilder);

  readonly ccxToEvmForm = this.#fb.group({
    ccxFromAddress: this.#fb.control('', [Validators.required, Validators.pattern(CCX_ADDRESS_RE)]),
    evmToAddress: this.#fb.control('', [Validators.required, Validators.pattern(EVM_ADDRESS_RE)]),
    amount: this.#fb.control('', [
      Validators.required,
      Validators.pattern(AMOUNT_RE),
      Validators.maxLength(32),
    ]),
    email: this.#fb.control('', [Validators.email, Validators.maxLength(254)]),
  });

  readonly evmToCcxForm = this.#fb.group({
    ccxToAddress: this.#fb.control('', [Validators.required, Validators.pattern(CCX_ADDRESS_RE)]),
    amount: this.#fb.control('', [
      Validators.required,
      Validators.pattern(AMOUNT_RE),
      Validators.maxLength(32),
    ]),
    email: this.#fb.control('', [Validators.email, Validators.maxLength(254)]),
  });

  getCcxToEvmValues() {
    const form = this.ccxToEvmForm;
    return {
      ccxFromAddress: form.controls.ccxFromAddress.value,
      evmToAddress: form.controls.evmToAddress.value,
      amount: form.controls.amount.value,
      email: form.controls.email.value.trim() || undefined,
    };
  }

  getEvmToCcxValues() {
    const form = this.evmToCcxForm;
    return {
      ccxToAddress: form.controls.ccxToAddress.value,
      amount: form.controls.amount.value,
      email: form.controls.email.value.trim() || undefined,
    };
  }

  setEvmToAddress(address: string): void {
    this.ccxToEvmForm.controls.evmToAddress.setValue(address);
  }

  validateCcxToEvmForm(): boolean {
    this.ccxToEvmForm.markAllAsTouched();
    return this.ccxToEvmForm.valid;
  }

  validateEvmToCcxForm(): boolean {
    this.evmToCcxForm.markAllAsTouched();
    return this.evmToCcxForm.valid;
  }

  resetForms(): void {
    this.ccxToEvmForm.reset();
    this.evmToCcxForm.reset();
  }
}
