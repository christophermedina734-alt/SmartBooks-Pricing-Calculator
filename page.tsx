"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, Download, FileText, Save, Settings, Users } from "lucide-react";
import jsPDF from "jspdf";
import { calculateQuote, defaultPricingConfig } from "@/lib/pricing";
import { blankIntake, sampleQuotes } from "@/lib/sampleData";
import { supabase } from "@/lib/supabase";
import type { Intake, PricingConfig, QuoteResult, SavedQuote, ServiceTier } from "@/lib/types";

const quoteStorageKey = "smartbooks-quotes";
const configStorageKey = "smartbooks-pricing-config";
const tiers: ServiceTier[] = ["Basic", "Growth", "Advisory", "Premium CFO"];

export default function Home() {
  const [intake, setIntake] = useState<Intake>(blankIntake);
  const [config, setConfig] = useState<PricingConfig>(defaultPricingConfig);
  const [quotes, setQuotes] = useState<SavedQuote[]>(sampleQuotes);
  const [activeQuote, setActiveQuote] = useState<SavedQuote | null>(null);
  const [tab, setTab] = useState<"calculator" | "admin">("calculator");
  const [loaded, setLoaded] = useState(false);

  const result = useMemo(() => calculateQuote(intake, config), [intake, config]);

  useEffect(() => {
    const storedQuotes = window.localStorage.getItem(quoteStorageKey);
    const storedConfig = window.localStorage.getItem(configStorageKey);
    if (storedQuotes) setQuotes(JSON.parse(storedQuotes));
    if (storedConfig) setConfig(JSON.parse(storedConfig));
    setLoaded(true);
  }, []);

  useEffect(() => {
    async function loadSupabaseData() {
      if (!supabase) return;

      const [{ data: quoteRows }, { data: pricingRows }] = await Promise.all([
        supabase.from("quotes").select("*").order("created_at", { ascending: false }),
        supabase.from("pricing_assumptions").select("config").eq("id", "default").limit(1)
      ]);

      if (quoteRows?.length) {
        setQuotes(
          quoteRows.map((row) => ({
            id: row.id,
            intake: row.intake,
            result: row.result,
            createdAt: row.created_at,
            status: row.status as SavedQuote["status"]
          }))
        );
      }

      if (pricingRows?.[0]?.config) {
        setConfig(pricingRows[0].config);
      }
    }

    loadSupabaseData();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(quoteStorageKey, JSON.stringify(quotes));
  }, [loaded, quotes]);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(configStorageKey, JSON.stringify(config));
  }, [config, loaded]);

  async function saveQuote() {
    const saved: SavedQuote = {
      id: crypto.randomUUID(),
      intake,
      result,
      createdAt: new Date().toISOString(),
      status: "draft"
    };
    setQuotes((current) => [saved, ...current]);
    setActiveQuote(saved);

    if (supabase) {
      await supabase.from("quotes").insert({
        id: saved.id,
        intake: saved.intake,
        result: saved.result,
        status: saved.status,
        created_at: saved.createdAt
      });
    }
  }

  function loadSample(quote: SavedQuote) {
    setIntake(quote.intake);
    setActiveQuote(quote);
    setTab("calculator");
  }

  async function syncPricing() {
    if (!supabase) return;
    await supabase.from("pricing_assumptions").upsert({
      id: "default",
      config,
      updated_at: new Date().toISOString()
    });
  }

  const displayedQuote = { id: activeQuote?.id ?? "preview", intake, result, createdAt: activeQuote?.createdAt ?? new Date().toISOString(), status: "draft" as const };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(47,128,237,0.18),transparent_34%),linear-gradient(135deg,#07111f_0%,#0b1729_52%,#10213a_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-300">SmartBooks CPA</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Bookkeeping Pricing Calculator</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={tab === "calculator" ? "btn-primary" : "btn-secondary"} onClick={() => setTab("calculator")}>
              <Calculator size={17} /> Calculator
            </button>
            <button className={tab === "admin" ? "btn-primary" : "btn-secondary"} onClick={() => setTab("admin")}>
              <Settings size={17} /> Admin
            </button>
          </div>
        </header>

        {tab === "calculator" ? (
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <IntakeForm intake={intake} setIntake={setIntake} saveQuote={saveQuote} />
            <QuoteOutput quote={displayedQuote} exportPdf={() => exportProposalPdf(displayedQuote)} />
          </div>
        ) : (
          <AdminDashboard
            quotes={quotes}
            config={config}
            setConfig={setConfig}
            loadSample={loadSample}
            exportCsv={() => exportCsv(quotes)}
            syncPricing={syncPricing}
            supabaseEnabled={Boolean(supabase)}
          />
        )}
      </div>
    </main>
  );
}

function IntakeForm({ intake, setIntake, saveQuote }: { intake: Intake; setIntake: (value: Intake) => void; saveQuote: () => void }) {
  const setValue = <K extends keyof Intake>(key: K, value: Intake[K]) => setIntake({ ...intake, [key]: value });
  const toggleFields: Array<[keyof Pick<Intake, "payrollNeeded" | "salesTaxNeeded" | "inventory" | "loans" | "multipleOwners" | "monthlyReviewCall" | "taxPlanning" | "advisory">, string]> = [
    ["payrollNeeded", "Payroll needed?"],
    ["salesTaxNeeded", "Sales tax needed?"],
    ["inventory", "Inventory?"],
    ["loans", "Loans?"],
    ["multipleOwners", "Multiple owners?"],
    ["monthlyReviewCall", "Monthly review call?"],
    ["taxPlanning", "Tax planning needed?"],
    ["advisory", "Advisory needed?"]
  ];

  return (
    <section className="panel p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Client Intake</h2>
          <p className="mt-1 text-sm text-slate-300">Enter complexity drivers to generate a CPA-reviewed starting quote.</p>
        </div>
        <button className="btn-primary" onClick={saveQuote}>
          <Save size={17} /> Save
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Business name" value={intake.businessName} onChange={(value) => setValue("businessName", value)} />
        <TextField label="Contact name" value={intake.contactName} onChange={(value) => setValue("contactName", value)} />
        <TextField label="Email" type="email" value={intake.email} onChange={(value) => setValue("email", value)} />
        <TextField label="Phone" value={intake.phone} onChange={(value) => setValue("phone", value)} />
        <TextField label="Industry" value={intake.industry} onChange={(value) => setValue("industry", value)} />
        <SelectField label="Entity type" value={intake.entityType} options={["Sole Prop", "LLC", "S-Corp", "Partnership", "C-Corp"]} onChange={(value) => setValue("entityType", value as Intake["entityType"])} />
        <NumberField label="Monthly transaction count" value={intake.monthlyTransactions} onChange={(value) => setValue("monthlyTransactions", value)} />
        <NumberField label="Number of bank accounts" value={intake.bankAccounts} onChange={(value) => setValue("bankAccounts", value)} />
        <NumberField label="Number of credit cards" value={intake.creditCards} onChange={(value) => setValue("creditCards", value)} />
        <NumberField label="Months behind" value={intake.monthsBehind} onChange={(value) => setValue("monthsBehind", value)} />
        <SelectField label="Current books condition" value={intake.booksCondition} options={["Clean", "Somewhat messy", "Very messy", "Failed audit/unreliable"]} onChange={(value) => setValue("booksCondition", value as Intake["booksCondition"])} />
        <SelectField label="Desired response time" value={intake.responseTime} options={["Standard", "Priority", "White Glove"]} onChange={(value) => setValue("responseTime", value as Intake["responseTime"])} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {toggleFields.map(([key, label]) => (
          <label key={key} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-navy-950/50 px-3 py-3 text-sm">
            <span>{label}</span>
            <input
              type="checkbox"
              checked={intake[key]}
              onChange={(event) => setValue(key, event.target.checked)}
              className="h-5 w-5 rounded border-white/20 bg-navy-950 accent-accent-500"
            />
          </label>
        ))}
      </div>
    </section>
  );
}

function QuoteOutput({ quote, exportPdf }: { quote: SavedQuote; exportPdf: () => void }) {
  const { intake, result } = quote;
  return (
    <aside className="panel h-fit p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-300">Recommended Quote</p>
          <h2 className="mt-2 text-3xl font-semibold">${result.monthlyFee.toLocaleString()}/mo</h2>
          <p className="mt-1 text-sm text-slate-300">{result.tier} service tier</p>
        </div>
        <button className="btn-secondary" onClick={exportPdf}>
          <FileText size={17} /> PDF
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Metric label="Complexity" value={result.complexityScore.toString()} />
        <Metric label="Monthly hours" value={`${result.estimatedMonthlyHours}`} />
        <Metric label="Onboarding" value={`$${result.setupFee.toLocaleString()}`} />
        <Metric label="Cleanup" value={cleanupText(result)} />
      </div>

      <Section title="What's Included" items={result.included} />
      <div className="mt-5 rounded-lg border border-accent-400/25 bg-accent-500/10 p-4">
        <h3 className="font-semibold text-white">Client-facing explanation</h3>
        <p className="mt-2 text-sm leading-6 text-slate-200">{result.clientExplanation}</p>
      </div>
      <Section title="Internal CPA Notes" items={result.internalNotes} />
      <p className="mt-5 rounded-md border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300">
        Final pricing subject to CPA review. Cleanup scope, catch-up work, and advisory cadence may change after file access and document review.
      </p>
      <p className="mt-3 text-xs text-slate-400">Prepared for {intake.businessName || "new prospect"}</p>
    </aside>
  );
}

function AdminDashboard({
  quotes,
  config,
  setConfig,
  loadSample,
  exportCsv,
  syncPricing,
  supabaseEnabled
}: {
  quotes: SavedQuote[];
  config: PricingConfig;
  setConfig: (config: PricingConfig) => void;
  loadSample: (quote: SavedQuote) => void;
  exportCsv: () => void;
  syncPricing: () => void;
  supabaseEnabled: boolean;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <section className="panel p-4 sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <Settings size={18} className="text-accent-300" />
          <h2 className="text-xl font-semibold">Pricing Assumptions</h2>
        </div>
        <div className="grid gap-4">
          {tiers.map((tier) => (
            <NumberField
              key={tier}
              label={`${tier} base monthly price`}
              value={config.tierBase[tier]}
              onChange={(value) => setConfig({ ...config, tierBase: { ...config.tierBase, [tier]: value } })}
            />
          ))}
          <NumberField label="Base setup fee" value={config.setupFee.base} onChange={(value) => setConfig({ ...config, setupFee: { ...config.setupFee, base: value } })} />
          <NumberField label="Setup fee per account/card" value={config.setupFee.perAccount} onChange={(value) => setConfig({ ...config, setupFee: { ...config.setupFee, perAccount: value } })} />
          {(["light", "moderate", "heavy"] as const).map((level) => (
            <div key={level} className="grid grid-cols-2 gap-3">
              <NumberField label={`${level} cleanup low`} value={config.cleanupRanges[level][0]} onChange={(value) => setCleanup(config, setConfig, level, 0, value)} />
              <NumberField label={`${level} cleanup high`} value={config.cleanupRanges[level][1]} onChange={(value) => setCleanup(config, setConfig, level, 1, value)} />
            </div>
          ))}
        </div>
        <button className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50" onClick={syncPricing} disabled={!supabaseEnabled}>
          <Save size={17} /> Sync Pricing to Supabase
        </button>
        {!supabaseEnabled ? <p className="mt-2 text-xs text-slate-400">Add Supabase environment variables to enable cloud sync.</p> : null}
      </section>

      <section className="panel overflow-hidden p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-accent-300" />
            <h2 className="text-xl font-semibold">Saved Quotes</h2>
          </div>
          <button className="btn-secondary" onClick={exportCsv}>
            <Download size={17} /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-[0.08em] text-slate-400">
              <tr>
                <th className="py-3 pr-4">Prospect</th>
                <th className="py-3 pr-4">Contact</th>
                <th className="py-3 pr-4">Tier</th>
                <th className="py-3 pr-4">Monthly</th>
                <th className="py-3 pr-4">Cleanup</th>
                <th className="py-3 pr-4">Score</th>
                <th className="py-3 pr-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {quotes.map((quote) => (
                <tr key={quote.id} className="text-slate-200">
                  <td className="py-3 pr-4 font-medium text-white">{quote.intake.businessName}</td>
                  <td className="py-3 pr-4">{quote.intake.contactName}</td>
                  <td className="py-3 pr-4">{quote.result.tier}</td>
                  <td className="py-3 pr-4">${quote.result.monthlyFee.toLocaleString()}</td>
                  <td className="py-3 pr-4">{cleanupText(quote.result)}</td>
                  <td className="py-3 pr-4">{quote.result.complexityScore}</td>
                  <td className="py-3 pr-4">
                    <button className="rounded-md border border-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/10" onClick={() => loadSample(quote)}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-2">
      <span className="label">{label}</span>
      <input className="field" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-2">
      <span className="label">{label}</span>
      <input className="field" type="number" min="0" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="label">{label}</span>
      <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <p className="text-xs uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-5">
      <h3 className="font-semibold text-white">{title}</h3>
      <ul className="mt-3 grid gap-2 text-sm text-slate-300">
        {items.map((item) => (
          <li key={item} className="rounded-md border border-white/10 bg-white/[0.035] px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function cleanupText(result: QuoteResult) {
  if (result.cleanupLevel === "none") return "None";
  return `$${result.cleanupFeeLow.toLocaleString()}-$${result.cleanupFeeHigh.toLocaleString()}${result.cleanupLevel === "heavy" ? "+" : ""}`;
}

function setCleanup(config: PricingConfig, setConfig: (config: PricingConfig) => void, level: "light" | "moderate" | "heavy", index: 0 | 1, value: number) {
  const nextRange: [number, number] = [...config.cleanupRanges[level]];
  nextRange[index] = value;
  setConfig({ ...config, cleanupRanges: { ...config.cleanupRanges, [level]: nextRange } });
}

function exportCsv(quotes: SavedQuote[]) {
  const headers = ["Business", "Contact", "Email", "Phone", "Industry", "Tier", "Monthly Fee", "Setup Fee", "Cleanup", "Score", "Hours", "Created"];
  const rows = quotes.map((quote) => [
    quote.intake.businessName,
    quote.intake.contactName,
    quote.intake.email,
    quote.intake.phone,
    quote.intake.industry,
    quote.result.tier,
    quote.result.monthlyFee,
    quote.result.setupFee,
    cleanupText(quote.result),
    quote.result.complexityScore,
    quote.result.estimatedMonthlyHours,
    quote.createdAt
  ]);
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, "smartbooks-quotes.csv");
}

function exportProposalPdf(quote: SavedQuote) {
  const doc = new jsPDF();
  const { intake, result } = quote;
  doc.setFillColor(7, 17, 31);
  doc.rect(0, 0, 210, 297, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("SmartBooks CPA", 18, 24);
  doc.setFontSize(14);
  doc.setTextColor(145, 197, 255);
  doc.text("Bookkeeping & Advisory Proposal", 18, 34);
  doc.setDrawColor(47, 128, 237);
  doc.line(18, 42, 192, 42);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(intake.businessName || "Prospective Client", 18, 56);
  doc.setFontSize(11);
  doc.setTextColor(220, 230, 242);
  doc.text(`Contact: ${intake.contactName || "TBD"}`, 18, 66);
  doc.text(`Recommended tier: ${result.tier}`, 18, 74);
  doc.text(`Monthly price: $${result.monthlyFee.toLocaleString()}`, 18, 82);
  doc.text(`Setup/onboarding: $${result.setupFee.toLocaleString()}`, 18, 90);
  doc.text(`Cleanup estimate: ${cleanupText(result)}`, 18, 98);

  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("Scope of Services", 18, 116);
  doc.setFontSize(10);
  doc.setTextColor(220, 230, 242);
  result.included.forEach((item, index) => doc.text(`- ${item}`, 22, 126 + index * 8));

  const nextY = 132 + result.included.length * 8;
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("Next Steps", 18, nextY);
  doc.setFontSize(10);
  doc.setTextColor(220, 230, 242);
  doc.text("1. CPA reviews source documents and confirms scope.", 22, nextY + 10);
  doc.text("2. SmartBooks CPA sends final engagement letter.", 22, nextY + 18);
  doc.text("3. Client connects accounting, payroll, and bank access.", 22, nextY + 26);

  doc.setFontSize(9);
  doc.setTextColor(180, 194, 214);
  doc.text("Final pricing subject to CPA review. Proposal estimates may change after file access and document review.", 18, 276, { maxWidth: 174 });
  doc.save(`SmartBooks CPA Proposal - ${intake.businessName || "Prospect"}.pdf`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
