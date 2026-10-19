import { useCallback } from 'react';
import { PACKAGE_TYPES } from '../constants/packages';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../constants/translations';
import { formatDate, formatDateTime, formatPrice } from '../lib/format';
import { ContractStatus, OfferStatus, RequestStatus, ShippingMode } from '../lib/types';
import { Tone } from '../components/ui';

const REQUEST_TONES: Record<RequestStatus, Tone> = {
  OPEN: 'success', IN_NEGOTIATION: 'accent', ACCEPTED: 'info', IN_TRANSIT: 'info', DELIVERED: 'success', CANCELLED: 'error',
};
const OFFER_TONES: Record<OfferStatus, Tone> = { ACTIVE: 'success', PAUSED: 'warning', EXPIRED: 'neutral' };
const CONTRACT_TONES: Record<ContractStatus, Tone> = { PROPOSED: 'accent', ACCEPTED: 'info', PICKED_UP: 'info', DELIVERED: 'success', CANCELLED: 'error' };

/** Localized labels for API values, dates and prices. */
export function useLabels() {
  const { t, language } = useLanguage();
  const mode = useCallback((m: ShippingMode) => t(m === 'AIR' ? 'mode_air' : 'mode_road'), [t]);
  const requestStatus = useCallback((s: RequestStatus) => ({ label: t(`req_status_${s}`), tone: REQUEST_TONES[s] ?? 'neutral' }), [t]);
  const offerStatus = useCallback((s: OfferStatus) => ({ label: t(`offer_status_${s}`), tone: OFFER_TONES[s] ?? 'neutral' }), [t]);
  const contractStatus = useCallback((s: ContractStatus) => ({ label: t(`contract_status_${s}`), tone: CONTRACT_TONES[s] ?? 'neutral' }), [t]);
  /** The server stores the label as typed on the site, in any language: show it in the current one when known. */
  const packageType = useCallback((stored: string) => {
    for (const key of PACKAGE_TYPES) {
      const k = `pkg_${key}`;
      if (Object.values(translations).some((lang) => lang[k] === stored) || stored === key) return t(k);
    }
    return stored;
  }, [t]);
  const date = useCallback((iso?: string | null) => formatDate(iso, language), [language]);
  const dateTime = useCallback((iso?: string | null) => formatDateTime(iso, language), [language]);
  const price = useCallback((v?: number | null) => formatPrice(v, language), [language]);
  return { mode, requestStatus, offerStatus, contractStatus, packageType, date, dateTime, price, language };
}
