import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import '../style/GoogleTranslate.css';

const flagPaths = {
  en: '/flags/gb.svg',
  es: '/flags/es.svg',
  fr: '/flags/fr.svg',
  swed: '/flags/swed.svg',
  de: '/flags/de.svg',
  it: '/flags/it.svg',
  pt: '/flags/pt.svg',
  ar: '/flags/sa.svg',
  ja: '/flags/jp.svg',
  ko: '/flags/kr.svg',
  'zh-CN': '/flags/cn.svg'
};

const languageNames = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  swed: 'Swedish',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ar: 'العربية',
  ja: '日本語',
  ko: '한국어',
  'zh-CN': '中文'
};

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    closeDropdown();
  };

  return (
    <div className="language-dropdown">
      <button
        onClick={toggleDropdown}
        className="dropdown-button"
      >
        <img
          src={flagPaths[i18n.language]}
          alt={`${i18n.language} flag`}
          className="flag-icon"
        />
        <span className="language-name">{languageNames[i18n.language]}</span>
        <ChevronDown className={`chevron ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <ul className="language-list">
            {Object.keys(flagPaths).map((lang) => (
              <li key={lang}>
                <button
                  onClick={() => handleLanguageChange(lang)}
                  className={`language-option ${i18n.language === lang ? 'active' : ''}`}
                >
                  <img
                    src={flagPaths[lang]}
                    alt={`${lang} flag`}
                    className="flag-icon"
                  />
                  <span className="language-name">{languageNames[lang]}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;