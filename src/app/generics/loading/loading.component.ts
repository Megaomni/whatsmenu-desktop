import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent implements OnInit, AfterViewInit {
  @Input() backdrop: boolean
  @ViewChild('loading_container') container: ElementRef<HTMLInputElement>
  constructor() { }

  ngOnInit(): void {
  }
  
  ngAfterViewInit(): void {
    if (this.backdrop) {
      this.container.nativeElement.style.backgroundColor = "#0000000b"
    }
  }
  
}
