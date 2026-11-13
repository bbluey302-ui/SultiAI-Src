import { useCallback, useEffect, useState } from 'react';
import {
  LEARNING_LANGUAGE_CHANGED_EVENT,
  LearningLanguage,
  getSelectedLanguage,
  isLearningLanguage,
  setSelectedLanguage,
} from '../utils/language';

/**
 * Shared learning-language state.
 *
 * Keeps every learning surface (Sulti AI, Curriculum Hub, Language Journey)
 * on the same selection and persists it to localStorage. Same-tab updates are
 * broadcast through a custom event because the native `storage` event only
 * fires in other tabs.
 */
export function useLearningLanguage(): [LearningLanguage, (lang: LearningLanguage) => void] {
  const [language, setLanguage] = useState<LearningLanguage>(getSelectedLanguage);

  useEffect(() => {
    const syncFromStorage = () => setLanguage(getSelectedLanguage());

    const handleLanguageEvent = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      setLanguage(isLearningLanguage(detail) ? detail : getSelectedLanguage());
    };

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener(LEARNING_LANGUAGE_CHANGED_EVENT, handleLanguageEvent);

    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener(LEARNING_LANGUAGE_CHANGED_EVENT, handleLanguageEvent);
    };
  }, []);

  const selectLanguage = useCallback((lang: LearningLanguage) => {
    setLanguage(lang);
    setSelectedLanguage(lang);
  }, []);

  return [language, selectLanguage];
}
