import { Component, Inject, OnInit, ElementRef, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from '../../services/api/api.service';
import { ToastService } from 'ng-metro4';
import { faChevronDown, faKeyboard } from '@fortawesome/free-solid-svg-icons';
import { NgControl, NgModel } from '@angular/forms';
import { MatKeyboardComponent, MatKeyboardRef, MatKeyboardService } from 'angular-onscreen-material-keyboard';

@Component({
  selector: 'app-bartender-logins',
  templateUrl: './bartender-login.component.html',
  styleUrls: ['./bartender-login.component.scss', '../bartender.component.scss'],
})
export class BartenderLoginComponent implements OnInit {
  bartenderId: number | string;
  password: string;
  tableId: number | string;
  keyBoardIsEnable = (!!navigator.maxTouchPoints) && (window.innerWidth > 768)
  deviceWidth = window.innerWidth

  faChevronDown = faChevronDown
  faKeyboard = faKeyboard
  // @ViewChild('inputPassword') inputPasswordElement: ElementRef<HTMLInputElement>;
  private _keyboardRef: MatKeyboardRef<MatKeyboardComponent>
  @ViewChild('inputPassword', { read: ElementRef }) inputPasswordElement: ElementRef<HTMLInputElement>;
  @ViewChild('inputPassword', { read: NgModel }) inputPasswordControl: NgControl;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    @Inject(MatDialogRef) private dialogRef,
    public api: ApiService,
    private toastService: ToastService,
    private keyboardService: MatKeyboardService,
  ) { }

  ngOnInit(): void {
    this.bartenderId = this.data.bartenders[0].id || '';
    this.password = '';
  }

  public authBartender = async () => {
    this.data.spinner(true);
    try {
      const { bartender, table } = await this.api.authBartender({
        bartenderId: Number(this.bartenderId || 0),
        password: this.password,
        tableId: this.data.table.id
      });
      bartender.password = this.password
      this.bartenderId = '';
      this.password = '';
      this.dialogRef.close({ bartender, table });
    } catch (error) {
      this.toastService.create(error.error.message || 'Algo inesperado ocorreu, tente novamente', {
        additional: { distance: 400, showTop: true },
        cls: 'alert',
        timeout: 1500,
      });
      this.dialogRef.close({});
    } finally{
      this.closeKeyboard()
    }
  };

  // Pega a luminosidade da cor e retorna uma número entre 0 a 255
  public Luminosity(color: string, packageA: boolean = false) {
    let r: any;
    let g: any;
    let b: any;
    let lum: any;
    let long: any;
    let colorArr: any;
    let background: any;
    let colorS: any;
    let arr = []

    colorArr = color.split('');
    long = colorArr.length > 4;

    r = long ? parseInt(colorArr[1] + colorArr[2], 16) : parseInt(colorArr[1], 16) * 17;
    g = long ? parseInt(colorArr[3] + colorArr[4], 16) : parseInt(colorArr[2], 16) * 17;
    b = long ? parseInt(colorArr[5] + colorArr[6], 16) : parseInt(colorArr[3], 16) * 17;
    lum = (r * 299 + g * 587 + b * 114) / 1000;

    arr.push(r, g, b);

    if (!packageA) {
      background = color
      colorS = lum > 127.5 ? 'black' : 'white'
    } else {
      const filtrados = arr.filter(el => el < 40)
      if (filtrados.length >= 2) {
        r < 40 && (r = 50);
        g < 40 && (g = 50);
        b < 40 && (b = 50);
      }
      lum = (r * 299 + g * 587 + b * 114) / 1000;
      if (lum > 127.5) {
        r = r / 2;
        g = g / 2;
        b = b / 2;

        lum = (r * 299 + g * 587 + b * 114) / 1000;
        colorS = lum > 127.5 ? 'black' : 'white';
      } else {
        r = r + (.3 * r);
        g = g + (.3 * g);
        b = b + (.3 * b);
        lum = (r * 299 + g * 587 + b * 114) / 1000;
        colorS = lum > 127.5 ? 'black' : 'white';
      }
      background = `rgb(${r}, ${g}, ${b})`;

    }

    return {
      color: colorS,
      background
    }
  }

  public close() {
    this.dialogRef.close()
    this.closeKeyboard()
  }

  public setFocusInputPassword() {
    setTimeout(() => {
      this.inputPasswordElement.nativeElement.focus()
    }, 10);
  }

  public moveModalOnFocusOrBlur(type: 'blur' | 'focus') {
    const dialog = document.querySelector('mat-dialog-container') as HTMLElement
    if (dialog && window.innerWidth <= 768) {
      dialog.style.transition = 'all 0.2s'
      dialog.style.marginBottom = type === 'blur' ? '0' : '35vh'
    }
    if (type === 'focus') {
      this.openKeyboard()
    } else {
      this.closeKeyboard()
    }
  }

  public toggleKeyboard() {
    if (this.deviceWidth > 768) {
      this.keyBoardIsEnable = !this.keyBoardIsEnable
    }
    this.setFocusInputPassword()
  }

  public openKeyboard() {
    if (this.keyBoardIsEnable) {
      this._keyboardRef = this.keyboardService.open(navigator.language)
      this._keyboardRef.instance.setInputInstance(this.inputPasswordElement)
      this._keyboardRef.instance.attachControl(this.inputPasswordControl.control)
      this.setFocusInputPassword()
    }
  }

  public closeKeyboard() {
    this._keyboardRef?.dismiss()
  }

  public logger(value: any) {
    return console.log(value);
  }
}
