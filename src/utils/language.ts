export type LearningLanguage = 'cebuano' | 'filipino' | 'english';

export const LEARNING_LANGUAGE_STORAGE_KEY = 'sultiai_selected_language';
export const LEARNING_LANGUAGE_CHANGED_EVENT = 'sultiai:learning-language-changed';

export function isLearningLanguage(value: unknown): value is LearningLanguage {
  return value === 'cebuano' || value === 'filipino' || value === 'english';
}

export function getSelectedLanguage(): LearningLanguage {
  if (typeof window === 'undefined') return 'cebuano';
  const saved = localStorage.getItem(LEARNING_LANGUAGE_STORAGE_KEY);
  if (isLearningLanguage(saved)) {
    return saved;
  }
  return 'cebuano';
}

export function setSelectedLanguage(lang: LearningLanguage) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LEARNING_LANGUAGE_STORAGE_KEY, lang);
  window.dispatchEvent(
    new CustomEvent<LearningLanguage>(LEARNING_LANGUAGE_CHANGED_EVENT, { detail: lang })
  );
}
