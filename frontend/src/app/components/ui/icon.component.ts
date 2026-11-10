import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type IconName =
  // Custom Automotive & Mechanical Icons (24x24, 1.75px stroke, Lucide-matched geometry)
  | 'engine'
  | 'starter'
  | 'battery-auto'
  | 'battery'
  | 'disc-brake'
  | 'brakes'
  | 'exhaust'
  | 'smoke'
  | 'suspension'
  | 'rotate'
  | 'gearbox'
  | 'steering'
  | 'tire'
  | 'obd-port'
  | 'multimeter'
  | 'oil-can'
  // Lucide Base Icons (24x24, 1.75px stroke)
  | 'home'
  | 'car'
  | 'scan'
  | 'clock'
  | 'history'
  | 'user'
  | 'bell'
  | 'sun'
  | 'moon'
  | 'globe'
  | 'x'
  | 'check'
  | 'check-circle'
  | 'x-circle'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'arrow-right'
  | 'arrow-left'
  | 'search'
  | 'thermometer'
  | 'fuel'
  | 'zap'
  | 'sound'
  | 'volume-2'
  | 'snowflake'
  | 'key'
  | 'wrench'
  | 'gauge'
  | 'layers'
  | 'scale'
  | 'ruler'
  | 'message-square'
  | 'file-text'
  | 'clipboard-list'
  | 'printer'
  | 'copy'
  | 'plus'
  | 'trash'
  | 'eye'
  | 'help-circle'
  | 'euro'
  | 'alert-triangle'
  | 'alert'
  | 'alert-octagon'
  | 'shield-check'
  | 'shield-alert'
  | 'info'
  | 'lock'
  | 'building'
  | 'cloud'
  | 'link'
  | 'database'
  | 'refresh'
  | 'cookie'
  | 'bot'
  | 'robot';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
      flex-shrink: 0;
      color: inherit;
    }
    svg {
      display: block;
      flex-shrink: 0;
    }
  `],
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.role]="label ? 'img' : null"
      [attr.aria-label]="label || null"
      [attr.aria-hidden]="label ? null : 'true'">

      @switch (resolvedName) {
        <!-- =================================================================
             1. CUSTOM AUTOMOTIVE & MECHANICAL ICONS (12 Icons)
             Designed on Lucide's 24x24 grid (2px padding, 1.75px stroke, 2px radius)
             ================================================================= -->

        @case ('engine') {
          <!-- ISO Engine Block: intake top, main block, front pulley, rear mount -->
          <path d="M8 6V4h6v2" />
          <path d="M11 4v2" />
          <path d="M5 8h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8l-2-2H3v-5h2V8Z" />
          <path d="M3 9v7" />
          <path d="M18 11h3" />
          <path d="M18 15h3" />
          <path d="M21 9v8" />
        }

        @case ('starter') {
          <!-- Ignition Switch & Clockwise Cranking Arc -->
          <circle cx="11" cy="13" r="6" />
          <path d="M11 10v6" />
          <path d="M11 3a10 10 0 0 1 9.5 7" />
          <path d="m17.5 8.5 3 1.5 1-3.2" />
        }

        @case ('battery-auto') {
          <!-- 12V Automotive Accumulator with top terminals and +/- poles -->
          <rect x="2" y="7" width="20" height="13" rx="2" />
          <path d="M6 7V4.5h2.5V7" />
          <path d="M15.5 7V4.5H18V7" />
          <path d="M6 13.5h3" />
          <path d="M15 13.5h3" />
          <path d="M16.5 12v3" />
        }

        @case ('disc-brake') {
          <!-- Ventilated Brake Rotor & Caliper -->
          <circle cx="11" cy="13" r="8" />
          <circle cx="11" cy="13" r="3" />
          <path d="M13 3.2A9.8 9.8 0 0 1 20.8 11L17.8 12A6.5 6.5 0 0 0 12 6.2L13 3.2Z" />
          <path d="M7.5 9.5 6 8" />
          <path d="m14.5 16.5 1.5 1.5" />
          <path d="M7.5 16.5 6 18" />
        }

        @case ('exhaust') {
          <!-- Exhaust Muffler, Tailpipe & Structured Plume Waves -->
          <rect x="2" y="9" width="9" height="6" rx="2" />
          <path d="M11 12h3" />
          <path d="M16 9h3.5a2 2 0 1 0-2-2" />
          <path d="M16 12h5" />
          <path d="M16 15h2.5a2 2 0 1 1-2 2" />
        }

        @case ('suspension') {
          <!-- Symmetric Coilover Shock Absorber & Strut -->
          <circle cx="17.5" cy="4.5" r="2" />
          <circle cx="6.5" cy="19.5" r="2" />
          <path d="M16.2 6.2 7.8 17.8" />
          <path d="m12 6.5 4.5 3.2" />
          <path d="m9.8 9.6 4.5 3.2" />
          <path d="m7.6 12.7 4.5 3.2" />
        }

        @case ('gearbox') {
          <!-- Symmetric 6-Point H-Gate Shifter Pattern -->
          <circle cx="12" cy="12" r="9.5" />
          <path d="M8 8v8" />
          <path d="M12 8v8" />
          <path d="M16 8v8" />
          <path d="M8 12h8" />
        }

        @case ('steering') {
          <!-- 3-Spoke Automotive Steering Wheel -->
          <circle cx="12" cy="12" r="9.5" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="m3 10.5 6.5 1.2" />
          <path d="m21 10.5-6.5 1.2" />
          <path d="M12 14.5v6.8" />
        }

        @case ('tire') {
          <!-- Tire Profile & Symmetric Tread Grooves -->
          <rect x="5.5" y="2.5" width="13" height="19" rx="3.5" />
          <path d="M10 2.5v19" />
          <path d="M14 2.5v19" />
          <path d="M5.5 7.5H10" />
          <path d="M14 7.5h4.5" />
          <path d="M5.5 12H10" />
          <path d="M14 12h4.5" />
          <path d="M5.5 16.5H10" />
          <path d="M14 16.5h4.5" />
        }

        @case ('obd-port') {
          <!-- SAE J1962 16-Pin Trapezoidal OBD-II Connector -->
          <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2l-1.8 8.4a2 2 0 0 1-2 1.6H6.8a2 2 0 0 1-2-1.6L3 8Z" />
          <path d="M10 6V4h4v2" />
          <path d="M7 10.5h2" />
          <path d="M11 10.5h2" />
          <path d="M15 10.5h2" />
          <path d="M7.5 14h2" />
          <path d="M11 14h2" />
          <path d="M14.5 14h2" />
        }

        @case ('multimeter') {
          <!-- Digital Automotive Multimeter -->
          <rect x="4" y="2" width="16" height="20" rx="2.5" />
          <rect x="7" y="5" width="10" height="4.5" rx="1" />
          <circle cx="12" cy="14.5" r="2.5" />
          <path d="m12 14.5 1.5-1.5" />
          <path d="M8.5 19h.01" />
          <path d="M15.5 19h.01" />
        }

        @case ('oil-can') {
          <!-- ISO 7000 Engine Oil Can & Droplet -->
          <path d="M2 10.5 5 12v4a2 2 0 0 0 2 2h8l5-5.5-6.5-1V9.5H6v2.5l-4-1.5Z" />
          <path d="M8 9.5V7h3.5v2.5" />
          <path d="M21.5 16.5a1.5 1.5 0 0 1-3 0c0-1 1.5-2.5 1.5-2.5s1.5 1.5 1.5 2.5Z" />
        }

        <!-- =================================================================
             2. LUCIDE BASE ICONS (24x24, 1.75px stroke)
             ================================================================= -->

        @case ('home') {
          <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
          <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        }

        @case ('car') {
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        }

        @case ('scan') {
          <path d="M3 7V5a2 2 0 0 1 2-2h2" />
          <path d="M17 3h2a2 2 0 0 1 2 2v2" />
          <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
          <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          <path d="M7 12h10" />
        }

        @case ('clock') {
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        }

        @case ('user') {
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        }

        @case ('bell') {
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        }

        @case ('sun') {
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        }

        @case ('moon') {
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        }

        @case ('globe') {
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        }

        @case ('x') {
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        }

        @case ('check') {
          <path d="M20 6 9 17l-5-5" />
        }

        @case ('check-circle') {
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="m9 11 3 3L22 4" />
        }

        @case ('x-circle') {
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        }

        @case ('chevron-right') {
          <path d="m9 18 6-6-6-6" />
        }

        @case ('chevron-left') {
          <path d="m15 18-6-6 6-6" />
        }

        @case ('chevron-down') {
          <path d="m6 9 6 6 6-6" />
        }

        @case ('arrow-right') {
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        }

        @case ('arrow-left') {
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        }

        @case ('search') {
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        }

        @case ('thermometer') {
          <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
        }

        @case ('fuel') {
          <line x1="3" x2="15" y1="22" y2="22" />
          <line x1="4" x2="14" y1="9" y2="9" />
          <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
          <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
        }

        @case ('zap') {
          <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
        }

        @case ('sound') {
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        }

        @case ('snowflake') {
          <line x1="2" x2="22" y1="12" y2="12" />
          <line x1="12" x2="12" y1="2" y2="22" />
          <path d="m20 16-4-4 4-4" />
          <path d="m4 8 4 4-4 4" />
          <path d="m16 4-4 4-4-4" />
          <path d="m8 20 4-4 4 4" />
        }

        @case ('key') {
          <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" />
          <path d="m21 2-9.6 9.6" />
          <circle cx="7.5" cy="15.5" r="5.5" />
        }

        @case ('wrench') {
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        }

        @case ('gauge') {
          <path d="m12 14 4-4" />
          <path d="M3.34 19a10 10 0 1 1 17.32 0" />
        }

        @case ('layers') {
          <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
          <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
          <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
        }

        @case ('scale') {
          <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="M7 21h10" />
          <path d="M12 3v18" />
          <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
        }

        @case ('ruler') {
          <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
          <path d="m14.5 12.5 2-2" />
          <path d="m11.5 9.5 2-2" />
          <path d="m8.5 6.5 2-2" />
          <path d="m17.5 15.5 2-2" />
        }

        @case ('message-square') {
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        }

        @case ('file-text') {
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <path d="M10 9H8" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
        }

        @case ('clipboard-list') {
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M12 11h4" />
          <path d="M12 16h4" />
          <path d="M8 11h.01" />
          <path d="M8 16h.01" />
        }

        @case ('printer') {
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
          <rect x="6" y="14" width="12" height="8" rx="1" />
        }

        @case ('copy') {
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        }

        @case ('plus') {
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        }

        @case ('trash') {
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        }

        @case ('eye') {
          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
          <circle cx="12" cy="12" r="3" />
        }

        @case ('help-circle') {
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        }

        @case ('euro') {
          <path d="M4 10h12" />
          <path d="M4 14h9" />
          <path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2" />
        }

        @case ('alert-triangle') {
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        }

        @case ('alert-octagon') {
          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        }

        @case ('shield-check') {
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          <path d="m9 12 2 2 4-4" />
        }

        @case ('shield-alert') {
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        }

        @case ('info') {
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        }

        @case ('lock') {
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        }

        @case ('building') {
          <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01" />
          <path d="M16 6h.01" />
          <path d="M12 6h.01" />
          <path d="M12 10h.01" />
          <path d="M12 14h.01" />
          <path d="M16 10h.01" />
          <path d="M16 14h.01" />
          <path d="M8 10h.01" />
          <path d="M8 14h.01" />
        }

        @case ('cloud') {
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        }

        @case ('database') {
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
        }

        @case ('refresh') {
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
          <path d="M16 16h5v5" />
        }

        @case ('link') {
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        }

        @case ('bot') {
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2" />
          <path d="M20 14h2" />
          <path d="M15 13v2" />
          <path d="M9 13v2" />
        }

        @case ('cookie') {
          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
          <path d="M8.5 8.5v.01" />
          <path d="M16 15.5v.01" />
          <path d="M12 12v.01" />
          <path d="M11 17v.01" />
          <path d="M7 14v.01" />
        }

        @default {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        }
      }
    </svg>
  `
})
export class IconComponent {
  @Input({ required: true }) name!: IconName | string;
  @Input() size: number | string = 24;
  @Input() strokeWidth: number | string = 1.75;
  @Input() label?: string;

  get resolvedName(): string {
    switch (this.name) {
      case 'battery': return 'battery-auto';
      case 'brakes': return 'disc-brake';
      case 'smoke': return 'exhaust';
      case 'rotate': return 'suspension';
      case 'history': return 'clock';
      case 'volume-2': return 'sound';
      case 'alert': return 'alert-triangle';
      case 'robot': return 'bot';
      default: return this.name;
    }
  }
}

