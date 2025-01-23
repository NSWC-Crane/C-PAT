import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AAPackageProcessingComponent } from './aaPackage-processing.component';
import { AAPackageService } from './aaPackage-processing.service';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { } from 'jasmine';

describe('AAPackageProcessingComponent', () => {
  let component: AAPackageProcessingComponent;
  let fixture: ComponentFixture<AAPackageProcessingComponent>;
  let aaPackageService: jasmine.SpyObj<AAPackageService>;
  let messageService: jasmine.SpyObj<MessageService>;

  const mockAAPackages = [
    { aaPackageId: 1, aaPackage: 'Package 1' },
    { aaPackageId: 2, aaPackage: 'Package 2' }
  ];

  beforeEach(async () => {
    const aaPackageServiceSpy = jasmine.createSpyObj('AAPackageService', [
      'getAAPackages',
      'postAAPackage',
      'putAAPackage',
      'deleteAAPackage'
    ]);
    const messageServiceSpy = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [AAPackageProcessingComponent],
      providers: [
        { provide: AAPackageService, useValue: aaPackageServiceSpy },
        { provide: MessageService, useValue: messageServiceSpy }
      ]
    }).compileComponents();

    aaPackageService = TestBed.inject(AAPackageService) as jasmine.SpyObj<AAPackageService>;
    messageService = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;
    fixture = TestBed.createComponent(AAPackageProcessingComponent);
    component = fixture.componentInstance;
  });

  describe('loadAAPackages', () => {
    it('should handle error when loading packages fails', (done) => {
      const errorObs = throwError(() => new Error('Test error'));
      aaPackageService.getAAPackages.and.returnValue(Promise.resolve(errorObs));

      component.loadAAPackages().then(() => {
        expect(messageService.add).toHaveBeenCalledWith({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load A&A Packages'
        });
        done();
      });
    });
  });

  describe('onRowEditSave', () => {
    it('should save new package successfully', (done) => {
      const newAAPackage = { aaPackageId: 0, aaPackage: 'New Package' };
      const savedAAPackage = { aaPackageId: 3, aaPackage: 'New Package' };
      component.aaPackages = [newAAPackage];

      aaPackageService.postAAPackage.and.returnValue(Promise.resolve(of(savedAAPackage)));

      component.onRowEditSave(newAAPackage).then(() => {
        expect(messageService.add).toHaveBeenCalledWith({
          severity: 'success',
          summary: 'Success',
          detail: 'A&A Package Added'
        });
        done();
      });
    });

    it('should update existing package successfully', (done) => {
      const existingAAPackage = { aaPackageId: 1, aaPackage: 'Updated Package' };
      aaPackageService.putAAPackage.and.returnValue(Promise.resolve(of(existingAAPackage)));

      component.onRowEditSave(existingAAPackage).then(() => {
        expect(messageService.add).toHaveBeenCalledWith({
          severity: 'success',
          summary: 'Success',
          detail: 'A&A Package Updated'
        });
        done();
      });
    });

    it('should handle error when saving fails', (done) => {
      const testAAPackage = { aaPackageId: 1, aaPackage: 'Test' };
      const errorObs = throwError(() => new Error('Test error'));
      aaPackageService.putAAPackage.and.returnValue(Promise.resolve(errorObs));

      component.onRowEditSave(testAAPackage).then(() => {
        expect(messageService.add).toHaveBeenCalledWith({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save A&A Package'
        });
        done();
      });
    });
  });


  describe('onRowDelete', () => {
    it('should delete package successfully', (done) => {
      const packageToDelete = { aaPackageId: 1, aaPackage: 'Package 1' };
      component.aaPackages = [...mockAAPackages];
      aaPackageService.deleteAAPackage.and.returnValue(Promise.resolve(of(void 0)));

      component.onRowDelete(packageToDelete).then(() => {
        expect(messageService.add).toHaveBeenCalledWith({
          severity: 'success',
          summary: 'Success',
          detail: 'A&A Package Deleted'
        });
        done();
      });
    });

    it('should handle error when deletion fails', (done) => {
      const packageToDelete = { aaPackageId: 1, aaPackage: 'Package 1' };
      const errorObs = throwError(() => new Error('Test error'));
      aaPackageService.deleteAAPackage.and.returnValue(Promise.resolve(errorObs));

      component.onRowDelete(packageToDelete).then(() => {
        expect(messageService.add).toHaveBeenCalledWith({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete A&A Package'
        });
        done();
      });
    });
  });

  describe('onAddNewClick', () => {
    it('should add new package to the beginning of the list', () => {
      component.aaPackages = [...mockAAPackages];
      const initialLength = component.aaPackages.length;

      component.onAddNewClick();

      expect(component.aaPackages.length).toBe(initialLength + 1);
      expect(component.aaPackages[0].aaPackageId).toBe(0);
    });
  });

  describe('onRowEditCancel', () => {
    it('should remove new package on cancel', () => {
      const newAAPackage = { aaPackageId: 0, aaPackage: 'New Package' };
      component.aaPackages = [newAAPackage, ...mockAAPackages];

      component.onRowEditCancel(newAAPackage, 0);

      expect(component.aaPackages.length).toBe(2);
      expect(component.aaPackages).toEqual(mockAAPackages);
    });

    it('should revert changes for existing package on cancel', () => {
      const originalAAPackage = { aaPackageId: 1, aaPackage: 'Original' };
      const editedAAPackage = { aaPackageId: 1, aaPackage: 'Edited' };
      component.editingAAPackage = originalAAPackage;
      component.aaPackages = [editedAAPackage];

      component.onRowEditCancel(editedAAPackage, 0);

      expect(component.aaPackages[0]).toEqual(originalAAPackage);
      expect(component.editingAAPackage).toBeNull();
    });
  });
});
