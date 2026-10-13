import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Role } from '@features/users/models/user.enum';
import { User } from '@features/users/models/user.interface';
import { UserActionsButton } from './user-table-actions';

describe('UserActionsButton', () => {
  let component: UserActionsButton;
  let fixture: ComponentFixture<UserActionsButton>;
  const user: User = {
    id: '42',
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
    fixture.componentRef.setInput('onUserUpdated', vi.fn());
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('opens the user details dialog and its update dialog', () => {
    component.onDialogStateChange('open');
    component.onUserDialogStateChange('open');

    expect(component.dialogState()).toBe('open');
    expect(component.openUpdateDialog()).toBe('open');
  });

  it('notifies the list to reload after the user is updated', () => {
    const onUserUpdated = vi.fn();
    fixture.componentRef.setInput('onUserUpdated', onUserUpdated);

    component.handleUserUpdated();

    expect(onUserUpdated).toHaveBeenCalledOnce();
  });
});