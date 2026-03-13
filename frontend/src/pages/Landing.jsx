import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './Landing.module.css'

export default function Landing() {
    const { t, i18n } = useTranslation()

    const handleLanguageChange = (e) => {
        i18n.changeLanguage(e.target.value)
    }

    return (
        <div className={styles.landingPage}>
            {/* Navigation */}
            <nav className={styles.navbar}>
                <div className={styles.logo}>
                    <div className={styles.logoMark}>
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="1.5" />
                            <circle cx="14" cy="14" r="7" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
                            <circle cx="14" cy="14" r="3" fill="currentColor" />
                            <line x1="14" y1="2" x2="14" y2="6" stroke="currentColor" strokeWidth="1.5" />
                            <line x1="14" y1="22" x2="14" y2="26" stroke="currentColor" strokeWidth="1.5" />
                            <line x1="2" y1="14" x2="6" y2="14" stroke="currentColor" strokeWidth="1.5" />
                            <line x1="22" y1="14" x2="26" y2="14" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                    </div>
                    <div className={styles.logoText}>
                        <span className={styles.logoName}>BioScope</span>
                        <span className={styles.logoSub}>ENV · MONITOR</span>
                    </div>
                </div>

                <div className={styles.navControls}>
                    <select
                        className={styles.langSelect}
                        value={i18n.language}
                        onChange={handleLanguageChange}
                    >
                        <option value="en">English</option>
                        <option value="ja">日本語</option>
                    </select>
                    <Link to="/login" className={styles.signInBtn}>
                        {t('landing.signIn')}
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className={styles.hero}>
                <div className={styles.tagline}>{t('landing.tagline')}</div>
                <h1 className={styles.title}>{t('landing.title')}</h1>
                <p className={styles.subtitle}>{t('landing.subtitle')}</p>

                <p className={styles.heroNote}>{t('landing.heroNote')}</p>

                <Link to="/signup" className={styles.ctaBtn}>
                    {t('landing.signUp')}
                    <span style={{ fontSize: '1.2em' }}>→</span>
                </Link>
            </main>

            {/* Features Grid */}
            <section className={styles.features}>
                <h2 className={styles.featuresTitle}>{t('landing.featuresTitle')}</h2>
                <div className={styles.grid}>

                    <div className={styles.card}>
                        <div className={styles.iconWrapper}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                        <h3 className={styles.cardTitle}>{t('landing.feature1Title')}</h3>
                        <p className={styles.cardDesc}>{t('landing.feature1Desc')}</p>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.iconWrapper}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                        </div>
                        <h3 className={styles.cardTitle}>{t('landing.feature2Title')}</h3>
                        <p className={styles.cardDesc}>{t('landing.feature2Desc')}</p>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.iconWrapper}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </div>
                        <h3 className={styles.cardTitle}>{t('landing.feature3Title')}</h3>
                        <p className={styles.cardDesc}>{t('landing.feature3Desc')}</p>
                    </div>

                </div>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                {t('landing.footer')}
            </footer>
        </div>
    )
}
