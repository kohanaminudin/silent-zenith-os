"use client";

import React, { useMemo, useState } from "react";
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ShieldAlert,
  CheckCircle2,
  Sliders,
  Lock,
  Sparkles,
  ArrowRight,
  Edit3,
  Save,
} from "lucide-react";
import {
  SopChecklistItem,
  SopEvaluationSnapshot,
  SopTemplate,
} from "@/types/trading-system";

export const DEFAULT_SOP_TEMPLATES: SopTemplate[] = [
  {
    id: "default-ict-template",
    name: "Template Standar (Contoh Kustomisasi)",
    description:
      "Contoh struktur awal. Silakan ubah, hapus, tambah kategori, atau buat template baru sesuai SOP trading Anda.",
    setupTag: "Intraday / Swing",
    items: [
      {
        id: "item-1",
        category: "Market Structure",
        label: "Struktur HTF (H4/D1) selaras dengan arah entry (BOS / CHoCH valid)",
        mandatory: true,
        enabled: true,
        order: 1,
      },
      {
        id: "item-2",
        category: "Liquidity",
        label: "Liquidity sweep (BSL / SSL) sudah terjadi sebelum harga masuk area POI",
        mandatory: true,
        enabled: true,
        order: 2,
      },
      {
        id: "item-3",
        category: "Supply & Demand",
        label: "Harga berada di area 75% Premium / Discount POI yang valid",
        mandatory: true,
        enabled: true,
        order: 3,
      },
      {
        id: "item-4",
        category: "Entry Confirmation",
        label: "Konfirmasi LTF (M5/M15) dengan displacement & FVG terbentuk",
        mandatory: false,
        enabled: true,
        order: 4,
      },
      {
        id: "item-5",
        category: "Risk Management",
        label: "Stop Loss terpasang di level invalidasi dan risiko sesuai batas harian",
        mandatory: true,
        enabled: true,
        order: 5,
      },
      {
        id: "item-6",
        category: "Trading Psychology",
        label: "Kondisi emosi tenang, tidak FOMO, dan bukan menjelang news high-impact",
        mandatory: true,
        enabled: true,
        order: 6,
      },
    ],
  },
];

export function SopSettingsManager({
  templates,
  onSaveTemplate,
  onDeleteTemplate,
  onNotify,
}: {
  templates: SopTemplate[];
  onSaveTemplate: (tpl: SopTemplate, isNew: boolean) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
  onNotify: (msg: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id || "");
  const activeTemplate = useMemo(
    () => templates.find((t) => t.id === selectedId) || templates[0] || null,
    [templates, selectedId]
  );

  const [newTplName, setNewTplName] = useState("");
  const [newTplSetup, setNewTplSetup] = useState("");
  const [newCategory, setNewCategory] = useState("Market Structure");
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemMandatory, setNewItemMandatory] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingCategory, setEditingCategory] = useState("");

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplName.trim()) return;
    const created: SopTemplate = {
      id: crypto.randomUUID(),
      name: newTplName.trim(),
      description: "SOP Trading Kustom",
      setupTag: newTplSetup.trim() || "Custom Setup",
      items: [],
    };
    await onSaveTemplate(created, true);
    setSelectedId(created.id);
    setNewTplName("");
    setNewTplSetup("");
    onNotify(`Template SOP "${created.name}" berhasil dibuat!`);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTemplate || !newItemLabel.trim()) return;
    const nextItem: SopChecklistItem = {
      id: crypto.randomUUID(),
      category: newCategory.trim() || "Umum",
      label: newItemLabel.trim(),
      mandatory: newItemMandatory,
      enabled: true,
      order: activeTemplate.items.length + 1,
    };
    await onSaveTemplate(
      {
        ...activeTemplate,
        items: [...activeTemplate.items, nextItem],
      },
      false
    );
    setNewItemLabel("");
    onNotify("Item checklist ditambahkan ke SOP.");
  };

  const handleUpdateItems = async (updatedItems: SopChecklistItem[]) => {
    if (!activeTemplate) return;
    const normalized = updatedItems.map((it, idx) => ({ ...it, order: idx + 1 }));
    await onSaveTemplate({ ...activeTemplate, items: normalized }, false);
  };

  const moveItem = async (index: number, direction: -1 | 1) => {
    if (!activeTemplate) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= activeTemplate.items.length) return;
    const copy = [...activeTemplate.items];
    const [removed] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, removed);
    await handleUpdateItems(copy);
  };

  const saveEditedItem = async (itemId: string) => {
    if (!activeTemplate || !editingLabel.trim()) return;
    const updated = activeTemplate.items.map((it) =>
      it.id === itemId
        ? {
            ...it,
            label: editingLabel.trim(),
            category: editingCategory.trim() || it.category,
          }
        : it
    );
    await handleUpdateItems(updated);
    setEditingItemId(null);
    onNotify("Item SOP diperbarui.");
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-violet-400" />
            Trading SOP & Custom Checklist Builder
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Buat kategori, aturan wajib (mandatory), dan template SOP berbeda untuk setiap setup trading Anda.
          </p>
        </div>

        <form onSubmit={handleCreateTemplate} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Nama Template SOP Baru..."
            value={newTplName}
            onChange={(e) => setNewTplName(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white"
          />
          <input
            type="text"
            placeholder="Tag Setup (mis. London Sweep)"
            value={newTplSetup}
            onChange={(e) => setNewTplSetup(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Buat Template
          </button>
        </form>
      </div>

      {/* Template Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => setSelectedId(tpl.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              activeTemplate?.id === tpl.id
                ? "bg-violet-600/20 text-violet-300 border-violet-500/50"
                : "bg-[#111827] text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            {tpl.name} ({tpl.items.length})
          </button>
        ))}
      </div>

      {activeTemplate && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Tambah Item SOP */}
          <form
            onSubmit={handleAddItem}
            className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4 h-fit"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Tambah Kriteria SOP</h2>
              {templates.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDeleteTemplate(activeTemplate.id)}
                  className="text-xs text-rose-400 hover:underline cursor-pointer"
                >
                  Hapus Template
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Kategori (Ketik bebas atau pilih saran)
              </label>
              <input
                type="text"
                list="sop-category-suggestions"
                required
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Contoh: Market Structure, Liquidity..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
              <datalist id="sop-category-suggestions">
                <option value="Market Structure" />
                <option value="Trend Analysis" />
                <option value="Support & Resistance" />
                <option value="Supply & Demand" />
                <option value="Liquidity" />
                <option value="Entry Confirmation" />
                <option value="Risk Management" />
                <option value="Trading Psychology" />
              </datalist>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Aturan / Pertanyaan Checklist
              </label>
              <textarea
                rows={3}
                required
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
                placeholder="Contoh: Apakah harga sudah menyapu High/Low sesi Asia?"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={newItemMandatory}
                onChange={(e) => setNewItemMandatory(e.target.checked)}
                className="rounded accent-violet-500"
              />
              <span>Wajib dipenuhi (Mandatory) sebelum eksekusi trade</span>
            </label>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambahkan ke SOP
            </button>
          </form>

          {/* Daftar Item SOP */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Daftar Kriteria: {activeTemplate.name}
              </h2>
              <span className="text-xs text-slate-400">
                {activeTemplate.items.filter((i) => i.enabled).length} Aktif /{" "}
                {activeTemplate.items.length} Total
              </span>
            </div>

            {activeTemplate.items.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Belum ada item di template SOP ini. Tambahkan kriteria pertama Anda di panel kiri.
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeTemplate.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-colors ${
                      item.enabled
                        ? "bg-slate-950/70 border-slate-800"
                        : "bg-slate-950/30 border-slate-800/40 opacity-55"
                    }`}
                  >
                    {editingItemId === item.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingCategory}
                          onChange={(e) => setEditingCategory(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white"
                        />
                        <input
                          type="text"
                          value={editingLabel}
                          onChange={(e) => setEditingLabel(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingItemId(null)}
                            className="px-2.5 py-1 text-xs text-slate-400 cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditedItem(item.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Save className="w-3 h-3" /> Simpan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-violet-500/15 text-violet-300">
                              {item.category}
                            </span>
                            {item.mandatory ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400">
                                Wajib (Mandatory)
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                Opsional
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-200">{item.label}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateItems(
                                activeTemplate.items.map((it) =>
                                  it.id === item.id ? { ...it, mandatory: !it.mandatory } : it
                                )
                              )
                            }
                            title="Ubah Wajib/Opsional"
                            className="px-2 py-1 rounded-lg text-[11px] bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-600 cursor-pointer"
                          >
                            {item.mandatory ? "Wajib" : "Opsional"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateItems(
                                activeTemplate.items.map((it) =>
                                  it.id === item.id ? { ...it, enabled: !it.enabled } : it
                                )
                              )
                            }
                            className={`px-2 py-1 rounded-lg text-[11px] border cursor-pointer ${
                              item.enabled
                                ? "border-emerald-500/30 text-emerald-400"
                                : "border-slate-700 text-slate-500"
                            }`}
                          >
                            {item.enabled ? "Aktif" : "Nonaktif"}
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItem(idx, -1)}
                            disabled={idx === 0}
                            className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItem(idx, 1)}
                            disabled={idx === activeTemplate.items.length - 1}
                            className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItemId(item.id);
                              setEditingLabel(item.label);
                              setEditingCategory(item.category);
                            }}
                            className="p-1.5 text-slate-400 hover:text-sky-400 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateItems(
                                activeTemplate.items.filter((it) => it.id !== item.id)
                              )
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ChecklistAnalysisWorkspace({
  templates,
  activeSnapshot,
  onLockSnapshot,
  onProceedToCalculator,
  onOpenSopSettings,
}: {
  templates: SopTemplate[];
  activeSnapshot: SopEvaluationSnapshot | null;
  onLockSnapshot: (snapshot: SopEvaluationSnapshot) => void;
  onProceedToCalculator: (snapshot: SopEvaluationSnapshot) => void;
  onOpenSopSettings: () => void;
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    activeSnapshot?.templateId || templates[0]?.id || ""
  );
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    activeSnapshot?.items.forEach((it) => {
      initial[it.id] = it.checked;
    });
    return initial;
  });
  const [overrideConfirmed, setOverrideConfirmed] = useState<boolean>(
    activeSnapshot?.overridden || false
  );
  const [showOverrideWarning, setShowOverrideWarning] = useState<boolean>(false);

  const currentTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || templates[0] || null,
    [templates, selectedTemplateId]
  );

  const enabledItems = useMemo(
    () => (currentTemplate ? currentTemplate.items.filter((i) => i.enabled) : []),
    [currentTemplate]
  );

  const groupedItems = useMemo(() => {
    const map = new Map<string, SopChecklistItem[]>();
    enabledItems.forEach((item) => {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    });
    return Array.from(map.entries());
  }, [enabledItems]);

  const completedCount = enabledItems.filter((it) => Boolean(checkedMap[it.id])).length;
  const mandatoryIncomplete = enabledItems.filter(
    (it) => it.mandatory && !checkedMap[it.id]
  );
  const completionPct =
    enabledItems.length > 0 ? Math.round((completedCount / enabledItems.length) * 100) : 100;

  const buildSnapshot = (overridden: boolean): SopEvaluationSnapshot => ({
    templateId: currentTemplate?.id || "custom",
    templateName: currentTemplate?.name || "SOP Kustom",
    completionPct,
    totalEnabled: enabledItems.length,
    completedCount,
    mandatoryIncompleteCount: mandatoryIncomplete.length,
    overridden,
    items: enabledItems.map((it) => ({
      ...it,
      checked: Boolean(checkedMap[it.id]),
    })),
    evaluatedAt: new Date().toISOString(),
  });

  const handleConfirmChecklist = (proceedToLot: boolean) => {
    if (mandatoryIncomplete.length > 0 && !overrideConfirmed) {
      setShowOverrideWarning(true);
      return;
    }
    const snap = buildSnapshot(mandatoryIncomplete.length > 0 && overrideConfirmed);
    onLockSnapshot(snap);
    if (proceedToLot) {
      onProceedToCalculator(snap);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            Checklist Analisis Pra-Trade (SOP Gatekeeper)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Validasi setup sebelum menghitung lot dan mengeksekusi posisi. Snapshot checklist tersimpan permanen di jurnal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={currentTemplate?.id || ""}
            onChange={(e) => {
              setSelectedTemplateId(e.target.value);
              setCheckedMap({});
              setOverrideConfirmed(false);
              setShowOverrideWarning(false);
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-950 border border-slate-700 text-white"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                SOP: {t.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onOpenSopSettings}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
          >
            Kelola / Edit SOP
          </button>
        </div>
      </div>

      {/* Progress & Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
          <p className="text-xs text-slate-400">Kesiapan SOP</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold tabular-nums ${
                mandatoryIncomplete.length === 0
                  ? "text-emerald-400"
                  : completionPct >= 60
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}
            >
              {completionPct}%
            </span>
            <span className="text-xs text-slate-400">
              ({completedCount}/{enabledItems.length} Terpenuhi)
            </span>
          </div>
          <div className="mt-3 w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                mandatoryIncomplete.length === 0 ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
          <p className="text-xs text-slate-400">Status Syarat Wajib (Mandatory)</p>
          <div className="mt-2">
            {mandatoryIncomplete.length === 0 ? (
              <div className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-400">
                <CheckCircle2 className="w-5 h-5" /> Semua Syarat Wajib Terpenuhi
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-400">
                <ShieldAlert className="w-5 h-5" /> {mandatoryIncomplete.length} Syarat Wajib Belum Dicentang
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            {mandatoryIncomplete.length === 0
              ? "Setup valid secara SOP untuk dilanjutkan ke kalkulator lot."
              : "Sistem mencegah eksekusi tanpa konfirmasi override eksplisit."}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-400">Snapshot Terkunci</p>
            <p className="text-xs font-semibold text-white mt-1">
              {activeSnapshot
                ? `${activeSnapshot.templateName} (${activeSnapshot.completionPct}%)`
                : "Belum ada snapshot dikunci"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              onClick={() => handleConfirmChecklist(false)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-violet-400" /> Kunci Snapshot
            </button>
            <button
              type="button"
              onClick={() => handleConfirmChecklist(true)}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Lanjut Hitung Lot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Warning & Override Box jika Mandatory belum lengkap */}
      {showOverrideWarning && mandatoryIncomplete.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/40 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-400">
                Peringatan Disiplin SOP: Syarat Wajib Belum Lengkap!
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Item wajib berikut belum terpenuhi:{" "}
                <strong>{mandatoryIncomplete.map((m) => m.label).join("; ")}</strong>. Trading di
                luar SOP meningkatkan risiko emosional.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-amber-300 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={overrideConfirmed}
              onChange={(e) => setOverrideConfirmed(e.target.checked)}
              className="accent-amber-500"
            />
            <span>
              Saya sadar melanggar aturan SOP wajib dan tetap ingin mencatat trade ini dengan status OVERRIDE.
            </span>
          </label>
        </div>
      )}

      {/* Checklist Grouped by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groupedItems.map(([category, items]) => (
          <div
            key={category}
            className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-violet-300">
                {category}
              </h3>
              <span className="text-[11px] text-slate-400">
                {items.filter((i) => checkedMap[i.id]).length}/{items.length}
              </span>
            </div>

            <div className="space-y-2">
              {items.map((item) => {
                const isChecked = Boolean(checkedMap[item.id]);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCheckedMap((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
                      setShowOverrideWarning(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border flex items-start gap-3 transition-colors cursor-pointer ${
                      isChecked
                        ? "bg-emerald-500/10 border-emerald-500/35 text-white"
                        : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 text-xs leading-relaxed">
                      <span>{item.label}</span>
                      {item.mandatory && (
                        <span className="ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400">
                          Wajib
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}