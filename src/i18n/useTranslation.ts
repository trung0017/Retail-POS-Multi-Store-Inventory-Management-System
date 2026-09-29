import { useAppSelector } from '../store';
import { translations, Language } from './translations';

export const useTranslation = () => {
  const language = useAppSelector((state) => state.pos.language) || 'en';
  const t = translations[language as Language] || translations.en;
  return { t, language: language as Language };
};
