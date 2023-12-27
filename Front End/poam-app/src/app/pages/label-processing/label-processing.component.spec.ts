import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionProcessingComponent } from './collection-processing.component';

describe('BilletTaskProcessComponent', () => {
  let component: CollectionProcessingComponent;
  let fixture: ComponentFixture<CollectionProcessingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CollectionProcessingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionProcessingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
