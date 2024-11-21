import {
  Component,
  computed,
  effect,
  HostListener,
  OnInit,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf, NgStyle } from '@angular/common';
import { BeforeInstallPromptEvent } from './BeforeInstallPromptEvent';
import { Html5Qrcode, Html5QrcodeResult } from 'html5-qrcode';
import { Html5QrcodeError } from 'html5-qrcode/core';
import { initializeApp } from 'firebase/app';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf, NgStyle],
  templateUrl: './app.component.html',
})
export class AppComponent {
  isPwaInstalled = signal<boolean>(false);
  qrCodeScanResult = signal<string>('');
  shouldShowQrCodeScanner = computed<boolean>(() => {
    return this.isPwaInstalled() && this.qrCodeScanResult() === '';
  });
  deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
  html5QrcodeScanner: Html5Qrcode | null = null;
  firebaseConfig = {
    apiKey: "AIzaSyCjBzhnQpY0FWQnl6hqu2OxV57RDfBOZpc",
    authDomain: "pwa-poc-nx.firebaseapp.com",
    projectId: "pwa-poc-nx",
    storageBucket: "pwa-poc-nx.firebasestorage.app",
    messagingSenderId: "42534205474",
    appId: "1:42534205474:web:32fbf0363deaca609a327b"
  };
  app = initializeApp(this.firebaseConfig);

  constructor() {
    effect(() => {
      if (this.shouldShowQrCodeScanner()) {
        this.html5QrcodeScanner = new Html5Qrcode('reader');
        void this.html5QrcodeScanner
          ?.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            this.onScanSuccess.bind(this),
            this.onScanFailure.bind(this),
          )
          .catch((err) => {
            console.log(err);
          });
      }
    });
  }

  @HostListener('window:DOMContentLoaded', ['$event'])
  onContentLoaded(e: Event) {
    this.isPwaInstalled.set(this.checkIfPwaInstalled());
    console.log('isDomContentLoaded', e);
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
    this.isPwaInstalled.set(true);
    console.log('PWA was installed');
  }

  async triggerInstallPrompt() {
    if (!this.isPwaInstalled()) {
      // iOS does not support install prompting, user must manually add to home screen
      this.deferredInstallPrompt?.prompt();
      const result = await this.deferredInstallPrompt?.userChoice;
      console.log(`User response to the install prompt: ${result?.outcome}`);
      this.deferredInstallPrompt = null;
    }
  }

  checkIfPwaInstalled(): boolean {
    const UA = navigator.userAgent;
    const IOS = UA.match(/iPhone|iPad|iPod/);
    const ANDROID = UA.match(/Android/);
    const PLATFORM = IOS ? 'ios' : ANDROID ? 'android' : 'unknown';
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    const INSTALLED = !!(standalone || (IOS && !UA.match(/Safari/)));
    console.log(`PWA is ${!INSTALLED ? 'NOT' : ''} installed on ${PLATFORM}`);
    return INSTALLED;
  }

  onScanSuccess(decodedText: string, decodedResult: Html5QrcodeResult) {
    // handle the scanned code as you like, for example:
    console.log(`Code matched = ${decodedText}`, decodedResult);
    this.qrCodeScanResult.set(decodedText);
    this.html5QrcodeScanner
      ?.stop()
      .then((ignore) => {
        // QR Code scanning is stopped.
      })
      .catch((err) => {
        // Stop failed, handle it.
      });
  }

  onScanFailure(errorMessage: string, error: Html5QrcodeError) {
    // handle scan failure, usually better to ignore and keep scanning.
    // for example:
    // console.error(`Code scan error: ${errorMessage}`, error);
  }
}
