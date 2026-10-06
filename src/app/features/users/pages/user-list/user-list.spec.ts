import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Role } from '@features/users/models/user.enum';
import { UserList } from './user-list';

describe('UserList', () => {
  let component: UserList;
  let fixture: ComponentFixture<UserList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserList],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(UserList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('syncs role filter changes into the role control', () => {
    component.onFilterChange({ key: 'role', selectedValues: [Role.ADMIN] });

    expect(component.roleControl.value).toEqual([Role.ADMIN]);
  });

  it('clears all user filter controls', () => {
    component.roleControl.setValue([Role.USER]);
    component.statusControl.setValue(['inactive']);
    component.searchControl.setValue('Emma');

    component.clearFilters();

    expect(component.roleControl.value).toEqual([]);
    expect(component.statusControl.value).toEqual([]);
    expect(component.searchControl.value).toBe('');
  });
});
