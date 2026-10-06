import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { AppSidebar } from './sidebar';

describe('AppSidebar', () => {
  let component: AppSidebar;
  let fixture: ComponentFixture<AppSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppSidebar],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { getCurrentUser: () => null } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppSidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
