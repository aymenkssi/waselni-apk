import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { needsIdentityCheck } from '../lib/roles';
import { CarrierVerification, VerificationStatus } from '../lib/types';
import { useQuery } from './useQuery';

/** Identity verification state of a carrier (always "verified" for accounts that do not need it). */
export function useVerification() {
  const { api, user } = useAuth();
  const required = needsIdentityCheck(user);
  const load = useCallback(() => api.get<CarrierVerification>('/carriers/verification/status'), [api]);
  const { data, reload } = useQuery(required ? load : null);
  const status: VerificationStatus = !required ? 'VERIFIED' : data?.status ?? 'VERIFIED';
  return {
    required,
    status,
    data,
    reload,
    /** A carrier who cannot publish trips or contact senders yet. */
    needsAction: required && !!data && status !== 'VERIFIED',
  };
}
