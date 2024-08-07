import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-countdown',
  templateUrl: './countdown.component.html',
  styleUrls: ['./countdown.component.scss']
})
export class CountdownComponent {
  @Input() minutes: number = 5;
  @Input() seconds: number = 0;
  @Input() radius: number = 45;
  timer;
  totalSeconds: number = 0;
  elapsedSeconds: number = 0;
  circumference: number = 0;
  progressOffset: number = 0;
  userAgent: string

  ngOnInit() {
    this.totalSeconds = this.minutes * 60;
    this.circumference = 2 * Math.PI * this.radius;
    this.userAgent = window.navigator.userAgent.split(';')[0].split('(')[1]
    this.startTimer()
  }

  startTimer() {
    this.stopTimer();  // Clear existing timer before starting a new one
    this.progressOffset = 0;
    this.elapsedSeconds = 0;
    this.timer = setInterval(() => {
      this.elapsedSeconds++;
      this.calculateTime();
      this.calculateProgressOffset();
      if (this.elapsedSeconds >= this.totalSeconds) {
        this.stopTimer();
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timer);
  }

  private calculateTime() {
    this.minutes = Math.floor((this.totalSeconds - this.elapsedSeconds) / 60);
    this.seconds = (this.totalSeconds - this.elapsedSeconds) % 60;
  }

  private calculateProgressOffset() {
    const progress = this.elapsedSeconds / this.totalSeconds;
    this.progressOffset = -this.circumference * progress;
  }
}
