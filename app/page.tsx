"use client";

import { CalendarDays, CheckCircle2, ClipboardList, Download, FolderOpen, KeyRound, LucideIcon, Plus, ShieldCheck, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

type Status = "Not Started" | "Waiting on Client" | "In Progress" | "Complete";

type Task = {
  id: string;
  phase: string;
  task: string;
  owner: "Client" | "Smart Books CPA" | "Both";
  due: string;
  status: Status;
};

const initialTasks: Task[] = [
  { id: "engagement", phase: "Engagement", task: "Signed engagement letter received", owner: "Client", due: "Day 0", status: "Complete" },
  { id: "payment", phase: "Engagement", task: "Recurring payment method authorized", owner: "Client", due: "Day 0", status: "In Progress" },
  { id: "qbo", phase: "System Access", task: "QuickBooks Online accountant access granted", owner: "Client", due: "Day 1", status: "Waiting on Client" },
  { id: "bank", phase: "System Access", task: "Bank and credit card feeds connected", owner: "Both", due: "Day 2", status: "Not Started" },
  { id: "payroll", phase: "System Access", task: "Payroll provider access or reports provided", owner: "Client", due: "Day 3", status: "Not Started" },
  { id: "sales-tax", phase: "System Access", task: "Sales tax account access confirmed", owner: "Client", due: "Day 3", status: "Not Started" },
  { id: "prior-financials", phase: "Historical Records", task: "Prior financial statements uploaded", owner: "Client", due: "Day 4", status: "Waiting on Client" },
  { id: "tax-return", phase: "Historical Records", task: "Prior tax return uploaded for reference", owner: "Client", due: "Day 4", status: "Not Started" },
  { id: "coa", phase: "Setup Review", task: "Chart of accounts reviewed and cleaned up", owner: "Smart Books CPA", due: "Day 5", status: "Not Started" },
  { id: "close-calendar", phase: "Setup Review", task: "Monthly close calendar created", owner: "Smart Books CPA", due: "Day 5", status: "Not Started" },
  { id: "kickoff", phase: "Kickoff", task: "Kickoff call scheduled", owner: "Both", due: "Day 7", status: "In Progress" },
  { id: "first-close", phase: "Kickoff", task: "First month-end close target confirmed", owner: "Smart Books CPA", due: "Day 7", status: "Not Started" }
];

const statuses: Status[] = ["Not Started", "Waiting on Client", "In Progress", "Complete"];

const statusStyles: Record<Status, string> = {
  "Not Started": "border-white/10 bg-white/5 text-slate-300",
  "Waiting on Client": "border-amber-300/30 bg-amber-300/10 text-amber-100",
  "In Progress": "border-accent-300/30 bg-accent-500/10 text-accent-300",
  Complete: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
};

export default function OnboardingChecklistPage({ searchParams }: { searchParams: { clientId?: string } }) {
  const [clientName, setClientName] = useState(searchParams.clientId ? `Client ${searchParams.clientId}` : "Demo Client LLC");
  const [serviceTier, setServiceTier] = useState("Growth bookkeeping");
  const [startDate, setStartDate] = useState("2026-05-20");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTask, setNewTask] = useState("");
  const [newPhase, setNewPhase] = useState("Kickoff");

  const completed = tasks.filter((task) => task.status === "Complete").length;
  const waiting = tasks.filter((task) => task.status === "Waiting on Client").length;
  const progress = Math.round((completed / tasks.length) * 100);
  const phases = useMemo(() => Array.from(new Set(tasks.map((task) => task.phase))), [tasks]);

  function updateStatus(id: string, status: Status) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, status } : task)));
  }

  function addTask() {
    if (!newTask.trim()) return;
    setTasks((current) => [
      ...current,
      {
        id: `custom-${Date.now()}`,
        phase: newPhase,
        task: newTask.trim(),
        owner: "Smart Books CPA",
        due: "TBD",
        status: "Not Started"
      }
    ]);
    setNewTask("");
  }

  function exportCsv() {
    const headers = ["Client", "Phase", "Task", "Owner", "Due", "Status"];
    const rows = tasks.map((task) => [clientName, task.phase, task.task, task.owner, task.due, task.status]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "smart-books-onboarding-checklist.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(47,128,237,0.18),transparent_34%),linear-gradient(135deg,#07111f_0%,#0b1729_52%,#10213a_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <nav className="panel flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <a href="/" className="btn-primary">
              Home
            </a>
            <a href="/pricing-calculator" className="btn-secondary">
              Pricing
            </a>
            <a href="/qb-transaction-categorizer" className="btn-secondary">
              QB Categorizer
            </a>
            <a href="/client-portal" className="btn-secondary">
              Client Portal
            </a>
          </div>
          <button className="btn-primary w-fit" onClick={exportCsv}>
            <Download size={17} /> Export Checklist
          </button>
        </nav>

        <section className="panel p-5 sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-300">Smart Books CPA</p>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-5xl">Onboarding Checklist</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
                Standardize the new-client handoff from signed proposal to first month-end close.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[460px]">
              <Metric label="CRM Context" value={searchParams.clientId || "No clientId supplied"} />
              <Metric label="Completion" value={`${progress}%`} />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
          <div className="grid gap-6">
            <div className="panel p-5">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                <UserRound size={20} className="text-accent-300" /> Client Setup
              </h2>
              <div className="mt-5 grid gap-4">
                <Field label="Client name" value={clientName} onChange={setClientName} />
                <Field label="Service tier" value={serviceTier} onChange={setServiceTier} />
                <Field label="Target start date" value={startDate} onChange={setStartDate} type="date" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <Metric label="Tasks" value={tasks.length.toString()} />
              <Metric label="Complete" value={completed.toString()} />
              <Metric label="Waiting" value={waiting.toString()} />
            </div>

            <div className="panel p-5">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                <Plus size={20} className="text-accent-300" /> Add Task
              </h2>
              <div className="mt-4 grid gap-3">
                <input className="field" value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="New onboarding task" />
                <select className="field" value={newPhase} onChange={(event) => setNewPhase(event.target.value)}>
                  {phases.map((phase) => (
                    <option key={phase}>{phase}</option>
                  ))}
                </select>
                <button className="btn-secondary" onClick={addTask}>Add Task</button>
              </div>
            </div>

            <div className="panel p-5">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                <KeyRound size={20} className="text-accent-300" /> Access Priorities
              </h2>
              <ul className="mt-4 grid gap-3 text-sm text-slate-300">
                <li className="rounded-lg border border-white/10 bg-navy-950/55 p-3">QuickBooks Online accountant access</li>
                <li className="rounded-lg border border-white/10 bg-navy-950/55 p-3">Bank and credit card feeds</li>
                <li className="rounded-lg border border-white/10 bg-navy-950/55 p-3">Payroll provider reports</li>
                <li className="rounded-lg border border-white/10 bg-navy-950/55 p-3">Sales tax portal access if applicable</li>
              </ul>
            </div>
          </div>

          <div className="grid gap-6">
            {phases.map((phase) => (
              <div key={phase} className="panel p-5">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                    <FolderOpen size={20} className="text-accent-300" /> {phase}
                  </h2>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-300">
                    {tasks.filter((task) => task.phase === phase && task.status === "Complete").length}/{tasks.filter((task) => task.phase === phase).length}
                  </span>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-white/10 text-xs uppercase tracking-[0.08em] text-slate-400">
                      <tr>
                        <th className="py-3 pr-4">Task</th>
                        <th className="py-3 pr-4">Owner</th>
                        <th className="py-3 pr-4">Due</th>
                        <th className="py-3 pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {tasks.filter((task) => task.phase === phase).map((task) => (
                        <tr key={task.id} className="align-top text-slate-200">
                          <td className="py-3 pr-4 font-medium text-white">{task.task}</td>
                          <td className="py-3 pr-4">{task.owner}</td>
                          <td className="py-3 pr-4">{task.due}</td>
                          <td className="py-3 pr-4">
                            <select className={`rounded-full border px-2.5 py-1 text-xs font-bold outline-none ${statusStyles[task.status]}`} value={task.status} onChange={(event) => updateStatus(task.id, event.target.value as Status)}>
                              {statuses.map((status) => (
                                <option key={status}>{status}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <div className="panel p-5">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                <ShieldCheck size={20} className="text-accent-300" /> Handoff Rules
              </h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Rule icon={CheckCircle2} title="Ready for first close" detail="All access and historical records complete." />
                <Rule icon={CalendarDays} title="Kickoff scheduled" detail="Client confirms standing communication rhythm." />
                <Rule icon={ClipboardList} title="Scope confirmed" detail="Monthly services match proposal and engagement letter." />
                <Rule icon={KeyRound} title="Access verified" detail="No shared passwords stored in notes or task descriptions." />
              </div>
            </div>
          </div>
        </section>

        <p className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-xs leading-5 text-slate-400">
          MVP note: checklist changes are in-browser only until Supabase persistence is connected.
        </p>

        <div className="panel p-5">
          <a href="https://smart-books-cpa-tools-hub.vercel.app/" target="_top" className="btn-primary w-fit">
            Return to Smart Books CPA Tools Hub
          </a>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-2">
      <span className="label">{label}</span>
      <input className="field" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <p className="text-xs uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <p className="mt-2 break-words text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Rule({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-navy-950/55 p-4">
      <h3 className="flex items-center gap-2 font-semibold text-white">
        <Icon size={17} className="text-accent-300" /> {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
    </div>
  );
}
