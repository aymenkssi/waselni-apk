/** Data shapes returned by the Waselni API (https://waselni.fr/api). */
export type Language = 'fr' | 'en' | 'ar';
export const LANGUAGES: Language[] = ['fr', 'en', 'ar'];

export type Role = 'SHIPPER' | 'CARRIER_INDIVIDUAL' | 'CARRIER_PRO' | 'SHIPPER_CARRIER' | 'ADMIN';
export type CarrierType = 'individual' | 'pro';
export type ShippingMode = 'TERRESTRIAL' | 'AIR';
export type RequestStatus = 'OPEN' | 'IN_NEGOTIATION' | 'ACCEPTED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
export type OfferStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED';
export type ContractStatus = 'PROPOSED' | 'ACCEPTED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';
export type VerificationStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface PublicUser {
  id?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
  bio?: string | null;
  role?: Role;
  carrier_type?: CarrierType | null;
  city?: string;
  country?: string;
  rating_sum?: number;
  rating_count?: number;
  created_at?: string;
  phone?: string;
}

export interface User extends PublicUser {
  id: string;
  email: string;
  role: Role;
  phone?: string;
  status?: string;
  two_factor_enabled?: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages?: number;
}

export interface Offer {
  id: string;
  user_id: string;
  origin_country: string;
  origin_city: string;
  destination_country: string;
  destination_city: string;
  departure_date: string;
  arrival_date: string;
  capacity_kg: number;
  mode: ShippingMode;
  price_per_kg: number;
  conditions?: string | null;
  status: OfferStatus;
  created_at: string;
  user?: PublicUser | null;
}

export interface ShipRequest {
  id: string;
  user_id: string;
  origin_country: string;
  origin_city: string;
  destination_country: string;
  destination_city: string;
  weight: number;
  width?: number | null;
  height?: number | null;
  length?: number | null;
  package_type: string;
  mode: ShippingMode;
  deadline: string;
  description: string;
  photos?: string[];
  status: RequestStatus;
  created_at: string;
  user?: PublicUser | null;
}

export interface Conversation {
  id: string;
  request_id?: string | null;
  offer_id?: string | null;
  participants: string[];
  last_message?: string | null;
  last_message_at?: string;
  other_user?: PublicUser | null;
  request?: Partial<ShipRequest> | null;
  offer?: Partial<Offer> | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  attachments: string[];
  created_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: PublicUser | null;
}

export interface Contract {
  id: string;
  request_id: string;
  offer_id?: string | null;
  shipper_id: string;
  carrier_id: string;
  proposed_price: number;
  status: ContractStatus;
  timeline: { status: ContractStatus; timestamp: string; by?: string }[];
  created_at: string;
  request?: ShipRequest | null;
  offer?: Offer | null;
  shipper?: PublicUser | null;
  carrier?: PublicUser | null;
  reviews?: Review[];
  payment_status?: string;
}

export interface Country {
  id?: string;
  name: string;
  code?: string;
  is_origin?: boolean;
  is_destination?: boolean;
}

export interface CarrierVerification {
  status: VerificationStatus;
  is_verified?: boolean;
  documents_complete?: boolean;
  identity_doc_url?: string | null;
  address_proof_url?: string | null;
  rejection_reason?: string | null;
}

export interface ProVerification {
  status: VerificationStatus;
  company_name?: string;
  document_url?: string | null;
  rejection_reason?: string | null;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse extends TokenPair {
  user: User;
}

export interface TwoFactorChallenge {
  requires_2fa: true;
  temporary_token: string;
}

/** A file picked on the phone, ready to be sent as multipart form data. */
export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}
