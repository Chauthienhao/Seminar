import { NavLink } from 'react-router-dom'
import { MapPin, Phone, Mail } from 'lucide-react'

import { useLang } from '../lib/i18n.jsx'

export default function Footer() {
  const year = new Date().getFullYear()
  const { t } = useLang()

  return (
    <footer className="bg-navy-800 text-cream/85">
      <div className="mx-auto grid max-w-content gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <h3 className="font-serif text-lg font-semibold text-cream">{t('footer.museumName')}</h3>
          <p className="mt-3 text-sm leading-relaxed text-cream/70">{t('footer.about')}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-cream">{t('footer.explore')}</h4>
          <ul className="mt-3 space-y-2 text-sm text-cream/70">
            <li><NavLink to="/" className="hover:text-cream">{t('footer.featuredArtifacts')}</NavLink></li>
            <li><NavLink to="/bo-suu-tap" className="hover:text-cream">{t('footer.featuredCollections')}</NavLink></li>
            <li><NavLink to="/ban-do" className="hover:text-cream">{t('footer.map2d')}</NavLink></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-cream">{t('footer.support')}</h4>
          <ul className="mt-3 space-y-2 text-sm text-cream/70">
            <li><NavLink to="/tra-cuu-hien-vat" className="hover:text-cream">{t('footer.lookup')}</NavLink></li>
            <li><a href="#faq" className="hover:text-cream">{t('footer.faq')}</a></li>
            <li><a href="#help" className="hover:text-cream">{t('footer.help')}</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-cream">{t('footer.contact')}</h4>
          <ul className="mt-3 space-y-2.5 text-sm text-cream/70">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-maroon" />
              {t('footer.address')}
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="shrink-0 text-maroon" />
              (028) 3829 9483
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="shrink-0 text-maroon" />
              info@hcmc-museum.gov.vn
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-content flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-cream/50 sm:flex-row sm:px-6">
          <p>{t('footer.copyright', { year })}</p>
          <div className="flex items-center gap-4">
            <a href="#terms" className="hover:text-cream/80">{t('footer.terms')}</a>
            <a href="#privacy" className="hover:text-cream/80">{t('footer.privacy')}</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
