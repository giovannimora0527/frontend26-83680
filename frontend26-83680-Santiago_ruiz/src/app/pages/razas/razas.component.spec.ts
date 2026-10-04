import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RazasComponent } from './razas.component';

describe('RazasComponent', () => {
  let component: RazasComponent;
  let fixture: ComponentFixture<RazasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RazasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RazasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
