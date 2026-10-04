import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormulaMedicaComponent } from './formula-medica.component';

describe('FormulaMedicaComponent', () => {
  let component: FormulaMedicaComponent;
  let fixture: ComponentFixture<FormulaMedicaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormulaMedicaComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(FormulaMedicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
