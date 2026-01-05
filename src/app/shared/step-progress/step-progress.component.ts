import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { ClassValue } from 'clsx';

import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { mergeClasses } from '@/shared/utils/merge-classes';

/**
 * Represents the state of a single step in the progress indicator.
 */
export type StepState = 'pending' | 'active' | 'completed';

/**
 * Configuration for a single step in the progress indicator.
 */
export interface StepConfig {
  /** Unique identifier for the step */
  id: string | number;
  /** Display label for the step */
  label: string;
  /** Current state of the step */
  state: StepState;
  /** Optional description for accessibility */
  description?: string;
}

/**
 * A horizontal step progress indicator component that displays the current
 * position in a multi-step process. Shows step circles with numbers/icons,
 * labels, and connecting lines.
 *
 * ## Accessibility Features
 *
 * This component follows WCAG 2.1 AA standards and includes:
 * - Semantic HTML structure with `<nav>` and `<ol role="list">`
 * - `aria-current="step"` on the active step for screen reader navigation
 * - Comprehensive `aria-label` announcing step position, label, and state
 * - `aria-describedby` linking optional descriptions to their steps
 * - Visual elements marked with `aria-hidden="true"` to avoid duplication
 * - WCAG AA color contrast ratios (amber: #f59e0b, green: #10b981, gray: #6b7280)
 * - Non-interactive design (no focus management required)
 *
 * @example
 * ```html
 * <app-step-progress [steps]="stepConfigs()" />
 * ```
 *
 * @example With descriptions for enhanced accessibility
 * ```typescript
 * const steps = [
 *   { id: 1, label: 'Initialize', state: 'completed', description: 'Swap details confirmed' },
 *   { id: 2, label: 'Deposit', state: 'active', description: 'Waiting for blockchain confirmation' },
 *   { id: 3, label: 'Complete', state: 'pending' }
 * ];
 * ```
 */
@Component({
  selector: 'app-step-progress',
  standalone: true,
  imports: [ZardIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Progress through swap steps" class="flex w-full items-center justify-center">
      <ol role="list" class="flex w-full items-center justify-center">
        @for (step of steps(); track step.id; let i = $index; let isLast = $last) {
          <li class="flex items-center" [class.flex-1]="!isLast">
            <!-- Step circle and label -->
            <div class="flex flex-col items-center gap-2">
              <!-- Step indicator circle -->
              <div
                [class]="stepCircleClasses(step.state)"
                [attr.aria-current]="step.state === 'active' ? 'step' : null"
                [attr.aria-label]="getAriaLabel(step, i)"
                [attr.aria-describedby]="step.description ? 'step-desc-' + step.id : null"
                role="status"
              >
                @if (step.state === 'completed') {
                  <!-- Check icon for completed steps -->
                  <z-icon
                    [zType]="'check'"
                    [zSize]="'sm'"
                    [class]="stepIconClasses(step.state)"
                    aria-hidden="true"
                  />
                } @else {
                  <!-- Step number for pending/active steps -->
                  <span [class]="stepNumberClasses(step.state)" aria-hidden="true">{{
                    i + 1
                  }}</span>
                }
              </div>

              <!-- Step label -->
              <div [class]="stepLabelClasses(step.state)" aria-hidden="true">
                {{ step.label }}
              </div>

              <!-- Hidden description for screen readers if provided -->
              @if (step.description) {
                <span [id]="'step-desc-' + step.id" class="sr-only">
                  {{ step.description }}
                </span>
              }
            </div>

            <!-- Connecting line (not shown after last step) -->
            @if (!isLast) {
              <div [class]="connectorClasses(step.state)" aria-hidden="true"></div>
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class StepProgressComponent {
  /** Array of step configurations to display */
  readonly steps = input.required<StepConfig[]>();

  /** Optional CSS classes to apply to the component */
  readonly class = input<ClassValue>('');

  /**
   * Generates CSS classes for the step circle based on state.
   */
  protected stepCircleClasses(state: StepState): string {
    const baseClasses =
      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300';

    switch (state) {
      case 'completed':
        return mergeClasses(baseClasses, 'border-green-500 bg-green-500/10 text-green-400');
      case 'active':
        return mergeClasses(
          baseClasses,
          'border-amber-500 bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-500/20 animate-pulse',
        );
      case 'pending':
      default:
        return mergeClasses(baseClasses, 'border-gray-700 bg-gray-800/50 text-gray-500');
    }
  }

  /**
   * Generates CSS classes for the step icon based on state.
   */
  protected stepIconClasses(state: StepState): string {
    switch (state) {
      case 'completed':
        return 'text-green-400';
      case 'active':
        return 'text-amber-400';
      case 'pending':
      default:
        return 'text-gray-500';
    }
  }

  /**
   * Generates CSS classes for the step number based on state.
   */
  protected stepNumberClasses(state: StepState): string {
    const baseClasses = 'text-sm font-semibold transition-colors duration-300';

    switch (state) {
      case 'completed':
        return mergeClasses(baseClasses, 'text-green-400');
      case 'active':
        return mergeClasses(baseClasses, 'text-amber-400');
      case 'pending':
      default:
        return mergeClasses(baseClasses, 'text-gray-500');
    }
  }

  /**
   * Generates CSS classes for the step label based on state.
   */
  protected stepLabelClasses(state: StepState): string {
    const baseClasses = 'text-xs font-medium transition-colors duration-300 sm:text-sm';

    switch (state) {
      case 'completed':
        return mergeClasses(baseClasses, 'text-gray-300');
      case 'active':
        return mergeClasses(baseClasses, 'text-amber-400 font-semibold');
      case 'pending':
      default:
        return mergeClasses(baseClasses, 'text-gray-500');
    }
  }

  /**
   * Generates CSS classes for the connector line based on the step state
   * (applies to the line following the step).
   */
  protected connectorClasses(state: StepState): string {
    const baseClasses = 'mx-2 h-0.5 flex-1 transition-all duration-300 sm:mx-4';

    switch (state) {
      case 'completed':
        return mergeClasses(baseClasses, 'bg-green-500/50');
      case 'active':
      case 'pending':
      default:
        return mergeClasses(baseClasses, 'bg-gray-700');
    }
  }

  /**
   * Generates an accessible label for screen readers.
   * Includes step position, label, state, and optional description.
   */
  protected getAriaLabel(step: StepConfig, index: number): string {
    const total = this.steps().length;
    const position = `Step ${index + 1} of ${total}`;
    const status = step.state === 'completed' ? 'completed' : step.state;
    const description = step.description ? `, ${step.description}` : '';
    return `${position}: ${step.label}, ${status}${description}`;
  }
}
