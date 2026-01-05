import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepProgressComponent, type StepConfig } from './step-progress.component';

describe('StepProgressComponent', () => {
  let component: StepProgressComponent;
  let fixture: ComponentFixture<StepProgressComponent>;

  const createComponent = (steps: StepConfig[]) => {
    TestBed.configureTestingModule({
      imports: [StepProgressComponent],
    });

    fixture = TestBed.createComponent(StepProgressComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('steps', steps);
    fixture.detectChanges();
  };

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
    TestBed.resetTestingModule();
  });

  describe('initialization', () => {
    it('should create the component', () => {
      createComponent([
        { id: 1, label: 'Step 1', state: 'pending' },
        { id: 2, label: 'Step 2', state: 'pending' },
      ]);
      expect(component).toBeTruthy();
    });

    it('should render with empty steps array', () => {
      createComponent([]);
      expect(component).toBeTruthy();
      const listItems = fixture.nativeElement.querySelectorAll('li');
      expect(listItems.length).toBe(0);
    });
  });

  describe('rendering', () => {
    it('should render correct number of steps', () => {
      createComponent([
        { id: 1, label: 'Step 1', state: 'pending' },
        { id: 2, label: 'Step 2', state: 'active' },
        { id: 3, label: 'Step 3', state: 'pending' },
      ]);

      const listItems = fixture.nativeElement.querySelectorAll('li');
      expect(listItems.length).toBe(3);
    });

    it('should display step labels correctly', () => {
      createComponent([
        { id: 1, label: 'Initialize', state: 'completed' },
        { id: 2, label: 'Deposit', state: 'active' },
        { id: 3, label: 'Complete', state: 'pending' },
      ]);

      const labels = fixture.nativeElement.querySelectorAll('[aria-hidden="true"]');
      const labelTexts = Array.from(labels)
        .map((el) => (el as HTMLElement).textContent?.trim())
        .filter((text) => text && !text.match(/^\d+$/)); // Filter out numbers

      expect(labelTexts).toContain('Initialize');
      expect(labelTexts).toContain('Deposit');
      expect(labelTexts).toContain('Complete');
    });

    it('should render step numbers for pending steps', () => {
      createComponent([
        { id: 1, label: 'Step 1', state: 'pending' },
        { id: 2, label: 'Step 2', state: 'pending' },
      ]);

      const numbers = fixture.nativeElement.querySelectorAll('span[aria-hidden="true"]');
      const numberTexts = Array.from(numbers)
        .map((el) => (el as HTMLElement).textContent?.trim())
        .filter((text) => text?.match(/^\d+$/));

      expect(numberTexts).toContain('1');
      expect(numberTexts).toContain('2');
    });

    it('should render step numbers for active steps', () => {
      createComponent([
        { id: 1, label: 'Step 1', state: 'pending' },
        { id: 2, label: 'Step 2', state: 'active' },
      ]);

      const numbers = fixture.nativeElement.querySelectorAll('span[aria-hidden="true"]');
      const numberTexts = Array.from(numbers)
        .map((el) => (el as HTMLElement).textContent?.trim())
        .filter((text) => text?.match(/^\d+$/));

      expect(numberTexts).toContain('2');
    });

    it('should render check icon for completed steps', () => {
      createComponent([
        { id: 1, label: 'Step 1', state: 'completed' },
        { id: 2, label: 'Step 2', state: 'pending' },
      ]);

      const icons = fixture.nativeElement.querySelectorAll('z-icon');
      expect(icons.length).toBe(1);
    });

    it('should render check icons for all completed steps', () => {
      createComponent([
        { id: 1, label: 'Step 1', state: 'completed' },
        { id: 2, label: 'Step 2', state: 'completed' },
        { id: 3, label: 'Step 3', state: 'pending' },
      ]);

      const icons = fixture.nativeElement.querySelectorAll('z-icon');
      expect(icons.length).toBe(2);
    });

    it('should render connecting lines between steps', () => {
      createComponent([
        { id: 1, label: 'Step 1', state: 'pending' },
        { id: 2, label: 'Step 2', state: 'active' },
        { id: 3, label: 'Step 3', state: 'pending' },
      ]);

      const listItems = fixture.nativeElement.querySelectorAll('li');
      // Should have 3 steps
      expect(listItems.length).toBe(3);

      // Check for connector divs (should be 2 for 3 steps)
      const connectors = Array.from(listItems)
        .slice(0, 2) // First 2 items should have connectors
        .map((li) => (li as HTMLElement).querySelector('div[aria-hidden="true"]'))
        .filter(Boolean);

      expect(connectors.length).toBe(2);
    });

    it('should not render connecting line after last step', () => {
      createComponent([
        { id: 1, label: 'Step 1', state: 'pending' },
        { id: 2, label: 'Step 2', state: 'pending' },
      ]);

      const listItems = fixture.nativeElement.querySelectorAll('li');
      const lastItem = listItems[listItems.length - 1];

      // Check for connector line specifically (it has flex-1 class)
      const connectorInLastItem = lastItem.querySelector('div.flex-1');
      expect(connectorInLastItem).toBeNull();
    });
  });

  describe('state styling', () => {
    it('should apply pending styles to pending steps', () => {
      createComponent([{ id: 1, label: 'Step 1', state: 'pending' }]);

      const circle = fixture.nativeElement.querySelector('[role="status"]');
      expect(circle.className).toContain('border-gray-700');
      expect(circle.className).toContain('bg-gray-800/50');
      expect(circle.className).toContain('text-gray-500');
    });

    it('should apply active styles to active steps', () => {
      createComponent([{ id: 1, label: 'Step 1', state: 'active' }]);

      const circle = fixture.nativeElement.querySelector('[role="status"]');
      expect(circle.className).toContain('border-amber-500');
      expect(circle.className).toContain('bg-amber-500/10');
      expect(circle.className).toContain('text-amber-400');
      expect(circle.className).toContain('animate-pulse');
    });

    it('should apply completed styles to completed steps', () => {
      createComponent([{ id: 1, label: 'Step 1', state: 'completed' }]);

      const circle = fixture.nativeElement.querySelector('[role="status"]');
      expect(circle.className).toContain('border-green-500');
      expect(circle.className).toContain('bg-green-500/10');
      expect(circle.className).toContain('text-green-400');
    });

    it('should apply completed connector styling after completed steps', () => {
      createComponent([
        { id: 1, label: 'Step 1', state: 'completed' },
        { id: 2, label: 'Step 2', state: 'active' },
      ]);

      const connectors = fixture.nativeElement.querySelectorAll('div[aria-hidden="true"]');
      const firstConnector = Array.from(connectors).find((el) =>
        (el as HTMLElement).className.includes('flex-1'),
      );

      expect(firstConnector).toBeTruthy();
      expect((firstConnector as HTMLElement).className).toContain('bg-green-500/50');
    });

    it('should apply pending connector styling after active steps', () => {
      createComponent([
        { id: 1, label: 'Step 1', state: 'active' },
        { id: 2, label: 'Step 2', state: 'pending' },
      ]);

      const connectors = fixture.nativeElement.querySelectorAll('div[aria-hidden="true"]');
      const firstConnector = Array.from(connectors).find((el) =>
        (el as HTMLElement).className.includes('flex-1'),
      );

      expect(firstConnector).toBeTruthy();
      expect((firstConnector as HTMLElement).className).toContain('bg-gray-700');
    });
  });

  describe('accessibility', () => {
    it('should have nav element with aria-label', () => {
      createComponent([{ id: 1, label: 'Step 1', state: 'pending' }]);

      const nav = fixture.nativeElement.querySelector('nav');
      expect(nav).toBeTruthy();
      expect(nav.getAttribute('aria-label')).toBe('Progress through swap steps');
    });

    it('should have ordered list with role="list"', () => {
      createComponent([{ id: 1, label: 'Step 1', state: 'pending' }]);

      const list = fixture.nativeElement.querySelector('ol');
      expect(list).toBeTruthy();
      expect(list.getAttribute('role')).toBe('list');
    });

    it('should have aria-current="step" on active step', () => {
      createComponent([
        { id: 1, label: 'Step 1', state: 'pending' },
        { id: 2, label: 'Step 2', state: 'active' },
        { id: 3, label: 'Step 3', state: 'pending' },
      ]);

      const circles = fixture.nativeElement.querySelectorAll('[role="status"]');
      const activeCircle = Array.from(circles).find(
        (el) => (el as HTMLElement).getAttribute('aria-current') === 'step',
      );

      expect(activeCircle).toBeTruthy();
    });

    it('should not have aria-current on pending steps', () => {
      createComponent([
        { id: 1, label: 'Step 1', state: 'pending' },
        { id: 2, label: 'Step 2', state: 'active' },
      ]);

      const circles = fixture.nativeElement.querySelectorAll('[role="status"]');
      const pendingCircle = circles[0];

      expect(pendingCircle.getAttribute('aria-current')).toBeNull();
    });

    it('should not have aria-current on completed steps', () => {
      createComponent([
        { id: 1, label: 'Step 1', state: 'completed' },
        { id: 2, label: 'Step 2', state: 'active' },
      ]);

      const circles = fixture.nativeElement.querySelectorAll('[role="status"]');
      const completedCircle = circles[0];

      expect(completedCircle.getAttribute('aria-current')).toBeNull();
    });

    it('should have descriptive aria-label with step position', () => {
      createComponent([
        { id: 1, label: 'Initialize', state: 'pending' },
        { id: 2, label: 'Deposit', state: 'active' },
        { id: 3, label: 'Complete', state: 'pending' },
      ]);

      const circles = fixture.nativeElement.querySelectorAll('[role="status"]');
      const labels = Array.from(circles).map((el) =>
        (el as HTMLElement).getAttribute('aria-label'),
      );

      expect(labels[0]).toContain('Step 1 of 3');
      expect(labels[1]).toContain('Step 2 of 3');
      expect(labels[2]).toContain('Step 3 of 3');
    });

    it('should include step label in aria-label', () => {
      createComponent([{ id: 1, label: 'Initialize', state: 'pending' }]);

      const circle = fixture.nativeElement.querySelector('[role="status"]');
      expect(circle.getAttribute('aria-label')).toContain('Initialize');
    });

    it('should include state in aria-label for pending steps', () => {
      createComponent([{ id: 1, label: 'Step 1', state: 'pending' }]);

      const circle = fixture.nativeElement.querySelector('[role="status"]');
      expect(circle.getAttribute('aria-label')).toContain('pending');
    });

    it('should include state in aria-label for active steps', () => {
      createComponent([{ id: 1, label: 'Step 1', state: 'active' }]);

      const circle = fixture.nativeElement.querySelector('[role="status"]');
      expect(circle.getAttribute('aria-label')).toContain('active');
    });

    it('should include state in aria-label for completed steps', () => {
      createComponent([{ id: 1, label: 'Step 1', state: 'completed' }]);

      const circle = fixture.nativeElement.querySelector('[role="status"]');
      expect(circle.getAttribute('aria-label')).toContain('completed');
    });

    it('should include description in aria-label when provided', () => {
      createComponent([
        { id: 1, label: 'Initialize', state: 'active', description: 'Set up swap details' },
      ]);

      const circle = fixture.nativeElement.querySelector('[role="status"]');
      expect(circle.getAttribute('aria-label')).toContain('Set up swap details');
    });

    it('should have aria-describedby when description is provided', () => {
      createComponent([
        { id: 1, label: 'Initialize', state: 'active', description: 'Set up swap details' },
      ]);

      const circle = fixture.nativeElement.querySelector('[role="status"]');
      expect(circle.getAttribute('aria-describedby')).toBe('step-desc-1');
    });

    it('should not have aria-describedby when description is not provided', () => {
      createComponent([{ id: 1, label: 'Initialize', state: 'active' }]);

      const circle = fixture.nativeElement.querySelector('[role="status"]');
      expect(circle.getAttribute('aria-describedby')).toBeNull();
    });

    it('should render hidden description element when provided', () => {
      createComponent([
        { id: 1, label: 'Initialize', state: 'active', description: 'Set up swap details' },
      ]);

      const descElement = fixture.nativeElement.querySelector('#step-desc-1');
      expect(descElement).toBeTruthy();
      expect(descElement.textContent.trim()).toBe('Set up swap details');
      expect(descElement.className).toContain('sr-only');
    });

    it('should mark visual elements as aria-hidden', () => {
      createComponent([
        { id: 1, label: 'Step 1', state: 'pending' },
        { id: 2, label: 'Step 2', state: 'active' },
      ]);

      const hiddenElements = fixture.nativeElement.querySelectorAll('[aria-hidden="true"]');
      // Should have: step numbers (2), labels (2), connectors (1), check icons (0)
      expect(hiddenElements.length).toBeGreaterThan(0);
    });
  });

  describe('getAriaLabel method', () => {
    it('should generate correct aria label for first step', () => {
      createComponent([
        { id: 1, label: 'Initialize', state: 'pending' },
        { id: 2, label: 'Deposit', state: 'pending' },
      ]);

      const label = component['getAriaLabel']({ id: 1, label: 'Initialize', state: 'pending' }, 0);
      expect(label).toBe('Step 1 of 2: Initialize, pending');
    });

    it('should generate correct aria label for middle step', () => {
      createComponent([
        { id: 1, label: 'Initialize', state: 'completed' },
        { id: 2, label: 'Deposit', state: 'active' },
        { id: 3, label: 'Complete', state: 'pending' },
      ]);

      const label = component['getAriaLabel']({ id: 2, label: 'Deposit', state: 'active' }, 1);
      expect(label).toBe('Step 2 of 3: Deposit, active');
    });

    it('should generate correct aria label with description', () => {
      createComponent([
        { id: 1, label: 'Initialize', state: 'active', description: 'Set up swap' },
      ]);

      const label = component['getAriaLabel'](
        { id: 1, label: 'Initialize', state: 'active', description: 'Set up swap' },
        0,
      );
      expect(label).toBe('Step 1 of 1: Initialize, active, Set up swap');
    });
  });

  describe('state changes', () => {
    it('should update rendering when steps input changes', () => {
      createComponent([{ id: 1, label: 'Step 1', state: 'pending' }]);

      let circle = fixture.nativeElement.querySelector('[role="status"]');
      expect(circle.className).toContain('border-gray-700');

      // Update to active state
      fixture.componentRef.setInput('steps', [{ id: 1, label: 'Step 1', state: 'active' }]);
      fixture.detectChanges();

      circle = fixture.nativeElement.querySelector('[role="status"]');
      expect(circle.className).toContain('border-amber-500');
    });

    it('should show check icon when step becomes completed', () => {
      createComponent([{ id: 1, label: 'Step 1', state: 'pending' }]);

      let icons = fixture.nativeElement.querySelectorAll('z-icon');
      expect(icons.length).toBe(0);

      // Update to completed state
      fixture.componentRef.setInput('steps', [{ id: 1, label: 'Step 1', state: 'completed' }]);
      fixture.detectChanges();

      icons = fixture.nativeElement.querySelectorAll('z-icon');
      expect(icons.length).toBe(1);
    });

    it('should update aria-current when active step changes', () => {
      createComponent([
        { id: 1, label: 'Step 1', state: 'active' },
        { id: 2, label: 'Step 2', state: 'pending' },
      ]);

      let circles = fixture.nativeElement.querySelectorAll('[role="status"]');
      expect(circles[0].getAttribute('aria-current')).toBe('step');
      expect(circles[1].getAttribute('aria-current')).toBeNull();

      // Update to move active state
      fixture.componentRef.setInput('steps', [
        { id: 1, label: 'Step 1', state: 'completed' },
        { id: 2, label: 'Step 2', state: 'active' },
      ]);
      fixture.detectChanges();

      circles = fixture.nativeElement.querySelectorAll('[role="status"]');
      expect(circles[0].getAttribute('aria-current')).toBeNull();
      expect(circles[1].getAttribute('aria-current')).toBe('step');
    });
  });

  describe('class methods', () => {
    beforeEach(() => {
      createComponent([{ id: 1, label: 'Test', state: 'pending' }]);
    });

    it('stepCircleClasses should return correct classes for pending state', () => {
      const classes = component['stepCircleClasses']('pending');
      expect(classes).toContain('border-gray-700');
      expect(classes).toContain('bg-gray-800/50');
      expect(classes).toContain('text-gray-500');
    });

    it('stepCircleClasses should return correct classes for active state', () => {
      const classes = component['stepCircleClasses']('active');
      expect(classes).toContain('border-amber-500');
      expect(classes).toContain('bg-amber-500/10');
      expect(classes).toContain('text-amber-400');
      expect(classes).toContain('animate-pulse');
    });

    it('stepCircleClasses should return correct classes for completed state', () => {
      const classes = component['stepCircleClasses']('completed');
      expect(classes).toContain('border-green-500');
      expect(classes).toContain('bg-green-500/10');
      expect(classes).toContain('text-green-400');
    });

    it('stepIconClasses should return correct classes for each state', () => {
      expect(component['stepIconClasses']('completed')).toContain('text-green-400');
      expect(component['stepIconClasses']('active')).toContain('text-amber-400');
      expect(component['stepIconClasses']('pending')).toContain('text-gray-500');
    });

    it('stepNumberClasses should return correct classes for each state', () => {
      expect(component['stepNumberClasses']('completed')).toContain('text-green-400');
      expect(component['stepNumberClasses']('active')).toContain('text-amber-400');
      expect(component['stepNumberClasses']('pending')).toContain('text-gray-500');
    });

    it('stepLabelClasses should return correct classes for each state', () => {
      const completedClasses = component['stepLabelClasses']('completed');
      expect(completedClasses).toContain('text-gray-300');

      const activeClasses = component['stepLabelClasses']('active');
      expect(activeClasses).toContain('text-amber-400');
      expect(activeClasses).toContain('font-semibold');

      const pendingClasses = component['stepLabelClasses']('pending');
      expect(pendingClasses).toContain('text-gray-500');
    });

    it('connectorClasses should return correct classes for each state', () => {
      const completedClasses = component['connectorClasses']('completed');
      expect(completedClasses).toContain('bg-green-500/50');

      const activeClasses = component['connectorClasses']('active');
      expect(activeClasses).toContain('bg-gray-700');

      const pendingClasses = component['connectorClasses']('pending');
      expect(pendingClasses).toContain('bg-gray-700');
    });
  });

  describe('responsive design', () => {
    it('should have responsive classes on labels', () => {
      createComponent([{ id: 1, label: 'Step 1', state: 'pending' }]);

      const labels = fixture.nativeElement.querySelectorAll('[aria-hidden="true"]');
      const labelElement = Array.from(labels).find(
        (el) =>
          (el as HTMLElement).textContent?.trim() === 'Step 1' &&
          (el as HTMLElement).tagName === 'DIV',
      );

      expect(labelElement).toBeTruthy();
      expect((labelElement as HTMLElement).className).toContain('sm:text-sm');
    });

    it('should have responsive margin on connectors', () => {
      createComponent([
        { id: 1, label: 'Step 1', state: 'pending' },
        { id: 2, label: 'Step 2', state: 'pending' },
      ]);

      const connectors = fixture.nativeElement.querySelectorAll('div[aria-hidden="true"]');
      const connector = Array.from(connectors).find((el) =>
        (el as HTMLElement).className.includes('flex-1'),
      );

      expect(connector).toBeTruthy();
      expect((connector as HTMLElement).className).toContain('sm:mx-4');
    });
  });

  describe('integration scenarios', () => {
    it('should render typical 3-step swap flow at initialization', () => {
      createComponent([
        { id: 0, label: 'Initialize', state: 'active' },
        { id: 1, label: 'Deposit', state: 'pending' },
        { id: 2, label: 'Complete', state: 'pending' },
      ]);

      const circles = fixture.nativeElement.querySelectorAll('[role="status"]');
      expect(circles.length).toBe(3);

      const activeCircle = circles[0];
      expect(activeCircle.getAttribute('aria-current')).toBe('step');
      expect(activeCircle.className).toContain('border-amber-500');
    });

    it('should render typical 3-step swap flow at deposit step', () => {
      createComponent([
        { id: 0, label: 'Initialize', state: 'completed' },
        { id: 1, label: 'Deposit', state: 'active' },
        { id: 2, label: 'Complete', state: 'pending' },
      ]);

      const circles = fixture.nativeElement.querySelectorAll('[role="status"]');
      const icons = fixture.nativeElement.querySelectorAll('z-icon');

      expect(icons.length).toBe(1); // Check icon on completed step
      expect(circles[1].getAttribute('aria-current')).toBe('step');
    });

    it('should render typical 3-step swap flow when complete', () => {
      createComponent([
        { id: 0, label: 'Initialize', state: 'completed' },
        { id: 1, label: 'Deposit', state: 'completed' },
        { id: 2, label: 'Complete', state: 'active' },
      ]);

      const icons = fixture.nativeElement.querySelectorAll('z-icon');
      expect(icons.length).toBe(2); // Check icons on both completed steps

      const circles = fixture.nativeElement.querySelectorAll('[role="status"]');
      expect(circles[2].getAttribute('aria-current')).toBe('step');
    });
  });
});
