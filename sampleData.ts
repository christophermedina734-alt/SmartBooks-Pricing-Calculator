import { calculateQuote, defaultPricingConfig } from "@/lib/pricing";
import type { Intake, SavedQuote } from "@/lib/types";

export const blankIntake: Intake = {
  businessName: "",
  contactName: "",
  email: "",
  phone: "",
  industry: "",
  entityType: "LLC",
  monthlyTransactions: 125,
  bankAccounts: 2,
  creditCards: 1,
  payrollNeeded: false,
  salesTaxNeeded: false,
  inventory: false,
  loans: false,
  multipleOwners: false,
  booksCondition: "Clean",
  monthsBehind: 0,
  monthlyReviewCall: true,
  taxPlanning: false,
  advisory: false,
  responseTime: "Standard"
};

export const sampleIntakes: Intake[] = [
  {
    ...blankIntake,
    businessName: "Northstar Therapy Group",
    contactName: "Maya Patel",
    email: "maya@northstar.example",
    phone: "(555) 014-2198",
    industry: "Healthcare services",
    entityType: "S-Corp",
    monthlyTransactions: 180,
    bankAccounts: 2,
    creditCards: 2,
    payrollNeeded: true,
    loans: true,
    taxPlanning: true,
    responseTime: "Priority"
  },
  {
    ...blankIntake,
    businessName: "Blue Harbor Retail Co.",
    contactName: "Evan Brooks",
    email: "evan@blueharbor.example",
    phone: "(555) 016-8244",
    industry: "Retail",
    entityType: "LLC",
    monthlyTransactions: 520,
    bankAccounts: 3,
    creditCards: 4,
    payrollNeeded: true,
    salesTaxNeeded: true,
    inventory: true,
    booksCondition: "Very messy",
    monthsBehind: 7,
    advisory: true,
    responseTime: "White Glove"
  },
  {
    ...blankIntake,
    businessName: "Summit Design Studio",
    contactName: "Claire Nguyen",
    email: "claire@summit.example",
    phone: "(555) 019-4310",
    industry: "Professional services",
    monthlyTransactions: 70,
    bankAccounts: 1,
    creditCards: 1,
    monthlyReviewCall: false
  }
];

export const sampleQuotes: SavedQuote[] = sampleIntakes.map((intake, index) => ({
  id: `sample-${index + 1}`,
  intake,
  result: calculateQuote(intake, defaultPricingConfig),
  createdAt: new Date(Date.now() - index * 86400000).toISOString(),
  status: "sample"
}));
