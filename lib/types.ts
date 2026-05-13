export type EntityType = "Sole Prop" | "LLC" | "S-Corp" | "Partnership" | "C-Corp";
export type BookCondition = "Clean" | "Somewhat messy" | "Very messy" | "Failed audit/unreliable";
export type ResponseTime = "Standard" | "Priority" | "White Glove";
export type ServiceTier = "Basic" | "Growth" | "Advisory" | "Premium CFO";

export type Intake = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string;
  entityType: EntityType;
  monthlyTransactions: number;
  bankAccounts: number;
  creditCards: number;
  payrollNeeded: boolean;
  salesTaxNeeded: boolean;
  inventory: boolean;
  loans: boolean;
  multipleOwners: boolean;
  booksCondition: BookCondition;
  monthsBehind: number;
  monthlyReviewCall: boolean;
  taxPlanning: boolean;
  advisory: boolean;
  responseTime: ResponseTime;
};

export type PricingConfig = {
  tierBase: Record<ServiceTier, number>;
  setupFee: {
    base: number;
    perAccount: number;
    priorityMultiplier: number;
    whiteGloveMultiplier: number;
  };
  cleanupRanges: {
    none: [number, number];
    light: [number, number];
    moderate: [number, number];
    heavy: [number, number];
  };
  hourlyEstimate: {
    base: number;
    scoreDivisor: number;
  };
};

export type QuoteResult = {
  monthlyFee: number;
  cleanupFeeLow: number;
  cleanupFeeHigh: number;
  setupFee: number;
  complexityScore: number;
  estimatedMonthlyHours: number;
  tier: ServiceTier;
  included: string[];
  internalNotes: string[];
  clientExplanation: string;
  cleanupLevel: "none" | "light" | "moderate" | "heavy";
};

export type SavedQuote = {
  id: string;
  intake: Intake;
  result: QuoteResult;
  createdAt: string;
  status: "sample" | "draft" | "reviewed";
};
