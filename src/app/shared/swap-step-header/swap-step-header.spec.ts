import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwapStepHeader } from './swap-step-header';

describe('SwapStepHeader', () => {
  let component: SwapStepHeader;
  let fixture: ComponentFixture<SwapStepHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwapStepHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(SwapStepHeader);
    component = fixture.componentInstance;

    // Set required signal inputs using componentRef.setInput()
    fixture.componentRef.setInput('title', 'Test Title');
    fixture.componentRef.setInput('description', 'Test Description');

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title', () => {
    const titleElement = fixture.nativeElement.querySelector('h2');
    expect(titleElement).toBeTruthy();
    expect(titleElement?.textContent).toContain('Test Title');
  });

  it('should render description', () => {
    const descriptionElement = fixture.nativeElement.querySelector('p');
    expect(descriptionElement).toBeTruthy();
    expect(descriptionElement?.textContent).toContain('Test Description');
  });

  it('should show spinner when showSpinner is true', async () => {
    fixture.componentRef.setInput('showSpinner', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const spinnerElement = fixture.nativeElement.querySelector('z-icon');
    expect(spinnerElement).toBeTruthy();
  });

  it('should not show spinner when showSpinner is false', async () => {
    fixture.componentRef.setInput('showSpinner', false);
    fixture.detectChanges();
    await fixture.whenStable();

    const spinnerElement = fixture.nativeElement.querySelector('z-icon');
    expect(spinnerElement).toBeFalsy();
  });
});
