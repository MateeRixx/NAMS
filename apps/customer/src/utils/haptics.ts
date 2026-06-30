import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isNative = Capacitor.isNativePlatform();

export function lightImpact() {
  if (!isNative) return;
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

export function mediumImpact() {
  if (!isNative) return;
  Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
}

export function heavyImpact() {
  if (!isNative) return;
  Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
}

export function successNotification() {
  if (!isNative) return;
  Haptics.notification({ type: NotificationType.Success }).catch(() => {});
}

export function errorNotification() {
  if (!isNative) return;
  Haptics.notification({ type: NotificationType.Error }).catch(() => {});
}

export function selectionFeedback() {
  if (!isNative) return;
  Haptics.selectionStart().catch(() => {});
}
