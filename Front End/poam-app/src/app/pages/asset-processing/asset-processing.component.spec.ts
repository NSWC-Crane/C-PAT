import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetProcessingComponent } from './asset-processing.component';

describe('BilletTaskProcessComponent', () => {
  let component: AssetProcessingComponent;
  let fixture: ComponentFixture<AssetProcessingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssetProcessingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetProcessingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
