import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserProcessingComponent } from './user-processing.component';

describe('BilletTaskProcessComponent', () => {
  let component: UserProcessingComponent;
  let fixture: ComponentFixture<UserProcessingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserProcessingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserProcessingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
