/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { computed, Renderer2, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Select } from 'primeng/select';
import { beforeEach, describe, expect, it } from 'vitest';
import { MultiSelectDirective } from './multi-select.directive';

interface Option {
  label: string;
  value: string;
  disabled?: boolean;
}

function makeEmitter() {
  const listeners: ((value?: any) => void)[] = [];

  return {
    subscribe(fn: (value?: any) => void) {
      listeners.push(fn);

      return {
        unsubscribe() {
          const index = listeners.indexOf(fn);

          if (index >= 0) listeners.splice(index, 1);
        }
      };
    },
    emit(value?: any) {
      listeners.slice().forEach((listener) => listener(value));
    }
  };
}

function makeRenderer(): Renderer2 {
  return {
    createElement: (name: string) => document.createElement(name),
    createText: (text: string) => document.createTextNode(text),
    addClass: (el: HTMLElement, name: string) => el.classList.add(name),
    setAttribute: (el: HTMLElement, name: string, value: string) => el.setAttribute(name, value),
    appendChild: (parent: Node, child: Node) => parent.appendChild(child),
    insertBefore: (parent: Node, child: Node, ref: Node | null) => parent.insertBefore(child, ref),
    removeChild: (parent: Node, child: Node) => parent.removeChild(child),
    listen: (el: HTMLElement, event: string, handler: (e: Event) => void) => {
      el.addEventListener(event, handler);

      return () => el.removeEventListener(event, handler);
    }
  } as unknown as Renderer2;
}

describe('MultiSelectDirective', () => {
  let model: WritableSignal<string[]>;
  let visible: WritableSignal<Option[]>;
  let multiple: WritableSignal<boolean>;
  let filter: WritableSignal<boolean>;
  let overlayRoot: HTMLElement;
  let header: HTMLElement;
  let listContainer: HTMLElement;
  let fakeSelect: any;

  const header$ = () => overlayRoot.querySelector('.cpat-select-all') as HTMLElement | null;
  const box$ = () => overlayRoot.querySelector('.cpat-select-all-box') as HTMLElement | null;
  const label$ = () => overlayRoot.querySelector('.cpat-select-all-label') as HTMLElement | null;

  const withoutFilter = () => {
    filter.set(false);
    header.remove();
  };

  beforeEach(() => {
    model = signal<string[]>([]);
    visible = signal<Option[]>([
      { label: 'Alpha', value: 'a' },
      { label: 'Bravo', value: 'b' },
      { label: 'Charlie', value: 'c' }
    ]);
    multiple = signal(true);
    filter = signal(true);

    overlayRoot = document.createElement('div');

    const panel = document.createElement('div');

    panel.className = 'p-select-overlay';
    overlayRoot.appendChild(panel);

    header = document.createElement('div');
    header.className = 'p-select-header';
    panel.appendChild(header);

    listContainer = document.createElement('div');
    listContainer.className = 'p-select-list-container';
    panel.appendChild(listContainer);

    fakeSelect = {
      onShow: makeEmitter(),
      onHide: makeEmitter(),
      onFilter: makeEmitter(),
      onChange: makeEmitter(),
      multiple,
      filter,
      overlayViewChild: () => ({ overlayViewChild: () => ({ nativeElement: overlayRoot }) }),
      visibleOptions: visible,
      isOptionGroup: () => false,
      isOptionDisabled: (option: Option) => !!option.disabled,
      isSelected: (option: Option) => model().includes(option.value),
      getOptionValue: (option: Option) => option.value,
      equalityKey: () => undefined,
      modelValue: model,
      placeholder: () => 'Choose',
      label: computed(() => {
        const value = model();

        if (value.length === 0) {
          return 'Choose';
        }

        return value.map((val) => visible().find((option) => option.value === val)?.label ?? String(val)).join(', ');
      }),
      updateModel: (value: string[]) => model.set(value)
    };

    TestBed.configureTestingModule({
      providers: [MultiSelectDirective, { provide: Select, useValue: fakeSelect }, { provide: Renderer2, useValue: makeRenderer() }]
    });

    TestBed.inject(MultiSelectDirective);
  });

  it('injects a select-all control into the filter header on show', () => {
    expect(header$()).toBeNull();

    fakeSelect.onShow.emit();

    expect(header$()).not.toBeNull();
    expect(box$()?.getAttribute('data-state')).toBe('unchecked');
  });

  it('does not inject when the select is not multiple', () => {
    multiple.set(false);

    fakeSelect.onShow.emit();

    expect(header$()).toBeNull();
  });

  it('builds a header ahead of the list when the select has no filter header of its own', () => {
    withoutFilter();

    fakeSelect.onShow.emit();

    const control = header$();

    expect(control).not.toBeNull();
    expect(control!.parentElement!.classList.contains('p-select-header')).toBe(true);
    expect(control!.parentElement!.nextElementSibling).toBe(listContainer);
  });

  it('labels the checkbox when no filter input names the row', () => {
    withoutFilter();

    fakeSelect.onShow.emit();

    expect(label$()?.textContent).toBe('Select All');
  });

  it('leaves the checkbox unlabelled when it shares the row with a filter input', () => {
    fakeSelect.onShow.emit();

    expect(label$()).toBeNull();
    expect(header$()?.textContent).toBe('');
    expect(header$()?.getAttribute('aria-label')).toBe('Select All');
  });

  it('removes a header it built once the overlay hides', () => {
    withoutFilter();
    fakeSelect.onShow.emit();
    expect(overlayRoot.querySelector('.p-select-header')).not.toBeNull();

    fakeSelect.onHide.emit();

    expect(overlayRoot.querySelector('.p-select-header')).toBeNull();
    expect(header$()).toBeNull();
  });

  it('leaves a header the select rendered itself in place on hide', () => {
    fakeSelect.onShow.emit();
    fakeSelect.onHide.emit();

    expect(overlayRoot.querySelector('.p-select-header')).toBe(header);
  });

  it('does not inject when the overlay has nowhere to put the control', () => {
    withoutFilter();
    listContainer.remove();

    fakeSelect.onShow.emit();

    expect(header$()).toBeNull();
  });

  it('does not inject twice across repeated shows', () => {
    fakeSelect.onShow.emit();
    fakeSelect.onShow.emit();

    expect(header.querySelectorAll('.cpat-select-all')).toHaveLength(1);
  });

  it('selects every visible option when toggled from empty', () => {
    fakeSelect.onShow.emit();

    header$()!.click();

    expect(model()).toEqual(['a', 'b', 'c']);
    expect(box$()?.getAttribute('data-state')).toBe('checked');
  });

  it('clears every visible option when toggled while fully selected', () => {
    model.set(['a', 'b', 'c']);
    fakeSelect.onShow.emit();
    expect(box$()?.getAttribute('data-state')).toBe('checked');

    header$()!.click();

    expect(model()).toEqual([]);
    expect(box$()?.getAttribute('data-state')).toBe('unchecked');
  });

  it('reflects a partial selection as indeterminate', () => {
    model.set(['a']);
    fakeSelect.onShow.emit();

    expect(box$()?.getAttribute('data-state')).toBe('indeterminate');
  });

  it('only toggles filter-visible options and preserves selections outside the filter', () => {
    model.set(['z']);
    visible.set([
      { label: 'Alpha', value: 'a' },
      { label: 'Bravo', value: 'b' }
    ]);
    fakeSelect.onShow.emit();
    fakeSelect.onFilter.emit();

    header$()!.click();

    expect(model()).toEqual(['z', 'a', 'b']);
    expect(box$()?.getAttribute('data-state')).toBe('checked');
  });

  it('ignores disabled options when selecting all', () => {
    visible.set([
      { label: 'Alpha', value: 'a' },
      { label: 'Bravo', value: 'b', disabled: true }
    ]);
    fakeSelect.onShow.emit();

    header$()!.click();

    expect(model()).toEqual(['a']);
    expect(box$()?.getAttribute('data-state')).toBe('checked');
  });

  it('resyncs indeterminate state when the model changes externally', () => {
    fakeSelect.onShow.emit();
    expect(box$()?.getAttribute('data-state')).toBe('unchecked');

    model.set(['b']);
    fakeSelect.onChange.emit();

    expect(box$()?.getAttribute('data-state')).toBe('indeterminate');
  });

  it('removes the select-all control on hide', () => {
    fakeSelect.onShow.emit();
    expect(header$()).not.toBeNull();

    fakeSelect.onHide.emit();

    expect(header$()).toBeNull();
  });

  it('lists the labels when the selection is within the threshold', () => {
    model.set(['a', 'b']);

    expect(fakeSelect.label()).toBe('Alpha, Bravo');
  });

  it('still lists the labels at exactly the threshold', () => {
    model.set(['a', 'b', 'c']);

    expect(fakeSelect.label()).toBe('Alpha, Bravo, Charlie');
  });

  it('summarises the count once the selection passes the threshold', () => {
    visible.set([
      { label: 'Alpha', value: 'a' },
      { label: 'Bravo', value: 'b' },
      { label: 'Charlie', value: 'c' },
      { label: 'Delta', value: 'd' }
    ]);
    model.set(['a', 'b', 'c', 'd']);

    expect(fakeSelect.label()).toBe('4 items selected');
  });

  it('recomputes the label as the model changes', () => {
    model.set(['a']);
    expect(fakeSelect.label()).toBe('Alpha');

    model.set(['a', 'b', 'c', 'd']);

    expect(fakeSelect.label()).toBe('4 items selected');
  });

  it('defers to the placeholder when nothing is selected', () => {
    expect(fakeSelect.label()).toBe('Choose');
  });

  it('leaves a single select alone however long its label', () => {
    visible.set([
      { label: 'Alpha', value: 'a' },
      { label: 'Bravo', value: 'b' },
      { label: 'Charlie', value: 'c' },
      { label: 'Delta', value: 'd' }
    ]);
    multiple.set(false);
    model.set(['a', 'b', 'c', 'd']);

    expect(fakeSelect.label()).toBe('Alpha, Bravo, Charlie, Delta');
  });
});
