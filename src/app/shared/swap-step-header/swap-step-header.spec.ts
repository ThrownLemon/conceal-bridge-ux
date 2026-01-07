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

    // Set required signal inputs before change detection
    component.title.set('Test Title');
    component.description.set('Test Description');

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
