import { Component, Input, OnInit } from '@angular/core';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-accordion',
  templateUrl: './accordion.component.html',
  styleUrls: ['./accordion.component.scss']
})

export class AccordionComponent implements OnInit {
  @Input() border = '';
  @Input() shadow = '';
  @Input() margin = '';
  faChevronDown = faChevronDown
  constructor() { }

  ngOnInit(): void {
  }

}
