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
import { HomeComponent } from './home.component';
import { describe, it, expect, beforeEach } from 'vitest';
import { SharedService } from '../../common/services/shared.service';
import { createMockSharedService } from '../../../testing/mocks/service-mocks';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let sharedService: ReturnType<typeof createMockSharedService>;

  beforeEach(async () => {
    sharedService = createMockSharedService();

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [{ provide: SharedService, useValue: sharedService }]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should trigger the guided tour via the shared service', () => {
    component.startTour();

    expect(sharedService.startTour).toHaveBeenCalled();
  });
});
