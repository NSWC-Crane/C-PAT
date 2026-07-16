/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { computed, DestroyRef, Directive, inject, input, Renderer2, Signal } from '@angular/core';
import { equals } from '@primeuix/utils';
import { Select } from 'primeng/select';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'p-select[multiple]',
  standalone: true
})
export class MultiSelectDirective {
  private readonly select = inject(Select, { self: true });
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);

  readonly maxSelectedLabels = input<number | null>(3);
  readonly selectedItemsLabel = input('{0} items selected');

  private container: HTMLElement | null = null;
  private box: HTMLElement | null = null;
  private createdHeader: HTMLElement | null = null;
  private removeClick: (() => void) | null = null;
  private removeKeydown: (() => void) | null = null;
  private removeHeaderClick: (() => void) | null = null;

  constructor() {
    this.summariseLabelBeyondThreshold();

    const subscriptions = [
      this.select.onShow.subscribe(() => this.onOverlayShow()),
      this.select.onHide.subscribe(() => this.teardownSelectAll()),
      this.select.onFilter.subscribe(() => this.syncState()),
      this.select.onChange.subscribe(() => this.syncState())
    ];

    this.destroyRef.onDestroy(() => {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
      this.teardownSelectAll();
    });
  }

  private summariseLabelBeyondThreshold(): void {
    const base = this.select.label;

    (this.select as unknown as { label: Signal<string> }).label = computed(() => {
      const value = this.select.modelValue();
      const max = this.maxSelectedLabels();

      if (max === null || !this.select.multiple() || !Array.isArray(value) || value.length <= max) {
        return base();
      }

      return this.selectedItemsLabel().replace('{0}', String(value.length));
    });
  }

  private onOverlayShow(): void {
    if (!this.select.multiple()) {
      return;
    }

    const overlayEl = this.select.overlayViewChild()?.overlayViewChild()?.nativeElement as HTMLElement | undefined;

    if (!overlayEl) {
      return;
    }

    const header = (overlayEl.querySelector('.p-select-header') as HTMLElement | null) ?? this.createHeader(overlayEl);

    if (!header || header.querySelector('.cpat-select-all')) {
      return;
    }

    this.buildSelectAll(header);
    this.syncState();
  }

  private createHeader(overlayEl: HTMLElement): HTMLElement | null {
    const listContainer = overlayEl.querySelector('.p-select-list-container');
    const listParent = listContainer?.parentNode;

    if (!listContainer || !listParent) {
      return null;
    }

    const header = this.renderer.createElement('div') as HTMLElement;

    this.renderer.addClass(header, 'p-select-header');
    this.renderer.insertBefore(listParent, header, listContainer);

    this.removeHeaderClick = this.renderer.listen(header, 'click', (event: Event) => event.stopPropagation());
    this.createdHeader = header;

    return header;
  }

  private buildSelectAll(header: HTMLElement): void {
    const container = this.renderer.createElement('div') as HTMLElement;

    this.renderer.addClass(container, 'cpat-select-all');
    this.renderer.setAttribute(container, 'role', 'checkbox');
    this.renderer.setAttribute(container, 'tabindex', '0');
    this.renderer.setAttribute(container, 'aria-label', 'Select All');
    this.renderer.setAttribute(container, 'title', 'Select All');

    const box = this.renderer.createElement('div') as HTMLElement;

    this.renderer.addClass(box, 'cpat-select-all-box');
    this.renderer.setAttribute(box, 'data-state', 'unchecked');

    this.renderer.appendChild(container, box);

    if (!this.select.filter()) {
      const label = this.renderer.createElement('span') as HTMLElement;

      this.renderer.addClass(label, 'cpat-select-all-label');
      this.renderer.appendChild(label, this.renderer.createText('Select All'));
      this.renderer.appendChild(container, label);
    }

    this.renderer.insertBefore(header, container, header.firstChild);

    this.removeClick = this.renderer.listen(container, 'click', (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      this.toggleAll(event);
    });
    this.removeKeydown = this.renderer.listen(container, 'keydown', (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        this.toggleAll(event);
      }
    });

    this.container = container;
    this.box = box;
  }

  private selectableVisibleOptions(): any[] {
    return this.select.visibleOptions().filter((option: any) => !this.select.isOptionGroup(option) && !this.select.isOptionDisabled(option));
  }

  private toggleAll(event: Event): void {
    const options = this.selectableVisibleOptions();

    if (!options.length) {
      return;
    }

    const key = this.select.equalityKey();
    const modelValue = this.select.modelValue();
    const current: any[] = Array.isArray(modelValue) ? [...modelValue] : [];
    const allSelected = options.every((option: any) => this.select.isSelected(option));

    let newValue: any[];

    if (allSelected) {
      const removeValues = options.map((option: any) => this.select.getOptionValue(option));

      newValue = current.filter((value: any) => !removeValues.some((removeValue: any) => equals(value, removeValue, key)));
    } else {
      const additions = options.filter((option: any) => !this.select.isSelected(option)).map((option: any) => this.select.getOptionValue(option));

      newValue = [...current, ...additions];
    }

    this.select.updateModel(newValue, event);
    this.select.onChange.emit({ originalEvent: event, value: newValue });
    this.syncState();
  }

  private syncState(): void {
    if (!this.box || !this.container) {
      return;
    }

    const options = this.selectableVisibleOptions();
    const total = options.length;
    const selected = options.filter((option: any) => this.select.isSelected(option)).length;

    let state: 'checked' | 'unchecked' | 'indeterminate';

    if (total === 0 || selected === 0) {
      state = 'unchecked';
    } else if (selected === total) {
      state = 'checked';
    } else {
      state = 'indeterminate';
    }

    const ariaChecked = { checked: 'true', indeterminate: 'mixed', unchecked: 'false' }[state];

    this.renderer.setAttribute(this.box, 'data-state', state);
    this.renderer.setAttribute(this.container, 'aria-checked', ariaChecked);
    this.renderer.setAttribute(this.container, 'data-disabled', total === 0 ? 'true' : 'false');
  }

  private teardownSelectAll(): void {
    this.removeClick?.();
    this.removeKeydown?.();
    this.removeHeaderClick?.();
    this.container?.remove();
    this.createdHeader?.remove();
    this.removeClick = null;
    this.removeKeydown = null;
    this.removeHeaderClick = null;
    this.container = null;
    this.box = null;
    this.createdHeader = null;
  }
}
