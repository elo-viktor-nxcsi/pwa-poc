import { Component, HostListener, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { BeforeInstallPromptEvent } from './BeforeInstallPromptEvent';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'pwa-poc';
  deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
  isPwaInstalled = false;

  ngOnInit() {
    this.isPwaInstalled = this.checkIfPwaInstalled();
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(e: BeforeInstallPromptEvent) {
    console.log('beforeinstallprompt', e);
    this.deferredInstallPrompt = e;
    e.preventDefault();
  }

  @HostListener('window:appinstalled', ['$event'])
  onAppInstalled(e: Event) {
    this.deferredInstallPrompt = null;
    this.isPwaInstalled = true;
    console.log('PWA was installed');
  }

  async triggerInstallPrompt() {
    if (!this.isPwaInstalled) {
      this.deferredInstallPrompt?.prompt();
      const result = await this.deferredInstallPrompt?.userChoice;
      console.log(`User response to the install prompt: ${result?.outcome}`);
      this.deferredInstallPrompt = null;
    }
  }

  checkIfPwaInstalled() {
    const UA = navigator.userAgent;
    const IOS = UA.match(/iPhone|iPad|iPod/);
    const ANDROID = UA.match(/Android/);
    const PLATFORM = IOS ? 'ios' : ANDROID ? 'android' : 'unknown';
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    const INSTALLED = !!(standalone || (IOS && !UA.match(/Safari/)));
    console.log(`PWA is ${!INSTALLED ? 'NOT' : ''} installed on ${PLATFORM}`);
    return INSTALLED;
  }
}
