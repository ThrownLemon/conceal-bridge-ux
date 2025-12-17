import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QrCodeComponent } from './qr-code.component';

describe('QrCodeComponent', () => {
  let component: QrCodeComponent;
  let fixture: ComponentFixture<QrCodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrCodeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QrCodeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', 'https://example.com');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate an SVG path', () => {
    const qrData = component.qrData();
    expect(qrData).not.toBeNull();
    expect(qrData?.path).toContain('M');
  });

  it('should generate optimized SVG path commands', () => {
    const qrData = component.qrData();
    // Check for "h" followed by a number > 1 (e.g., h2, h3) which indicates horizontal merging.
    // The probability of a QR code having at least one run of 2+ pixels is near 100%.
    const hasOptimizedRun = /h[2-9]/.test(qrData?.path || '') || /h\d{2,}/.test(qrData?.path || '');
    expect(hasOptimizedRun).toBe(true);
  });

  it('should generate correct viewbox', () => {
    const qrData = component.qrData();
    // Size varies depending on the QR version chosen, but it should be a square.
    expect(qrData?.viewBox).toMatch(/^0 0 \d+ \d+$/);
  });
});
