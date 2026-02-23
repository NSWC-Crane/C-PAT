/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { Component, signal } from '@angular/core';
import { PoamAdvancedPieComponent } from './poam-advanced-pie.component';
import { ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'cpat-test-host',
  template: `<cpat-poam-advanced-pie [pieChartData]="pieChartData()" [collectionName]="collectionName()" />`,
  standalone: true,
  imports: [PoamAdvancedPieComponent]
})
class TestHostComponent {
  pieChartData = signal<any[]>([]);
  collectionName = signal<string>('Test Collection');
}

describe('PoamAdvancedPieComponent', () => {
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;
  let component: PoamAdvancedPieComponent;

  beforeAll(() => {
    (globalThis as any).CPAT = {
      Env: {
        basePath: '/',
        apiBase: '/api',
        features: {
          docsDisabled: false,
          swaggerUiEnabled: true,
          marketplaceDisabled: false
        }
      }
    };
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
    hostFixture.detectChanges();

    component = hostFixture.debugElement.children[0].componentInstance;
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have gradient set to true', () => {
      expect(component.gradient).toBe(true);
    });

    it('should define categories', () => {
      expect(component.categories).toEqual(['CAT I', 'CAT II', 'CAT III']);
    });

    it('should receive pieChartData input', () => {
      hostComponent.pieChartData.set([{ name: 'Approved', value: 5 }]);
      hostFixture.detectChanges();

      expect(component.pieChartData()).toEqual([{ name: 'Approved', value: 5 }]);
    });

    it('should receive collectionName input', () => {
      expect(component.collectionName()).toBe('Test Collection');
    });
  });

  describe('sortedPieChartData computed', () => {
    it('should return empty array when pieChartData is null/empty', () => {
      hostComponent.pieChartData.set([]);
      hostFixture.detectChanges();

      expect(component.sortedPieChartData()).toEqual([]);
    });

    it('should sort data by predefined type order', () => {
      hostComponent.pieChartData.set([
        { name: 'Open Findings', value: 3 },
        { name: 'Approved', value: 5 },
        { name: 'Closed', value: 2 },
        { name: 'Submitted', value: 1 }
      ]);
      hostFixture.detectChanges();

      const sorted = component.sortedPieChartData();

      expect(sorted[0].name).toBe('Approved');
      expect(sorted[1].name).toBe('Submitted');
      expect(sorted[2].name).toBe('Closed');
      expect(sorted[3].name).toBe('Open Findings');
    });

    it('should place Approved before Submitted', () => {
      hostComponent.pieChartData.set([
        { name: 'Submitted', value: 1 },
        { name: 'Approved', value: 2 }
      ]);
      hostFixture.detectChanges();

      const sorted = component.sortedPieChartData();

      expect(sorted[0].name).toBe('Approved');
      expect(sorted[1].name).toBe('Submitted');
    });

    it('should place Extension Requested before Expired', () => {
      hostComponent.pieChartData.set([
        { name: 'Expired', value: 1 },
        { name: 'Extension Requested', value: 2 }
      ]);
      hostFixture.detectChanges();

      const sorted = component.sortedPieChartData();

      expect(sorted[0].name).toBe('Extension Requested');
      expect(sorted[1].name).toBe('Expired');
    });

    it('should place Pending CAT-I Approval after Extension Requested', () => {
      hostComponent.pieChartData.set([
        { name: 'Pending CAT-I Approval', value: 1 },
        { name: 'Extension Requested', value: 2 }
      ]);
      hostFixture.detectChanges();

      const sorted = component.sortedPieChartData();

      expect(sorted[0].name).toBe('Extension Requested');
      expect(sorted[1].name).toBe('Pending CAT-I Approval');
    });

    it('should sort all known statuses in correct order', () => {
      hostComponent.pieChartData.set([
        { name: 'No Data', value: 1 },
        { name: 'Open Findings', value: 1 },
        { name: 'Closed', value: 1 },
        { name: 'Rejected', value: 1 },
        { name: 'Expired', value: 1 },
        { name: 'False-Positive', value: 1 },
        { name: 'Pending CAT-I Approval', value: 1 },
        { name: 'Extension Requested', value: 1 },
        { name: 'Submitted', value: 1 },
        { name: 'Approved', value: 1 }
      ]);
      hostFixture.detectChanges();

      const sorted = component.sortedPieChartData();

      expect(sorted.map((d: any) => d.name)).toEqual(['Approved', 'Submitted', 'Extension Requested', 'Pending CAT-I Approval', 'False-Positive', 'Expired', 'Rejected', 'Closed', 'Open Findings', 'No Data']);
    });

    it('should place unknown status names at the end', () => {
      hostComponent.pieChartData.set([
        { name: 'Unknown Status', value: 1 },
        { name: 'Approved', value: 2 },
        { name: 'Closed', value: 3 }
      ]);
      hostFixture.detectChanges();

      const sorted = component.sortedPieChartData();

      expect(sorted[0].name).toBe('Approved');
      expect(sorted[1].name).toBe('Closed');
      expect(sorted[2].name).toBe('Unknown Status');
    });

    it('should not mutate original pieChartData', () => {
      const original = [
        { name: 'Closed', value: 1 },
        { name: 'Approved', value: 2 }
      ];

      hostComponent.pieChartData.set(original);
      hostFixture.detectChanges();

      component.sortedPieChartData();

      expect(component.pieChartData()[0].name).toBe('Closed');
    });

    it('should handle single item', () => {
      hostComponent.pieChartData.set([{ name: 'Approved', value: 10 }]);
      hostFixture.detectChanges();

      const sorted = component.sortedPieChartData();

      expect(sorted.length).toBe(1);
      expect(sorted[0]).toEqual({ name: 'Approved', value: 10 });
    });

    it('should handle "No Data" entry', () => {
      hostComponent.pieChartData.set([{ name: 'No Data', value: 1 }]);
      hostFixture.detectChanges();

      const sorted = component.sortedPieChartData();

      expect(sorted.length).toBe(1);
      expect(sorted[0].name).toBe('No Data');
    });
  });

  describe('colorScheme computed', () => {
    it('should return a Color object with ScaleType.Ordinal', () => {
      hostComponent.pieChartData.set([{ name: 'Approved', value: 5 }]);
      hostFixture.detectChanges();

      const scheme = component.colorScheme();

      expect(scheme.name).toBe('custom');
      expect(scheme.selectable).toBe(true);
      expect(scheme.group).toBe(ScaleType.Ordinal);
    });

    it('should map Approved to its correct color', () => {
      hostComponent.pieChartData.set([{ name: 'Approved', value: 5 }]);
      hostFixture.detectChanges();

      const scheme = component.colorScheme();

      expect(scheme.domain[0]).toBe('rgba(75, 192, 115, 0.6)');
    });

    it('should map Submitted to its correct color', () => {
      hostComponent.pieChartData.set([{ name: 'Submitted', value: 3 }]);
      hostFixture.detectChanges();

      const scheme = component.colorScheme();

      expect(scheme.domain[0]).toBe('rgba(75, 192, 170, 0.55)');
    });

    it('should map Open Findings to its correct color', () => {
      hostComponent.pieChartData.set([{ name: 'Open Findings', value: 2 }]);
      hostFixture.detectChanges();

      const scheme = component.colorScheme();

      expect(scheme.domain[0]).toBe('rgba(230, 50, 50, 0.4)');
    });

    it('should map No Data to its correct color', () => {
      hostComponent.pieChartData.set([{ name: 'No Data', value: 1 }]);
      hostFixture.detectChanges();

      const scheme = component.colorScheme();

      expect(scheme.domain[0]).toBe('rgba(200, 200, 200, .6)');
    });

    it('should map Closed to its correct color', () => {
      hostComponent.pieChartData.set([{ name: 'Closed', value: 1 }]);
      hostFixture.detectChanges();

      const scheme = component.colorScheme();

      expect(scheme.domain[0]).toBe('rgba(25, 25, 25, .6)');
    });

    it('should map Expired to its correct color', () => {
      hostComponent.pieChartData.set([{ name: 'Expired', value: 1 }]);
      hostFixture.detectChanges();

      const scheme = component.colorScheme();

      expect(scheme.domain[0]).toBe('rgba(255, 160, 65, .5)');
    });

    it('should map Rejected to its correct color', () => {
      hostComponent.pieChartData.set([{ name: 'Rejected', value: 1 }]);
      hostFixture.detectChanges();

      const scheme = component.colorScheme();

      expect(scheme.domain[0]).toBe('rgba(255, 55, 55, 0.45)');
    });

    it('should use fallback gray for unknown status names', () => {
      hostComponent.pieChartData.set([{ name: 'Unknown Status', value: 1 }]);
      hostFixture.detectChanges();

      const scheme = component.colorScheme();

      expect(scheme.domain[0]).toBe('rgba(128, 128, 128, .7)');
    });

    it('should generate colors matching sorted data order', () => {
      hostComponent.pieChartData.set([
        { name: 'Open Findings', value: 3 },
        { name: 'Approved', value: 5 }
      ]);
      hostFixture.detectChanges();

      const scheme = component.colorScheme();

      expect(scheme.domain[0]).toBe('rgba(75, 192, 115, 0.6)');
      expect(scheme.domain[1]).toBe('rgba(230, 50, 50, 0.4)');
    });

    it('should return empty domain for empty data', () => {
      hostComponent.pieChartData.set([]);
      hostFixture.detectChanges();

      const scheme = component.colorScheme();

      expect(scheme.domain).toEqual([]);
    });

    it('should have domain length matching data length', () => {
      hostComponent.pieChartData.set([
        { name: 'Approved', value: 5 },
        { name: 'Submitted', value: 3 },
        { name: 'Closed', value: 1 }
      ]);
      hostFixture.detectChanges();

      const scheme = component.colorScheme();

      expect(scheme.domain.length).toBe(3);
    });

    it('should map all known statuses to their correct colors', () => {
      hostComponent.pieChartData.set([
        { name: 'Approved', value: 1 },
        { name: 'Submitted', value: 1 },
        { name: 'Extension Requested', value: 1 },
        { name: 'Pending CAT-I Approval', value: 1 },
        { name: 'False-Positive', value: 1 },
        { name: 'Expired', value: 1 },
        { name: 'Rejected', value: 1 },
        { name: 'Closed', value: 1 },
        { name: 'Open Findings', value: 1 },
        { name: 'No Data', value: 1 }
      ]);
      hostFixture.detectChanges();

      const scheme = component.colorScheme();

      expect(scheme.domain.length).toBe(10);
      expect(scheme.domain.every((c: string) => c.startsWith('rgba('))).toBe(true);
      expect(scheme.domain).not.toContain('rgba(128, 128, 128, .7)');
    });
  });

  describe('Template rendering', () => {
    it('should show spinner when pieChartData is empty', () => {
      hostComponent.pieChartData.set([]);
      hostFixture.detectChanges();

      const spinner = hostFixture.nativeElement.querySelector('p-progress-spinner, p-progressspinner');
      const spinnerContainer = hostFixture.nativeElement.querySelector('.spinner-container');

      expect(spinnerContainer || spinner).toBeTruthy();
    });

    it('should not show spinner when pieChartData has items', () => {
      hostComponent.pieChartData.set([{ name: 'Approved', value: 5 }]);
      hostFixture.detectChanges();

      const spinnerContainer = hostFixture.nativeElement.querySelector('.spinner-container');

      expect(spinnerContainer).toBeFalsy();
    });
  });
});
