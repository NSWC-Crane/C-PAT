/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Select, SelectModule } from 'primeng/select';
import { beforeEach, describe, expect, it } from 'vitest';
import { MultiSelectDirective } from './multi-select.directive';

@Component({
  standalone: true,
  imports: [FormsModule, SelectModule, MultiSelectDirective],
  template: `<p-select [multiple]="true" [checkmark]="true" [filter]="true" [options]="options" optionLabel="label" optionValue="value" [(ngModel)]="value"></p-select>`
})
class HostComponent {
  options = [
    { label: 'Alpha', value: 'a' },
    { label: 'Bravo', value: 'b' },
    { label: 'Charlie', value: 'c' }
  ];
  value: string[] = [];
}

@Component({
  standalone: true,
  imports: [FormsModule, SelectModule, MultiSelectDirective],
  template: `<p-select [multiple]="true" [checkmark]="true" [options]="options" optionLabel="label" optionValue="value" [(ngModel)]="value"></p-select>`
})
class UnfilteredHostComponent {
  options = [
    { label: 'Alpha', value: 'a' },
    { label: 'Bravo', value: 'b' }
  ];
  value: string[] = [];
}

@Component({
  standalone: true,
  imports: [FormsModule, SelectModule, MultiSelectDirective],
  template: `<p-select
    [multiple]="true"
    [checkmark]="true"
    [maxSelectedLabels]="maxSelectedLabels"
    [selectedItemsLabel]="selectedItemsLabel"
    [options]="options"
    optionLabel="label"
    optionValue="value"
    placeholder="Choose"
    [(ngModel)]="value"
  ></p-select>`
})
class SummaryHostComponent {
  options = [
    { label: 'Alpha', value: 'a' },
    { label: 'Bravo', value: 'b' },
    { label: 'Charlie', value: 'c' },
    { label: 'Delta', value: 'd' }
  ];
  value: string[] = [];
  maxSelectedLabels: number | null = 3;
  selectedItemsLabel = '{0} items selected';
}

function overlayRoot(select: Select): HTMLElement | null {
  return ((select.overlayViewChild() as any)?.overlayViewChild()?.nativeElement as HTMLElement | undefined) ?? null;
}

function overlayHeader(select: Select): HTMLElement | null {
  return (overlayRoot(select)?.querySelector('.p-select-header') as HTMLElement | null) ?? null;
}

describe('MultiSelectDirective (integration with real p-select)', () => {
  let fixture: any;
  let select: Select;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideNoopAnimations()]
    });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    select = fixture.debugElement.query(By.directive(Select)).componentInstance as Select;
    select.show();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const header = overlayHeader(select);

    if (header && !header.querySelector('.cpat-select-all')) {
      select.onShow.emit({} as any);
      fixture.detectChanges();
    }
  });

  it('renders the overlay header + select-all against the real Select', () => {
    const header = overlayHeader(select);

    expect(header).toBeTruthy();
    expect(header!.querySelector('.cpat-select-all')).toBeTruthy();
    expect(header!.querySelector('.cpat-select-all-box')?.getAttribute('data-state')).toBe('unchecked');
  });

  it('places the select-all in the filter row, immediately before the filter field', () => {
    const header = overlayHeader(select)!;
    const children = Array.from(header.children);
    const selectAll = header.querySelector('.cpat-select-all')!;
    const filterField = header.querySelector('p-iconfield')!;

    expect(children).toContain(selectAll);
    expect(children).toContain(filterField);
    expect(children.indexOf(selectAll)).toBe(children.indexOf(filterField) - 1);
    expect(selectAll.textContent).toBe('');
    expect(selectAll.getAttribute('aria-label')).toBe('Select All');
  });

  it('renders a check or blank icon as a direct child of every option', () => {
    const options = Array.from(overlayRoot(select)!.querySelectorAll('.p-select-option'));

    expect(options).toHaveLength(3);

    options.forEach((option) => {
      expect(option.querySelector(':scope > .p-select-option-check-icon, :scope > .p-select-option-blank-icon')).toBeTruthy();
    });
  });

  it('selects all options through the real model plumbing', () => {
    const selectAll = overlayHeader(select)!.querySelector('.cpat-select-all') as HTMLElement;

    selectAll.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value).toEqual(['a', 'b', 'c']);
    expect(overlayHeader(select)!.querySelector('.cpat-select-all-box')?.getAttribute('data-state')).toBe('checked');
  });

  it('clears all options on a second toggle', () => {
    const selectAll = overlayHeader(select)!.querySelector('.cpat-select-all') as HTMLElement;

    selectAll.click();
    fixture.detectChanges();
    selectAll.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value).toEqual([]);
    expect(overlayHeader(select)!.querySelector('.cpat-select-all-box')?.getAttribute('data-state')).toBe('unchecked');
  });
});

describe('MultiSelectDirective (selected label summary)', () => {
  let fixture: any;

  const labelText = () => (fixture.nativeElement.querySelector('.p-select-label') as HTMLElement).textContent?.trim();

  const select = async (...value: string[]) => {
    fixture.componentInstance.value = value;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SummaryHostComponent],
      providers: [provideNoopAnimations()]
    });
    fixture = TestBed.createComponent(SummaryHostComponent);
    fixture.detectChanges();
  });

  it('shows the placeholder when nothing is selected', async () => {
    await select();

    expect(labelText()).toBe('Choose');
  });

  it('lists the labels up to the threshold', async () => {
    await select('a', 'b', 'c');

    expect(labelText()).toBe('Alpha, Bravo, Charlie');
  });

  it('summarises the count past the threshold', async () => {
    await select('a', 'b', 'c', 'd');

    expect(labelText()).toBe('4 items selected');
  });

  it('honours a custom threshold', async () => {
    fixture.componentInstance.maxSelectedLabels = 1;
    await select('a', 'b');

    expect(labelText()).toBe('2 items selected');
  });

  it('honours a custom summary message', async () => {
    fixture.componentInstance.selectedItemsLabel = '{0} chosen';
    await select('a', 'b', 'c', 'd');

    expect(labelText()).toBe('4 chosen');
  });

  it('lists every label when the threshold is disabled', async () => {
    fixture.componentInstance.maxSelectedLabels = null;
    await select('a', 'b', 'c', 'd');

    expect(labelText()).toBe('Alpha, Bravo, Charlie, Delta');
  });
});

describe('MultiSelectDirective (unfiltered multiple select)', () => {
  let fixture: any;
  let select: Select;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [UnfilteredHostComponent],
      providers: [provideNoopAnimations()]
    });
    fixture = TestBed.createComponent(UnfilteredHostComponent);
    fixture.detectChanges();

    select = fixture.debugElement.query(By.directive(Select)).componentInstance as Select;
    select.show();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    if (!overlayRoot(select)?.querySelector('.cpat-select-all')) {
      select.onShow.emit({} as any);
      fixture.detectChanges();
    }
  });

  it('builds a header for a select that renders none, ahead of the option list', () => {
    const header = overlayHeader(select);

    expect(header).toBeTruthy();
    expect(header!.querySelector('.cpat-select-all')).toBeTruthy();
    expect(header!.nextElementSibling?.classList.contains('p-select-list-container')).toBe(true);
  });

  it('labels the checkbox, there being no filter input to name the row', () => {
    const header = overlayHeader(select)!;

    expect(header.querySelector('.p-select-filter')).toBeNull();
    expect(header.querySelector('.cpat-select-all-label')?.textContent).toBe('Select All');
  });

  it('selects all options through the real model plumbing', () => {
    const selectAll = overlayHeader(select)!.querySelector('.cpat-select-all') as HTMLElement;

    selectAll.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value).toEqual(['a', 'b']);
  });

  it('removes the header it built when the overlay hides', () => {
    expect(overlayHeader(select)).toBeTruthy();

    select.onHide.emit({} as any);
    fixture.detectChanges();

    expect(overlayHeader(select)).toBeNull();
    expect(overlayRoot(select)?.querySelector('.p-select-list-container')).toBeTruthy();
  });
});
