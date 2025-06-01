import React from 'react';
import { Link } from 'react-router-dom';
import './style/Homepage.css';
import { useTranslation } from 'react-i18next';



/*
*
*language instructions at the end
*
*/



const Home = () => {

  const { t } = useTranslation();
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">{t('hero.title')}</h1>
          <p className="hero-subtitle">{t('hero.subtitle')}</p>
          <div className="hero-buttons">
            <Link to="/signin" className="cta-button">{t('hero.getStarted')}</Link>
            <Link to="/about" className="secondary-button">{t('hero.learnMore')}</Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">{t('features.title')}</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>{t('features.structured.title')}</h3>
            <p>{t('features.structured.desc')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌟</div>
            <h3>{t('features.interactive.title')}</h3>
            <p>{t('features.interactive.desc')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤝</div>
            <h3>{t('features.community.title')}</h3>
            <p>{t('features.community.desc')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>{t('features.anywhere.title')}</h3>
            <p>{t('features.anywhere.desc')}</p>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="quick-start-section">
        <h2 className="section-title">{t('journey.title')}</h2>
        <div className="journey-steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>{t('journey.steps.account.title')}</h3>
            <p>{t('journey.steps.account.desc')}</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>{t('journey.steps.path.title')}</h3>
            <p>{t('journey.steps.path.desc')}</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>{t('journey.steps.learn.title')}</h3>
            <p>{t('journey.steps.learn.desc')}</p>
          </div>
        </div>
      </section>

      {/* Featured Content Section */}
      <section className="featured-section">
        <h2 className="section-title">{t('featured.title')}</h2>
        <div className="featured-grid">
          <div className="featured-card">
            <h3>{t('featured.basics.title')}</h3>
            <p>{t('featured.basics.desc')}</p>
            <Link to="/signin" className="learn-more-link">{t('featured.learnMore')}</Link>
          </div>
          <div className="featured-card">
            <h3>{t('featured.advanced.title')}</h3>
            <p>{t('featured.advanced.desc')}</p>
            <Link to="/signin" className="learn-more-link">{t('featured.learnMore')}</Link>
          </div>
          <div className="featured-card">
            <h3>{t('featured.daily.title')}</h3>
            <p>{t('featured.daily.desc')}</p>
            <Link to="/signin" className="learn-more-link">{t('featured.learnMore')}</Link>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>{t('cta.title')}</h2>
          <p>{t('cta.subtitle')}</p>
          <Link to="/signup" className="cta-button">{t('cta.button')}</Link>
        </div>
      </section>


      {/* Footer Section */}
      <footer className="footer-section">
        <div className="footer-content">
          <div className="footer-grid">
            {/* Company Info */}
            <div className="footer-column">
              <h4>{t('footer.company.title')}</h4>
              <Link to="/about" className="footer-link">{t('footer.company.about')}</Link>
              <Link to="/contact" className="footer-link">{t('footer.company.contact')}</Link>
              <Link to="/church" className="footer-link footer-special-link">
                {t('footer.company.eldersSignup')}
              </Link>
            </div>

            {/* Resources */}
            <div className="footer-column">
              <h4>{t('footer.resources.title')}</h4>
              <Link to="/blog" className="footer-link">{t('footer.resources.blog')}</Link>
              <Link to="/help" className="footer-link">{t('footer.resources.help')}</Link>
              <Link to="/faq" className="footer-link">{t('footer.resources.faq')}</Link>
            </div>

            {/* Social Links */}
            <div className="footer-column">
              <h4>{t('footer.social.title')}</h4>
              <a 
                href="https://facebook.com/yourpage" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="footer-link"
              >
                {t('footer.social.facebook')}
              </a>
              <a 
                href="https://twitter.com/yourhandle" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="footer-link"
              >
                {t('footer.social.twitter')}
              </a>
              <a 
                href="https://instagram.com/yourprofile" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="footer-link"
              >
                {t('footer.social.instagram')}
              </a>
              <a 
                href="https://linkedin.com/company/yourcompany" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="footer-link"
              >
                {t('footer.social.linkedin')}
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="footer-bottom">
            <p className="copyright">{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
/*
*
*all components including this one use the "t" constant that 
calls the "usetranslation()" function

to add new language texts--- 
navigate to the Language/
                      |-language-files/
                          -your language.json

then go to the config.js in the Language/
                                    |-config.js
                to add the json file as a dependency
*
*/