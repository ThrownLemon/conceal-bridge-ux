import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwapStepHeader } from './swap-step-header';

describe('SwapStepHeader', () => {
  let component: SwapStepHeader;
  let fixture: ComponentFixture<SwapStepHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwapStepHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SwapStepHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
