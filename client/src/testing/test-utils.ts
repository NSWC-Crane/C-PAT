/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ComponentFixture } from '@angular/core/testing';

/**
 * Get a single element from the component's native element
 */
export function getElement<T>(fixture: ComponentFixture<T>, selector: string): HTMLElement | null {
  return fixture.nativeElement.querySelector(selector);
}

/**
 * Get all elements matching a selector from the component's native element
 */
export function getAllElements<T>(fixture: ComponentFixture<T>, selector: string): NodeListOf<HTMLElement> {
  return fixture.nativeElement.querySelectorAll(selector);
}

/**
 * Click an element and trigger change detection
 */
export function clickElement<T>(fixture: ComponentFixture<T>, selector: string): void {
  const element = getElement(fixture, selector);

  element?.click();
  fixture.detectChanges();
}

/**
 * Set an input element's value and dispatch input event
 */
export function setInputValue<T>(fixture: ComponentFixture<T>, selector: string, value: string): void {
  const input = getElement(fixture, selector) as HTMLInputElement;

  if (input) {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }
}

/**
 * Get text content of an element
 */
export function getTextContent<T>(fixture: ComponentFixture<T>, selector: string): string {
  const element = getElement(fixture, selector);

  return element?.textContent?.trim() ?? '';
}

/**
 * Check if an element exists in the DOM
 */
export function elementExists<T>(fixture: ComponentFixture<T>, selector: string): boolean {
  return getElement(fixture, selector) !== null;
}

/**
 * Wait for async operations and detect changes
 */
export async function waitForAsync<T>(fixture: ComponentFixture<T>): Promise<void> {
  await fixture.whenStable();
  fixture.detectChanges();
}
