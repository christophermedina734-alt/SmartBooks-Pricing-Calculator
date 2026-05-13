import type { BookCondition, Intake, PricingConfig, QuoteResult, ServiceTier } from "@/lib/types";

export const defaultPricingConfig: PricingConfig = {
  tierBase: {
    Basic: 475,
    Growth: 650,
    Advisory: 1000,
    "Premium CFO": 1500
  },
  setupFee: {
    base: 350,
    perAccount: 45,
    priorityMultiplier: 1.2,
    whiteGloveMultiplier: 1.4
  },
  cleanupRanges: {
    none: [0, 0],
    light: [500, 1500],
    moderate: [1500, 3500],
    heavy: [3500, 7500]
  },
  hourlyEstimate: {
    base: 2.5,
    scoreDivisor: 12
  }
};

const conditionScores: Record<BookCondition, number> = {
  Clean: 0,
  "Somewhat messy": 10,
  "Very messy": 22,
  "Failed audit/unreliable": 35
};

export function calculateQuote(intake: Intake, config: PricingConfig = defaultPricingConfig): QuoteResult {
  const transactionScore =
    intake.monthlyTransactions <= 100 ? 6 : intake.monthlyTransactions <= 250 ? 14 : intake.monthlyTransactions <= 500 ? 24 : 34;
  const accountScore = Math.max(0, intake.bankAccounts - 1) * 3 + intake.creditCards * 3;
  const featureScore =
    boolScore(intake.payrollNeeded, 8) +
    boolScore(intake.salesTaxNeeded, 7) +
    boolScore(intake.inventory, 10) +
    boolScore(intake.loans, 5) +
    boolScore(intake.multipleOwners, 6) +
    boolScore(intake.monthlyReviewCall, 5) +
    boolScore(intake.taxPlanning, 8) +
    boolScore(intake.advisory, 14);
  const entityScore = ["Partnership", "S-Corp", "C-Corp"].includes(intake.entityType) ? 6 : intake.entityType === "LLC" ? 3 : 0;
  const responseScore = intake.responseTime === "White Glove" ? 12 : intake.responseTime === "Priority" ? 7 : 0;
  const behindScore = Math.min(24, intake.monthsBehind * 2);
  const complexityScore = transactionScore + accountScore + featureScore + entityScore + responseScore + conditionScores[intake.booksCondition] + behindScore;

  const tier = recommendTier(complexityScore, intake);
  const accountCount = intake.bankAccounts + intake.creditCards;
  const responseMultiplier = intake.responseTime === "White Glove" ? 1.18 : intake.responseTime === "Priority" ? 1.1 : 1;
  const monthlyFee = roundToNearest25(config.tierBase[tier] + Math.max(0, complexityScore - tierFloor(tier)) * 8 * responseMultiplier);
  const cleanupLevel = cleanupBand(intake);
  const [cleanupFeeLow, cleanupFeeHigh] = config.cleanupRanges[cleanupLevel];
  const setupMultiplier = intake.responseTime === "White Glove" ? config.setupFee.whiteGloveMultiplier : intake.responseTime === "Priority" ? config.setupFee.priorityMultiplier : 1;
  const setupFee = roundToNearest25((config.setupFee.base + accountCount * config.setupFee.perAccount) * setupMultiplier);
  const estimatedMonthlyHours = roundOne(config.hourlyEstimate.base + complexityScore / config.hourlyEstimate.scoreDivisor);

  return {
    monthlyFee,
    cleanupFeeLow,
    cleanupFeeHigh,
    setupFee,
    complexityScore,
    estimatedMonthlyHours,
    tier,
    cleanupLevel,
    included: includedServices(intake, tier),
    internalNotes: internalNotes(intake, complexityScore),
    clientExplanation: clientExplanation(intake, tier),
  };
}

function boolScore(value: boolean, score: number) {
  return value ? score : 0;
}

function recommendTier(score: number, intake: Intake): ServiceTier {
  if (intake.responseTime === "White Glove" || score >= 95) return "Premium CFO";
  if (intake.advisory || intake.taxPlanning || score >= 68) return "Advisory";
  if (score >= 36 || intake.payrollNeeded || intake.salesTaxNeeded) return "Growth";
  return "Basic";
}

function tierFloor(tier: ServiceTier) {
  return tier === "Basic" ? 0 : tier === "Growth" ? 36 : tier === "Advisory" ? 68 : 95;
}

function cleanupBand(intake: Intake): QuoteResult["cleanupLevel"] {
  if (intake.monthsBehind === 0 && intake.booksCondition === "Clean") return "none";
  if (intake.booksCondition === "Failed audit/unreliable" || intake.monthsBehind >= 10) return "heavy";
  if (intake.booksCondition === "Very messy" || intake.monthsBehind >= 5) return "moderate";
  return "light";
}

function includedServices(intake: Intake, tier: ServiceTier) {
  const services = [
    "Monthly bank and credit card reconciliation",
    "Financial statement preparation",
    "Month-end review and exception follow-up",
    "Secure document requests and client communication"
  ];
  if (intake.payrollNeeded) services.push("Payroll coordination and payroll journal entries");
  if (intake.salesTaxNeeded) services.push("Sales tax tracking support");
  if (intake.monthlyReviewCall || tier !== "Basic") services.push("Monthly review call");
  if (intake.taxPlanning || tier === "Advisory" || tier === "Premium CFO") services.push("Tax planning touchpoints");
  if (intake.advisory || tier === "Premium CFO") services.push("Advisory support and KPI review");
  return services;
}

function internalNotes(intake: Intake, score: number) {
  const notes = [`Complexity score ${score}. Confirm transaction volume against bank feeds before final quote.`];
  if (intake.booksCondition !== "Clean") notes.push(`Books condition: ${intake.booksCondition}. Review prior-year balance sheet before engagement letter.`);
  if (intake.inventory) notes.push("Inventory adds close complexity; confirm system and count process.");
  if (intake.multipleOwners) notes.push("Multiple owners may require additional equity and distribution review.");
  if (intake.responseTime !== "Standard") notes.push(`${intake.responseTime} response time should be reflected in scope and service expectations.`);
  return notes;
}

function clientExplanation(intake: Intake, tier: ServiceTier) {
  return `Based on ${intake.businessName || "the business"}'s transaction volume, account count, current books condition, and requested support level, SmartBooks CPA recommends the ${tier} monthly service tier. This quote is designed to cover recurring bookkeeping, month-end review, and the added complexity identified in the intake.`;
}

function roundToNearest25(value: number) {
  return Math.round(value / 25) * 25;
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}
