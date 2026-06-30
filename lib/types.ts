// Domain model for the Zion Dealflow engine.

export type DealStage =
  | "sourced"
  | "screening"
  | "analyzed"
  | "drafted"
  | "outbox"
  | "sent"
  | "replied"
  | "archived";

export const STAGE_ORDER: DealStage[] = [
  "sourced",
  "screening",
  "analyzed",
  "drafted",
  "outbox",
  "sent",
  "replied",
];

export type AssetType =
  | "house"
  | "multifamily"
  | "rv_park"
  | "mobile_home_park"
  | "motel"
  | "self_storage"
  | "retail"
  | "land"
  | "other";

export const ASSET_LABEL: Record<AssetType, string> = {
  house: "House",
  multifamily: "Multifamily",
  rv_park: "RV Park",
  mobile_home_park: "MH Park",
  motel: "Motel",
  self_storage: "Self-Storage",
  retail: "Retail",
  land: "Land",
  other: "Other",
};

export type FinanceStructure =
  | "seller_carry"
  | "subject_to"
  | "assumable"
  | "master_lease"
  | "conventional"
  | "cash";

export interface Contact {
  name?: string;
  brokerage?: string;
  phone?: string;
  email?: string;
  confidence?: "high" | "medium" | "low";
  source?: string;
}

export interface FinancingScenario {
  label: string;
  price: number;
  downPct: number;
  rate: number;
  structure: FinanceStructure;
  balloonYears?: number;
  monthlyDebtService?: number;
  notes?: string;
}

export interface Analysis {
  noi?: number;
  capRate?: number;
  capex?: number;
  stabilizedNoi?: number;
  offerPrice?: number;
  offerYieldOnCost?: number;
  financing: FinancingScenario[];
  creativeTerms?: string;
  fitScore?: number; // 1-10
  summary?: string;
  risks?: string[];
  model?: string;
  generatedAt?: string;
}

export type OfferStatus = "draft" | "approved" | "sending" | "sent" | "replied";

export interface Offer {
  recipient?: string;
  subject?: string;
  emailBody?: string;
  html?: string; // rendered LOI HTML (source for the PDF)
  pdfBase64?: string; // generated offer PDF, base64 (attached at send time)
  status: OfferStatus;
  approvedAt?: string;
  sentAt?: string;
  resendId?: string;
}

export interface Property {
  id: string;
  source: "alert" | "search" | "manual";
  url?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  assetType: AssetType;
  price?: number;
  units?: number;
  beds?: number;
  sqft?: number;
  yearBuilt?: number;
  daysOnMarket?: number;
  priceCuts?: string;
  sellerFinancing?: boolean;
  driveHours?: number;
  stage: DealStage;
  fitScore?: number;
  contact?: Contact;
  analysis?: Analysis;
  offer?: Offer;
  createdAt: string;
  notes?: string;
}
