import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import type { FeeBreakdown } from '../../core/bridge-types';
import { FeeBreakdownComponent } from './fee-breakdown.component';

@Component({
  selector: 'app-test-host',
  imports: [FeeBreakdownComponent],
  template: `
    <app-fee-breakdown
      [breakdown]="breakdown()"
      [tokenSymbol]="tokenSymbol()"
      [isEstimate]="isEstimate()"
    />
  `,
})
class TestHostComponent {
  breakdown = signal<FeeBreakdown>({
    inputAmount: 1000000n, // 1 CCX (6 decimals)
    gasFee: 1000000000000000n, // 0.001 ETH (18 decimals)
    bridgeFee: 0n,
    outputAmount: 1000000n,
    inputDecimals: 6,
    outputDecimals: 6,
    nativeSymbol: 'ETH',
  });
  tokenSymbol = signal('wCCX');
  isEstimate = signal(true);
}

describe('FeeBreakdownComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    const feeBreakdown = fixture.nativeElement.querySelector('app-fee-breakdown');
    expect(feeBreakdown).toBeTruthy();
  });

  it('should display input amount with token symbol', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('You send');
    expect(text).toContain('1');
    expect(text).toContain('wCCX');
  });

  it('should display gas fee with native symbol', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Gas fee');
    expect(text).toContain('0.001');
    expect(text).toContain('ETH');
  });

  it('should display output amount', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('You receive');
    expect(text).toContain('1');
  });

  it('should show estimate disclaimer by default', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Estimated. Actual amounts may vary.');
  });

  it('should hide estimate disclaimer when isEstimate is false', () => {
    hostComponent.isEstimate.set(false);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('Estimated. Actual amounts may vary.');
  });

  it('should not display bridge fee when zero', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('Bridge fee');
  });

  it('should display bridge fee when greater than zero', () => {
    hostComponent.breakdown.set({
      inputAmount: 1000000n,
      gasFee: 1000000000000000n,
      bridgeFee: 10000n, // 0.01 CCX
      outputAmount: 990000n,
      inputDecimals: 6,
      outputDecimals: 6,
      nativeSymbol: 'ETH',
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Bridge fee');
  });

  it('should handle zero input amount', () => {
    hostComponent.breakdown.set({
      inputAmount: 0n,
      gasFee: 0n,
      bridgeFee: 0n,
      outputAmount: 0n,
      inputDecimals: 6,
      outputDecimals: 6,
      nativeSymbol: 'ETH',
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('0');
  });

  it('should handle large amounts', () => {
    hostComponent.breakdown.set({
      inputAmount: 1000000000000n, // 1,000,000 CCX
      gasFee: 100000000000000000n, // 0.1 ETH
      bridgeFee: 0n,
      outputAmount: 1000000000000n,
      inputDecimals: 6,
      outputDecimals: 6,
      nativeSymbol: 'BNB',
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('1,000,000');
    expect(text).toContain('BNB');
  });

  it('should update when token symbol changes', () => {
    hostComponent.tokenSymbol.set('CCX');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('CCX');
  });
});
