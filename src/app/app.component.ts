import { Component, HostListener, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf, NgStyle } from '@angular/common';
import { BeforeInstallPromptEvent } from './BeforeInstallPromptEvent';
import { Html5Qrcode, Html5QrcodeResult } from 'html5-qrcode';
import { Html5QrcodeError } from 'html5-qrcode/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf, NgStyle],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  title = 'pwa-poc';
  deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
  isPwaInstalled = false;
  html5QrcodeScanner: Html5Qrcode | null = null;
  qrCodeScanResult = '';

  ngOnInit() {
    this.html5QrcodeScanner = new Html5Qrcode('reader');
    void this.html5QrcodeScanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      this.onScanSuccess.bind(this),
      this.onScanFailure.bind(this),
    );
  }

  @HostListener('window:DOMContentLoaded', ['$event'])
  onContentLoaded(e: Event) {
    this.isPwaInstalled = this.checkIfPwaInstalled();
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
    this.isPwaInstalled = true;
    console.log('PWA was installed');
  }

  async triggerInstallPrompt() {
    if (!this.isPwaInstalled) {
      // iOS does not support install prompting, user must manually add to home screen
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

  onScanSuccess(decodedText: string, decodedResult: Html5QrcodeResult) {
    // handle the scanned code as you like, for example:
    console.log(`Code matched = ${decodedText}`, decodedResult);
    this.qrCodeScanResult = decodedText;
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

  shouldShowQrCodeScanner(): boolean {
    return this.isPwaInstalled && this.qrCodeScanResult === '';
  }
}
