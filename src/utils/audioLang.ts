import { LearningLanguage } from './language';

export function getSpeechLocale(lang: LearningLanguage): string {
  if (lang === 'filipino') return 'fil-PH';
  if (lang === 'cebuano') return 'fil-PH';
  if (lang === 'english') return 'en-US';
  return 'fil-PH';
}
