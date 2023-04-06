import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  MAT_DIALOG_DATA,
  MatButtonModule,
  MatDialogModule,
  MatDialogRef,
  MatIconModule,
  MatMenuModule,
  MatTooltipModule
} from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { AngularFireAuthStub } from '../../tests/helper';
import { NgxAuthFirebaseuiAvatarComponent } from './auth-firebaseui-avatar.component';

describe('NgxAuthFirebaseuiAvatarComponent', () => {
  let component: NgxAuthFirebaseuiAvatarComponent;
  let fixture: ComponentFixture<NgxAuthFirebaseuiAvatarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [NgxAuthFirebaseuiAvatarComponent],
      imports: [
        AngularFireModule,
        RouterTestingModule,
        MatMenuModule,
        MatButtonModule,
        MatTooltipModule,
        MatDialogModule,
        MatIconModule
      ],
      providers: [
        { provide: AngularFireAuth, useValue: AngularFireAuthStub },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} }
      ]
    })
      .compileComponents().then(() => {
        fixture = TestBed.createComponent(NgxAuthFirebaseuiAvatarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
