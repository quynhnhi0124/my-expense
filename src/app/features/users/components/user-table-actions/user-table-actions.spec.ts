import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Role } from '@features/users/models/user.enum';
import { User } from '@features/users/models/user.interface';
import { UserActionsButton } from './user-table-actions';

describe('UserActionsButton', () => {
  let component: UserActionsButton;
  let fixture: ComponentFixture<UserActionsButton>;
  const user: User = {
    id: 42,
    firstName: 'Alex',
    lastName: 'Admin',
    email: 'alex@example.test',
    role: Role.USER,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00'),
    updatedAt: new Date('2026-01-01T00:00:00'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UserActionsButton] }).compileComponents();

    fixture = TestBed.createComponent(UserActionsButton);
    fixture.componentRef.setInput('user', user);
    fixture.componentRef.setInput('updateStatus', () => of(user));
    fixture.componentRef.setInput('updateRole', () => of(user));
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('submits the selected role and closes the dialog after success', () => {
    const updateRole = vi.fn(() => of({ ...user, role: Role.ADMIN }));
    fixture.componentRef.setInput('updateRole', updateRole);
    component.dialogState.set('open');
    component.prepareRoleChange();
    component.roleControl.setValue(Role.ADMIN);

    component.saveRoleChange();

    expect(updateRole).toHaveBeenCalledWith(user.id, Role.ADMIN);
    expect(component.dialogState()).toBe('closed');
  });

  it('submits a status action and closes the dialog after success', () => {
    const updateStatus = vi.fn(() => of({ ...user, isActive: false }));
    fixture.componentRef.setInput('updateStatus', updateStatus);
    component.dialogState.set('open');

    component.deactivateUser();

    expect(updateStatus).toHaveBeenCalledWith(user.id, 'deactivate');
    expect(component.dialogState()).toBe('closed');
  });
});