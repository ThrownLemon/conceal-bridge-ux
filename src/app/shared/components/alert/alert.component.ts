import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

import type { ClassValue } from 'clsx';

import {
  alertDescriptionVariants,
  alertIconVariants,
  alertTitleVariants,
  alertVariants,
  type ZardAlertVariants,
} from './alert.variants';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import type { ZardIcon } from '@/shared/components/icon/icons';

import { ZardStringTemplateOutletDirective } from '@/shared/core/directives/string-template-outlet/string-template-outlet.directive';
import { mergeClasses } from '@/shared/utils/merge-classes';

/** Maps alert variant types to their default icon names */
const VARIANT_ICONS: Partial<Record<NonNullable<ZardAlertVariants['zType']>, ZardIcon>> = {
  destructive: 'circle-alert',
  warning: 'triangle-alert',
  info: 'info',
};

@Component({
  selector: 'z-alert, [z-alert]',
  imports: [ZardIconComponent, ZardStringTemplateOutletDirective],
  standalone: true,
  template: `
    @if (zIcon() || iconName()) {
      <span [class]="iconClasses()" data-slot="alert-icon">
        <ng-container *zStringTemplateOutlet="zIcon()">
          <z-icon [zType]="iconName()!" />
        </ng-container>
      </span>
    }

    <div class="flex-1">
      @if (zTitle()) {
        <div [class]="titleClasses()" data-slot="alert-title">
          <ng-container *zStringTemplateOutlet="zTitle()">{{ zTitle() }}</ng-container>
        </div>
      }

      @if (zDescription()) {
        <div [class]="descriptionClasses()" data-slot="alert-description">
          <ng-container *zStringTemplateOutlet="zDescription()">{{ zDescription() }}</ng-container>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'alert',
    '[class]': 'classes()',
    '[attr.data-slot]': '"alert"',
  },
  exportAs: 'zAlert',
})
export class ZardAlertComponent {
  readonly class = input<ClassValue>('');
  readonly zTitle = input<string | TemplateRef<void>>('');
  readonly zDescription = input<string | TemplateRef<void>>('');
  readonly zIcon = input<ZardIcon | TemplateRef<void>>();
  readonly zType = input<ZardAlertVariants['zType']>('default');

  protected readonly classes = computed(() =>
    mergeClasses(alertVariants({ zType: this.zType() }), this.class()),
  );

  protected readonly iconClasses = computed(() => alertIconVariants());

  protected readonly titleClasses = computed(() => alertTitleVariants());

  protected readonly descriptionClasses = computed(() =>
    alertDescriptionVariants({ zType: this.zType() }),
  );

  protected readonly iconName = computed((): ZardIcon | null => {
    const customIcon = this.zIcon();
    if (customIcon) {
      // If custom icon is a TemplateRef, return null (template will be rendered instead)
      if (customIcon instanceof TemplateRef) {
        return null;
      }
      return customIcon;
    }

    const variantType = this.zType();
    return variantType ? (VARIANT_ICONS[variantType] ?? null) : null;
  });
}
