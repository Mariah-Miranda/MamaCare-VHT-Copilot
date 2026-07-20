import { createContext, useContext, useMemo, useState } from 'react'
import { translationApi } from './lib/api'

export const uiCatalog = {
  'brand.caption': 'VHT copilot',
  'nav.workspace': 'Workspace',
  'nav.dashboard': 'Dashboard',
  'nav.mothers': 'Mothers',
  'nav.newVisit': 'New visit',
  'nav.visitHistory': 'Visit history',
  'nav.assistant': 'AI assistant',
  'nav.reports': 'Reports',
  'nav.settings': 'Settings',
  'nav.logout': 'Log out',
  'nav.beta': 'Beta',
  'nav.careConnected': 'Care is connected',
  'nav.syncedSecurely': 'Your work is synced securely',
  'nav.allChangesSaved': 'All changes saved',
  'dashboard.eyebrow': 'Monday, 11 August 2025',
  'dashboard.greeting': 'Good morning, {firstName}',
  'dashboard.description': 'Here’s the picture of care in Kanyanya today.',
  'dashboard.recordVisit': 'Record a visit',
  'dashboard.bannerTitle': 'Every visit is a chance to catch something early.',
  'dashboard.bannerText': 'You have {count} high-risk pregnancy that needs attention today.',
  'dashboard.reviewAlert': 'Review alert',
  'dashboard.totalMothers': 'Total mothers',
  'dashboard.highRisk': 'High-risk pregnancies',
  'dashboard.upcomingVisits': 'Upcoming visits',
  'dashboard.visitsToday': 'Visits today',
  'dashboard.aiAssessments': 'AI assessments',
  'dashboard.recentActivity': 'Recent activity',
  'dashboard.activityDescription': 'The latest updates from your care list',
  'dashboard.viewAll': 'View all',
  'dashboard.upcomingFollowups': 'Upcoming follow-ups',
  'dashboard.followupsDescription': 'Keep your next visits close',
  'dashboard.seeCalendar': 'See calendar',
  'dashboard.highRiskAlerts': 'Recent high-risk alerts',
  'dashboard.highRiskDescription': 'Review and act early',
  'dashboard.quickActions': 'Quick actions',
  'dashboard.quickActionsDescription': 'Common tasks, one tap away',
  'dashboard.registerMother': 'Register mother',
  'dashboard.registerMotherDescription': 'Add someone to your care list',
  'dashboard.askCopilot': 'Ask the copilot',
  'dashboard.askCopilotDescription': 'Get structured decision support',
  'mothers.eyebrow': 'Care list',
  'mothers.title': 'Mothers',
  'mothers.description': 'The mothers and pregnancies in your care.',
  'mothers.register': 'Register mother',
  'mothers.search': 'Search by name, village or phone',
  'mothers.all': 'All mothers',
  'mothers.of': 'of',
  'mothers.mothers': 'mothers',
  'mothers.noResults': 'No mothers found',
  'mothers.tryFilters': 'Try adjusting your search or filters.',
  'mothers.newEyebrow': 'Care list / New mother',
  'mothers.newTitle': 'Register a mother',
  'mothers.newDescription': 'Create a clear, complete record so every visit starts with context.',
  'mothers.personalInfo': 'Personal information',
  'mothers.personalDescription': 'Basic details help you identify and reach the mother.',
  'mothers.pregnancyDetails': 'Pregnancy details',
  'mothers.pregnancyDescription': 'Use the ANC card where available to keep dates accurate.',
  'mothers.healthContext': 'Health context',
  'mothers.healthDescription': 'A little more context makes risk assessment safer.',
  'profile.eyebrow': 'Mother profile',
  'profile.messageSupervisor': 'Message supervisor',
  'profile.recordVisit': 'Record visit',
  'newVisit.eyebrow': 'Antenatal care / New visit',
  'newVisit.title': 'Record an antenatal visit',
  'newVisit.description': 'Capture the essentials, then let the copilot help you see the whole picture.',
  'newVisit.draftSaved': 'Draft autosaved',
  'newVisit.who': 'Who are you visiting?',
  'newVisit.whoDescription': 'Start with the mother’s record so previous context is included.',
  'newVisit.vitals': 'Vitals and observations',
  'newVisit.vitalsDescription': 'Record what you can see and measure today.',
  'newVisit.voiceTitle': 'Prefer to speak your notes?',
  'newVisit.voiceDescription': 'Use AI voice input in English or Luganda.',
  'newVisit.useVoice': 'Use voice',
  'newVisit.symptoms': 'Symptoms reported',
  'newVisit.notes': 'Additional notes',
  'newVisit.dangerSigns': 'Danger signs',
  'newVisit.dangerSignsDescription': 'Select anything present today. This helps the copilot prioritise safety.',
  'newVisit.saveDraft': 'Save as draft',
  'newVisit.analyze': 'Analyze this visit',
  'newVisit.scanCard': 'Scan ANC card',
  'newVisit.scanDescription': 'Bring in key details from the mother’s paper card with your camera.',
  'newVisit.openScanner': 'Open scanner',
  'newVisit.liveContext': 'Live context',
  'newVisit.contextTitle': 'What the copilot uses',
  'newVisit.motherProfile': 'Mother profile',
  'newVisit.previousVisits': 'Previous visits',
  'newVisit.todayVitals': 'Today’s vitals',
  'newVisit.observations': 'Your observations',
  'assistant.eyebrow': 'Decision support',
  'assistant.title': 'AI assistant',
  'assistant.description': 'Structured maternal care support, grounded in the context you already have.',
  'assistant.online': 'Copilot online',
  'reports.eyebrow': 'Supervisor overview',
  'reports.title': 'Reports & insights',
  'reports.description': 'A clear view of care coverage and where support is needed.',
  'settings.eyebrow': 'Workspace',
  'settings.title': 'Settings',
  'settings.description': 'Manage your profile, preferences and care workspace.',
  'language.english': 'English',
  'language.luganda': 'Luganda',
  'language.switching': 'Translating…',
  'language.translationError': 'Translation unavailable. Check your API key and try again.',
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('mamacare_language') || 'en')
  const [translations, setTranslations] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mamacare_translations') || '{}') } catch { return {} }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function switchLanguage(nextLanguage) {
    if (nextLanguage === language) return
    setError('')
    if (nextLanguage === 'en') {
      setLanguage('en')
      localStorage.setItem('mamacare_language', 'en')
      return
    }
    setLoading(true)
    try {
      const response = await translationApi.catalog({ targetLanguage: 'Luganda', catalog: uiCatalog })
      const nextTranslations = response.data.translations || {}
      setTranslations(nextTranslations)
      localStorage.setItem('mamacare_translations', JSON.stringify(nextTranslations))
      setLanguage('lg')
      localStorage.setItem('mamacare_language', 'lg')
    } catch (requestError) {
      setError(requestError.response?.data?.error || uiCatalog['language.translationError'])
    } finally { setLoading(false) }
  }

  const value = useMemo(() => ({ language, loading, error, switchLanguage, t: (key, fallback, variables = {}) => {
    const template = language === 'lg' ? (translations[key] || uiCatalog[key] || fallback || key) : (uiCatalog[key] || fallback || key)
    return Object.entries(variables).reduce((text, [name, replacement]) => text.replaceAll(`{${name}}`, replacement), template)
  } }), [language, translations, loading, error])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
