import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import ptBRcommon from './locales/pt-BR/common.json'
import ptBRauth from './locales/pt-BR/auth.json'
import ptBRdashboard from './locales/pt-BR/dashboard.json'
import ptBRemployees from './locales/pt-BR/employees.json'
import ptBRoutsourced from './locales/pt-BR/outsourced.json'
import ptBRvehicles from './locales/pt-BR/vehicles.json'
import ptBRproviders from './locales/pt-BR/providers.json'
import ptBRconsular from './locales/pt-BR/consular.json'
import ptBRpackages from './locales/pt-BR/packages.json'
import ptBRvisitors from './locales/pt-BR/visitors.json'
import ptBRreports from './locales/pt-BR/reports.json'
import ptBRembassyInfo from './locales/pt-BR/embassyInfo.json'
import ptBRadmin from './locales/pt-BR/admin.json'
import ptBRaudit from './locales/pt-BR/audit.json'
import ptBRdetailModal from './locales/pt-BR/detailModal.json'
import ptBRlayout from './locales/pt-BR/layout.json'
import ptBRvalidation from './locales/pt-BR/validation.json'
import ptBRapi from './locales/pt-BR/api.json'

import enUScommon from './locales/en-US/common.json'
import enUSauth from './locales/en-US/auth.json'
import enUSdashboard from './locales/en-US/dashboard.json'
import enUSemployees from './locales/en-US/employees.json'
import enUSoutsourced from './locales/en-US/outsourced.json'
import enUSvehicles from './locales/en-US/vehicles.json'
import enUSproviders from './locales/en-US/providers.json'
import enUSconsular from './locales/en-US/consular.json'
import enUSpackages from './locales/en-US/packages.json'
import enUSvisitors from './locales/en-US/visitors.json'
import enUSreports from './locales/en-US/reports.json'
import enUSembassyInfo from './locales/en-US/embassyInfo.json'
import enUSadmin from './locales/en-US/admin.json'
import enUSaudit from './locales/en-US/audit.json'
import enUSdetailModal from './locales/en-US/detailModal.json'
import enUSlayout from './locales/en-US/layout.json'
import enUSvalidation from './locales/en-US/validation.json'
import enUSapi from './locales/en-US/api.json'

const resources = {
  'pt-BR': {
    common: ptBRcommon,
    auth: ptBRauth,
    dashboard: ptBRdashboard,
    employees: ptBRemployees,
    outsourced: ptBRoutsourced,
    vehicles: ptBRvehicles,
    providers: ptBRproviders,
    consular: ptBRconsular,
    packages: ptBRpackages,
    visitors: ptBRvisitors,
    reports: ptBRreports,
    embassyInfo: ptBRembassyInfo,
    admin: ptBRadmin,
    audit: ptBRaudit,
    detailModal: ptBRdetailModal,
    layout: ptBRlayout,
    validation: ptBRvalidation,
    api: ptBRapi,
  },
  'en-US': {
    common: enUScommon,
    auth: enUSauth,
    dashboard: enUSdashboard,
    employees: enUSemployees,
    outsourced: enUSoutsourced,
    vehicles: enUSvehicles,
    providers: enUSproviders,
    consular: enUSconsular,
    packages: enUSpackages,
    visitors: enUSvisitors,
    reports: enUSreports,
    embassyInfo: enUSembassyInfo,
    admin: enUSadmin,
    audit: enUSaudit,
    detailModal: enUSdetailModal,
    layout: enUSlayout,
    validation: enUSvalidation,
    api: enUSapi,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-BR',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  })

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng === 'pt-BR' ? 'pt-BR' : 'en'
})

export default i18n
