export type LearningLanguage = 'cebuano' | 'filipino' | 'english';

export function getSelectedLanguage(): LearningLanguage {
  if (typeof window === 'undefined') return 'cebuano';
  const saved = localStorage.getItem('sultiai_selected_language');
  if (saved === 'cebuano' || saved === 'filipino' || saved === 'english') {
    return saved;
  }
  return 'cebuano';
}

export function setSelectedLanguage(lang: LearningLanguage) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sultiai_selected_language', lang);
}
