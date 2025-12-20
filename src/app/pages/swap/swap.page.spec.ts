import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SwapPage } from './swap.page';
import { BridgeApiService } from '../../core/bridge-api.service';
import { EvmWalletService } from '../../core/evm-wallet.service';
import { TransactionHistoryService } from '../../core/transaction-history.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('SwapPage Security', () => {
  let component: SwapPage;
  let fixture: ComponentFixture<SwapPage>;

  beforeEach(async () => {
    const apiMock = {
      getChainConfig: () => of(null),
      getCcxSwapBalance: () => of({ result: false, balance: 0 }),
      getWccxSwapBalance: () => of({ result: false, balance: 0 }),
    };
    const walletMock = {
      hydrate: async () => Promise.resolve(),
      isConnected: () => false,
      address: () => null,
      disconnectedByUser: () => false,
      chainId: () => null,
      connector: () => null,
      provider: () => null,
      hasInjectedProvider: () => false,
      hasBinanceProvider: () => false,
      isInstalled: () => false,
      shortAddress: () => '',
    };
    const historyMock = {};
    const routeMock = {
      paramMap: of(new Map([['direction', 'ccx-to-evm']])),
    };

    await TestBed.configureTestingModule({
      imports: [SwapPage],
      providers: [
        provideRouter([]),
        { provide: BridgeApiService, useValue: apiMock },
        { provide: EvmWalletService, useValue: walletMock },
        { provide: TransactionHistoryService, useValue: historyMock },
        { provide: ActivatedRoute, useValue: routeMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SwapPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should reject excessively long inputs for amount', () => {
    // 100 digits - too long
    const longAmount = '1'.repeat(100);
    const amountControl = component.ccxToEvmForm.controls.amount;

    amountControl.setValue(longAmount);

    // Should be INVALID now due to maxLength(32)
    expect(amountControl.valid).toBe(false);
    expect(amountControl.errors?.['maxlength']).toBeTruthy();

    // Normal amount should still be valid
    amountControl.setValue('10.5');
    expect(amountControl.valid).toBe(true);
  });

  it('should reject excessively long inputs for email', () => {
    // Construct a valid email format but very long (>254 chars)
    // Local part max 64. Domain max 255.
    // But total length is limited to 254 by our validator.

    const local = 'a'.repeat(60);
    const domain = 'b'.repeat(190) + '.com'; // 194 chars
    const longEmail = `${local}@${domain}`; // 60 + 1 + 194 = 255 chars

    const emailControl = component.ccxToEvmForm.controls.email;
    emailControl.setValue(longEmail);

    expect(emailControl.valid).toBe(false);
    expect(emailControl.errors?.['maxlength']).toBeTruthy();

    // Valid length
    const validEmail = 'test@example.com';
    emailControl.setValue(validEmail);
    expect(emailControl.valid).toBe(true);
  });

  it('should provide in-context feedback when copying', async () => {
    // Ensure navigator.clipboard exists (JSDOM might not implement it fully)
    if (!navigator.clipboard) {
      Object.assign(navigator, { clipboard: { writeText: () => Promise.resolve() } });
    }
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();

    await component.copy('test-address', 'test-id');

    expect(writeTextSpy).toHaveBeenCalledWith('test-address');
    expect(component.copiedItem()).toBe('test-id');
  });
});
