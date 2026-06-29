import en from './en';
import hi from './hi';
import type { Translations } from './en';

export const translations: Record<string, Translations> = { en, hi };
export type { Translations };
export type Locale = 'en' | 'hi';
