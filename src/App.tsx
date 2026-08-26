// @ts-nocheck
import React, {
  useState,
  useMemo,
  useCallback,
  memo,
  ChangeEvent,
  useEffect,
} from "react";
import {
  Calculator,
  Heart,
  Droplets,
  Zap,
  RotateCcw,
  Shuffle,
  BookOpen,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Info,
  Shield,
  AlertTriangle,
  BookText,
  Download,
} from "lucide-react";
import { jsPDF } from "jspdf";

// Import explanations from external JSON file
import explanations from "./explanations.json";
// Import ZIP code to SDI decile lookup (ZCTA5 → SDI decile 1–10)
import zipSdiDecile from "./zipSdiDecile.json";
// PREVENT and KFRE formula reference text (loaded on demand)
import preventFormulaTabs from "./PREVENT_Formulas_Reference";
import type { FormulaTab } from "./PREVENT_Formulas_Reference";
import kfreFormulaTabs from "./KFRE_Formulas_Reference";

// --- Configuration for Input Validation ---
const validationConfig = {
  age: { softMin: 30, hardMin: 18, softMax: 90, hardMax: 120, unit: "yrs" },
  eGFR: {
    softMin: 5,
    hardMin: 1,
    softMax: 120,
    hardMax: 200,
    unit: "mL/min/1.73mÂ²",
  },
  uACR: { softMin: 1, hardMin: 0, softMax: 3500, hardMax: 10000, unit: "mg/g" },
  sbp: { softMin: 90, hardMin: 60, softMax: 180, hardMax: 250, unit: "mmHg" },
  totalCholesterol: {
    softMin: 100,
    hardMin: 50,
    softMax: 300,
    hardMax: 500,
    unit: "mg/dL",
  },
  hdlCholesterol: {
    softMin: 20,
    hardMin: 10,
    softMax: 100,
    hardMax: 150,
    unit: "mg/dL",
  },
  bmi: { softMin: 18, hardMin: 10, softMax: 45, hardMax: 70, unit: "kg/mÂ²" },
  calcium: { softMin: 7, hardMin: 5, softMax: 11, hardMax: 15, unit: "mg/dL" },
  phosphate: { softMin: 2, hardMin: 1, softMax: 6, hardMax: 10, unit: "mg/dL" },
  albumin: { softMin: 2.5, hardMin: 1, softMax: 5.5, hardMax: 7, unit: "g/dL" },
  bicarbonate: {
    softMin: 15,
    hardMin: 5,
    softMax: 35,
    hardMax: 50,
    unit: "mEq/L",
  },
  a1c: { softMin: 4, hardMin: 3, softMax: 12, hardMax: 15, unit: "%" },
};

const InfoButton = memo(({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="ml-1 text-gray-400 hover:text-purple-600 transition-colors"
  >
    <Info className="w-3 h-3" />
  </button>
));

const CompactInputField = memo(
  ({
    label,
    value,
    name,
    onChange,
    onBlur,
    unit,
    required = false,
    error,
    onInfoClick,
  }: {
    label: string;
    value: string;
    name: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onBlur: (e: ChangeEvent<HTMLInputElement>) => void;
    unit?: string;
    required?: boolean;
    error?: { message: string; severity: "soft" | "hard" } | null;
    onInfoClick: () => void;
  }) => {
    const errorClasses = {
      soft: "bg-yellow-50 border-yellow-400 focus:ring-yellow-500",
      hard: "bg-red-50 border-red-500 focus:ring-red-500",
    };
    const errorTextClasses = {
      soft: "text-yellow-800",
      hard: "text-red-800",
    };

    return (
      <div>
        <div className="mb-1">
          <label
            htmlFor={name}
            className="flex items-center text-xs font-medium text-gray-700"
          >
            {label} {required && <span className="text-red-500">*</span>}
            {unit && (
              <span className="text-gray-500 text-xs ml-1">({unit})</span>
            )}
            <InfoButton onClick={onInfoClick} />
          </label>
          <input
            id={name}
            name={name}
            type="text"
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:border-transparent ${
              error
                ? errorClasses[error.severity]
                : "border-gray-300 focus:ring-purple-500"
            }`}
            placeholder={label}
            inputMode="decimal"
            autoComplete="off"
          />
        </div>
        {error && (
          <p
            className={`text-xs mt-1 p-1 rounded ${
              errorClasses[error.severity]
            } ${errorTextClasses[error.severity]}`}
          >
            {error.message}
          </p>
        )}
      </div>
    );
  }
);

const ToggleButton = memo(
  ({
    label,
    name,
    checked,
    onChange,
    onInfoClick,
  }: {
    label: string;
    name: string;
    checked: boolean;
    onChange: (name: string, value: boolean) => void;
    onInfoClick: () => void;
  }) => (
    <div>
      <label className="flex items-center mb-1 text-xs font-medium text-gray-700">
        {label} <InfoButton onClick={onInfoClick} />
      </label>
      <button
        type="button"
        onClick={() => onChange(name, !checked)}
        className={`w-full p-2 text-xs font-medium rounded border transition-colors ${
          checked
            ? "bg-purple-600 text-white border-purple-600"
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
        }`}
      >
        {" "}
        {label}{" "}
      </button>
    </div>
  )
);

const SexToggle = memo(
  ({
    sex,
    onSexChange,
    onInfoClick,
  }: {
    sex: string;
    onSexChange: (value: string) => void;
    onInfoClick: () => void;
  }) => (
    <div>
      <label className="flex items-center text-xs font-medium text-gray-700 mb-1">
        Sex <span className="text-red-500">*</span>
        <InfoButton onClick={onInfoClick} />
      </label>
      <div className="flex rounded border border-gray-300 overflow-hidden">
        <button
          type="button"
          onClick={() => onSexChange("male")}
          className={`flex-1 px-3 py-1 text-xs font-medium transition-colors ${
            sex === "male"
              ? "bg-purple-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          {" "}
          Male{" "}
        </button>
        <button
          type="button"
          onClick={() => onSexChange("female")}
          className={`flex-1 px-3 py-1 text-xs font-medium transition-colors ${
            sex === "female"
              ? "bg-purple-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          {" "}
          Female{" "}
        </button>
      </div>
    </div>
  )
);

const WaffleChart = memo(
  ({
    baseValue,
    treatedValue,
    colors,
    total = 100,
  }: {
    baseValue: number;
    treatedValue: number;
    colors: { base: string; treated: string; bg: string };
    total?: number;
  }) => {
    const baseCount = Math.round((baseValue / 100) * total);
    const treatedCount = Math.round((treatedValue / 100) * total);

    // Determine grid layout and square size based on total
    let gridCols, gridSize, squareSize;
    if (total === 100) {
      gridCols = 10;
      gridSize = "w-40 h-40";
      squareSize = "rounded-[2px]";
    } else if (total === 1000) {
      gridCols = 32;
      gridSize = "w-96 h-96";
      squareSize = "rounded-[1px]";
    } else if (total === 10000) {
      gridCols = 100;
      gridSize = "w-[32rem] h-[32rem]";
      squareSize = "rounded-[0.5px]";
    }

    const squares = Array.from({ length: total }, (_, i) => {
      let colorClass = colors.bg;
      if (i < treatedCount) {
        colorClass = colors.treated;
      } else if (i < baseCount) {
        colorClass = colors.base;
      }
      return (
        <div key={i} className={`w-full h-full ${squareSize} ${colorClass}`} />
      );
    });

    return (
      <div
        className={`grid gap-[1px] ${gridSize} p-1 border rounded-md bg-gray-50 shrink-0`}
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        {squares}
      </div>
    );
  }
);

// ---------------------------------------------------------------------------
// PDF export helpers
// ---------------------------------------------------------------------------
// Hex equivalents of the Tailwind classes used by WaffleChart on screen, so
// the exported PDF can redraw the same icon arrays as native vector
// rectangles (crisp at any zoom, tiny file size) instead of rasterizing a
// screenshot of the page.
const PDF_COLOR_HEX: Record<string, string> = {
  "bg-blue-300": "#93c5fd",
  "bg-blue-600": "#2563eb",
  "bg-red-300": "#fca5a5",
  "bg-red-600": "#dc2626",
  "bg-orange-300": "#fdba74",
  "bg-orange-600": "#ea580c",
  "bg-purple-300": "#d8b4fe",
  "bg-purple-600": "#9333ea",
  "bg-gray-200": "#e5e7eb",
};

// Mirrors the `waffleColors` map used in the on-screen patient view.
const PDF_WAFFLE_COLORS: Record<
  string,
  { base: string; treated: string; bg: string }
> = {
  krfe: { base: "bg-blue-300", treated: "bg-blue-600", bg: "bg-gray-200" },
  cvd: { base: "bg-red-300", treated: "bg-red-600", bg: "bg-gray-200" },
  ascvd: { base: "bg-orange-300", treated: "bg-orange-600", bg: "bg-gray-200" },
  hf: { base: "bg-purple-300", treated: "bg-purple-600", bg: "bg-gray-200" },
  kdigoCvd: { base: "bg-red-300", treated: "bg-red-600", bg: "bg-gray-200" },
  kdigoCkd: {
    base: "bg-orange-300",
    treated: "bg-orange-600",
    bg: "bg-gray-200",
  },
};

// Icon-array box size (pt) scaled to the requested denominator, so cells
// stay legible whether showing 100, 1,000, or 10,000 icons — mirrors how
// the on-screen WaffleChart grows its container for denser grids.
function waffleBoxSize(total: number, scale: number = 1): number {
  const base = total === 100 ? 150 : total === 1000 ? 270 : 400;
  return base * scale;
}

// Draws one icon array (waffle chart) directly as vector shapes at (x, y)
// inside a boxSize×boxSize square, on a light card background, and returns
// the total height used (including the card). At the default denominator
// (100) every icon is drawn individually with a small rounded corner and a
// visible gap, so it genuinely reads as 100 discrete units. At denser
// denominators (1,000 / 10,000) cells are drawn as merged same-color runs
// per row for performance — cell color is monotonic along the row-major
// index (treated, then base, then background), so each row has at most 3
// runs, keeping a 10,000-cell chart to a few hundred draw calls.
function drawPdfWaffleChart(
  doc: jsPDF,
  x: number,
  y: number,
  boxSize: number,
  baseValue: number,
  treatedValue: number,
  total: number,
  colors: { base: string; treated: string; bg: string }
): number {
  const baseCount = Math.round((baseValue / 100) * total);
  const treatedCount = Math.round((treatedValue / 100) * total);
  const gridCols = total === 100 ? 10 : total === 1000 ? 32 : 100;
  const gridRows = Math.ceil(total / gridCols);
  const gapRatio = total === 100 ? 0.16 : 0.06;
  const cell = boxSize / (gridCols + (gridCols - 1) * gapRatio);
  const gap = cell * gapRatio;
  const gridHeight = gridRows * (cell + gap) - gap;
  const pad = 10;

  // Card background behind the grid, matching the on-screen bg-gray-50 tile.
  // The card's own top-left is exactly (x, y) — it must not extend above
  // or left of the anchor point, since the caller has already reserved
  // exactly (boxSize + 2*pad) height starting at y for this chart.
  doc.setFillColor("#f9fafb");
  doc.setDrawColor("#e5e7eb");
  doc.setLineWidth(0.6);
  doc.roundedRect(x, y, boxSize + pad * 2, gridHeight + pad * 2, 4, 4, "FD");

  const gridX = x + pad;
  const gridY = y + pad;

  const colorAt = (i: number) =>
    i < treatedCount ? colors.treated : i < baseCount ? colors.base : colors.bg;

  // Always draw every icon individually (not merged runs) so the chart
  // reads as discrete units at every denominator, not a solid bar.
  const r = Math.min(cell * 0.22, 1.6);
  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / gridCols);
    const col = i % gridCols;
    const rx = gridX + col * (cell + gap);
    const ry = gridY + row * (cell + gap);
    doc.setFillColor(PDF_COLOR_HEX[colorAt(i)] || "#e5e7eb");
    if (total <= 1000) {
      doc.roundedRect(rx, ry, cell, cell, r, r, "F");
    } else {
      // At 10,000 icons a rounded-corner draw per cell roughly doubles
      // render time for a barely-visible effect — plain squares instead.
      doc.rect(rx, ry, cell, cell, "F");
    }
  }
  doc.setDrawColor("#000000");
  return gridHeight + pad * 2;
}

// Builds the compact "Patient Data" rows shown at the top of the PDF —
// whichever fields are actually relevant to the active tab and input mode,
// skipping anything left blank.
function getPatientDataRows(
  tab: "krfe" | "prevent" | "kdigo",
  mode: "calculate" | "manual",
  data: Record<string, any>,
  manual: Record<string, any>,
  labels: Record<string, string>
): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const add = (label: string, value?: string | null) => {
    if (value === undefined || value === null || value === "") return;
    rows.push({ label, value });
  };

  if (mode === "manual") {
    if (tab === "krfe") {
      add("2-Year Kidney Failure Risk", manual.krfe2Year && `${manual.krfe2Year}%`);
      add("5-Year Kidney Failure Risk", manual.krfe5Year && `${manual.krfe5Year}%`);
    } else if (tab === "prevent") {
      add("10-Year CVD Risk", manual.cvd && `${manual.cvd}%`);
      add("10-Year ASCVD Risk", manual.ascvd && `${manual.ascvd}%`);
      add("10-Year Heart Failure Risk", manual.hf && `${manual.hf}%`);
      add("30-Year CVD Risk", manual.cvd30 && `${manual.cvd30}%`);
      add("30-Year ASCVD Risk", manual.ascvd30 && `${manual.ascvd30}%`);
      add("30-Year Heart Failure Risk", manual.hf30 && `${manual.hf30}%`);
    } else {
      add("CVD Mortality Risk", manual.kdigoCvd && `${manual.kdigoCvd}%`);
      add("CKD Progression Risk", manual.kdigoCkd && `${manual.kdigoCkd}%`);
    }
    return rows;
  }

  if (tab === "krfe" || tab === "prevent") {
    add(labels.age, data.age && `${data.age} yrs`);
    add(
      labels.sex,
      data.sex && data.sex.charAt(0).toUpperCase() + data.sex.slice(1)
    );
  }
  add(labels.eGFR, data.eGFR && `${data.eGFR} mL/min/1.73m²`);
  if (tab === "krfe" || tab === "kdigo" || data.uACR) {
    add(labels.uACR, data.uACR && `${data.uACR} mg/g`);
  }
  if (tab === "krfe") {
    add(labels.calcium, data.calcium && `${data.calcium} mg/dL`);
    add(labels.phosphate, data.phosphate && `${data.phosphate} mg/dL`);
    add(labels.albumin, data.albumin && `${data.albumin} g/dL`);
    add(labels.bicarbonate, data.bicarbonate && `${data.bicarbonate} mEq/L`);
  }
  if (tab === "prevent") {
    add(labels.sbp, data.sbp && `${data.sbp} mmHg`);
    add(
      labels.totalCholesterol,
      data.totalCholesterol && `${data.totalCholesterol} mg/dL`
    );
    add(
      labels.hdlCholesterol,
      data.hdlCholesterol && `${data.hdlCholesterol} mg/dL`
    );
    add(labels.bmi, data.bmi && `${data.bmi} kg/m²`);
    add("Diabetes", data.diabetes ? "Yes" : "No");
    add("Current smoker", data.smoking ? "Yes" : "No");
    add("On anti-hypertensive therapy", data.onAntihypertensive ? "Yes" : "No");
    add("On statin", data.onStatin ? "Yes" : "No");
    add(labels.hba1c, data.a1c && `${data.a1c}%`);
    add("ZIP code", data.zipCode || null);
  }
  return rows;
}

// Short, plain-language reminder that a risk number is an estimate, not a
// certainty for this individual. Shown alongside patient-facing risk figures
// per Winton Centre risk-communication guidance (uncertainty should always
// accompany a point estimate).
const EstimateCaveat = memo(
  ({ variant = "risk" }: { variant?: "risk" | "medication" }) => (
    <p className="text-xs text-gray-500 italic mt-2">
      {variant === "medication"
        ? "This is an estimate based on the average results seen in research studies of this medication. Your own results could be higher or lower."
        : "This is an estimate based on people with similar health information in research studies. Your own risk could be a little higher or lower."}
    </p>
  )
);

// Autonomy / shared decision-making banner shown once at the top of the
// patient-facing results view, in line with the framing used in NHS/Winton
// Centre decision aids ("it's your choice", "you don't have to decide now").
// Collapsible so it doesn't eat space once a patient/doctor has read it.
const PatientDecisionNote = memo(() => {
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-gray-700">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className={collapsed ? "" : "mr-3"}>
          These numbers come from research on large groups of people.
        </span>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 shrink-0 text-indigo-400" />
        ) : (
          <ChevronUp className="w-4 h-4 shrink-0 text-indigo-400" />
        )}
      </button>
      {!collapsed && (
        <p className="px-4 pb-4 -mt-2">
          They're meant to help you and your doctor talk through whether
          treatment is right for you — not to tell you what to do. You don't
          have to decide right away, and choosing not to start a medication is
          always a reasonable option.
        </p>
      )}
    </div>
  );
});

// Improved Modal Component
const InfoModal = ({
  show,
  title,
  content,
  inputExplanations,
  onClose,
  patientMode = false,
  formulaTabs = null,
}: {
  show: boolean;
  title: string;
  content: string | null;
  inputExplanations: Record<string, { why: string; how: string }> | null;
  onClose: () => void;
  patientMode?: boolean;
  formulaTabs?: FormulaTab[] | null;
}) => {
  const [activeModel, setActiveModel] = React.useState<string>("");
  const [activeTab, setActiveTab] = React.useState<"why" | "how">("why");
  const [activeFormulaTab, setActiveFormulaTab] = React.useState<string>("");

  React.useEffect(() => {
    if (show && inputExplanations) {
      const models = Object.keys(inputExplanations);
      setActiveModel(models[0] ?? "");
      setActiveTab("why");
    }
    if (show && formulaTabs && formulaTabs.length > 0) {
      setActiveFormulaTab(formulaTabs[0].id);
    }
  }, [show, inputExplanations, formulaTabs]);

  if (!show) return null;

  const isFormula =
    (content !== null || !!formulaTabs) &&
    title.toLowerCase().includes("formula");

  const renderText = (text: string) => (
    <div className="text-gray-700 leading-relaxed space-y-3">
      {text
        .split("\n")
        .map((para, i) => (para.trim() ? <p key={i}>{para}</p> : null))}
    </div>
  );

  const modelColors: Record<string, { tab: string; badge: string }> = {
    KFRE: {
      tab: "bg-blue-600 text-white",
      badge: "bg-blue-100 text-blue-800 border-blue-300",
    },
    PREVENT: {
      tab: "bg-red-600 text-white",
      badge: "bg-red-100 text-red-800 border-red-300",
    },
    KDIGO: {
      tab: "bg-amber-600 text-white",
      badge: "bg-amber-100 text-amber-800 border-amber-300",
    },
  };
  const inactiveTabClass =
    "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] shadow-2xl border border-gray-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 rounded-t-2xl shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              {isFormula ? (
                <BookOpen className="w-5 h-5 text-purple-600" />
              ) : (
                <Info className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500">
                {patientMode
                  ? "Plain-language explanation"
                  : inputExplanations
                  ? "Clinical context and statistical implementation"
                  : isFormula
                  ? "Mathematical formulation and implementation details"
                  : "Parameter explanation and clinical context"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Input variable: model tabs + Why/How */}
        {inputExplanations &&
          (() => {
            const models = Object.keys(inputExplanations);
            const current = inputExplanations[activeModel];
            return (
              <>
                {/* Model tabs — shown only when variable appears in >1 model */}
                {models.length > 1 && (
                  <div className="flex items-center gap-2 px-6 pt-4 pb-0 shrink-0">
                    <span className="text-xs font-semibold text-gray-500 mr-1">
                      Model:
                    </span>
                    {models.map((m) => {
                      const isActive = m === activeModel;
                      const colors = modelColors[m] ?? {
                        tab: "bg-purple-600 text-white",
                        badge: "",
                      };
                      return (
                        <button
                          key={m}
                          onClick={() => setActiveModel(m)}
                          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                            isActive ? colors.tab : inactiveTabClass
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Why / How toggle */}
                <div className="flex items-center gap-2 px-6 pt-4 pb-3 border-b border-gray-100 shrink-0">
                  <span className="text-xs font-semibold text-gray-500 mr-1">
                    View:
                  </span>
                  <button
                    onClick={() => setActiveTab("why")}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      activeTab === "why"
                        ? "bg-purple-600 text-white"
                        : inactiveTabClass
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    Why it matters
                  </button>
                  <button
                    onClick={() => setActiveTab("how")}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      activeTab === "how"
                        ? "bg-purple-600 text-white"
                        : inactiveTabClass
                    }`}
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    How it's used
                  </button>
                  {/* Badge when only 1 model */}
                  {models.length === 1 &&
                    (() => {
                      const m = models[0];
                      const colors = modelColors[m] ?? {
                        badge: "bg-gray-100 text-gray-700 border-gray-300",
                      };
                      return (
                        <span
                          className={`ml-auto px-3 py-1 rounded-full text-xs font-bold border ${colors.badge}`}
                        >
                          {m}
                        </span>
                      );
                    })()}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                  {current ? (
                    renderText(activeTab === "why" ? current.why : current.how)
                  ) : (
                    <p className="text-gray-400 text-sm">
                      No content available.
                    </p>
                  )}
                </div>
              </>
            );
          })()}

        {/* Formula reference: tab bar + selected tab's content */}
        {formulaTabs && formulaTabs.length > 0 && (
          <>
            <div className="flex items-center gap-2 px-6 pt-4 pb-3 border-b border-gray-100 shrink-0 flex-wrap">
              {formulaTabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveFormulaTab(t.id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    activeFormulaTab === t.id
                      ? "bg-purple-600 text-white"
                      : inactiveTabClass
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed bg-gray-50 p-4 rounded-lg border overflow-x-auto">
                {formulaTabs.find((t) => t.id === activeFormulaTab)
                  ?.content ?? "No content available."}
              </pre>
            </div>
          </>
        )}

        {/* Formula / output: plain content */}
        {content !== null && !formulaTabs && (
          <div className="p-6 overflow-y-auto flex-1">
            {isFormula ? (
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed bg-gray-50 p-4 rounded-lg border overflow-x-auto">
                {content}
              </pre>
            ) : (
              <div className="text-gray-700 leading-relaxed space-y-3">
                {content.split("\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-400">
              {patientMode
                ? "Ask your doctor or care team if you'd like more detail."
                : inputExplanations
                ? "Based on published PREVENT, KFRE, and KDIGO equations"
                : isFormula
                ? "Equations as published in peer-reviewed literature"
                : "Clinical parameter information"}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Evidence Modal Component
const EvidenceModal = ({
  show,
  data,
  onClose,
}: {
  show: boolean;
  data: any;
  onClose: () => void;
}) => {
  if (!show || !data) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-purple-50 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{data.title}</h2>
              <p className="text-sm text-gray-600 font-medium">
                {data.question}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors duration-200 group"
          >
            <X className="w-6 h-6 text-gray-500 group-hover:text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Meta-analysis Image */}
            <div className="flex justify-center bg-gray-50 rounded-lg p-4">
              <img
                src={data.image}
                alt={data.title}
                className="max-w-full h-auto rounded border shadow-lg"
                style={{ maxHeight: "500px" }}
              />
            </div>

            {/* Caption */}
            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
              <h3 className="font-semibold text-purple-900 mb-2">
                Figure Caption
              </h3>
              <p className="text-sm text-purple-800 leading-relaxed">
                {data.caption}
              </p>
            </div>

            {/* Reference */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Reference</h3>
              <p className="text-sm text-gray-700 mb-2">{data.reference}</p>
              <a
                href={data.doi}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 underline text-sm font-medium"
              >
                Read Original Paper →
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Meta-analysis evidence from peer-reviewed literature
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClinicalRiskCalculator = () => {
  const [activeTab, setActiveTab] = useState<
    "krfe" | "prevent" | "kdigo" | "learn" | "about" | "specifications"
  >("krfe");
  const [showInfoModal, setShowInfoModal] = useState<{
    show: boolean;
    title: string;
    content: string | null;
    inputExplanations: Record<string, { why: string; how: string }> | null;
    patientMode?: boolean;
    formulaTabs?: FormulaTab[] | null;
  }>({
    show: false,
    title: "",
    content: null,
    inputExplanations: null,
    patientMode: false,
    formulaTabs: null,
  });
  const [showEvidenceModal, setShowEvidenceModal] = useState<{
    show: boolean;
    data: any;
  }>({ show: false, data: null });
  const [activeLearnTab, setActiveLearnTab] = useState<
    | "ckm"
    | "gdmt"
    | "sglt2i"
    | "glp1ra"
    | "nsmra"
    | "krfe"
    | "prevent"
    | "kdigo"
  >("ckm");
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  const [inputsCollapsed, setInputsCollapsed] = useState(false);
  const [outputsCollapsed, setOutputsCollapsed] = useState(false);
  // Per-outcome accordion state for the patient view (each risk panel, and
  // each panel's "Medication Impact" sub-section, can be collapsed
  // independently). Keyed by a stable id per outcome, e.g. "krfe-main",
  // "prevent-cvd", "kdigo-ckd".
  const [collapsedOutcomes, setCollapsedOutcomes] = useState<
    Record<string, boolean>
  >({});
  const [collapsedMedImpact, setCollapsedMedImpact] = useState<
    Record<string, boolean>
  >({});
  const toggleOutcome = useCallback((id: string) => {
    setCollapsedOutcomes((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);
  const toggleMedImpact = useCallback((id: string) => {
    setCollapsedMedImpact((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);
  const [viewMode, setViewMode] = useState<"clinician" | "patient">(
    "clinician"
  );
  const [applyGdmt, setApplyGdmt] = useState(false);
  const [waffleScale, setWaffleScale] = useState<100 | 1000 | 10000>(100);
  // Which PREVENT time horizon is currently displayed / has GDMT applied to it.
  const [preventPeriod, setPreventPeriod] = useState<"10" | "30">("10");
  const [inputMode, setInputMode] = useState<"calculate" | "manual">(
    "calculate"
  );
  const [manualRisks, setManualRisks] = useState({
    krfe2Year: "",
    krfe5Year: "",
    cvd: "",
    ascvd: "",
    hf: "",
    cvd30: "",
    ascvd30: "",
    hf30: "",
    kdigoCvd: "",
    kdigoCkd: "",
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, { message: string; severity: "soft" | "hard" } | null>
  >({});

  // Default hazard ratios from literature
  const defaultHazardRatios = {
    sglt2i: { cvd: 0.87, hf: 0.7, ckd: 0.63 },
    glp1ra: { cvd: 0.82, hf: null, ckd: 0.79 },
    nsmra: { cvd: 0.86, hf: 0.78, ckd: 0.77 },
  };

  // Custom hazard ratios state (null means use default)
  const [customHazardRatios, setCustomHazardRatios] = useState({
    sglt2i: { cvd: null, hf: null, ckd: null },
    glp1ra: { cvd: null, hf: null, ckd: null },
    nsmra: { cvd: null, hf: null, ckd: null },
  });

  // Get effective hazard ratios (custom if set, otherwise default)
  const getEffectiveHazardRatios = () => {
    return {
      sglt2i: {
        cvd: customHazardRatios.sglt2i.cvd ?? defaultHazardRatios.sglt2i.cvd,
        hf: customHazardRatios.sglt2i.hf ?? defaultHazardRatios.sglt2i.hf,
        ckd: customHazardRatios.sglt2i.ckd ?? defaultHazardRatios.sglt2i.ckd,
      },
      glp1ra: {
        cvd: customHazardRatios.glp1ra.cvd ?? defaultHazardRatios.glp1ra.cvd,
        hf: customHazardRatios.glp1ra.hf ?? defaultHazardRatios.glp1ra.hf,
        ckd: customHazardRatios.glp1ra.ckd ?? defaultHazardRatios.glp1ra.ckd,
      },
      nsmra: {
        cvd: customHazardRatios.nsmra.cvd ?? defaultHazardRatios.nsmra.cvd,
        hf: customHazardRatios.nsmra.hf ?? defaultHazardRatios.nsmra.hf,
        ckd: customHazardRatios.nsmra.ckd ?? defaultHazardRatios.nsmra.ckd,
      },
    };
  };

  // Check if any custom HRs are being used
  const hasCustomHR = (medication, outcome) => {
    return customHazardRatios[medication]?.[outcome] !== null;
  };

  // Custom HR Notification Component
  const CustomHRNotification = ({ medications }) => {
    const customMeds = medications.filter((med) =>
      hasCustomHR(med.key, med.outcome)
    );

    if (customMeds.length === 0) return null;

    return (
      <div className="mb-4">
        {customMeds.map((med) => (
          <button
            key={`${med.key}-${med.outcome}`}
            onClick={() => setActiveTab("specifications")}
            className="w-full mb-2 p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <span className="text-sm text-purple-900">
              User-inputted custom hazard ratio is being applied for {med.name}{" "}
              (click to edit)
            </span>
          </button>
        ))}
      </div>
    );
  };

  // Human-readable labels for each input key
  const inputLabels: Record<string, string> = {
    age: "Age",
    sex: "Sex",
    eGFR: "eGFR",
    uACR: "Urine ACR (uACR)",
    albumin: "Serum Albumin",
    phosphate: "Serum Phosphate",
    bicarbonate: "Serum Bicarbonate",
    calcium: "Serum Calcium",
    totalCholesterol: "Total Cholesterol",
    hdlCholesterol: "HDL Cholesterol",
    sbp: "Systolic Blood Pressure",
    diabetes: "Diabetes",
    smoking: "Current Smoking",
    bmi: "BMI",
    onAntihypertensive: "Anti-hypertensive Use",
    onStatin: "Statin Use",
    hba1c: "HbA1c",
    sdi: "Social Deprivation Index (SDI)",
  };

  const handleInfoClick = useCallback(
    (type: "input" | "output" | "formula", key: string) => {
      const isPatientView = viewMode === "patient";

      if (type === "input") {
        // Patient view: prefer a single plain-language paragraph over the
        // clinician-level why/how tabs, when we have one for this variable.
        if (isPatientView) {
          const patientText = (explanations as any).patientInputs?.[key];
          if (patientText) {
            setShowInfoModal({
              show: true,
              title: inputLabels[key] ?? key,
              content: patientText,
              inputExplanations: null,
              patientMode: true,
            });
            return;
          }
        }

        const rawData = (explanations.inputs as any)[key];
        if (rawData && typeof rawData === "object") {
          // New structured format: { MODEL: { why, how } }
          const inputExplanations: Record<
            string,
            { why: string; how: string }
          > = {};
          for (const [model, data] of Object.entries(
            rawData as Record<string, any>
          )) {
            inputExplanations[model] = {
              why: (data.why || "").replace(/\\n/g, "\n"),
              how: (data.how || "").replace(/\\n/g, "\n"),
            };
          }
          setShowInfoModal({
            show: true,
            title: inputLabels[key] ?? key,
            content: null,
            inputExplanations,
            patientMode: false,
          });
        } else {
          // Fallback: plain string (legacy)
          setShowInfoModal({
            show: true,
            title: `About ${key.charAt(0).toUpperCase() + key.slice(1)}`,
            content: rawData ?? "",
            inputExplanations: null,
            patientMode: false,
          });
        }
      } else if (type === "output") {
        const patientText = isPatientView
          ? (explanations as any).patientOutputs?.[key]
          : null;
        const content =
          patientText ?? (explanations.outputs as any)[key] ?? "";
        setShowInfoModal({
          show: true,
          title: `About ${key.toUpperCase()} Results`,
          content,
          inputExplanations: null,
          patientMode: isPatientView,
        });
      } else {
        // formula — technical equation reference; not offered in patient
        // view (the "Formula" trigger button is hidden there), but keep
        // this branch safe regardless of caller. PREVENT and KFRE ship as
        // arrays of {id,label,content} tabs so the modal can render a tab
        // bar instead of one long scrolling document.
        if (key === "prevent" || key === "krfe") {
          const tabs = key === "prevent" ? preventFormulaTabs : kfreFormulaTabs;
          const title =
            key === "prevent"
              ? "PREVENT Formula Reference"
              : "KFRE Formula Reference";
          setShowInfoModal({
            show: true,
            title,
            content: null,
            inputExplanations: null,
            patientMode: false,
            formulaTabs: tabs,
          });
        } else {
          const content = (explanations.formulas as any)[key] ?? "";
          setShowInfoModal({
            show: true,
            title: `Formula Details for ${key.toUpperCase()}`,
            content,
            inputExplanations: null,
            patientMode: false,
            formulaTabs: null,
          });
        }
      }
    },
    [viewMode]
  );

  const handleEvidenceClick = useCallback(
    (
      medication: "sglt2i" | "glp1ra" | "nsmra",
      outcome: "cvd" | "hf" | "ckd"
    ) => {
      const evidenceData = explanations.evidence[medication][outcome];
      setShowEvidenceModal({ show: true, data: evidenceData });
    },
    []
  );

  const renderLearnSubTab = useCallback(
    (
      tabId:
        | "ckm"
        | "gdmt"
        | "sglt2i"
        | "glp1ra"
        | "nsmra"
        | "krfe"
        | "prevent"
        | "kdigo"
    ) => {
      const tabData = explanations.learn[tabId];

      return (
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {tabData.title}
            </h2>
          </div>

          <div className="space-y-6">
            {Object.entries(tabData.sections).map(([key, section]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {section.title}
                </h3>
                <div className="text-sm text-gray-700 mb-4 whitespace-pre-line leading-relaxed">
                  {section.content}
                </div>
                {section.source && (
                  <div className="text-xs text-purple-600 border-t border-gray-200 pt-3">
                    <span className="font-medium">Source:</span>{" "}
                    {section.source}
                    {section.doi && (
                      <div className="mt-1">
                        {section.doi.split(";").map((doi, index) => (
                          <a
                            key={index}
                            href={doi.trim()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-purple-800 mr-3"
                          >
                            View Guidelines {index + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    },
    []
  );

  const initialPatientData = useMemo(
    () => ({
      age: "",
      sex: "",
      eGFR: "",
      uACR: "",
      sbp: "",
      totalCholesterol: "",
      hdlCholesterol: "",
      diabetes: false,
      smoking: false,
      bmi: "",
      onAntihypertensive: false,
      onStatin: false,
      calcium: "",
      phosphate: "",
      albumin: "",
      bicarbonate: "",
      a1c: "",
      zipCode: "",
    }),
    []
  );

  const [formState, setFormState] = useState(initialPatientData);
  const [calculationState, setCalculationState] = useState(initialPatientData);

  const validateInput = useCallback(
    (
      name: string,
      value: string
    ): { message: string; severity: "soft" | "hard" } | null => {
      if (
        value === "" ||
        !validationConfig[name as keyof typeof validationConfig]
      ) {
        return null;
      }
      const numValue = parseFloat(value);
      const { softMin, hardMin, softMax, hardMax } =
        validationConfig[name as keyof typeof validationConfig];

      if (numValue < hardMin)
        return {
          message: `Input is physiologically impossible.`,
          severity: "hard",
        };
      if (numValue > hardMax)
        return {
          message: `Input is physiologically impossible.`,
          severity: "hard",
        };
      if (numValue < softMin)
        return {
          message: `Input is unusually low. Please check.`,
          severity: "soft",
        };
      if (numValue > softMax)
        return {
          message: `Input is unusually high. Please check.`,
          severity: "soft",
        };

      return null;
    },
    []
  );

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericRegex = /^\d*\.?\d*$/;
    if (numericRegex.test(value) || value === "") {
      setFormState((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleInputBlur = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setCalculationState((prev) => ({ ...prev, [name]: value }));
      const error = validateInput(name, value);
      setValidationErrors((prev) => ({ ...prev, [name]: error }));
    },
    [validateInput]
  );

  const handleToggleChange = useCallback((name: string, value: boolean) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
    setCalculationState((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSexChange = useCallback((value: string) => {
    setFormState((prev) => ({ ...prev, sex: value }));
    setCalculationState((prev) => ({ ...prev, sex: value }));
  }, []);

  const handleManualRiskChange = useCallback((field: string, value: string) => {
    setManualRisks((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetAllData = useCallback(() => {
    setFormState(initialPatientData);
    setCalculationState(initialPatientData);
    setValidationErrors({});
    setInputMode("calculate");
    setManualRisks({
      krfe2Year: "",
      krfe5Year: "",
      cvd: "",
      ascvd: "",
      hf: "",
      kdigoCvd: "",
      kdigoCkd: "",
    });
  }, [initialPatientData]);

  // --- Simulate: fill inputs with random-but-valid values and calculate ---
  const zipSdiKeys = useMemo(() => Object.keys(zipSdiDecile), []);

  const simulateRandomData = useCallback(() => {
    // Random helpers, all bounded by each field's "soft" (clinically
    // plausible) range so the simulated patient never trips a validation
    // warning. Numeric fields are additionally biased toward the
    // higher-risk 2/3 of that range (rather than sampled uniformly across
    // the whole range), since the simulator is meant to demo what a
    // higher-risk patient's results look like, not a low-risk one.
    // "worseDirection" says which end of the range is clinically worse:
    // "high" = larger numbers are worse (e.g. blood pressure), "low" =
    // smaller numbers are worse (e.g. eGFR).
    const randWorseRange = (
      min: number,
      max: number,
      worseDirection: "high" | "low"
    ) => {
      const span = max - min;
      const worseCut = span / 3; // exclude the "better" 1/3 of the range
      return worseDirection === "high"
        ? min + worseCut + Math.random() * (span - worseCut)
        : min + Math.random() * (span - worseCut);
    };
    const randInt = (
      min: number,
      max: number,
      worseDirection: "high" | "low" = "high"
    ) => Math.round(randWorseRange(min, max, worseDirection)).toString();
    const randDecimal = (
      min: number,
      max: number,
      worseDirection: "high" | "low" = "high",
      places = 1
    ) => randWorseRange(min, max, worseDirection).toFixed(places);
    const chance = (probability: number) => Math.random() < probability;
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    const cfg = validationConfig;
    const sex = pick(["male", "female"]);

    const simulated: typeof initialPatientData = {
      ...initialPatientData,
      sex,
      // Older age carries more overall CV/kidney risk burden.
      age: randInt(cfg.age.softMin, cfg.age.softMax, "high"),
      // Lower eGFR = worse kidney function.
      eGFR: randInt(cfg.eGFR.softMin, cfg.eGFR.softMax, "low"),
    };

    if (activeTab === "krfe") {
      // Higher uACR (more albuminuria) = worse.
      simulated.uACR = randInt(cfg.uACR.softMin, 1000, "high");
      // Sometimes simulate the full 8-variable model, sometimes leave it
      // as the 4-variable model, so both code paths get exercised.
      if (chance(0.6)) {
        // Lower calcium/albumin/bicarbonate and higher phosphate all
        // indicate more advanced CKD.
        simulated.calcium = randDecimal(
          cfg.calcium.softMin,
          cfg.calcium.softMax,
          "low"
        );
        simulated.phosphate = randDecimal(
          cfg.phosphate.softMin,
          cfg.phosphate.softMax,
          "high"
        );
        simulated.albumin = randDecimal(
          cfg.albumin.softMin,
          cfg.albumin.softMax,
          "low"
        );
        simulated.bicarbonate = randInt(
          cfg.bicarbonate.softMin,
          cfg.bicarbonate.softMax,
          "low"
        );
      }
    } else if (activeTab === "prevent") {
      // Higher SBP, total cholesterol, and BMI are all worse; lower HDL
      // ("good" cholesterol) is worse.
      simulated.sbp = randInt(cfg.sbp.softMin, cfg.sbp.softMax, "high");
      simulated.totalCholesterol = randInt(
        cfg.totalCholesterol.softMin,
        cfg.totalCholesterol.softMax,
        "high"
      );
      simulated.hdlCholesterol = randInt(
        cfg.hdlCholesterol.softMin,
        cfg.hdlCholesterol.softMax,
        "low"
      );
      simulated.bmi = randDecimal(cfg.bmi.softMin, cfg.bmi.softMax, "high");
      // Bias risk-factor prevalence upward too, consistent with modeling a
      // higher-risk example patient rather than a uniformly random one.
      simulated.diabetes = chance(0.55);
      simulated.smoking = chance(0.45);
      simulated.onAntihypertensive = chance(0.4);
      simulated.onStatin = chance(0.35);
      // Optional enhancement variables — randomly include each so both the
      // base and enhanced PREVENT models get exercised.
      if (chance(0.7)) simulated.uACR = randInt(cfg.uACR.softMin, 1000, "high");
      if (chance(0.6))
        simulated.a1c = randDecimal(cfg.a1c.softMin, cfg.a1c.softMax, "high");
      if (chance(0.6) && zipSdiKeys.length > 0) {
        simulated.zipCode = pick(zipSdiKeys);
      }
    } else if (activeTab === "kdigo") {
      simulated.uACR = randInt(cfg.uACR.softMin, 1000, "high");
    }

    setInputMode("calculate");
    setFormState(simulated);
    setCalculationState(simulated);
    setValidationErrors({});
    setInputsCollapsed(false);
    setOutputsCollapsed(false);
  }, [activeTab, initialPatientData, zipSdiKeys]);

  // --- Calculation Logic (KFRE, PREVENT, KDIGO) are unchanged ---
  const calculateKFRE = useCallback((data: typeof calculationState) => {
    const { age, eGFR, uACR, sex, calcium, phosphate, albumin, bicarbonate } =
      data;
    const has8VarInputs =
      age &&
      eGFR &&
      uACR &&
      sex &&
      calcium &&
      phosphate &&
      albumin &&
      bicarbonate;
    const has4VarInputs = age && eGFR && uACR && sex;
    if (!has4VarInputs) return null;
    let twoYearRisk: number, fiveYearRisk: number;
    if (has8VarInputs) {
      const coeffs = {
        male: 0.16117,
        age: -0.19883,
        eGFR: -0.4936,
        ACR: 0.35066,
        calcium: -0.22129,
        phosphate: 0.24197, // corrected from 0.3204
        albumin: -0.33867, // corrected from -0.0805
        bicarbonate: -0.07429, // corrected from -0.03852
      };
      const means = {
        male: 0.5642,
        age: 7.0355,
        eGFR: 7.2216,
        ACR: 5.2774,
        calcium: 9.351,
        phosphate: 3.9221, // corrected from 4.445
        albumin: 3.9925, // corrected from 38.3 (g/dL, no unit conversion)
        bicarbonate: 25.5441, // corrected from 23.3
      };
      const transformed = {
        male: sex === "male" ? 1 : 0,
        age: parseFloat(age) / 10,
        eGFR: parseFloat(eGFR) / 5,
        ACR: Math.log(parseFloat(uACR)),
        calcium: parseFloat(calcium),
        phosphate: parseFloat(phosphate),
        albumin: parseFloat(albumin), // corrected: g/dL directly, no * 10
        bicarbonate: parseFloat(bicarbonate),
      };
      const linearPredictor =
        coeffs.male * (transformed.male - means.male) +
        coeffs.age * (transformed.age - means.age) +
        coeffs.eGFR * (transformed.eGFR - means.eGFR) +
        coeffs.ACR * (transformed.ACR - means.ACR) +
        coeffs.calcium * (transformed.calcium - means.calcium) +
        coeffs.phosphate * (transformed.phosphate - means.phosphate) +
        coeffs.albumin * (transformed.albumin - means.albumin) +
        coeffs.bicarbonate * (transformed.bicarbonate - means.bicarbonate);
      twoYearRisk = 1 - Math.pow(0.976, Math.exp(linearPredictor));
      fiveYearRisk = 1 - Math.pow(0.929, Math.exp(linearPredictor)); // corrected from 0.925
    } else {
      const ageNum = parseFloat(age);
      const egfrNum = parseFloat(eGFR);
      const uacrNum = parseFloat(uACR);
      const sexNum = sex === "male" ? 1 : 0;
      // 4-variable KFRE (Tangri et al.) — centered-means form
      const linearPredictor4 =
        -0.2201 * (ageNum / 10 - 7.036) +
        0.2467 * (sexNum - 0.5642) +
        -0.5567 * (egfrNum / 5 - 7.222) +
        0.451 * (Math.log(Math.max(uacrNum, 0.1)) - 5.137);
      twoYearRisk = 1 - Math.pow(0.975, Math.exp(linearPredictor4));
      fiveYearRisk = 1 - Math.pow(0.924, Math.exp(linearPredictor4));
    }
    const twoYear = Math.max(0, Math.min(1, twoYearRisk)) * 100;
    const fiveYear = Math.max(0, Math.min(1, fiveYearRisk)) * 100;
    const riskLevel: "Low" | "Moderate" | "High" =
      twoYearRisk > 0.4 ? "High" : twoYearRisk > 0.1 ? "Moderate" : "Low";
    return { twoYear, fiveYear, riskLevel };
  }, []);
  const calculatePREVENT = useCallback((data: typeof calculationState) => {
    if (
      !data.age ||
      !data.sbp ||
      !data.totalCholesterol ||
      !data.hdlCholesterol ||
      !data.sex
    )
      return null;

    const age = parseFloat(data.age);
    const sbp = parseFloat(data.sbp);
    const tc = parseFloat(data.totalCholesterol);
    const hdl = parseFloat(data.hdlCholesterol);
    const egfr = parseFloat(data.eGFR || "90");
    const bmi = parseFloat(data.bmi || "25");
    const sex = data.sex;

    // ── Optional enhanced-variable inputs ────────────────────────────────────
    const uacr_raw = data.uACR ? parseFloat(data.uACR) : null;
    const a1c_raw = data.a1c ? parseFloat(data.a1c) : null;
    const zip = data.zipCode ? data.zipCode.trim().padStart(5, "0") : null;

    const hasACR = uacr_raw !== null && !isNaN(uacr_raw) && uacr_raw >= 0.1;
    const hasA1c =
      a1c_raw !== null && !isNaN(a1c_raw) && a1c_raw >= 3 && a1c_raw <= 15;
    const hasSDI =
      zip !== null &&
      (zipSdiDecile as Record<string, number>)[zip] !== undefined;
    const nEnhanced = (hasACR ? 1 : 0) + (hasA1c ? 1 : 0) + (hasSDI ? 1 : 0);

    // ── Derived / spline terms (shared across all models) ────────────────────
    const age_t = (age - 55) / 10;
    const nonHDLC_t = (tc - hdl) * 0.02586 - 3.5;
    const HDLC_t = (hdl * 0.02586 - 1.3) / 0.3;
    const sbpLow_t = (Math.min(sbp, 110) - 110) / 20; // ≤ 0
    const sbpHigh_t = (Math.max(sbp, 110) - 130) / 20;
    const egfrLow_t = (Math.min(egfr, 60) - 60) / -15; // ≥ 0 when eGFR < 60
    const egfrHigh_t = (Math.max(egfr, 60) - 90) / -15; // 0 at 90; >0 in 60–90; <0 above 90
    const bmiLow_t = (Math.min(bmi, 30) - 25) / 5; // HF only
    const bmiHigh_t = (Math.max(bmi, 30) - 30) / 5; // HF only
    const dm = data.diabetes ? 1 : 0;
    const smk = data.smoking ? 1 : 0;
    const antihtn = data.onAntihypertensive ? 1 : 0;
    const statin = data.onStatin ? 1 : 0;

    // Interaction terms
    const int_treatSBP = sbpHigh_t * antihtn;
    const int_treatChol = nonHDLC_t * statin;
    const int_ageChol = age_t * nonHDLC_t;
    const int_ageHDL = age_t * HDLC_t;
    const int_ageSBP = age_t * sbpHigh_t;
    const int_ageDM = age_t * dm;
    const int_ageSmk = age_t * smk;
    const int_ageBMI = age_t * bmiHigh_t; // HF only
    const int_ageEGFR = age_t * egfrLow_t;
    const age_t2 = age_t * age_t; // additional term used by the 30-year models

    // SDI lookup
    const sdiDecile = hasSDI
      ? (zipSdiDecile as Record<string, number>)[zip!]
      : null;
    const sdiMid = hasSDI ? (sdiDecile! >= 4 && sdiDecile! <= 6 ? 1 : 0) : 0;
    const sdiHigh = hasSDI ? (sdiDecile! >= 7 ? 1 : 0) : 0;

    // ── Coefficient arrays: [F_CVD, M_CVD, F_ASCVD, M_ASCVD, F_HF, M_HF] ───
    // 0 = term not applicable for that outcome (e.g. nonHDLC not used in HF)

    // ════════════════════════════════════════════════════════════════════════
    // MODEL A — BASE (Table S12A)  ·  used when nEnhanced === 0
    // ════════════════════════════════════════════════════════════════════════
    const A_c = [
      -3.307728, -3.031168, -3.819975, -3.500655, -4.310409, -3.946391,
    ];
    const A_age = [
      0.7939329, 0.7688528, 0.719883, 0.7099847, 0.8998235, 0.8972642,
    ];
    const A_nHDL = [0.0305239, 0.0736174, 0.1176967, 0.1658663, 0, 0];
    const A_HDL = [-0.1606857, -0.0954431, -0.151185, -0.1144285, 0, 0];
    const A_sL = [
      -0.2394003, -0.4347345, -0.0835358, -0.2837212, -0.4559771, -0.6811466,
    ];
    const A_sH = [
      0.3600781, 0.3362658, 0.3592852, 0.3239977, 0.3576505, 0.3634461,
    ];
    const A_dm = [
      0.8667604, 0.7692857, 0.8348585, 0.7189597, 1.038346, 0.923776,
    ];
    const A_smk = [
      0.5360739, 0.4386871, 0.4831078, 0.3956973, 0.583916, 0.5023736,
    ];
    const A_bL = [0, 0, 0, 0, -0.0072294, -0.0485841];
    const A_bH = [0, 0, 0, 0, 0.2997706, 0.3726929];
    const A_eL = [
      0.6045917, 0.5378979, 0.4864619, 0.3690075, 0.7451638, 0.6926917,
    ];
    const A_eH = [
      0.0433769, 0.0164827, 0.0397779, 0.0203619, 0.0557087, 0.0251827,
    ];
    const A_aht = [
      0.3151672, 0.288879, 0.2265309, 0.2036522, 0.3534442, 0.2980922,
    ];
    const A_sta = [-0.1477655, -0.1337349, -0.0592374, -0.0865581, 0, 0];
    const A_tSBP = [
      -0.0663612, -0.0475924, -0.0395762, -0.0322916, -0.0981511, -0.0497731,
    ];
    const A_tCho = [0.1197879, 0.150273, 0.0844423, 0.114563, 0, 0];
    const A_aCho = [-0.0819715, -0.0517874, -0.0567839, -0.0300005, 0, 0];
    const A_aHDL = [0.0306769, 0.0191169, 0.0325692, 0.0232747, 0, 0];
    const A_aSBP = [
      -0.0946348, -0.1049477, -0.1035985, -0.0927024, -0.0946663, -0.1289201,
    ];
    const A_aDM = [
      -0.27057, -0.2251948, -0.2417542, -0.2018525, -0.3581041, -0.3040924,
    ];
    const A_aSmk = [
      -0.078715, -0.0895067, -0.0791142, -0.0970527, -0.1159453, -0.1401688,
    ];
    const A_aBMI = [0, 0, 0, 0, -0.003878, 0.0068126];
    const A_aEGF = [
      -0.1637806, -0.1543702, -0.1671492, -0.1217081, -0.1884289, -0.1797778,
    ];

    // ════════════════════════════════════════════════════════════════════════
    // MODEL B — Enhanced ACR (Table S12B)  ·  used when nEnhanced === 1 && hasACR
    // ════════════════════════════════════════════════════════════════════════
    const B_c = [
      -3.738341, -3.510705, -4.174614, -3.85146, -4.841506, -4.556907,
    ];
    const B_age = [
      0.7969249, 0.7768655, 0.7201999, 0.7141718, 0.9145975, 0.9111795,
    ];
    const B_nHDL = [0.0256635, 0.0659949, 0.1135771, 0.1602194, 0, 0];
    const B_HDL = [-0.1588107, -0.0951111, -0.1493506, -0.1139086, 0, 0];
    const B_sL = [
      -0.2255701, -0.420667, -0.0726677, -0.2719456, -0.4441346, -0.6693649,
    ];
    const B_sH = [
      0.3396649, 0.3120151, 0.3436259, 0.3058719, 0.3260323, 0.3290082,
    ];
    const B_dm = [
      0.8047515, 0.698521, 0.7773094, 0.6600631, 0.9611365, 0.8377655,
    ];
    const B_smk = [
      0.5285338, 0.4314669, 0.4746662, 0.3884022, 0.5755787, 0.4978917,
    ];
    const B_bL = [0, 0, 0, 0, 0.0008831, -0.042749];
    const B_bH = [0, 0, 0, 0, 0.2988964, 0.3624165];
    const B_eL = [
      0.4803511, 0.3841364, 0.3824646, 0.2466316, 0.5915291, 0.5075796,
    ];
    const B_eH = [
      0.0434472, 0.009384, 0.0394178, 0.0151852, 0.0556823, 0.0137716,
    ];
    const B_aht = [
      0.2985207, 0.2676494, 0.2125182, 0.186167, 0.3314097, 0.2739963,
    ];
    const B_sta = [-0.1497787, -0.1390966, -0.0603046, -0.0894395, 0, 0];
    const B_tSBP = [
      -0.0742889, -0.0579315, -0.0466053, -0.0411884, -0.1078596, -0.0645712,
    ];
    const B_tCho = [0.106756, 0.1383719, 0.0733118, 0.1058212, 0, 0];
    const B_aCho = [-0.0778126, -0.0488332, -0.0534262, -0.028089, 0, 0];
    const B_aHDL = [0.0306768, 0.0200406, 0.0325689, 0.0240427, 0, 0];
    const B_aSBP = [
      -0.0907168, -0.102454, -0.0999887, -0.0912325, -0.0875231, -0.1230039,
    ];
    const B_aDM = [
      -0.2705122, -0.2236355, -0.2411762, -0.2004894, -0.356859, -0.3013297,
    ];
    const B_aSmk = [
      -0.0830564, -0.089485, -0.0826941, -0.096936, -0.1220248, -0.1410318,
    ];
    const B_aBMI = [0, 0, 0, 0, -0.0053637, 0.0021531];
    const B_aEGF = [
      -0.1389249, -0.1321848, -0.1444737, -0.1022867, -0.1610389, -0.1548018,
    ];
    const B_lACR = [
      0.1793037, 0.1887974, 0.1501217, 0.1510073, 0.2197281, 0.2306299,
    ];

    // ════════════════════════════════════════════════════════════════════════
    // MODEL C — Enhanced A1c (Table S12C)  ·  used when nEnhanced === 1 && hasA1c
    // ════════════════════════════════════════════════════════════════════════
    const C_c = [
      -3.306162, -3.040901, -3.838746, -3.51835, -4.288225, -3.961954,
    ];
    const C_age = [
      0.7858178, 0.7699177, 0.7111831, 0.7064146, 0.8997391, 0.911787,
    ];
    const C_nHDL = [0.0194438, 0.0605093, 0.106797, 0.1532267, 0, 0];
    const C_HDL = [-0.1521964, -0.0888525, -0.1425745, -0.1082166, 0, 0];
    const C_sL = [
      -0.2296681, -0.417713, -0.0736824, -0.2675288, -0.4422749, -0.6568071,
    ];
    const C_sH = [
      0.3465777, 0.3288657, 0.3480844, 0.3173809, 0.3378691, 0.3524645,
    ];
    const C_dm = [
      0.5366241, 0.4759471, 0.5112951, 0.432604, 0.681284, 0.5849752,
    ];
    const C_smk = [
      0.5411682, 0.4385663, 0.4880292, 0.3958842, 0.5886005, 0.5014014,
    ];
    const C_bL = [0, 0, 0, 0, -0.0148657, -0.0512352];
    const C_bH = [0, 0, 0, 0, 0.2958374, 0.365294];
    const C_eL = [
      0.5931898, 0.5334616, 0.4754997, 0.3665014, 0.73447, 0.6892219,
    ];
    const C_eH = [
      0.0472458, 0.0206431, 0.0438132, 0.0250243, 0.05926, 0.0292377,
    ];
    const C_aht = [
      0.3158567, 0.2917524, 0.2259093, 0.2061158, 0.3543475, 0.3038296,
    ];
    const C_sta = [-0.1535174, -0.1383313, -0.0648872, -0.0899988, 0, 0];
    const C_tSBP = [
      -0.0687752, -0.0482622, -0.0437645, -0.0334959, -0.1002139, -0.0515032,
    ];
    const C_tCho = [0.1054746, 0.1393796, 0.0697082, 0.1034168, 0, 0];
    const C_aCho = [-0.0761119, -0.0463501, -0.0506382, -0.0255406, 0, 0];
    const C_aHDL = [0.0307469, 0.0205926, 0.0327475, 0.0247538, 0, 0];
    const C_aSBP = [
      -0.0905966, -0.1037717, -0.0996442, -0.0917441, -0.0878765, -0.1262343,
    ];
    const C_aDM = [
      -0.2241857, -0.1737697, -0.1924338, -0.1499195, -0.303684, -0.2449514,
    ];
    const C_aSmk = [
      -0.080186, -0.0915839, -0.0803539, -0.098089, -0.1178943, -0.1392217,
    ];
    const C_aBMI = [0, 0, 0, 0, -0.008345, 0.0009592];
    const C_aEGF = [
      -0.1667286, -0.1637039, -0.1682586, -0.1305231, -0.1912183, -0.1917105,
    ];
    const C_aDMa = [
      0.1338348, 0.13159, 0.1339055, 0.1157161, 0.1856442, 0.1652857,
    ]; // a1cDM
    const C_aNDM = [
      0.1622409, 0.1295185, 0.1596461, 0.1288303, 0.1833083, 0.1505859,
    ]; // a1cNoDM

    // ════════════════════════════════════════════════════════════════════════
    // MODEL D — Enhanced SDI (Table S12D)  ·  used when nEnhanced === 1 && hasSDI
    // ════════════════════════════════════════════════════════════════════════
    const D_c = [
      -3.461564, -3.159572, -3.955898, -3.624712, -4.409382, -4.058977,
    ];
    const D_age = [
      0.7754083, 0.7756377, 0.7028123, 0.7150087, 0.8819156, 0.894179,
    ];
    const D_nHDL = [0.0221756, 0.0715325, 0.1056078, 0.1627339, 0, 0];
    const D_HDL = [-0.1650828, -0.0976775, -0.1502263, -0.1194988, 0, 0];
    const D_sL = [
      -0.2180808, -0.5186614, -0.0488757, -0.363659, -0.4495491, -0.7067398,
    ];
    const D_sH = [
      0.3381188, 0.3235653, 0.3402681, 0.3179476, 0.3457405, 0.350241,
    ];
    const D_dm = [
      0.8624372, 0.7722496, 0.838022, 0.7156422, 1.02632, 0.9252453,
    ];
    const D_smk = [
      0.4663953, 0.3761129, 0.4064592, 0.3404477, 0.5371646, 0.4364765,
    ];
    const D_bL = [0, 0, 0, 0, -0.0168447, -0.0866297];
    const D_bH = [0, 0, 0, 0, 0.2805126, 0.3706765];
    const D_eL = [
      0.5919004, 0.5180893, 0.4838394, 0.3545754, 0.7315223, 0.6696768,
    ];
    const D_eH = [
      0.0516821, 0.0118451, 0.0480415, 0.0157875, 0.0651679, 0.0237374,
    ];
    const D_aht = [
      0.3182166, 0.2634094, 0.2270648, 0.1786233, 0.3491487, 0.2688352,
    ];
    const D_sta = [-0.1460816, -0.1455263, -0.0585626, -0.1018269, 0, 0];
    const D_tSBP = [
      -0.0574455, -0.0367013, -0.0349485, -0.028313, -0.0890335, -0.0434892,
    ];
    const D_tCho = [0.1302287, 0.1617785, 0.1017299, 0.1209467, 0, 0];
    const D_aCho = [-0.083509, -0.0507669, -0.062389, -0.0285806, 0, 0];
    const D_aHDL = [0.0282181, 0.0178356, 0.0285106, 0.0247348, 0, 0];
    const D_aSBP = [
      -0.0952647, -0.1059337, -0.1033711, -0.0919494, -0.0971028, -0.1297155,
    ];
    const D_aDM = [
      -0.2718966, -0.2236755, -0.2477845, -0.1981491, -0.3528078, -0.299086,
    ];
    const D_aSmk = [
      -0.0641738, -0.0723216, -0.0544326, -0.0776891, -0.106216, -0.1079522,
    ];
    const D_aBMI = [0, 0, 0, 0, 0.0064998, 0.0130483];
    const D_aEGF = [
      -0.1717026, -0.1548205, -0.1735372, -0.1284899, -0.1899413, -0.1797791,
    ];
    const D_sMid = [
      0.1442776, 0.0889119, 0.1473705, 0.0728242, 0.1343318, 0.1235632,
    ];
    const D_sHi = [
      0.2421409, 0.291897, 0.2451878, 0.2824453, 0.2496522, 0.3592212,
    ];

    // ════════════════════════════════════════════════════════════════════════
    // MODEL E — FULL (Table S12E)  ·  used when nEnhanced === 2 or 3
    // Missing-variable indicator terms applied for each absent optional variable
    // ════════════════════════════════════════════════════════════════════════
    const E_c = [
      -3.860385, -3.631387, -4.291503, -3.969788, -4.896524, -4.663513,
    ];
    const E_age = [
      0.7716794, 0.7847578, 0.7023067, 0.7128741, 0.884209, 0.9095703,
    ];
    const E_nHDL = [0.0062109, 0.0534485, 0.0898765, 0.1465201, 0, 0];
    const E_HDL = [-0.1547756, -0.0911282, -0.1407316, -0.1125794, 0, 0];
    const E_sL = [
      -0.1933123, -0.4921973, -0.0256648, -0.3387216, -0.421474, -0.6765184,
    ];
    const E_sH = [
      0.3071217, 0.2972415, 0.314511, 0.2980252, 0.3002919, 0.3111651,
    ];
    const E_dm = [
      0.496753, 0.4527054, 0.4799217, 0.399583, 0.6170359, 0.5535052,
    ];
    const E_smk = [
      0.466605, 0.3726641, 0.4062049, 0.3379111, 0.5380269, 0.4326811,
    ];
    const E_bL = [0, 0, 0, 0, -0.0191335, -0.0854286];
    const E_bH = [0, 0, 0, 0, 0.2764302, 0.3551736];
    const E_eL = [
      0.4780697, 0.3886854, 0.3847744, 0.2582604, 0.5975847, 0.5102245,
    ];
    const E_eH = [
      0.0529077, 0.0081661, 0.0495174, 0.0147769, 0.0654197, 0.015472,
    ];
    const E_aht = [
      0.3034892, 0.2508052, 0.2133861, 0.1686621, 0.3313614, 0.2570964,
    ];
    const E_sta = [-0.1556524, -0.1538484, -0.0678552, -0.1073619, 0, 0];
    const E_tSBP = [
      -0.0667026, -0.0474695, -0.0451416, -0.0381038, -0.1002304, -0.0591177,
    ];
    const E_tCho = [0.1061825, 0.1415382, 0.0788187, 0.1034169, 0, 0];
    const E_aCho = [-0.0742271, -0.0436455, -0.0535985, -0.0228755, 0, 0];
    const E_aHDL = [0.0288245, 0.0199549, 0.0291762, 0.0267453, 0, 0];
    const E_aSBP = [
      -0.0875188, -0.1022686, -0.0961839, -0.0897449, -0.0845363, -0.1219056,
    ];
    const E_aDM = [
      -0.2267102, -0.1762507, -0.2001466, -0.1497464, -0.2989062, -0.2437577,
    ];
    const E_aSmk = [
      -0.0676125, -0.0715873, -0.0586472, -0.077206, -0.1111354, -0.105363,
    ];
    const E_aBMI = [0, 0, 0, 0, 0.0008104, 0.0037907];
    const E_aEGF = [
      -0.1493231, -0.1428668, -0.1537791, -0.1198368, -0.1666635, -0.1660207,
    ];
    // Novel-variable present terms
    const E_lACR = [
      0.1645922, 0.1772853, 0.1371824, 0.1375837, 0.1948135, 0.2164607,
    ];
    const E_aDMa = [
      0.1298513, 0.1165698, 0.123192, 0.101282, 0.176668, 0.148297,
    ]; // a1cDM
    const E_aNDM = [
      0.1412555, 0.1048297, 0.1410572, 0.1092726, 0.1614911, 0.1234088,
    ]; // a1cNoDM
    const E_sMid = [
      0.1361989, 0.0802431, 0.1413965, 0.0651121, 0.1213034, 0.1106372,
    ];
    const E_sHi = [
      0.2261596, 0.275073, 0.228136, 0.2676683, 0.2314147, 0.3371204,
    ];
    // Missing-variable indicator terms (× 1 when that variable is absent)
    const E_mACR = [
      0.0198413, 0.1095674, 0.0061613, 0.0652944, 0.0395368, 0.1702805,
    ];
    const E_mA1c = [
      -0.0031658, -0.0230072, 0.005866, -0.0112852, -0.0010583, -0.0234637,
    ];
    const E_mSDI = [
      0.1804508, 0.144759, 0.1588908, 0.1388492, 0.1819138, 0.1694628,
    ];

    // ════════════════════════════════════════════════════════════════════════
    // 30-YEAR MODELS — Tables S12F–J of the PREVENT supplementary appendix.
    // Same structure as Models A–E (base / ACR / A1c / SDI / full), fit
    // separately for 30-year risk. Each also adds an age² term (age_t2).
    // Array order: [F_CVD, M_CVD, F_ASCVD, M_ASCVD, F_HF, M_HF]
    // ════════════════════════════════════════════════════════════════════════

    // ── MODEL F — BASE 30yr (Table S12F) ────────────────────────────────────
    const F_c = [-1.318827, -1.148204, -1.974074, -1.736444, -2.205379, -1.95751];
    const F_age = [
      0.5503079, 0.4627309, 0.4669202, 0.3994099, 0.6254374, 0.5681541,
    ];
    const F_age2 = [
      -0.0928369, -0.0984281, -0.0893118, -0.0937484, -0.0983038, -0.1048388,
    ];
    const F_nHDL = [0.0409794, 0.0836088, 0.1256901, 0.1744643, 0, 0];
    const F_HDL = [-0.1663306, -0.1029824, -0.1542255, -0.120203, 0, 0];
    const F_sL = [
      -0.1628654, -0.2140352, -0.0018093, -0.0665117, -0.3919241, -0.4761564,
    ];
    const F_sH = [
      0.3299505, 0.2904325, 0.322949, 0.2753037, 0.3142295, 0.30324,
    ];
    const F_dm = [
      0.6793894, 0.5331276, 0.6296707, 0.4790257, 0.8330787, 0.6840338,
    ];
    const F_smk = [
      0.3196112, 0.2141914, 0.268292, 0.1782635, 0.3438651, 0.2656273,
    ];
    const F_bL = [0, 0, 0, 0, 0.0594874, 0.0833107];
    const F_bH = [0, 0, 0, 0, 0.2525536, 0.26999];
    const F_eL = [
      0.1857101, 0.1155556, 0.100106, -0.0218789, 0.2981642, 0.2541805,
    ];
    const F_eH = [
      0.0553528, 0.0603775, 0.0499663, 0.0602553, 0.0667159, 0.0638923,
    ];
    const F_aht = [
      0.2894, 0.232714, 0.1875292, 0.1421182, 0.333921, 0.2583631,
    ];
    const F_sta = [-0.075688, -0.0272112, 0.0152476, 0.0135996, 0, 0];
    const F_tSBP = [
      -0.056367, -0.0384488, -0.0276123, -0.0218265, -0.0893177, -0.0391938,
    ];
    const F_tCho = [0.1071019, 0.134192, 0.0736147, 0.1013148, 0, 0];
    const F_aCho = [-0.0751438, -0.0511759, -0.0521962, -0.0312619, 0, 0];
    const F_aHDL = [0.0301786, 0.0165865, 0.0316918, 0.020673, 0, 0];
    const F_aSBP = [
      -0.0998776, -0.1101437, -0.1046101, -0.0920935, -0.0974299, -0.1269124,
    ];
    const F_aDM = [
      -0.3206166, -0.2585943, -0.2727793, -0.2159947, -0.404855, -0.3273572,
    ];
    const F_aSmk = [
      -0.1607862, -0.1566406, -0.1530907, -0.1548811, -0.1982991, -0.2043019,
    ];
    const F_aBMI = [0, 0, 0, 0, -0.0035619, -0.0182831];
    const F_aEGF = [
      -0.1450788, -0.1166776, -0.1299149, -0.0712547, -0.1564215, -0.1342618,
    ];

    // ── MODEL G — ACR 30yr (Table S12G) ─────────────────────────────────────
    const G_c = [-1.583738, -1.398727, -2.178888, -1.873449, -2.538952, -2.314872];
    const G_age = [
      0.5491768, 0.464491, 0.4629669, 0.3995607, 0.6319513, 0.5750236,
    ];
    const G_age2 = [
      -0.0937311, -0.0998895, -0.0902777, -0.094557, -0.1009284, -0.1062268,
    ];
    const G_nHDL = [0.0359847, 0.0757606, 0.1215214, 0.1686692, 0, 0];
    const G_HDL = [-0.1642965, -0.1031778, -0.1522069, -0.1202145, 0, 0];
    const G_sL = [
      -0.1483404, -0.1990714, 0.0092679, -0.0555561, -0.3787175, -0.4633994,
    ];
    const G_sH = [
      0.313353, 0.2715816, 0.3113609, 0.2633566, 0.2863393, 0.2742874,
    ];
    const G_dm = [
      0.6253766, 0.4754637, 0.581256, 0.4362036, 0.7631221, 0.612208,
    ];
    const G_smk = [
      0.3147172, 0.2069672, 0.263167, 0.1716233, 0.3355843, 0.2614987,
    ];
    const G_bL = [0, 0, 0, 0, 0.0677084, 0.0895459];
    const G_bH = [0, 0, 0, 0, 0.2517238, 0.2632424];
    const G_eL = [
      0.1094663, 0.0331103, 0.0391726, -0.0775282, 0.1940067, 0.1430472,
    ];
    const G_eH = [
      0.0550705, 0.0540474, 0.0492959, 0.0561236, 0.0664006, 0.0535184,
    ];
    const G_aht = [
      0.2782433, 0.2189911, 0.1786178, 0.1319331, 0.3171436, 0.2417468,
    ];
    const G_sta = [-0.0786239, -0.0331044, 0.0131058, 0.0102428, 0, 0];
    const G_tSBP = [
      -0.0628947, -0.04534, -0.0325135, -0.0269294, -0.0970661, -0.0498574,
    ];
    const G_tCho = [0.093204, 0.1214535, 0.0617093, 0.0920557, 0, 0];
    const G_aCho = [-0.0710685, -0.0483995, -0.0489189, -0.0297021, 0, 0];
    const G_aHDL = [0.0306363, 0.0178997, 0.0321079, 0.0217935, 0, 0];
    const G_aSBP = [
      -0.0951455, -0.1059324, -0.1003185, -0.0893347, -0.0896239, -0.1193827,
    ];
    const G_aDM = [
      -0.3168231, -0.2492861, -0.2684574, -0.2081467, -0.400743, -0.316651,
    ];
    const G_aSmk = [
      -0.1636391, -0.1561543, -0.1547301, -0.1542716, -0.2042041, -0.2046122,
    ];
    const G_aBMI = [0, 0, 0, 0, -0.0054699, -0.0216878];
    const G_aEGF = [
      -0.1265483, -0.1012429, -0.1130703, -0.0597254, -0.13602, -0.1165637,
    ];
    const G_lACR = [
      0.1142251, 0.1007571, 0.0903471, 0.0684872, 0.1486028, 0.1366452,
    ];
    const G_mACR = [
      -0.0055863, 0.0572456, -0.0145818, 0.0193962, 0.011608, 0.1078355,
    ];

    // ── MODEL H — A1c 30yr (Table S12H) ─────────────────────────────────────
    const H_c = [-1.341059, -1.180767, -2.011533, -1.777708, -2.193553, -1.974999];
    const H_age = [
      0.5343493, 0.4519873, 0.4555574, 0.3883267, 0.6210856, 0.5703729,
    ];
    const H_age2 = [
      -0.0952314, -0.101624, -0.0903501, -0.0958114, -0.1000972, -0.1084544,
    ];
    const H_nHDL = [0.0298124, 0.0700456, 0.1148321, 0.1613374, 0, 0];
    const H_HDL = [-0.1578451, -0.0968005, -0.1458754, -0.1144418, 0, 0];
    const H_sL = [
      -0.1504488, -0.1923527, 0.0089323, -0.0474338, -0.3773697, -0.4471767,
    ];
    const H_sH = [
      0.3173368, 0.2827043, 0.3139029, 0.2691281, 0.295316, 0.2910152,
    ];
    const H_dm = [
      0.4314738, 0.3417152, 0.386281, 0.2859773, 0.5681692, 0.4507242,
    ];
    const H_smk = [
      0.3209399, 0.2105272, 0.2714309, 0.1759553, 0.3449139, 0.259585,
    ];
    const H_bL = [0, 0, 0, 0, 0.0540094, 0.0850676];
    const H_bH = [0, 0, 0, 0, 0.249767, 0.2637222];
    const H_eL = [
      0.1771435, 0.1113291, 0.0930987, -0.0242898, 0.2875781, 0.2454706,
    ];
    const H_eH = [
      0.0582828, 0.0640135, 0.0532216, 0.0644523, 0.0692013, 0.0675649,
    ];
    const H_aht = [
      0.2888947, 0.2334248, 0.1862181, 0.142874, 0.3334936, 0.2611991,
    ];
    const H_sta = [-0.0795886, -0.0299421, 0.0106964, 0.0115062, 0, 0];
    const H_tSBP = [
      -0.0600438, -0.0393204, -0.0329713, -0.02333, -0.0922339, -0.0408908,
    ];
    const H_tCho = [0.0920598, 0.1228854, 0.0583609, 0.0899664, 0, 0];
    const H_aCho = [-0.0696108, -0.0463737, -0.0463273, -0.0275478, 0, 0];
    const H_aHDL = [0.0308807, 0.0184599, 0.0324717, 0.022573, 0, 0];
    const H_aSBP = [
      -0.0954051, -0.1085744, -0.1004777, -0.090802, -0.0907885, -0.1241051,
    ];
    const H_aDM = [
      -0.2763408, -0.2208049, -0.2266944, -0.1771894, -0.3554646, -0.2849461,
    ];
    const H_aSmk = [
      -0.1623944, -0.1577978, -0.1541859, -0.1548847, -0.2008846, -0.2032308,
    ];
    const H_aBMI = [0, 0, 0, 0, -0.0079611, -0.0239714];
    const H_aEGF = [
      -0.1430514, -0.1179375, -0.1286005, -0.0732754, -0.156803, -0.138301,
    ];
    const H_aDMa = [
      0.0940543, 0.0768169, 0.0875827, 0.0591089, 0.1448336, 0.1101184,
    ];
    const H_aNDM = [
      0.1116486, 0.0777295, 0.1126417, 0.0821158, 0.1277838, 0.0949198,
    ];
    const H_mA1c = [
      -0.0024798, 0.0092204, 0.0124356, 0.0179755, -0.0022589, 0.0084192,
    ];

    // ── MODEL I — SDI 30yr (Table S12I) ─────────────────────────────────────
    const I_c = [-1.493211, -1.251031, -2.116951, -1.836632, -2.317899, -2.060187];
    const I_age = [
      0.5124233, 0.437377, 0.4396545, 0.3749788, 0.5919097, 0.5387527,
    ];
    const I_age2 = [
      -0.0978159, -0.104443, -0.0918489, -0.0990063, -0.1023133, -0.1090333,
    ];
    const I_nHDL = [0.0322131, 0.0812573, 0.1132729, 0.1708505, 0, 0];
    const I_HDL = [-0.1717884, -0.1069199, -0.1544977, -0.1272841, 0, 0];
    const I_sL = [
      -0.1364536, -0.2786727, 0.036315, -0.1275555, -0.3864727, -0.4829094,
    ];
    const I_sH = [
      0.3074443, 0.2729256, 0.3049229, 0.2659339, 0.301876, 0.2843569,
    ];
    const I_dm = [
      0.6709275, 0.5279006, 0.6344794, 0.4676531, 0.8162909, 0.6827667,
    ];
    const I_smk = [
      0.2897728, 0.1878949, 0.234514, 0.1610104, 0.3449647, 0.2406677,
    ];
    const I_bL = [0, 0, 0, 0, 0.0574975, 0.0618028];
    const I_bH = [0, 0, 0, 0, 0.2367826, 0.2705615];
    const I_eL = [
      0.1670658, 0.0866569, 0.0898312, -0.0465144, 0.2790347, 0.2255837,
    ];
    const I_eH = [
      0.0618439, 0.0594948, 0.0564502, 0.0596996, 0.0742645, 0.0653632,
    ];
    const I_aht = [
      0.2969806, 0.2028246, 0.1933487, 0.1147096, 0.3352935, 0.2263243,
    ];
    const I_sta = [-0.0665514, -0.0308404, 0.0220467, 0.0052906, 0, 0];
    const I_tSBP = [
      -0.0458917, -0.0283679, -0.0229229, -0.0186687, -0.0772532, -0.0316851,
    ];
    const I_tCho = [0.1168505, 0.1439353, 0.0903326, 0.1063151, 0, 0];
    const I_aCho = [-0.0770419, -0.0510854, -0.0579383, -0.0307797, 0, 0];
    const I_aHDL = [0.027634, 0.0150236, 0.0274011, 0.0218126, 0, 0];
    const I_aSBP = [
      -0.0992045, -0.1095448, -0.1039749, -0.0898242, -0.0995144, -0.1258716,
    ];
    const I_aDM = [
      -0.3208137, -0.2561109, -0.2785102, -0.210054, -0.4000423, -0.3243709,
    ];
    const I_aSmk = [
      -0.134847, -0.1282945, -0.1167267, -0.1246327, -0.1770335, -0.1596172,
    ];
    const I_aBMI = [0, 0, 0, 0, 0.0083046, -0.0103092];
    const I_aEGF = [
      -0.1399842, -0.1011023, -0.1269382, -0.0629358, -0.149585, -0.1204785,
    ];
    const I_sMid = [
      0.1129725, 0.0314626, 0.1149139, 0.0199201, 0.0960646, 0.0680528,
    ];
    const I_sHi = [
      0.1975843, 0.2003953, 0.1976537, 0.194949, 0.1987543, 0.2619865,
    ];

    // ── MODEL J — FULL 30yr (Table S12J) ────────────────────────────────────
    const J_c = [-1.748475, -1.504558, -2.314066, -1.985368, -2.642208, -2.425439];
    const J_age = [
      0.5073749, 0.4427595, 0.4386739, 0.3743566, 0.5927507, 0.5478829,
    ];
    const J_age2 = [
      -0.0981751, -0.1064108, -0.0921956, -0.0995499, -0.1028754, -0.1111928,
    ];
    const J_nHDL = [0.0162303, 0.0629381, 0.0977728, 0.1544808, 0, 0];
    const J_HDL = [-0.1617147, -0.1015427, -0.1453525, -0.1215297, 0, 0];
    const J_sL = [
      -0.1111241, -0.2542326, 0.0590925, -0.1083968, -0.3593781, -0.4547346,
    ];
    const J_sH = [
      0.282946, 0.2549679, 0.2862862, 0.2555179, 0.2628556, 0.2527602,
    ];
    const J_dm = [
      0.4004069, 0.333835, 0.3669136, 0.2696998, 0.5113472, 0.4385384,
    ];
    const J_smk = [
      0.2918701, 0.1873833, 0.2354695, 0.1628432, 0.347344, 0.2397952,
    ];
    const J_bL = [0, 0, 0, 0, 0.0564656, 0.0640931];
    const J_bH = [0, 0, 0, 0, 0.2363857, 0.2643081];
    const J_eL = [
      0.1017102, 0.0246102, 0.0354338, -0.077507, 0.1971295, 0.1354588,
    ];
    const J_eH = [
      0.0622643, 0.0552014, 0.0573093, 0.0583407, 0.0735227, 0.0570689,
    ];
    const J_aht = [
      0.2872416, 0.1979729, 0.1840085, 0.1120322, 0.3219386, 0.220666,
    ];
    const J_sta = [-0.0768135, -0.0407714, 0.0117504, -0.0025063, 0, 0];
    const J_tSBP = [
      -0.0557282, -0.0365522, -0.0331945, -0.0256116, -0.0880321, -0.0436769,
    ];
    const J_tCho = [0.0917585, 0.1232822, 0.0664311, 0.0886745, 0, 0];
    const J_aCho = [-0.0679131, -0.0441334, -0.0492826, -0.0254507, 0, 0];
    const J_aHDL = [0.029076, 0.0177865, 0.0288888, 0.0244639, 0, 0];
    const J_aSBP = [
      -0.0907755, -0.1046657, -0.0964709, -0.0869146, -0.0863132, -0.1168376,
    ];
    const J_aDM = [
      -0.2702118, -0.2116113, -0.2279648, -0.165745, -0.3425359, -0.2730055,
    ];
    const J_aSmk = [
      -0.1373216, -0.1277905, -0.120405, -0.1244714, -0.181405, -0.1573691,
    ];
    const J_aBMI = [0, 0, 0, 0, 0.0031285, -0.0174998];
    const J_aEGF = [
      -0.1255864, -0.0955922, -0.1157635, -0.0624552, -0.1356989, -0.1128676,
    ];
    const J_lACR = [
      0.1028065, 0.0894596, 0.0810739, 0.0560171, 0.1273306, 0.1233486,
    ];
    const J_mACR = [
      -0.0006181, 0.0710124, -0.0147785, 0.0252244, 0.0167008, 0.1274796,
    ];
    const J_aDMa = [
      0.0925285, 0.0676202, 0.0794709, 0.0501422, 0.1378342, 0.0985062,
    ];
    const J_aNDM = [
      0.0975598, 0.063409, 0.1002615, 0.0722905, 0.1138832, 0.0804844,
    ];
    const J_mA1c = [
      0.0101713, 0.0038783, 0.017301, 0.0114945, 0.0138979, 0.0022806,
    ];
    const J_sMid = [
      0.1067741, 0.0256704, 0.1107632, 0.015675, 0.0847634, 0.057746,
    ];
    const J_sHi = [
      0.1853138, 0.1887637, 0.1840367, 0.1864231, 0.18397, 0.2446441,
    ];
    const J_mSDI = [
      0.1567115, 0.089241, 0.1308962, 0.0845697, 0.1485802, 0.1076782,
    ];

    // ── Core log-odds helper (terms identical across all models) ─────────────
    const coreLogOdds = (
      i: number,
      c: number[],
      age_: number[],
      nHDL: number[],
      HDL_: number[],
      sL: number[],
      sH: number[],
      dm_: number[],
      smk_: number[],
      bL: number[],
      bH: number[],
      eL: number[],
      eH: number[],
      aht: number[],
      sta: number[],
      tSBP: number[],
      tCho: number[],
      aCho: number[],
      aHDL: number[],
      aSBP: number[],
      aDM_: number[],
      aSmk: number[],
      aBMI: number[],
      aEGF: number[]
    ): number =>
      c[i] +
      age_[i] * age_t +
      nHDL[i] * nonHDLC_t +
      HDL_[i] * HDLC_t +
      sL[i] * sbpLow_t +
      sH[i] * sbpHigh_t +
      dm_[i] * dm +
      smk_[i] * smk +
      bL[i] * bmiLow_t +
      bH[i] * bmiHigh_t +
      eL[i] * egfrLow_t +
      eH[i] * egfrHigh_t +
      aht[i] * antihtn +
      sta[i] * statin +
      tSBP[i] * int_treatSBP +
      tCho[i] * int_treatChol +
      aCho[i] * int_ageChol +
      aHDL[i] * int_ageHDL +
      aSBP[i] * int_ageSBP +
      aDM_[i] * int_ageDM +
      aSmk[i] * int_ageSmk +
      aBMI[i] * int_ageBMI +
      aEGF[i] * int_ageEGFR;

    // ── Model label ──────────────────────────────────────────────────────────
    let modelLabel: string;
    if (nEnhanced === 0) {
      modelLabel = "Base (S12A)";
    } else if (nEnhanced === 1) {
      if (hasACR) modelLabel = "Enhanced ACR (S12B)";
      else if (hasA1c) modelLabel = "Enhanced HbA1c (S12C)";
      else modelLabel = `Enhanced SDI decile ${sdiDecile} (S12D)`;
    } else {
      const parts: string[] = [];
      if (hasACR) parts.push("uACR");
      if (hasA1c) parts.push("HbA1c");
      if (hasSDI) parts.push(`SDI d${sdiDecile}`);
      const miss: string[] = [];
      if (!hasACR) miss.push("ACR→missing");
      if (!hasA1c) miss.push("A1c→missing");
      if (!hasSDI) miss.push("SDI→missing");
      modelLabel =
        `Full S12E: ${parts.join("+")}` +
        (miss.length ? ` (${miss.join(", ")})` : "");
    }

    // ── Per-index log-odds ───────────────────────────────────────────────────
    // idx: 0=F_CVD, 1=M_CVD, 2=F_ASCVD, 3=M_ASCVD, 4=F_HF, 5=M_HF
    const logOdds = (idx: number): number => {
      if (nEnhanced === 0) {
        // ── BASE model ───────────────────────────────────────────────────────
        return coreLogOdds(
          idx,
          A_c,
          A_age,
          A_nHDL,
          A_HDL,
          A_sL,
          A_sH,
          A_dm,
          A_smk,
          A_bL,
          A_bH,
          A_eL,
          A_eH,
          A_aht,
          A_sta,
          A_tSBP,
          A_tCho,
          A_aCho,
          A_aHDL,
          A_aSBP,
          A_aDM,
          A_aSmk,
          A_aBMI,
          A_aEGF
        );
      } else if (nEnhanced === 1 && hasACR) {
        // ── Enhanced ACR (S12B) ──────────────────────────────────────────────
        return (
          coreLogOdds(
            idx,
            B_c,
            B_age,
            B_nHDL,
            B_HDL,
            B_sL,
            B_sH,
            B_dm,
            B_smk,
            B_bL,
            B_bH,
            B_eL,
            B_eH,
            B_aht,
            B_sta,
            B_tSBP,
            B_tCho,
            B_aCho,
            B_aHDL,
            B_aSBP,
            B_aDM,
            B_aSmk,
            B_aBMI,
            B_aEGF
          ) +
          B_lACR[idx] * Math.log(uacr_raw!)
        );
      } else if (nEnhanced === 1 && hasA1c) {
        // ── Enhanced A1c (S12C) ──────────────────────────────────────────────
        return (
          coreLogOdds(
            idx,
            C_c,
            C_age,
            C_nHDL,
            C_HDL,
            C_sL,
            C_sH,
            C_dm,
            C_smk,
            C_bL,
            C_bH,
            C_eL,
            C_eH,
            C_aht,
            C_sta,
            C_tSBP,
            C_tCho,
            C_aCho,
            C_aHDL,
            C_aSBP,
            C_aDM,
            C_aSmk,
            C_aBMI,
            C_aEGF
          ) +
          C_aDMa[idx] * (a1c_raw! - 5.3) * dm +
          C_aNDM[idx] * (a1c_raw! - 5.3) * (1 - dm)
        );
      } else if (nEnhanced === 1 && hasSDI) {
        // ── Enhanced SDI (S12D) ──────────────────────────────────────────────
        return (
          coreLogOdds(
            idx,
            D_c,
            D_age,
            D_nHDL,
            D_HDL,
            D_sL,
            D_sH,
            D_dm,
            D_smk,
            D_bL,
            D_bH,
            D_eL,
            D_eH,
            D_aht,
            D_sta,
            D_tSBP,
            D_tCho,
            D_aCho,
            D_aHDL,
            D_aSBP,
            D_aDM,
            D_aSmk,
            D_aBMI,
            D_aEGF
          ) +
          D_sMid[idx] * sdiMid +
          D_sHi[idx] * sdiHigh
        );
      } else {
        // ── FULL model (S12E) — nEnhanced === 2 or 3 ────────────────────────
        let lo = coreLogOdds(
          idx,
          E_c,
          E_age,
          E_nHDL,
          E_HDL,
          E_sL,
          E_sH,
          E_dm,
          E_smk,
          E_bL,
          E_bH,
          E_eL,
          E_eH,
          E_aht,
          E_sta,
          E_tSBP,
          E_tCho,
          E_aCho,
          E_aHDL,
          E_aSBP,
          E_aDM,
          E_aSmk,
          E_aBMI,
          E_aEGF
        );
        // ACR: actual term if present, missing indicator if absent
        lo += hasACR ? E_lACR[idx] * Math.log(uacr_raw!) : E_mACR[idx];
        // HbA1c: actual terms if present, missing indicator if absent
        lo += hasA1c
          ? E_aDMa[idx] * (a1c_raw! - 5.3) * dm +
            E_aNDM[idx] * (a1c_raw! - 5.3) * (1 - dm)
          : E_mA1c[idx];
        // SDI: actual terms if present, missing indicator if absent
        lo += hasSDI
          ? E_sMid[idx] * sdiMid + E_sHi[idx] * sdiHigh
          : E_mSDI[idx];
        return lo;
      }
    };

    // ── 30-year log-odds (same structure, using Models F–J + age² term) ─────
    const core30 = (
      i: number,
      c: number[],
      age_: number[],
      age2_: number[],
      nHDL: number[],
      HDL_: number[],
      sL: number[],
      sH: number[],
      dm_: number[],
      smk_: number[],
      bL: number[],
      bH: number[],
      eL: number[],
      eH: number[],
      aht: number[],
      sta: number[],
      tSBP: number[],
      tCho: number[],
      aCho: number[],
      aHDL: number[],
      aSBP: number[],
      aDM_: number[],
      aSmk: number[],
      aBMI: number[],
      aEGF: number[]
    ): number =>
      coreLogOdds(
        i,
        c,
        age_,
        nHDL,
        HDL_,
        sL,
        sH,
        dm_,
        smk_,
        bL,
        bH,
        eL,
        eH,
        aht,
        sta,
        tSBP,
        tCho,
        aCho,
        aHDL,
        aSBP,
        aDM_,
        aSmk,
        aBMI,
        aEGF
      ) +
      age2_[i] * age_t2;

    const logOdds30 = (idx: number): number => {
      if (nEnhanced === 0) {
        // ── BASE 30yr model ────────────────────────────────────────────────
        return core30(
          idx,
          F_c,
          F_age,
          F_age2,
          F_nHDL,
          F_HDL,
          F_sL,
          F_sH,
          F_dm,
          F_smk,
          F_bL,
          F_bH,
          F_eL,
          F_eH,
          F_aht,
          F_sta,
          F_tSBP,
          F_tCho,
          F_aCho,
          F_aHDL,
          F_aSBP,
          F_aDM,
          F_aSmk,
          F_aBMI,
          F_aEGF
        );
      } else if (nEnhanced === 1 && hasACR) {
        // ── Enhanced ACR 30yr (S12G) ─────────────────────────────────────────
        return (
          core30(
            idx,
            G_c,
            G_age,
            G_age2,
            G_nHDL,
            G_HDL,
            G_sL,
            G_sH,
            G_dm,
            G_smk,
            G_bL,
            G_bH,
            G_eL,
            G_eH,
            G_aht,
            G_sta,
            G_tSBP,
            G_tCho,
            G_aCho,
            G_aHDL,
            G_aSBP,
            G_aDM,
            G_aSmk,
            G_aBMI,
            G_aEGF
          ) +
          G_lACR[idx] * Math.log(uacr_raw!)
        );
      } else if (nEnhanced === 1 && hasA1c) {
        // ── Enhanced A1c 30yr (S12H) ─────────────────────────────────────────
        return (
          core30(
            idx,
            H_c,
            H_age,
            H_age2,
            H_nHDL,
            H_HDL,
            H_sL,
            H_sH,
            H_dm,
            H_smk,
            H_bL,
            H_bH,
            H_eL,
            H_eH,
            H_aht,
            H_sta,
            H_tSBP,
            H_tCho,
            H_aCho,
            H_aHDL,
            H_aSBP,
            H_aDM,
            H_aSmk,
            H_aBMI,
            H_aEGF
          ) +
          H_aDMa[idx] * (a1c_raw! - 5.3) * dm +
          H_aNDM[idx] * (a1c_raw! - 5.3) * (1 - dm)
        );
      } else if (nEnhanced === 1 && hasSDI) {
        // ── Enhanced SDI 30yr (S12I) ─────────────────────────────────────────
        return (
          core30(
            idx,
            I_c,
            I_age,
            I_age2,
            I_nHDL,
            I_HDL,
            I_sL,
            I_sH,
            I_dm,
            I_smk,
            I_bL,
            I_bH,
            I_eL,
            I_eH,
            I_aht,
            I_sta,
            I_tSBP,
            I_tCho,
            I_aCho,
            I_aHDL,
            I_aSBP,
            I_aDM,
            I_aSmk,
            I_aBMI,
            I_aEGF
          ) +
          I_sMid[idx] * sdiMid +
          I_sHi[idx] * sdiHigh
        );
      } else {
        // ── FULL 30yr model (S12J) — nEnhanced === 2 or 3 ───────────────────
        let lo = core30(
          idx,
          J_c,
          J_age,
          J_age2,
          J_nHDL,
          J_HDL,
          J_sL,
          J_sH,
          J_dm,
          J_smk,
          J_bL,
          J_bH,
          J_eL,
          J_eH,
          J_aht,
          J_sta,
          J_tSBP,
          J_tCho,
          J_aCho,
          J_aHDL,
          J_aSBP,
          J_aDM,
          J_aSmk,
          J_aBMI,
          J_aEGF
        );
        lo += hasACR ? J_lACR[idx] * Math.log(uacr_raw!) : J_mACR[idx];
        lo += hasA1c
          ? J_aDMa[idx] * (a1c_raw! - 5.3) * dm +
            J_aNDM[idx] * (a1c_raw! - 5.3) * (1 - dm)
          : J_mA1c[idx];
        lo += hasSDI
          ? J_sMid[idx] * sdiMid + J_sHi[idx] * sdiHigh
          : J_mSDI[idx];
        return lo;
      }
    };

    const toRisk = (lo: number) => (Math.exp(lo) / (1 + Math.exp(lo))) * 100;
    const fi = sex === "female" ? 0 : 1; // 0 = female index; 1 = male

    return {
      cvd: Math.max(0, Math.min(100, toRisk(logOdds(fi)))),
      ascvd: Math.max(0, Math.min(100, toRisk(logOdds(2 + fi)))),
      heartFailure: Math.max(0, Math.min(100, toRisk(logOdds(4 + fi)))),
      cvd30: Math.max(0, Math.min(100, toRisk(logOdds30(fi)))),
      ascvd30: Math.max(0, Math.min(100, toRisk(logOdds30(2 + fi)))),
      heartFailure30: Math.max(0, Math.min(100, toRisk(logOdds30(4 + fi)))),
      modelLabel,
      sdiDecile: sdiDecile ?? null,
    };
  }, []);
  const calculateKDIGO = useCallback((data: typeof calculationState) => {
    if (!data.eGFR || !data.uACR) return null;
    const egfr = parseFloat(data.eGFR);
    const uacr = parseFloat(data.uACR);
    let egfrCategory: string, acrCategory: string;
    if (egfr > 105) egfrCategory = ">105";
    else if (egfr >= 90) egfrCategory = "90-105";
    else if (egfr >= 75) egfrCategory = "75-90";
    else if (egfr >= 60) egfrCategory = "60-75";
    else if (egfr >= 45) egfrCategory = "45-60";
    else if (egfr >= 30) egfrCategory = "30-45";
    else egfrCategory = "15-30";
    if (uacr < 10) acrCategory = "<10";
    else if (uacr < 30) acrCategory = "10-29";
    else if (uacr <= 300) acrCategory = "30-300";
    else acrCategory = ">300";
    const cvdMortalityRates: Record<string, Record<string, number>> = {
      ">105": { "<10": 4.05, "10-29": 5.85, "30-300": 10.35, ">300": 9.45 },
      "90-105": { "<10": 4.5, "10-29": 6.75, "30-300": 7.65, ">300": 16.65 },
      "75-90": { "<10": 4.5, "10-29": 5.85, "30-300": 7.2, ">300": 16.65 },
      "60-75": { "<10": 4.95, "10-29": 6.3, "30-300": 9, ">300": 18.45 },
      "45-60": { "<10": 6.75, "10-29": 9.9, "30-300": 12.6, ">300": 19.35 },
      "30-45": { "<10": 9.9, "10-29": 12.15, "30-300": 15.3, ">300": 23.4 },
      "15-30": { "<10": 63, "10-29": 35.55, "30-300": 21.6, ">300": 36.45 },
    };
    const ckdProgressionRates: Record<string, Record<string, number>> = {
      ">105": { "<10": 0, "10-29": 0, "30-300": 0.808, ">300": 6.06 },
      "90-105": { "<10": 0, "10-29": 0, "30-300": 1.818, ">300": 6.666 },
      "75-90": { "<10": 0, "10-29": 0, "30-300": 3.838, ">300": 10.1 },
      "60-75": { "<10": 0, "10-29": 0, "30-300": 6.464, ">300": 16.362 },
      "45-60": {
        "<10": 6.262,
        "10-29": 8.08,
        "30-300": 18.988,
        ">300": 115.14,
      },
      "30-45": { "<10": 6.06, "10-29": 38.38, "30-300": 30.3, ">300": 44.44 },
      "15-30": { "<10": 8.08, "10-29": 24.24, "30-300": 42.42, ">300": 15.554 },
    };
    const cvdRate = cvdMortalityRates[egfrCategory]?.[acrCategory] || 0;
    const ckdRate = ckdProgressionRates[egfrCategory]?.[acrCategory] || 0;
    return {
      cvdMortality: cvdRate,
      ckdProgression: ckdRate,
      egfrCategory,
      acrCategory,
    };
  }, []);

  const results = useMemo(() => {
    if (inputMode === "manual") {
      // Helper function to safely parse risk values
      const parseRisk = (value: string) => {
        if (!value || value.trim() === "") return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      };

      // Use manual risk inputs
      const krfe2YearValue = parseRisk(manualRisks.krfe2Year);
      const krfe5YearValue = parseRisk(manualRisks.krfe5Year);
      const cvdValue = parseRisk(manualRisks.cvd);
      const ascvdValue = parseRisk(manualRisks.ascvd);
      const hfValue = parseRisk(manualRisks.hf);
      const cvd30Value = parseRisk(manualRisks.cvd30);
      const ascvd30Value = parseRisk(manualRisks.ascvd30);
      const hf30Value = parseRisk(manualRisks.hf30);
      const kdigoCvdValue = parseRisk(manualRisks.kdigoCvd);
      const kdigoCkdValue = parseRisk(manualRisks.kdigoCkd);

      return {
        krfe:
          krfe2YearValue !== null || krfe5YearValue !== null
            ? {
                twoYear: krfe2YearValue !== null ? krfe2YearValue : 0,
                fiveYear: krfe5YearValue !== null ? krfe5YearValue : 0,
                riskLevel:
                  krfe5YearValue !== null
                    ? krfe5YearValue > 40
                      ? "High"
                      : krfe5YearValue > 10
                      ? "Moderate"
                      : "Low"
                    : krfe2YearValue !== null
                    ? krfe2YearValue > 40
                      ? "High"
                      : krfe2YearValue > 10
                      ? "Moderate"
                      : "Low"
                    : "Low",
              }
            : null,
        prevent:
          cvdValue !== null ||
          ascvdValue !== null ||
          hfValue !== null ||
          cvd30Value !== null ||
          ascvd30Value !== null ||
          hf30Value !== null
            ? {
                cvd: cvdValue !== null ? cvdValue : 0,
                ascvd: ascvdValue !== null ? ascvdValue : 0,
                heartFailure: hfValue !== null ? hfValue : 0,
                cvd30: cvd30Value !== null ? cvd30Value : 0,
                ascvd30: ascvd30Value !== null ? ascvd30Value : 0,
                heartFailure30: hf30Value !== null ? hf30Value : 0,
              }
            : null,
        kdigo:
          kdigoCvdValue !== null || kdigoCkdValue !== null
            ? {
                cvdMortality: kdigoCvdValue !== null ? kdigoCvdValue : 0,
                ckdProgression: kdigoCkdValue !== null ? kdigoCkdValue : 0,
                egfrCategory: "Unknown",
                acrCategory: "Unknown",
              }
            : null,
      };
    } else {
      // Calculate from inputs
      return {
        krfe: calculateKFRE(calculationState),
        prevent: calculatePREVENT(calculationState),
        kdigo: calculateKDIGO(calculationState),
      };
    }
  }, [
    inputMode,
    manualRisks,
    calculationState,
    calculateKFRE,
    calculatePREVENT,
    calculateKDIGO,
  ]);

  const hasHardErrors = useMemo(() => {
    return Object.values(validationErrors).some((e) => e?.severity === "hard");
  }, [validationErrors]);

  // --- PDF export ---------------------------------------------------------
  // Pure data-driven export: builds the PDF straight from the same
  // `results` / `calculationState` / `manualRisks` state that drives the
  // on-screen panels, rather than rasterizing the DOM. That means it works
  // regardless of which view or collapse state currently happens to be
  // showing on screen, and text stays crisp instead of screenshotted.
  const exportToPdf = (targetView: "patient" | "clinician") => {
    const tab = activeTab as "krfe" | "prevent" | "kdigo";
    const currentResult = results[tab];
    if (!currentResult) {
      window.alert(
        "Please complete the required inputs before exporting a PDF."
      );
      return;
    }
    const hazardRatios = getEffectiveHazardRatios();

    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    // Reserve room at the bottom of every page for the disclaimer footer
    // (added in a final pass once the total page count is known).
    const footerReserve = 60;
    const bottomLimit = pageHeight - margin - footerReserve;
    let y = margin + 8; // a little extra headroom for the page-number badge

    // Adds a new page (resetting y to the top margin) only if the next
    // `needed` pt of content wouldn't fit on the remainder of this page.
    // If a large amount of blank space would otherwise be left at the
    // bottom of the current page, drop a small "continued on next page"
    // badge there first so the reader doesn't mistake it for the end of
    // the document.
    const ensureSpace = (needed: number) => {
      if (y + needed > bottomLimit) {
        const remaining = bottomLimit - y;
        if (remaining > 130) {
          const badgeW = 190;
          const badgeH = 20;
          const bx = margin + (contentWidth - badgeW) / 2;
          const by = bottomLimit - badgeH - 14;
          doc.setFillColor("#f3f4f6");
          doc.setDrawColor("#e5e7eb");
          doc.roundedRect(bx, by, badgeW, badgeH, 10, 10, "FD");
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8.5);
          doc.setTextColor("#9ca3af");
          doc.text("continued on next page \u203a", bx + badgeW / 2, by + 13.5, {
            align: "center",
          });
          doc.setTextColor("#000000");
          doc.setDrawColor("#000000");
        }
        doc.addPage();
        y = margin + 8;
      }
    };

    // --- Block-based rendering -------------------------------------------
    // A "block" (e.g. one outcome's title + description + chart + its
    // medication-impact sub-section) is measured in full *before* anything
    // is drawn, then a single ensureSpace() is called for the whole block.
    // That's what keeps a waffle chart (and the text around it) from being
    // split across a page boundary — the block moves to a fresh page as a
    // unit rather than being drawn piece by piece.
    type Piece =
      | { type: "title"; text: string }
      | { type: "subheader"; text: string }
      | { type: "text"; text: string; fontSize?: number }
      | { type: "caveat"; text: string }
      | {
          type: "waffle";
          baseValue: number;
          treatedValue: number;
          total: number;
          colors: { base: string; treated: string; bg: string };
          size: number;
        }
      | {
          type: "statBoxRow";
          boxes: {
            label: string;
            value: string;
            bg: string;
            labelColor: string;
            valueColor: string;
          }[];
        }
      | {
          type: "table";
          headers: string[];
          colWidths: number[];
          rows: { cells: string[]; cellColors?: (string | null)[] }[];
        }
      | { type: "space"; height: number };

    const STAT_BOX_H = 50;
    const TABLE_ROW_H = 22;
    const TABLE_HEADER_H = 20;

    const measurePiece = (p: Piece): number => {
      switch (p.type) {
        case "title":
          return 18;
        case "subheader":
          return 15;
        case "text": {
          doc.setFontSize(p.fontSize ?? 9);
          const lines = doc.splitTextToSize(p.text, contentWidth);
          return lines.length * (p.fontSize ?? 9) * 1.45;
        }
        case "caveat": {
          doc.setFontSize(7.5);
          const lines = doc.splitTextToSize(p.text, contentWidth);
          return lines.length * 7.5 * 1.45 + 3;
        }
        case "waffle":
          return p.size + 32;
        case "statBoxRow":
          return STAT_BOX_H + 8;
        case "table":
          return TABLE_HEADER_H + p.rows.length * TABLE_ROW_H + 8;
        case "space":
          return p.height;
      }
    };

    const drawPiece = (p: Piece) => {
      switch (p.type) {
        case "title":
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor("#1f2937");
          doc.text(p.text, margin, y + 9);
          y += 18;
          break;
        case "subheader":
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor("#374151");
          doc.text(p.text, margin, y + 8);
          y += 15;
          break;
        case "text": {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(p.fontSize ?? 9);
          doc.setTextColor("#374151");
          const lines = doc.splitTextToSize(p.text, contentWidth);
          doc.text(lines, margin, y + (p.fontSize ?? 9));
          y += lines.length * (p.fontSize ?? 9) * 1.45;
          break;
        }
        case "caveat": {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(7.5);
          doc.setTextColor("#9ca3af");
          const lines = doc.splitTextToSize(p.text, contentWidth);
          doc.text(lines, margin, y + 7.5);
          y += lines.length * 7.5 * 1.45 + 3;
          doc.setTextColor("#000000");
          break;
        }
        case "waffle": {
          y += 4;
          const usedH = drawPdfWaffleChart(
            doc,
            margin,
            y,
            p.size,
            p.baseValue,
            p.treatedValue,
            p.total,
            p.colors
          );
          y += usedH + 8;
          break;
        }
        case "statBoxRow": {
          const n = p.boxes.length;
          const gap = 8;
          const boxW = (contentWidth - gap * (n - 1)) / n;
          p.boxes.forEach((b, i) => {
            const bx = margin + i * (boxW + gap);
            doc.setFillColor(b.bg);
            doc.roundedRect(bx, y, boxW, STAT_BOX_H, 5, 5, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(b.labelColor);
            doc.text(b.label, bx + 10, y + 17);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.setTextColor(b.valueColor);
            doc.text(b.value, bx + 10, y + 38);
          });
          doc.setTextColor("#000000");
          y += STAT_BOX_H + 8;
          break;
        }
        case "table": {
          const tableTop = y;
          let cx = margin;
          // Header row
          doc.setFillColor("#f3f4f6");
          doc.rect(margin, y, contentWidth, TABLE_HEADER_H, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor("#374151");
          p.headers.forEach((h, i) => {
            doc.text(h, cx + 6, y + 13.5, {
              align: i === 0 ? "left" : "center",
              maxWidth: p.colWidths[i] - 8,
            });
            cx += p.colWidths[i];
          });
          y += TABLE_HEADER_H;
          // Data rows
          p.rows.forEach((row, ri) => {
            if (ri % 2 === 1) {
              doc.setFillColor("#fafafa");
              doc.rect(margin, y, contentWidth, TABLE_ROW_H, "F");
            }
            let cx2 = margin;
            row.cells.forEach((cellText, ci) => {
              doc.setFont("helvetica", ci === 0 ? "bold" : "normal");
              doc.setFontSize(8.5);
              doc.setTextColor(row.cellColors?.[ci] || "#111827");
              doc.text(cellText, cx2 + 6, y + 14.5, {
                align: ci === 0 ? "left" : "center",
                maxWidth: p.colWidths[ci] - 8,
              });
              cx2 += p.colWidths[ci];
            });
            y += TABLE_ROW_H;
          });
          // Outer border + column separators
          doc.setDrawColor("#e5e7eb");
          doc.setLineWidth(0.6);
          doc.rect(margin, tableTop, contentWidth, y - tableTop, "S");
          let sepX = margin;
          p.colWidths.slice(0, -1).forEach((w) => {
            sepX += w;
            doc.line(sepX, tableTop, sepX, y);
          });
          doc.setTextColor("#000000");
          y += 8;
          break;
        }
        case "space":
          y += p.height;
          break;
      }
    };

    const renderBlock = (pieces: Piece[]) => {
      const total = pieces.reduce((sum, p) => sum + measurePiece(p), 0);
      ensureSpace(total);
      pieces.forEach((p) => {
        // Belt-and-suspenders: if a single block is somehow taller than a
        // full page, still avoid splitting an individual waffle chart.
        if (p.type === "waffle") ensureSpace(measurePiece(p));
        drawPiece(p);
      });
      y += 10;
    };

    // --- Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor("#1f2937");
    doc.text("TreatCKD Risk Summary", margin, y);
    y += 18;
    const tabLabel = { krfe: "KFRE", prevent: "PREVENT", kdigo: "KDIGO" }[tab];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor("#6b7280");
    doc.text(
      `${tabLabel} \u2022 ${
        targetView === "patient" ? "Patient" : "Clinician"
      } view \u2022 Generated ${new Date().toLocaleDateString()}${
        applyGdmt ? " \u2022 GDMT applied" : ""
      }`,
      margin,
      y
    );
    doc.setTextColor("#000000");
    y += 20;

    // --- Patient Data (compact, first, on page 1) ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor("#1f2937");
    doc.text("Inputted Data", margin, y);
    y += 6;
    doc.setDrawColor("#d1d5db");
    doc.line(margin, y, margin + contentWidth, y);
    y += 12;

    const rows = getPatientDataRows(
      tab,
      inputMode,
      calculationState,
      manualRisks,
      inputLabels
    );
    doc.setFontSize(8.5);
    if (rows.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setTextColor("#9ca3af");
      doc.text("No patient data entered.", margin, y + 8.5);
      y += 20;
    } else {
      const colWidth = contentWidth / 3;
      const rowHeight = 14;
      rows.forEach((row, i) => {
        const col = i % 3;
        const rIdx = Math.floor(i / 3);
        const rx = margin + col * colWidth;
        const ry = y + rIdx * rowHeight + 8.5;
        doc.setFont("helvetica", "bold");
        doc.setTextColor("#374151");
        doc.text(`${row.label}:`, rx, ry);
        const labelWidth = doc.getTextWidth(`${row.label}: `);
        doc.setFont("helvetica", "normal");
        doc.setTextColor("#111827");
        doc.text(row.value, rx + labelWidth, ry);
      });
      const rowsUsed = Math.ceil(rows.length / 3);
      y += rowsUsed * rowHeight + 10;
    }
    doc.setTextColor("#000000");

    // --- Results (can spill onto as many pages as needed) ---
    ensureSpace(24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor("#1f2937");
    doc.text("Results", margin, y);
    y += 6;
    doc.setDrawColor("#d1d5db");
    doc.line(margin, y, margin + contentWidth, y);
    doc.setTextColor("#000000");
    y += 14;

    const chartSize = waffleBoxSize(waffleScale);
    const medChartSize = waffleBoxSize(waffleScale, 0.6);
    const riskCaveat =
      "This is an estimate based on people with similar health information in research studies. Your own risk could be a little higher or lower.";
    const medCaveat =
      "This is an estimate based on the average results seen in research studies of this medication. Your own results could be higher or lower.";
    const patientMeds = (ckdHr = true) => [
      {
        name: "SGLT2 inhibitor (e.g. Jardiance, Farxiga)",
        hr: hazardRatios.sglt2i,
      },
      { name: "GLP-1 medicine (e.g. Ozempic, Trulicity)", hr: hazardRatios.glp1ra },
      { name: "Finerenone (Kerendia)", hr: hazardRatios.nsmra },
    ];
    const clinicianMeds = () => [
      { name: "SGLT2i", hr: hazardRatios.sglt2i },
      { name: "GLP-1 RA", hr: hazardRatios.glp1ra },
      { name: "nsMRA", hr: hazardRatios.nsmra },
    ];

    if (targetView === "patient") {
      renderBlock([
        {
          type: "text",
          text: "These numbers come from research on large groups of people. They're meant to help you and your doctor talk through whether treatment is right for you \u2014 not to tell you what to do. You don't have to decide right away, and choosing not to start a medication is always a reasonable option.",
          fontSize: 8.5,
        },
      ]);

      if (tab === "krfe") {
        const baseRisk = currentResult.fiveYear;
        const baseCount = Math.round((baseRisk / 100) * waffleScale);
        const pieces: Piece[] = [
          { type: "title", text: "Your 5-Year Kidney Failure Risk" },
          {
            type: "text",
            text: `Out of ${waffleScale.toLocaleString()} people with your health profile, about ${baseCount.toLocaleString()} may need dialysis or a kidney transplant in the next 5 years \u2014 which also means about ${(
              waffleScale - baseCount
            ).toLocaleString()} will not.`,
          },
          { type: "caveat", text: riskCaveat },
          {
            type: "waffle",
            baseValue: baseRisk,
            treatedValue: 0,
            total: waffleScale,
            colors: PDF_WAFFLE_COLORS.krfe,
            size: chartSize,
          },
        ];
        if (applyGdmt) {
          pieces.push({ type: "subheader", text: "How Medications Can Lower Your Risk" });
          pieces.push({ type: "caveat", text: medCaveat });
          patientMeds().forEach((med) => {
            const treatedRisk = baseRisk * med.hr.ckd;
            const treatedCount = Math.round((treatedRisk / 100) * waffleScale);
            pieces.push({
              type: "text",
              text: `${med.name}: could lower the number of people affected from ${baseCount.toLocaleString()} to about ${treatedCount.toLocaleString()} in ${waffleScale.toLocaleString()} people.`,
              fontSize: 8.5,
            });
            pieces.push({
              type: "waffle",
              baseValue: baseRisk,
              treatedValue: treatedRisk,
              total: waffleScale,
              colors: PDF_WAFFLE_COLORS.krfe,
              size: medChartSize,
            });
          });
        }
        renderBlock(pieces);
      } else if (tab === "prevent") {
        const risks: {
          title: string;
          key: "cvd" | "ascvd" | "heartFailure";
          colorKey: string;
          hrKey: "cvd" | "hf";
        }[] = [
          { title: "Any Heart Disease (CVD)", key: "cvd", colorKey: "cvd", hrKey: "cvd" },
          {
            title: "Heart Attack or Stroke (ASCVD)",
            key: "ascvd",
            colorKey: "ascvd",
            hrKey: "cvd",
          },
          { title: "Heart Failure", key: "heartFailure", colorKey: "hf", hrKey: "hf" },
        ];
        risks.forEach((riskItem) => {
          const resultKey = (
            preventPeriod === "30" ? `${riskItem.key}30` : riskItem.key
          ) as "cvd" | "ascvd" | "heartFailure" | "cvd30" | "ascvd30" | "heartFailure30";
          const baseRisk = currentResult[resultKey] as number;
          const baseCount = Math.round((baseRisk / 100) * waffleScale);
          const pieces: Piece[] = [
            {
              type: "title",
              text: `${riskItem.title} Risk (${preventPeriod}-Year)`,
            },
            {
              type: "text",
              text: `Out of ${waffleScale.toLocaleString()} people like you, about ${baseCount.toLocaleString()} may develop this in ${preventPeriod} years \u2014 which also means about ${(
                waffleScale - baseCount
              ).toLocaleString()} will not.`,
            },
            { type: "caveat", text: riskCaveat },
            {
              type: "waffle",
              baseValue: baseRisk,
              treatedValue: 0,
              total: waffleScale,
              colors: PDF_WAFFLE_COLORS[riskItem.colorKey],
              size: chartSize,
            },
          ];
          if (applyGdmt) {
            const applicable = patientMeds().filter(
              (m) => m.hr[riskItem.hrKey] !== null
            );
            if (applicable.length) {
              pieces.push({ type: "subheader", text: "Medication Impact" });
              pieces.push({ type: "caveat", text: medCaveat });
              applicable.forEach((med) => {
                const treatedRisk = baseRisk * (med.hr[riskItem.hrKey] || 1);
                const treatedCount = Math.round(
                  (treatedRisk / 100) * waffleScale
                );
                pieces.push({
                  type: "text",
                  text: `${med.name}: could lower the number from ${baseCount.toLocaleString()} to ${treatedCount.toLocaleString()} in ${waffleScale.toLocaleString()} people.`,
                  fontSize: 8.5,
                });
                pieces.push({
                  type: "waffle",
                  baseValue: baseRisk,
                  treatedValue: treatedRisk,
                  total: waffleScale,
                  colors: PDF_WAFFLE_COLORS[riskItem.colorKey],
                  size: medChartSize,
                });
              });
            }
          }
          renderBlock(pieces);
        });
      } else {
        const risks: {
          title: string;
          value: number;
          colorKey: string;
          hrKey: "cvd" | "ckd";
        }[] = [
          {
            title: "Serious Heart Problems (CVD Mortality)",
            value: currentResult.cvdMortality / 10,
            colorKey: "kdigoCvd",
            hrKey: "cvd",
          },
          {
            title: "Kidney Disease Worsening",
            value: currentResult.ckdProgression / 10,
            colorKey: "kdigoCkd",
            hrKey: "ckd",
          },
        ];
        risks.forEach((riskItem) => {
          const baseRisk = riskItem.value;
          const baseCount = Math.round((baseRisk / 100) * waffleScale);
          const pieces: Piece[] = [
            { type: "title", text: `Annual Risk of ${riskItem.title}` },
            {
              type: "text",
              text: `Each year, about ${baseCount.toLocaleString()} in ${waffleScale.toLocaleString()} people like you may have this outcome \u2014 meaning about ${(
                waffleScale - baseCount
              ).toLocaleString()} will not, that year.`,
            },
            { type: "caveat", text: riskCaveat },
            {
              type: "waffle",
              baseValue: baseRisk,
              treatedValue: 0,
              total: waffleScale,
              colors: PDF_WAFFLE_COLORS[riskItem.colorKey],
              size: chartSize,
            },
          ];
          if (applyGdmt) {
            pieces.push({ type: "subheader", text: "Medication Impact" });
            pieces.push({ type: "caveat", text: medCaveat });
            patientMeds().forEach((med) => {
              const treatedRisk =
                baseRisk * (med.hr[riskItem.hrKey] || 1);
              const treatedCount = Math.round(
                (treatedRisk / 100) * waffleScale
              );
              pieces.push({
                type: "text",
                text: `${med.name}: could lower the number from ${baseCount.toLocaleString()} to ${treatedCount.toLocaleString()} in ${waffleScale.toLocaleString()} people.`,
                fontSize: 8.5,
              });
              pieces.push({
                type: "waffle",
                baseValue: baseRisk,
                treatedValue: treatedRisk,
                total: waffleScale,
                colors: PDF_WAFFLE_COLORS[riskItem.colorKey],
                size: medChartSize,
              });
            });
          }
          renderBlock(pieces);
        });
      }
    } else {
      // Clinician view: colored stat boxes + formatted tables, mirroring
      // the on-screen clinician panel instead of plain unstyled text.
      if (tab === "krfe") {
        renderBlock([
          { type: "title", text: "KFRE Results" },
          {
            type: "statBoxRow",
            boxes: [
              {
                label: "2-YEAR RISK",
                value: `${currentResult.twoYear.toFixed(1)}%`,
                bg: "#eff6ff",
                labelColor: "#1e40af",
                valueColor: "#2563eb",
              },
              {
                label: "5-YEAR RISK",
                value: `${currentResult.fiveYear.toFixed(1)}%`,
                bg: "#f0fdf4",
                labelColor: "#166534",
                valueColor: "#16a34a",
              },
              {
                label: "RISK LEVEL",
                value: currentResult.riskLevel,
                bg: "#f9fafb",
                labelColor: "#374151",
                valueColor:
                  currentResult.riskLevel === "High"
                    ? "#dc2626"
                    : currentResult.riskLevel === "Moderate"
                    ? "#ea580c"
                    : "#16a34a",
              },
            ],
          },
        ]);
        if (applyGdmt) {
          renderBlock([
            { type: "subheader", text: "Risk with GDMT Applied" },
            {
              type: "table",
              headers: ["Medication", "2-Year Risk", "5-Year Risk"],
              colWidths: [
                contentWidth * 0.4,
                contentWidth * 0.3,
                contentWidth * 0.3,
              ],
              rows: clinicianMeds().map((med) => ({
                cells: [
                  med.name,
                  `${(currentResult.twoYear * med.hr.ckd).toFixed(1)}%`,
                  `${(currentResult.fiveYear * med.hr.ckd).toFixed(1)}%`,
                ],
                cellColors: [null, "#16a34a", "#16a34a"],
              })),
            },
          ]);
        }
      } else if (tab === "prevent") {
        const pCvd =
          preventPeriod === "30" ? currentResult.cvd30 : currentResult.cvd;
        const pAscvd =
          preventPeriod === "30"
            ? currentResult.ascvd30
            : currentResult.ascvd;
        const pHf =
          preventPeriod === "30"
            ? currentResult.heartFailure30
            : currentResult.heartFailure;
        renderBlock([
          { type: "title", text: `PREVENT Results (${preventPeriod}-Year)` },
          ...(currentResult.modelLabel
            ? ([{ type: "text", text: `Model: ${currentResult.modelLabel}` }] as Piece[])
            : []),
          {
            type: "statBoxRow",
            boxes: [
              {
                label: "CVD RISK",
                value: `${pCvd.toFixed(1)}%`,
                bg: "#fef2f2",
                labelColor: "#991b1b",
                valueColor: "#dc2626",
              },
              {
                label: "ASCVD RISK",
                value: `${pAscvd.toFixed(1)}%`,
                bg: "#fff7ed",
                labelColor: "#9a3412",
                valueColor: "#ea580c",
              },
              {
                label: "HEART FAILURE",
                value: `${pHf.toFixed(1)}%`,
                bg: "#faf5ff",
                labelColor: "#6b21a8",
                valueColor: "#9333ea",
              },
            ],
          },
        ]);
        if (applyGdmt) {
          renderBlock([
            {
              type: "subheader",
              text: `Risk with GDMT Applied (${preventPeriod}-Year)`,
            },
            {
              type: "table",
              headers: ["Medication", "CVD", "ASCVD", "Heart Failure"],
              colWidths: [
                contentWidth * 0.34,
                contentWidth * 0.22,
                contentWidth * 0.22,
                contentWidth * 0.22,
              ],
              rows: clinicianMeds().map((med) => {
                const cvdCell =
                  med.hr.cvd != null
                    ? `${(pCvd * med.hr.cvd).toFixed(1)}%`
                    : "\u2014";
                const ascvdCell =
                  med.hr.cvd != null
                    ? `${(pAscvd * med.hr.cvd).toFixed(1)}%`
                    : "\u2014";
                const hfCell =
                  med.hr.hf != null
                    ? `${(pHf * med.hr.hf).toFixed(1)}%`
                    : "\u2014";
                return {
                  cells: [med.name, cvdCell, ascvdCell, hfCell],
                  cellColors: [null, "#dc2626", "#ea580c", "#9333ea"],
                };
              }),
            },
          ]);
        }
      } else {
        renderBlock([
          { type: "title", text: "KDIGO Results" },
          {
            type: "statBoxRow",
            boxes: [
              {
                label: "CVD MORTALITY",
                value: `${currentResult.cvdMortality.toFixed(1)}`,
                bg: "#fef2f2",
                labelColor: "#991b1b",
                valueColor: "#dc2626",
              },
              {
                label: "CKD PROGRESSION",
                value: `${currentResult.ckdProgression.toFixed(1)}`,
                bg: "#fff7ed",
                labelColor: "#9a3412",
                valueColor: "#ea580c",
              },
              {
                label: "CATEGORIES",
                value: `eGFR ${currentResult.egfrCategory}`,
                bg: "#f9fafb",
                labelColor: "#374151",
                valueColor: "#374151",
              },
            ],
          },
          {
            type: "text",
            text: `Rates shown as events per 1,000 person-years. eGFR category: ${currentResult.egfrCategory}. ACR category: ${currentResult.acrCategory}.`,
            fontSize: 8,
          },
        ]);
        if (applyGdmt) {
          renderBlock([
            { type: "subheader", text: "Risk with GDMT Applied" },
            {
              type: "table",
              headers: [
                "Medication",
                "CVD Mortality",
                "CKD Progression",
              ],
              colWidths: [
                contentWidth * 0.34,
                contentWidth * 0.33,
                contentWidth * 0.33,
              ],
              rows: clinicianMeds().map((med) => {
                const cvdCell =
                  med.hr.cvd != null
                    ? (currentResult.cvdMortality * med.hr.cvd).toFixed(1)
                    : "\u2014";
                const ckdCell =
                  med.hr.ckd != null
                    ? (currentResult.ckdProgression * med.hr.ckd).toFixed(1)
                    : "\u2014";
                return {
                  cells: [med.name, cvdCell, ckdCell],
                  cellColors: [null, "#dc2626", "#ea580c"],
                };
              }),
            },
            {
              type: "text",
              text: "Rates shown as events per 1,000 person-years.",
              fontSize: 8,
            },
          ]);
        }
      }
    }

    // --- Final pass: page numbers + disclaimer footer on every page ------
    const totalPages = doc.internal.getNumberOfPages();
    const disclaimerText =
      "This educational tool designed to help clinicians learn about guideline-directed medical therapy for patients with kidney disease (without dialysis) +/- concomitant heart disease. The design and development of the tool is funded by NIH K99/R00 grant 4R00HL157721-03 from the NHLBI. This tool is not certified for use in direct patient care. Please discuss specific dosing with your local cardiologist/nephrologist/pharmacist. By using this interactive application, you certify that you are a licensed healthcare professional in the United States/Canada or enrolled in a medical training program, and that you will exercise your independent clinical judgment based on patient-specific characteristics prior to applying the knowledge in your clinical practice.";
    doc.setFontSize(6.5);
    const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth);
    const footerTextH = disclaimerLines.length * 6.5 * 1.35;
    const footerTop = pageHeight - footerReserve + 4;

    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);

      // Page number, top right
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor("#9ca3af");
      doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, 22, {
        align: "right",
      });

      // Disclaimer footer, every page, small grey text
      doc.setDrawColor("#e5e7eb");
      doc.setLineWidth(0.5);
      doc.line(margin, footerTop, pageWidth - margin, footerTop);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor("#9ca3af");
      doc.text(disclaimerLines, margin, footerTop + 10);
      doc.setTextColor("#000000");
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`TreatCKD-${tab}-${targetView}-${dateStr}.pdf`);
  };

  const TabButton = memo(({ id, label, icon: Icon, active, onClick }: any) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all text-sm ${
        active
          ? "bg-purple-600 text-white shadow-lg"
          : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
      }`}
    >
      {" "}
      <Icon className="w-4 h-4 mr-2" /> {label}{" "}
    </button>
  ));
  const ViewToggle = memo(() => (
    <div className="flex rounded border border-gray-300 overflow-hidden">
      {" "}
      <button
        type="button"
        onClick={() => setViewMode("clinician")}
        className={`flex items-center px-3 py-1 text-xs font-medium transition-colors ${
          viewMode === "clinician"
            ? "bg-purple-600 text-white"
            : "bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        {" "}
        <User className="w-3 h-3 mr-1" /> Clinician{" "}
      </button>{" "}
      <button
        type="button"
        onClick={() => setViewMode("patient")}
        className={`flex items-center px-3 py-1 text-xs font-medium transition-colors ${
          viewMode === "patient"
            ? "bg-purple-600 text-white"
            : "bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        {" "}
        <Users className="w-3 h-3 mr-1" /> Patient{" "}
      </button>{" "}
    </div>
  ));

  // Enhanced LearnTab with sticky sidebar navigation
  const LearnTab = () => {
    const tabData = explanations.learn[activeLearnTab];

    // Safety check to prevent errors if data isn't loaded
    if (!tabData || !tabData.sections) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center py-8">
            <p className="text-gray-500">Loading content...</p>
          </div>
        </div>
      );
    }

    const sectionKeys = Object.keys(tabData.sections);

    const scrollToSection = (index: number) => {
      const element = document.getElementById(`section-${index}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        setActiveSectionIndex(index);
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Learn About Guideline-Directed Medical Therapy
          </h2>
          <p className="text-base text-gray-600">
            Explore evidence-based recommendations and clinical insights for
            cardiovascular-kidney-metabolic care.
          </p>
        </div>

        {/* Sub-tab Navigation - Sticky */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex flex-wrap gap-3">
              {[
                { id: "ckm", label: "CKM Syndrome", color: "purple" },
                { id: "gdmt", label: "GDMT", color: "indigo" },
                { id: "sglt2i", label: "SGLT2i", color: "blue" },
                { id: "glp1ra", label: "GLP-1 RA", color: "green" },
                { id: "nsmra", label: "nsMRA", color: "yellow" },
                { id: "krfe", label: "KFRE", color: "red" },
                { id: "prevent", label: "PREVENT", color: "pink" },
                { id: "kdigo", label: "KDIGO", color: "teal" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveLearnTab(tab.id as any);
                    setActiveSectionIndex(0);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeLearnTab === tab.id
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content with Sidebar Navigation */}
        <div className="flex min-h-0">
          {/* Sidebar Navigation - Sticky */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 p-6 sticky top-[120px] h-[calc(100vh-120px)] overflow-y-auto shrink-0">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {tabData.title}
            </h3>
            <nav className="space-y-2">
              {sectionKeys.map((key, index) => {
                const section = tabData.sections[key];
                return (
                  <button
                    key={index}
                    onClick={() => scrollToSection(index)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      activeSectionIndex === index
                        ? "bg-purple-100 text-purple-800 border-l-4 border-purple-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="font-medium text-sm leading-tight">
                      {section.title}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8">
            <div className="max-w-4xl">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">
                {tabData.title}
              </h1>

              <div className="space-y-12">
                {sectionKeys.map((key, index) => {
                  const section = tabData.sections[key];
                  return (
                    <div
                      key={index}
                      id={`section-${index}`}
                      className="scroll-mt-6"
                    >
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-purple-200">
                          {section.title}
                        </h2>
                        <div className="prose prose-lg max-w-none">
                          <div className="text-gray-700 leading-relaxed text-base whitespace-pre-line">
                            {section.content
                              .split("•")
                              .map((item, itemIndex) => {
                                if (itemIndex === 0) {
                                  return (
                                    <div key={itemIndex} className="mb-4">
                                      {item}
                                    </div>
                                  );
                                }
                                return (
                                  <div key={itemIndex} className="flex mb-3">
                                    <span className="text-purple-600 font-bold mr-3 mt-1">
                                      •
                                    </span>
                                    <span className="flex-1">
                                      {item.trim()}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        {section.source && (
                          <div className="mt-6 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                            <div className="text-sm text-purple-800">
                              <span className="font-semibold">Source:</span>{" "}
                              {section.source}
                              {section.doi && (
                                <div className="mt-2">
                                  {section.doi
                                    .split(";")
                                    .map((doi, doiIndex) => (
                                      <a
                                        key={doiIndex}
                                        href={doi.trim()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block mr-3 mb-1 px-3 py-1 bg-purple-600 text-white text-xs rounded-full hover:bg-purple-700 transition-colors"
                                      >
                                        View Guidelines {doiIndex + 1} →
                                      </a>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AboutTab = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        About the Development Team
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        This clinical decision support tool was developed by a team of
        clinicians and researchers. The design and development of the tool is
        funded by{" "}
        <a href="https://reporter.nih.gov/search/udg-cplEvEK4cD7EVYK_jA/project-details/10995478">
          <strong>
            NIH K99/R00 Pathway to Independence grant from the National Heart,
            Lung, and Blood Institute
          </strong>
        </a>{" "}
        awarded to Dr Lamprea-Montealegre, entitled: Closing the Cardio-Renal
        Preventive Treatment Gap Among Patients with Type 2 Diabetes Mellitus
        and Chronic Kidney Disease: An Implementation Science Approach.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {explanations.about.team.map((member, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-gray-200"
          >
            <div className="flex justify-center mb-4">
              <img
                src={member.image}
                alt={member.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {member.name}
              </h3>
              <p className="text-sm font-medium text-purple-600 mb-2">
                {member.title}
              </p>
              <p className="text-sm text-gray-600 mb-3">{member.institution}</p>
              <p className="text-xs text-gray-700 mb-4">{member.bio}</p>
              <a
                href={member.bioLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-xs rounded-full hover:bg-purple-700 transition-colors"
              >
                View Profile
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const SpecificationsTab = () => {
    const [hrInputs, setHrInputs] = useState({});
    const [hrErrors, setHrErrors] = useState({});

    // Handle HR input change
    const handleHrInputChange = (medication, outcome, value) => {
      const key = `${medication}-${outcome}`;
      setHrInputs((prev) => ({ ...prev, [key]: value }));

      // Validate
      if (value === "") {
        setHrErrors((prev) => ({ ...prev, [key]: null }));
        return;
      }

      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        setHrErrors((prev) => ({ ...prev, [key]: "Must be a number" }));
      } else if (numValue <= 0) {
        setHrErrors((prev) => ({ ...prev, [key]: "Must be greater than 0" }));
      } else if (numValue >= 10) {
        setHrErrors((prev) => ({ ...prev, [key]: "Must be less than 10" }));
      } else {
        setHrErrors((prev) => ({ ...prev, [key]: null }));
      }
    };

    // Handle HR input blur (apply custom value)
    const handleHrInputBlur = (medication, outcome, value) => {
      const key = `${medication}-${outcome}`;
      if (value === "" || hrErrors[key]) {
        return;
      }

      const numValue = parseFloat(value);
      setCustomHazardRatios((prev) => ({
        ...prev,
        [medication]: {
          ...prev[medication],
          [outcome]: numValue,
        },
      }));
    };

    // Handle removing custom HR
    const handleRemoveCustomHR = (medication, outcome) => {
      setCustomHazardRatios((prev) => ({
        ...prev,
        [medication]: {
          ...prev[medication],
          [outcome]: null,
        },
      }));
      const key = `${medication}-${outcome}`;
      setHrInputs((prev) => {
        const newInputs = { ...prev };
        delete newInputs[key];
        return newInputs;
      });
      setHrErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    };

    // Render HR cell with input capability
    const renderHRCell = (value, medication, outcome, defaultValue) => {
      const key = `${medication}-${outcome}`;
      const hasCustom = hasCustomHR(medication, outcome);
      const inputValue = hrInputs[key] ?? "";
      const error = hrErrors[key];

      if (defaultValue === null) {
        return <td className="px-6 py-4 text-gray-400">Not available</td>;
      }

      return (
        <td className="px-6 py-4">
          <div className="space-y-2">
            {/* Default value display */}
            <div className="text-xs text-gray-500">
              <span className="font-medium">Literature: </span>
              {value}
            </div>

            {/* Custom input or display */}
            {hasCustom ? (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-sm font-medium text-purple-700">
                    Custom: {customHazardRatios[medication][outcome]}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveCustomHR(medication, outcome)}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Remove custom value"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) =>
                    handleHrInputChange(medication, outcome, e.target.value)
                  }
                  onBlur={(e) =>
                    handleHrInputBlur(medication, outcome, e.target.value)
                  }
                  placeholder="Custom HR"
                  className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
                    error
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-purple-500"
                  }`}
                />
              </div>
            )}
            {error && <div className="text-xs text-red-600">{error}</div>}
          </div>
        </td>
      );
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Risk Calculator Specifications
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          This tool is intended for clinical use and provides risk estimations
          based on published equations. The input fields have validation ranges
          to ensure data quality. "Soft" bounds will trigger a warning for
          unusual values, while "Hard" bounds will prevent calculation for
          physiologically impossible values.
        </p>

        {/* Hazard Ratios Table */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Risk Reduction When Each Medication is Applied
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            You can input custom hazard ratios for each medication-outcome
            combination. The literature values are shown for reference. Custom
            values must be numeric, greater than 0, and less than 10.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Outcome
                  </th>
                  <th scope="col" className="px-6 py-3">
                    SGLT2i
                    <br />
                    Hazard Ratio
                  </th>
                  <th scope="col" className="px-6 py-3">
                    GLP-1 RA
                    <br />
                    Hazard Ratio
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Finerenone
                    <br />
                    Hazard Ratio
                  </th>
                </tr>
              </thead>
              <tbody>
                {explanations.hazardRatios.table.map((row, index) => {
                  const outcomes = ["cvd", "hf", "ckd"];
                  const outcome = outcomes[index];
                  return (
                    <tr key={index} className="bg-white border-b">
                      <th
                        scope="row"
                        className="px-6 py-4 font-medium text-gray-900"
                      >
                        {row.outcome}
                      </th>
                      {renderHRCell(
                        row.sglt2i,
                        "sglt2i",
                        outcome,
                        defaultHazardRatios.sglt2i[outcome]
                      )}
                      {renderHRCell(
                        row.glp1ra,
                        "glp1ra",
                        outcome,
                        defaultHazardRatios.glp1ra[outcome]
                      )}
                      {renderHRCell(
                        row.nsmra,
                        "nsmra",
                        outcome,
                        defaultHazardRatios.nsmra[outcome]
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Values in parentheses represent 95% confidence intervals from
            published literature.
          </p>
        </div>

        {/* Input Validation Table */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Input Validation Ranges
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Variable
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Unit
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Soft Lower
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Hard Lower
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Soft Upper
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Hard Upper
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(validationConfig).map(([key, value]) => (
                  <tr key={key} className="bg-white border-b">
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </th>
                    <td className="px-6 py-4">{value.unit}</td>
                    <td className="px-6 py-4">{value.softMin}</td>
                    <td className="px-6 py-4">{value.hardMin}</td>
                    <td className="px-6 py-4">{value.softMax}</td>
                    <td className="px-6 py-4">{value.hardMax}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (hasHardErrors) {
      return (
        <div className="text-center py-8 px-4">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-bold text-red-700">Calculation Error</h3>
          <p className="text-gray-600 text-sm mt-2">
            One or more inputs are outside the physiologically possible range.
            Please review your entries.
          </p>
        </div>
      );
    }

    const currentResult = results[activeTab as "krfe" | "prevent" | "kdigo"];
    const hazardRatios = getEffectiveHazardRatios();

    if (!currentResult) {
      return (
        <div className="text-center py-8">
          {" "}
          <div className="text-gray-400 mb-2">
            {" "}
            {activeTab === "krfe" && (
              <Droplets className="w-12 h-12 mx-auto" />
            )}{" "}
            {activeTab === "prevent" && <Heart className="w-12 h-12 mx-auto" />}{" "}
            {activeTab === "kdigo" && <Zap className="w-12 h-12 mx-auto" />}{" "}
          </div>{" "}
          <p className="text-gray-500 text-sm">
            Enter required patient data to calculate risk
          </p>{" "}
        </div>
      );
    }

    if (viewMode === "clinician") {
      return (
        <>
          {" "}
          {activeTab === "krfe" && (
            <div className="space-y-4">
              {" "}
              <div className="grid grid-cols-2 gap-4">
                {" "}
                <div className="p-3 bg-blue-50 rounded">
                  <h4 className="font-semibold text-blue-800 text-sm">
                    2-Year Risk
                  </h4>
                  <p className="text-xl font-bold text-blue-600">
                    {currentResult.twoYear.toFixed(1)}%
                  </p>
                </div>{" "}
                <div className="p-3 bg-green-50 rounded">
                  <h4 className="font-semibold text-green-800 text-sm">
                    5-Year Risk
                  </h4>
                  <p className="text-xl font-bold text-green-600">
                    {currentResult.fiveYear.toFixed(1)}%
                  </p>
                </div>{" "}
              </div>{" "}
              <div className="p-3 bg-gray-50 rounded">
                <h4 className="font-semibold text-gray-800 text-sm">
                  Risk Level
                </h4>
                <p
                  className={`font-medium ${
                    currentResult.riskLevel === "High"
                      ? "text-red-600"
                      : currentResult.riskLevel === "Moderate"
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {currentResult.riskLevel}
                </p>
              </div>{" "}
            </div>
          )}{" "}
          {activeTab === "prevent" && (
            <div className="space-y-4">
              {" "}
              {currentResult.modelLabel && (
                <div className="px-2 py-1 bg-purple-50 border border-purple-200 rounded text-xs text-purple-800 font-medium">
                  Model: {currentResult.modelLabel}
                </div>
              )}
              <div className="flex justify-center">
                <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-white">
                  <button
                    onClick={() => setPreventPeriod("10")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      preventPeriod === "10"
                        ? "bg-purple-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    10-Year
                  </button>
                  <button
                    onClick={() => setPreventPeriod("30")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      preventPeriod === "30"
                        ? "bg-purple-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    30-Year
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {" "}
                <div className="p-3 bg-red-50 rounded">
                  <h4 className="font-semibold text-red-800 text-xs">
                    CVD Risk
                  </h4>
                  <p className="text-lg font-bold text-red-600">
                    {(preventPeriod === "30"
                      ? currentResult.cvd30
                      : currentResult.cvd
                    ).toFixed(1)}
                    %
                  </p>
                </div>{" "}
                <div className="p-3 bg-orange-50 rounded">
                  <h4 className="font-semibold text-orange-800 text-xs">
                    ASCVD Risk
                  </h4>
                  <p className="text-lg font-bold text-orange-600">
                    {(preventPeriod === "30"
                      ? currentResult.ascvd30
                      : currentResult.ascvd
                    ).toFixed(1)}
                    %
                  </p>
                </div>{" "}
                <div className="p-3 bg-purple-50 rounded">
                  <h4 className="font-semibold text-purple-800 text-xs">
                    Heart Failure
                  </h4>
                  <p className="text-lg font-bold text-purple-600">
                    {(preventPeriod === "30"
                      ? currentResult.heartFailure30
                      : currentResult.heartFailure
                    ).toFixed(1)}
                    %
                  </p>
                </div>{" "}
              </div>{" "}
            </div>
          )}{" "}
          {activeTab === "kdigo" && (
            <div className="space-y-4">
              {" "}
              <div className="grid grid-cols-2 gap-4">
                {" "}
                <div className="p-3 bg-red-50 rounded">
                  <h4 className="font-semibold text-red-800 text-sm">
                    CVD Mortality
                  </h4>
                  <p className="text-lg font-bold text-red-600">
                    {currentResult.cvdMortality.toFixed(1)}
                  </p>
                  <p className="text-xs text-red-700">events/1000 py</p>
                </div>{" "}
                <div className="p-3 bg-orange-50 rounded">
                  <h4 className="font-semibold text-orange-800 text-sm">
                    CKD Progression
                  </h4>
                  <p className="text-lg font-bold text-orange-600">
                    {currentResult.ckdProgression.toFixed(1)}
                  </p>
                  <p className="text-xs text-orange-700">events/1000 py</p>
                </div>{" "}
              </div>{" "}
              <div className="p-3 bg-gray-50 rounded">
                <h4 className="font-semibold text-gray-800 text-sm">
                  Categories
                </h4>
                <p className="text-sm text-gray-700">
                  eGFR: {currentResult.egfrCategory} | ACR:{" "}
                  {currentResult.acrCategory}
                </p>
              </div>{" "}
            </div>
          )}{" "}
          {applyGdmt && (
            <div className="mt-4 pt-4 border-t">
              {" "}
              <h3 className="text-md font-bold text-gray-800 mb-3">
                Risk with GDMT Applied
              </h3>{" "}
              {activeTab === "krfe" && (
                <div className="space-y-2">
                  <CustomHRNotification
                    medications={[
                      { name: "SGLT2i", key: "sglt2i", outcome: "ckd" },
                      { name: "GLP-1 RA", key: "glp1ra", outcome: "ckd" },
                      { name: "nsMRA", key: "nsmra", outcome: "ckd" },
                    ]}
                  />{" "}
                  <div className="grid grid-cols-5 items-center text-center text-xs font-semibold text-gray-600">
                    <div className="text-left">Medication</div>
                    <div>2-Year Risk</div>
                    <div>5-Year Risk</div>
                    <div>Evidence</div>
                    <div></div>
                  </div>{" "}
                  <div className="grid grid-cols-5 items-center p-2 rounded bg-gray-50">
                    {" "}
                    <div className="font-semibold text-sm text-gray-800">
                      SGLT2i
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {(
                        currentResult.twoYear * hazardRatios.sglt2i.ckd
                      ).toFixed(1)}
                      %
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {(
                        currentResult.fiveYear * hazardRatios.sglt2i.ckd
                      ).toFixed(1)}
                      %
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleEvidenceClick("sglt2i", "ckd")}
                        className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                      >
                        See Evidence
                      </button>
                    </div>
                    <div></div>{" "}
                  </div>{" "}
                  <div className="grid grid-cols-5 items-center p-2 rounded bg-gray-50">
                    {" "}
                    <div className="font-semibold text-sm text-gray-800">
                      GLP-1 RA
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {(
                        currentResult.twoYear * hazardRatios.glp1ra.ckd
                      ).toFixed(1)}
                      %
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {(
                        currentResult.fiveYear * hazardRatios.glp1ra.ckd
                      ).toFixed(1)}
                      %
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleEvidenceClick("glp1ra", "ckd")}
                        className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                      >
                        See Evidence
                      </button>
                    </div>
                    <div></div>{" "}
                  </div>{" "}
                  <div className="grid grid-cols-5 items-center p-2 rounded bg-gray-50">
                    {" "}
                    <div className="font-semibold text-sm text-gray-800">
                      nsMRA
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {(currentResult.twoYear * hazardRatios.nsmra.ckd).toFixed(
                        1
                      )}
                      %
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {(
                        currentResult.fiveYear * hazardRatios.nsmra.ckd
                      ).toFixed(1)}
                      %
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleEvidenceClick("nsmra", "ckd")}
                        className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                      >
                        See Evidence
                      </button>
                    </div>
                    <div></div>{" "}
                  </div>{" "}
                </div>
              )}{" "}
              {activeTab === "prevent" && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 italic">
                    Applying GDMT to the {preventPeriod}-Year risk (toggle
                    above to switch).
                  </div>
                  <CustomHRNotification
                    medications={[
                      { name: "SGLT2i (CVD)", key: "sglt2i", outcome: "cvd" },
                      { name: "SGLT2i (HF)", key: "sglt2i", outcome: "hf" },
                      { name: "GLP-1 RA (CVD)", key: "glp1ra", outcome: "cvd" },
                      { name: "nsMRA (CVD)", key: "nsmra", outcome: "cvd" },
                      { name: "nsMRA (HF)", key: "nsmra", outcome: "hf" },
                    ]}
                  />{" "}
                  <div className="grid grid-cols-5 gap-3 text-center text-xs font-semibold text-gray-600">
                    <div className="text-left">Medication</div>
                    <div>CVD</div>
                    <div>ASCVD</div>
                    <div>HF</div>
                    <div>Evidence</div>
                  </div>{" "}
                  {[
                    { name: "SGLT2i", hr: hazardRatios.sglt2i, key: "sglt2i" },
                    {
                      name: "GLP-1 RA",
                      hr: hazardRatios.glp1ra,
                      key: "glp1ra",
                    },
                    { name: "nsMRA", hr: hazardRatios.nsmra, key: "nsmra" },
                  ].map((med) => {
                    const baseCvd =
                      preventPeriod === "30"
                        ? currentResult.cvd30
                        : currentResult.cvd;
                    const baseAscvd =
                      preventPeriod === "30"
                        ? currentResult.ascvd30
                        : currentResult.ascvd;
                    const baseHf =
                      preventPeriod === "30"
                        ? currentResult.heartFailure30
                        : currentResult.heartFailure;
                    return (
                    <div
                      key={med.name}
                      className="grid grid-cols-5 gap-3 p-2 rounded bg-gray-50 items-center"
                    >
                      {" "}
                      <div className="font-semibold text-sm text-gray-800">
                        {med.name}
                      </div>{" "}
                      <div className="text-center text-lg font-bold text-red-600">
                        {(baseCvd * med.hr.cvd).toFixed(1)}%<br />
                        <button
                          onClick={() =>
                            handleEvidenceClick(
                              med.key as "sglt2i" | "glp1ra" | "nsmra",
                              "cvd"
                            )
                          }
                          className="px-1 py-0.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors mt-1"
                        >
                          Evidence
                        </button>
                      </div>{" "}
                      <div className="text-center text-lg font-bold text-orange-600">
                        {(baseAscvd * med.hr.cvd).toFixed(1)}%<br />
                        <button
                          onClick={() =>
                            handleEvidenceClick(
                              med.key as "sglt2i" | "glp1ra" | "nsmra",
                              "cvd"
                            )
                          }
                          className="px-1 py-0.5 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded transition-colors mt-1"
                        >
                          Evidence
                        </button>
                      </div>{" "}
                      <div className="text-center text-lg font-bold text-purple-600">
                        {med.hr.hf
                          ? `${(baseHf * med.hr.hf).toFixed(
                              1
                            )}%`
                          : "N/A"}
                        {med.hr.hf && (
                          <>
                            <br />
                            <button
                              onClick={() =>
                                handleEvidenceClick(
                                  med.key as "sglt2i" | "glp1ra" | "nsmra",
                                  "hf"
                                )
                              }
                              className="px-1 py-0.5 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors mt-1"
                            >
                              Evidence
                            </button>
                          </>
                        )}
                      </div>{" "}
                      <div className="text-center">
                        <span className="text-xs text-gray-500">
                          See individual
                          <br />
                          outcome evidence
                        </span>
                      </div>{" "}
                    </div>
                    );
                  })}{" "}
                </div>
              )}{" "}
              {activeTab === "kdigo" && (
                <div className="space-y-2">
                  <CustomHRNotification
                    medications={[
                      { name: "SGLT2i (CVD)", key: "sglt2i", outcome: "cvd" },
                      { name: "SGLT2i (CKD)", key: "sglt2i", outcome: "ckd" },
                      { name: "GLP-1 RA (CVD)", key: "glp1ra", outcome: "cvd" },
                      { name: "GLP-1 RA (CKD)", key: "glp1ra", outcome: "ckd" },
                      { name: "nsMRA (CVD)", key: "nsmra", outcome: "cvd" },
                      { name: "nsMRA (CKD)", key: "nsmra", outcome: "ckd" },
                    ]}
                  />{" "}
                  <div className="grid grid-cols-4 gap-3 text-center text-xs font-semibold text-gray-600">
                    <div className="text-left">Medication</div>
                    <div>CVD Mortality</div>
                    <div>CKD Progression</div>
                    <div>Evidence</div>
                  </div>{" "}
                  {[
                    { name: "SGLT2i", hr: hazardRatios.sglt2i, key: "sglt2i" },
                    {
                      name: "GLP-1 RA",
                      hr: hazardRatios.glp1ra,
                      key: "glp1ra",
                    },
                    { name: "nsMRA", hr: hazardRatios.nsmra, key: "nsmra" },
                  ].map((med) => (
                    <div
                      key={med.name}
                      className="grid grid-cols-4 gap-3 p-2 rounded bg-gray-50 items-center"
                    >
                      {" "}
                      <div className="font-semibold text-sm text-gray-800">
                        {med.name}
                      </div>{" "}
                      <div className="text-center text-lg font-bold text-red-600">
                        {(currentResult.cvdMortality * med.hr.cvd).toFixed(1)}
                        <br />
                        <button
                          onClick={() =>
                            handleEvidenceClick(
                              med.key as "sglt2i" | "glp1ra" | "nsmra",
                              "cvd"
                            )
                          }
                          className="px-1 py-0.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors mt-1"
                        >
                          Evidence
                        </button>
                      </div>{" "}
                      <div className="text-center text-lg font-bold text-orange-600">
                        {(currentResult.ckdProgression * med.hr.ckd).toFixed(1)}
                        <br />
                        <button
                          onClick={() =>
                            handleEvidenceClick(
                              med.key as "sglt2i" | "glp1ra" | "nsmra",
                              "ckd"
                            )
                          }
                          className="px-1 py-0.5 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded transition-colors mt-1"
                        >
                          Evidence
                        </button>
                      </div>{" "}
                      <div className="text-center">
                        <span className="text-xs text-gray-500">
                          See individual
                          <br />
                          outcome evidence
                        </span>
                      </div>{" "}
                    </div>
                  ))}{" "}
                </div>
              )}{" "}
            </div>
          )}{" "}
        </>
      );
    } else {
      // Patient View
      const waffleColors = {
        krfe: {
          base: "bg-blue-300",
          treated: "bg-blue-600",
          bg: "bg-gray-200",
        },
        cvd: { base: "bg-red-300", treated: "bg-red-600", bg: "bg-gray-200" },
        ascvd: {
          base: "bg-orange-300",
          treated: "bg-orange-600",
          bg: "bg-gray-200",
        },
        hf: {
          base: "bg-purple-300",
          treated: "bg-purple-600",
          bg: "bg-gray-200",
        },
        kdigoCvd: {
          base: "bg-red-300",
          treated: "bg-red-600",
          bg: "bg-gray-200",
        },
        kdigoCkd: {
          base: "bg-orange-300",
          treated: "bg-orange-600",
          bg: "bg-gray-200",
        },
      };

      if (activeTab === "krfe") {
        const baseRisk = currentResult.fiveYear;
        const meds = [
          {
            name: "SGLT2 inhibitor (e.g. Jardiance, Farxiga)",
            risk: baseRisk * hazardRatios.sglt2i.ckd,
          },
          {
            name: "GLP-1 medicine (e.g. Ozempic, Trulicity)",
            risk: baseRisk * hazardRatios.glp1ra.ckd,
          },
          {
            name: "Finerenone (Kerendia)",
            risk: baseRisk * hazardRatios.nsmra.ckd,
          },
        ];
        const baseCount = Math.round((baseRisk / 100) * waffleScale);
        return (
          <div className="space-y-6">
            {" "}
            <PatientDecisionNote />
            {/* Scale Toggle */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-white">
                <button
                  onClick={() => setWaffleScale(100)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    waffleScale === 100
                      ? "bg-purple-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Out of 100
                </button>
                <button
                  onClick={() => setWaffleScale(1000)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    waffleScale === 1000
                      ? "bg-purple-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Out of 1,000
                </button>
                <button
                  onClick={() => setWaffleScale(10000)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    waffleScale === 10000
                      ? "bg-purple-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Out of 10,000
                </button>
              </div>
            </div>
            <div>
              {" "}
              <button
                onClick={() => toggleOutcome("krfe-main")}
                className="w-full flex items-center justify-between mb-2 text-left"
              >
                <h4 className="font-semibold text-blue-800">
                  Your 5-Year Kidney Failure Risk
                </h4>
                {collapsedOutcomes["krfe-main"] ? (
                  <ChevronDown className="w-4 h-4 shrink-0 text-gray-500" />
                ) : (
                  <ChevronUp className="w-4 h-4 shrink-0 text-gray-500" />
                )}
              </button>{" "}
              {!collapsedOutcomes["krfe-main"] && (
                <>
                  <p className="text-sm text-gray-700 mb-3">
                    {" "}
                    Out of {waffleScale.toLocaleString()} people with your
                    health profile, about{" "}
                    <strong>{baseCount.toLocaleString()}</strong> may need
                    dialysis or a kidney transplant in the next 5 years —
                    which also means about{" "}
                    <strong>
                      {(waffleScale - baseCount).toLocaleString()}
                    </strong>{" "}
                    will not.{" "}
                  </p>{" "}
                  <EstimateCaveat />
                  <div className="flex justify-center p-4 bg-gray-50 rounded-lg mt-3">
                    {" "}
                    <WaffleChart
                      baseValue={baseRisk}
                      treatedValue={0}
                      colors={waffleColors.krfe}
                      total={waffleScale}
                    />{" "}
                  </div>{" "}
                </>
              )}
            </div>{" "}
            {applyGdmt && (
              <div className="space-y-4 pt-4 border-t">
                {" "}
                <button
                  onClick={() => toggleMedImpact("krfe-main")}
                  className="w-full flex items-center justify-between mb-2 text-left"
                >
                  <h4 className="font-semibold text-gray-800">
                    How Medications Can Lower Your Risk:
                  </h4>
                  {collapsedMedImpact["krfe-main"] ? (
                    <ChevronDown className="w-4 h-4 shrink-0 text-gray-500" />
                  ) : (
                    <ChevronUp className="w-4 h-4 shrink-0 text-gray-500" />
                  )}
                </button>{" "}
                {!collapsedMedImpact["krfe-main"] && (
                  <>
                    <EstimateCaveat variant="medication" />
                    {meds.map((med) => (
                      <div
                        key={med.name}
                        className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg mt-3"
                      >
                        {" "}
                        <div className="flex-1">
                          {" "}
                          <h5 className="font-bold text-blue-900">
                            {med.name}
                          </h5>{" "}
                          <p className="text-sm text-gray-700">
                            This medication could lower the number of people
                            affected from{" "}
                            {Math.round(
                              (baseRisk / 100) * waffleScale
                            ).toLocaleString()}{" "}
                            to about{" "}
                            <strong>
                              {Math.round(
                                (med.risk / 100) * waffleScale
                              ).toLocaleString()}{" "}
                              in {waffleScale.toLocaleString()} people
                            </strong>
                            .
                          </p>{" "}
                        </div>{" "}
                        <WaffleChart
                          baseValue={baseRisk}
                          treatedValue={med.risk}
                          colors={waffleColors.krfe}
                          total={waffleScale}
                        />{" "}
                      </div>
                    ))}{" "}
                  </>
                )}
              </div>
            )}{" "}
          </div>
        );
      }
      if (activeTab === "prevent") {
        const risks = [
          {
            title: "Any Heart Disease (CVD)",
            key: "cvd",
            colorKey: "cvd",
            hrKey: "cvd",
          },
          {
            title: "Heart Attack or Stroke (ASCVD)",
            key: "ascvd",
            colorKey: "ascvd",
            hrKey: "cvd",
          },
          {
            title: "Heart Failure",
            key: "heartFailure",
            colorKey: "hf",
            hrKey: "hf",
          },
        ];
        const meds = [
          {
            name: "SGLT2 inhibitor (e.g. Jardiance, Farxiga)",
            hr: hazardRatios.sglt2i,
          },
          {
            name: "GLP-1 medicine (e.g. Ozempic, Trulicity)",
            hr: hazardRatios.glp1ra,
          },
          { name: "Finerenone (Kerendia)", hr: hazardRatios.nsmra },
        ];

        return (
          <div className="space-y-6">
            <PatientDecisionNote />
            {/* Time Horizon Toggle */}
            <div className="flex justify-center mb-2">
              <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-white">
                <button
                  onClick={() => setPreventPeriod("10")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    preventPeriod === "10"
                      ? "bg-purple-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  10-Year Risk
                </button>
                <button
                  onClick={() => setPreventPeriod("30")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    preventPeriod === "30"
                      ? "bg-purple-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  30-Year Risk
                </button>
              </div>
            </div>
            {/* Scale Toggle */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-white">
                <button
                  onClick={() => setWaffleScale(100)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    waffleScale === 100
                      ? "bg-purple-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Out of 100
                </button>
                <button
                  onClick={() => setWaffleScale(1000)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    waffleScale === 1000
                      ? "bg-purple-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Out of 1,000
                </button>
                <button
                  onClick={() => setWaffleScale(10000)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    waffleScale === 10000
                      ? "bg-purple-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Out of 10,000
                </button>
              </div>
            </div>
            {risks.map((riskItem) => {
              const resultKey = (
                preventPeriod === "30" ? `${riskItem.key}30` : riskItem.key
              ) as keyof typeof currentResult;
              const baseRisk = currentResult[resultKey] as number;
              const baseCount = Math.round((baseRisk / 100) * waffleScale);
              return (
                <div key={riskItem.key} className="p-4 rounded-lg bg-gray-50">
                  <button
                    onClick={() => toggleOutcome(`prevent-${riskItem.key}`)}
                    className="w-full flex items-center justify-between mb-2 text-left"
                  >
                    <h4 className="font-semibold text-gray-800">
                      {riskItem.title} Risk ({preventPeriod}-Year)
                    </h4>
                    {collapsedOutcomes[`prevent-${riskItem.key}`] ? (
                      <ChevronDown className="w-4 h-4 shrink-0 text-gray-500" />
                    ) : (
                      <ChevronUp className="w-4 h-4 shrink-0 text-gray-500" />
                    )}
                  </button>
                  {!collapsedOutcomes[`prevent-${riskItem.key}`] && (
                    <>
                      <p className="text-sm text-gray-700 mb-3">
                        Out of {waffleScale.toLocaleString()} people like you,
                        about{" "}
                        <strong>{baseCount.toLocaleString()}</strong> may
                        develop this in {preventPeriod} years — which also
                        means about{" "}
                        <strong>
                          {(waffleScale - baseCount).toLocaleString()}
                        </strong>{" "}
                        will not.
                      </p>
                      <EstimateCaveat />
                      <div className="flex justify-center mb-3 mt-3">
                        <WaffleChart
                          baseValue={baseRisk}
                          treatedValue={0}
                          colors={
                            waffleColors[
                              riskItem.colorKey as keyof typeof waffleColors
                            ]
                          }
                          total={waffleScale}
                        />
                      </div>
                      {applyGdmt && (
                        <div className="pt-4 mt-4 border-t">
                          <button
                            onClick={() =>
                              toggleMedImpact(`prevent-${riskItem.key}`)
                            }
                            className="w-full flex items-center justify-between mb-2 text-left"
                          >
                            <h5 className="font-semibold text-gray-800 text-sm">
                              Medication Impact:
                            </h5>
                            {collapsedMedImpact[
                              `prevent-${riskItem.key}`
                            ] ? (
                              <ChevronDown className="w-4 h-4 shrink-0 text-gray-500" />
                            ) : (
                              <ChevronUp className="w-4 h-4 shrink-0 text-gray-500" />
                            )}
                          </button>
                          {!collapsedMedImpact[
                            `prevent-${riskItem.key}`
                          ] && (
                            <div className="space-y-4">
                              <EstimateCaveat variant="medication" />
                              {meds
                                .filter(
                                  (med) =>
                                    med.hr[
                                      riskItem.hrKey as keyof typeof med.hr
                                    ] !== null
                                )
                                .map((med) => {
                                  const treatedRisk =
                                    baseRisk *
                                    (med.hr[
                                      riskItem.hrKey as keyof typeof med.hr
                                    ] || 1);
                                  return (
                                    <div
                                      key={med.name}
                                      className="flex items-center gap-4 p-3 bg-white rounded-lg border"
                                    >
                                      <div className="flex-1">
                                        <h5 className="font-bold text-gray-900">
                                          {med.name}
                                        </h5>
                                        <p className="text-sm text-gray-700">
                                          Could lower the number from{" "}
                                          {Math.round(
                                            (baseRisk / 100) * waffleScale
                                          ).toLocaleString()}{" "}
                                          to{" "}
                                          <strong>
                                            {Math.round(
                                              (treatedRisk / 100) *
                                                waffleScale
                                            ).toLocaleString()}{" "}
                                            in {waffleScale.toLocaleString()}{" "}
                                            people
                                          </strong>
                                          .
                                        </p>
                                      </div>
                                      <WaffleChart
                                        baseValue={baseRisk}
                                        treatedValue={treatedRisk}
                                        colors={
                                          waffleColors[
                                            riskItem.colorKey as keyof typeof waffleColors
                                          ]
                                        }
                                        total={waffleScale}
                                      />
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        );
      }
      if (activeTab === "kdigo") {
        const risks = [
          {
            title: "Serious Heart Problems (CVD Mortality)",
            value: currentResult.cvdMortality / 10,
            colorKey: "kdigoCvd",
            hrKey: "cvd",
          },
          {
            title: "Kidney Disease Worsening",
            value: currentResult.ckdProgression / 10,
            colorKey: "kdigoCkd",
            hrKey: "ckd",
          },
        ];
        const meds = [
          {
            name: "SGLT2 inhibitor (e.g. Jardiance, Farxiga)",
            hr: hazardRatios.sglt2i,
          },
          {
            name: "GLP-1 medicine (e.g. Ozempic, Trulicity)",
            hr: hazardRatios.glp1ra,
          },
          { name: "Finerenone (Kerendia)", hr: hazardRatios.nsmra },
        ];

        return (
          <div className="space-y-6">
            <PatientDecisionNote />
            {/* Scale Toggle */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-white">
                <button
                  onClick={() => setWaffleScale(100)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    waffleScale === 100
                      ? "bg-purple-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Out of 100
                </button>
                <button
                  onClick={() => setWaffleScale(1000)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    waffleScale === 1000
                      ? "bg-purple-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Out of 1,000
                </button>
                <button
                  onClick={() => setWaffleScale(10000)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    waffleScale === 10000
                      ? "bg-purple-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Out of 10,000
                </button>
              </div>
            </div>
            {risks.map((riskItem) => {
              const baseRisk = riskItem.value;
              const baseCount = Math.round((baseRisk / 100) * waffleScale);
              return (
                <div key={riskItem.title} className="p-4 rounded-lg bg-gray-50">
                  <button
                    onClick={() =>
                      toggleOutcome(`kdigo-${riskItem.colorKey}`)
                    }
                    className="w-full flex items-center justify-between mb-2 text-left"
                  >
                    <h4 className="font-semibold text-gray-800">
                      Annual Risk of {riskItem.title}
                    </h4>
                    {collapsedOutcomes[`kdigo-${riskItem.colorKey}`] ? (
                      <ChevronDown className="w-4 h-4 shrink-0 text-gray-500" />
                    ) : (
                      <ChevronUp className="w-4 h-4 shrink-0 text-gray-500" />
                    )}
                  </button>
                  {!collapsedOutcomes[`kdigo-${riskItem.colorKey}`] && (
                    <>
                      <p className="text-sm text-gray-700 mb-3">
                        Each year, about{" "}
                        <strong>
                          {baseCount.toLocaleString()} in{" "}
                          {waffleScale.toLocaleString()} people
                        </strong>{" "}
                        like you may have this outcome — meaning about{" "}
                        <strong>
                          {(waffleScale - baseCount).toLocaleString()}
                        </strong>{" "}
                        will not, that year.
                      </p>
                      <EstimateCaveat />
                      <div className="flex justify-center mb-3 mt-3">
                        <WaffleChart
                          baseValue={baseRisk}
                          treatedValue={0}
                          colors={
                            waffleColors[
                              riskItem.colorKey as keyof typeof waffleColors
                            ]
                          }
                          total={waffleScale}
                        />
                      </div>
                      {applyGdmt && (
                        <div className="pt-4 mt-4 border-t">
                          <button
                            onClick={() =>
                              toggleMedImpact(`kdigo-${riskItem.colorKey}`)
                            }
                            className="w-full flex items-center justify-between mb-2 text-left"
                          >
                            <h5 className="font-semibold text-gray-800 text-sm">
                              Medication Impact:
                            </h5>
                            {collapsedMedImpact[
                              `kdigo-${riskItem.colorKey}`
                            ] ? (
                              <ChevronDown className="w-4 h-4 shrink-0 text-gray-500" />
                            ) : (
                              <ChevronUp className="w-4 h-4 shrink-0 text-gray-500" />
                            )}
                          </button>
                          {!collapsedMedImpact[
                            `kdigo-${riskItem.colorKey}`
                          ] && (
                            <div className="space-y-4">
                              <EstimateCaveat variant="medication" />
                              {meds.map((med) => {
                                const treatedRisk =
                                  baseRisk *
                                  (med.hr[
                                    riskItem.hrKey as keyof typeof med.hr
                                  ] || 1);
                                return (
                                  <div
                                    key={med.name}
                                    className="flex items-center gap-4 p-3 bg-white rounded-lg border"
                                  >
                                    <div className="flex-1">
                                      <h5 className="font-bold text-gray-900">
                                        {med.name}
                                      </h5>
                                      <p className="text-sm text-gray-700">
                                        Could lower the number from{" "}
                                        {Math.round(
                                          (baseRisk / 100) * waffleScale
                                        ).toLocaleString()}{" "}
                                        to{" "}
                                        <strong>
                                          {Math.round(
                                            (treatedRisk / 100) * waffleScale
                                          ).toLocaleString()}{" "}
                                          in {waffleScale.toLocaleString()}{" "}
                                          people
                                        </strong>
                                        .
                                      </p>
                                    </div>
                                    <WaffleChart
                                      baseValue={baseRisk}
                                      treatedValue={treatedRisk}
                                      colors={
                                        waffleColors[
                                          riskItem.colorKey as keyof typeof waffleColors
                                        ]
                                      }
                                      total={waffleScale}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-4">
          {" "}
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center">
            {" "}
            <Calculator className="w-6 h-6 mr-3 text-purple-600" /> TreatCKD{" "}
          </h1>{" "}
        </header>
        <nav className="flex justify-center mb-4 space-x-3">
          <TabButton
            id="krfe"
            label="KFRE"
            icon={Droplets}
            active={activeTab === "krfe"}
            onClick={setActiveTab}
          />
          <TabButton
            id="prevent"
            label="PREVENT"
            icon={Heart}
            active={activeTab === "prevent"}
            onClick={setActiveTab}
          />
          <TabButton
            id="kdigo"
            label="KDIGO"
            icon={Zap}
            active={activeTab === "kdigo"}
            onClick={setActiveTab}
          />
          <TabButton
            id="learn"
            label="Learn"
            icon={BookOpen}
            active={activeTab === "learn"}
            onClick={setActiveTab}
          />
          <TabButton
            id="about"
            label="About"
            icon={Users}
            active={activeTab === "about"}
            onClick={setActiveTab}
          />
          <TabButton
            id="specifications"
            label="Specifications"
            icon={BookText}
            active={activeTab === "specifications"}
            onClick={setActiveTab}
          />
        </nav>
        <main className="flex flex-col lg:flex-row gap-4 items-start">
          {activeTab === "specifications" ||
          activeTab === "learn" ||
          activeTab === "about" ? (
            <div className="w-full">
              {activeTab === "specifications" && <SpecificationsTab />}
              {activeTab === "learn" && <LearnTab />}
              {activeTab === "about" && <AboutTab />}
            </div>
          ) : (
            <>
              <section
                className={`bg-white rounded-xl shadow-lg transition-all duration-300 w-full ${
                  inputsCollapsed ? "lg:w-16 lg:flex-none" : "lg:flex-1"
                }`}
              >
                {inputsCollapsed ? (
                  <button
                    onClick={() => setInputsCollapsed(false)}
                    className="w-full lg:h-full flex flex-row lg:flex-col items-center justify-center gap-3 lg:gap-4 p-4 lg:py-6 hover:bg-gray-50 rounded-xl transition-colors text-gray-600"
                    title="Expand patient data panel"
                  >
                    <Info className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="text-sm font-semibold lg:hidden">
                      Patient Data — tap to expand
                    </span>
                    <span className="hidden lg:block text-xs font-semibold text-gray-500 [writing-mode:vertical-rl]">
                      Patient Data
                    </span>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </button>
                ) : (
                  <>
                    <header className="flex justify-between items-center p-4 border-b flex-wrap gap-y-2">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center">
                        <Info className="w-4 h-4 mr-2 text-purple-600" />
                        Patient Data
                      </h2>
                      <div className="flex items-center space-x-2">
                        <div className="flex rounded border border-gray-300 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setInputMode("calculate")}
                            className={`px-3 py-1 text-xs font-medium transition-colors ${
                              inputMode === "calculate"
                                ? "bg-purple-600 text-white"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            Calculate for me
                          </button>
                          <button
                            type="button"
                            onClick={() => setInputMode("manual")}
                            className={`px-3 py-1 text-xs font-medium transition-colors ${
                              inputMode === "manual"
                                ? "bg-purple-600 text-white"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            I already calculated
                          </button>
                        </div>
                        <button
                          onClick={simulateRandomData}
                          className="flex items-center px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors"
                        >
                          <Shuffle className="w-3 h-3 mr-1" />
                          Simulate
                        </button>
                        <button
                          onClick={resetAllData}
                          className="flex items-center px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Reset
                        </button>
                        <button
                          onClick={() => setInputsCollapsed(true)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Collapse panel"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    </header>
                    <div className="p-4 space-y-3">
                      {inputMode === "manual" ? (
                        // Manual Risk Input Mode
                        <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                          <p className="text-sm text-blue-800">
                            Enter the risk percentages you've already
                            calculated. The app will apply GDMT effects to these
                            values.
                          </p>
                        </div>
                        {activeTab === "krfe" && (
                          <div className="grid grid-cols-2 gap-3">
                            <CompactInputField
                              label="2-Year Kidney Failure Risk"
                              name="krfe2Year"
                              value={manualRisks.krfe2Year}
                              onChange={(e) =>
                                handleManualRiskChange(
                                  "krfe2Year",
                                  e.target.value
                                )
                              }
                              onBlur={() => {}}
                              unit="%"
                              onInfoClick={() =>
                                handleInfoClick("output", "krfe")
                              }
                            />
                            <CompactInputField
                              label="5-Year Kidney Failure Risk"
                              name="krfe5Year"
                              value={manualRisks.krfe5Year}
                              onChange={(e) =>
                                handleManualRiskChange(
                                  "krfe5Year",
                                  e.target.value
                                )
                              }
                              onBlur={() => {}}
                              unit="%"
                              onInfoClick={() =>
                                handleInfoClick("output", "krfe")
                              }
                            />
                          </div>
                        )}
                        {activeTab === "prevent" && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                              <CompactInputField
                                label="10-Year CVD Risk"
                                name="cvd"
                                value={manualRisks.cvd}
                                onChange={(e) =>
                                  handleManualRiskChange("cvd", e.target.value)
                                }
                                onBlur={() => {}}
                                unit="%"
                                onInfoClick={() =>
                                  handleInfoClick("output", "prevent")
                                }
                              />
                              <CompactInputField
                                label="10-Year ASCVD Risk"
                                name="ascvd"
                                value={manualRisks.ascvd}
                                onChange={(e) =>
                                  handleManualRiskChange(
                                    "ascvd",
                                    e.target.value
                                  )
                                }
                                onBlur={() => {}}
                                unit="%"
                                onInfoClick={() =>
                                  handleInfoClick("output", "prevent")
                                }
                              />
                              <CompactInputField
                                label="10-Year Heart Failure Risk"
                                name="hf"
                                value={manualRisks.hf}
                                onChange={(e) =>
                                  handleManualRiskChange("hf", e.target.value)
                                }
                                onBlur={() => {}}
                                unit="%"
                                onInfoClick={() =>
                                  handleInfoClick("output", "prevent")
                                }
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <CompactInputField
                                label="30-Year CVD Risk"
                                name="cvd30"
                                value={manualRisks.cvd30}
                                onChange={(e) =>
                                  handleManualRiskChange(
                                    "cvd30",
                                    e.target.value
                                  )
                                }
                                onBlur={() => {}}
                                unit="%"
                                onInfoClick={() =>
                                  handleInfoClick("output", "prevent")
                                }
                              />
                              <CompactInputField
                                label="30-Year ASCVD Risk"
                                name="ascvd30"
                                value={manualRisks.ascvd30}
                                onChange={(e) =>
                                  handleManualRiskChange(
                                    "ascvd30",
                                    e.target.value
                                  )
                                }
                                onBlur={() => {}}
                                unit="%"
                                onInfoClick={() =>
                                  handleInfoClick("output", "prevent")
                                }
                              />
                              <CompactInputField
                                label="30-Year Heart Failure Risk"
                                name="hf30"
                                value={manualRisks.hf30}
                                onChange={(e) =>
                                  handleManualRiskChange(
                                    "hf30",
                                    e.target.value
                                  )
                                }
                                onBlur={() => {}}
                                unit="%"
                                onInfoClick={() =>
                                  handleInfoClick("output", "prevent")
                                }
                              />
                            </div>
                          </div>
                        )}
                        {activeTab === "kdigo" && (
                          <div className="grid grid-cols-2 gap-3">
                            <CompactInputField
                              label="CVD Mortality Risk"
                              name="kdigoCvd"
                              value={manualRisks.kdigoCvd}
                              onChange={(e) =>
                                handleManualRiskChange(
                                  "kdigoCvd",
                                  e.target.value
                                )
                              }
                              onBlur={() => {}}
                              unit="%"
                              required
                              onInfoClick={() =>
                                handleInfoClick("output", "kdigo")
                              }
                            />
                            <CompactInputField
                              label="CKD Progression Risk"
                              name="kdigoCkd"
                              value={manualRisks.kdigoCkd}
                              onChange={(e) =>
                                handleManualRiskChange(
                                  "kdigoCkd",
                                  e.target.value
                                )
                              }
                              onBlur={() => {}}
                              unit="%"
                              required
                              onInfoClick={() =>
                                handleInfoClick("output", "kdigo")
                              }
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      // Calculate Mode - Original Input Fields
                      <>
                        {activeTab === "kdigo" ? (
                          <div className="grid grid-cols-2 gap-3">
                            {" "}
                            <CompactInputField
                              label="eGFR"
                              name="eGFR"
                              value={formState.eGFR}
                              onChange={handleInputChange}
                              onBlur={handleInputBlur}
                              unit="mL/min/1.73mÂ²"
                              required
                              error={validationErrors.eGFR}
                              onInfoClick={() =>
                                handleInfoClick("input", "eGFR")
                              }
                            />{" "}
                            <CompactInputField
                              label="uACR"
                              name="uACR"
                              value={formState.uACR}
                              onChange={handleInputChange}
                              onBlur={handleInputBlur}
                              unit="mg/g"
                              required
                              error={validationErrors.uACR}
                              onInfoClick={() =>
                                handleInfoClick("input", "uACR")
                              }
                            />{" "}
                          </div>
                        ) : (
                          <>
                            {" "}
                            {/* ── Row 1: Age / Sex / eGFR / BMI (PREVENT) or uACR (KFRE/KDIGO) ── */}
                            <div className="grid grid-cols-4 gap-3">
                              {" "}
                              <CompactInputField
                                label="Age"
                                name="age"
                                value={formState.age}
                                onChange={handleInputChange}
                                onBlur={handleInputBlur}
                                unit="yrs"
                                required
                                error={validationErrors.age}
                                onInfoClick={() =>
                                  handleInfoClick("input", "age")
                                }
                              />{" "}
                              <SexToggle
                                sex={formState.sex}
                                onSexChange={handleSexChange}
                                onInfoClick={() =>
                                  handleInfoClick("input", "sex")
                                }
                              />{" "}
                              <CompactInputField
                                label="eGFR"
                                name="eGFR"
                                value={formState.eGFR}
                                onChange={handleInputChange}
                                onBlur={handleInputBlur}
                                unit="mL/min/1.73m²"
                                required
                                error={validationErrors.eGFR}
                                onInfoClick={() =>
                                  handleInfoClick("input", "eGFR")
                                }
                              />{" "}
                              {activeTab === "prevent" ? (
                                <CompactInputField
                                  label="BMI"
                                  name="bmi"
                                  value={formState.bmi}
                                  onChange={handleInputChange}
                                  onBlur={handleInputBlur}
                                  unit="kg/m²"
                                  error={validationErrors.bmi}
                                  onInfoClick={() =>
                                    handleInfoClick("input", "bmi")
                                  }
                                />
                              ) : (
                                <CompactInputField
                                  label="uACR"
                                  name="uACR"
                                  value={formState.uACR}
                                  onChange={handleInputChange}
                                  onBlur={handleInputBlur}
                                  unit="mg/g"
                                  required
                                  error={validationErrors.uACR}
                                  onInfoClick={() =>
                                    handleInfoClick("input", "uACR")
                                  }
                                />
                              )}{" "}
                            </div>
                            {activeTab === "prevent" && (
                              <>
                                {" "}
                                {/* ── Row 2: SBP / Total Chol / HDL ── */}
                                <div className="grid grid-cols-3 gap-3">
                                  {" "}
                                  <CompactInputField
                                    label="SBP"
                                    name="sbp"
                                    value={formState.sbp}
                                    onChange={handleInputChange}
                                    onBlur={handleInputBlur}
                                    unit="mmHg"
                                    required
                                    error={validationErrors.sbp}
                                    onInfoClick={() =>
                                      handleInfoClick("input", "sbp")
                                    }
                                  />{" "}
                                  <CompactInputField
                                    label="Total Chol"
                                    name="totalCholesterol"
                                    value={formState.totalCholesterol}
                                    onChange={handleInputChange}
                                    onBlur={handleInputBlur}
                                    unit="mg/dL"
                                    required
                                    error={validationErrors.totalCholesterol}
                                    onInfoClick={() =>
                                      handleInfoClick(
                                        "input",
                                        "totalCholesterol"
                                      )
                                    }
                                  />{" "}
                                  <CompactInputField
                                    label="HDL"
                                    name="hdlCholesterol"
                                    value={formState.hdlCholesterol}
                                    onChange={handleInputChange}
                                    onBlur={handleInputBlur}
                                    unit="mg/dL"
                                    required
                                    error={validationErrors.hdlCholesterol}
                                    onInfoClick={() =>
                                      handleInfoClick("input", "hdlCholesterol")
                                    }
                                  />{" "}
                                </div>{" "}
                                {/* ── Row 3: uACR / HbA1c / ZIP — all optional ── */}
                                <div className="grid grid-cols-3 gap-3">
                                  <CompactInputField
                                    label="uACR"
                                    name="uACR"
                                    value={formState.uACR}
                                    onChange={handleInputChange}
                                    onBlur={handleInputBlur}
                                    unit="mg/g (optional)"
                                    error={validationErrors.uACR}
                                    onInfoClick={() =>
                                      handleInfoClick("input", "uACR")
                                    }
                                  />
                                  <CompactInputField
                                    label="HbA1c"
                                    name="a1c"
                                    value={formState.a1c}
                                    onChange={handleInputChange}
                                    onBlur={handleInputBlur}
                                    unit="% (optional)"
                                    error={validationErrors.a1c}
                                    onInfoClick={() =>
                                      handleInfoClick("input", "hba1c")
                                    }
                                  />
                                  <div>
                                    <label className="flex items-center text-xs font-medium text-gray-700 mb-1">
                                      ZIP Code{" "}
                                      <span className="text-gray-400 ml-1 text-xs">
                                        (optional–for SDI)
                                      </span>
                                      <InfoButton
                                        onClick={() =>
                                          handleInfoClick("input", "sdi")
                                        }
                                      />
                                    </label>
                                    <input
                                      id="zipCode"
                                      name="zipCode"
                                      type="text"
                                      value={formState.zipCode}
                                      onChange={(e) => {
                                        const v = e.target.value
                                          .replace(/\D/g, "")
                                          .slice(0, 5);
                                        setFormState((prev) => ({
                                          ...prev,
                                          zipCode: v,
                                        }));
                                      }}
                                      onBlur={(e) => {
                                        setCalculationState((prev) => ({
                                          ...prev,
                                          zipCode: e.target.value,
                                        }));
                                      }}
                                      className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 border-gray-300 focus:ring-purple-500"
                                      placeholder="e.g. 90210"
                                      maxLength={5}
                                      inputMode="numeric"
                                      autoComplete="off"
                                    />
                                    {formState.zipCode.length === 5 &&
                                      (zipSdiDecile as Record<string, number>)[
                                        formState.zipCode.padStart(5, "0")
                                      ] && (
                                        <p className="text-xs text-green-700 mt-1">
                                          SDI decile:{" "}
                                          {
                                            (
                                              zipSdiDecile as Record<
                                                string,
                                                number
                                              >
                                            )[
                                              formState.zipCode.padStart(5, "0")
                                            ]
                                          }{" "}
                                          / 10
                                        </p>
                                      )}
                                    {formState.zipCode.length === 5 &&
                                      !(zipSdiDecile as Record<string, number>)[
                                        formState.zipCode.padStart(5, "0")
                                      ] && (
                                        <p className="text-xs text-yellow-700 mt-1">
                                          ZIP not found in SDI lookup
                                        </p>
                                      )}
                                  </div>
                                </div>{" "}
                                {/* ── Row 4: Toggles ── */}
                                <div className="grid grid-cols-4 gap-3">
                                  {" "}
                                  <ToggleButton
                                    label="Diabetes"
                                    name="diabetes"
                                    checked={formState.diabetes}
                                    onChange={handleToggleChange}
                                    onInfoClick={() =>
                                      handleInfoClick("input", "diabetes")
                                    }
                                  />{" "}
                                  <ToggleButton
                                    label="Smoking"
                                    name="smoking"
                                    checked={formState.smoking}
                                    onChange={handleToggleChange}
                                    onInfoClick={() =>
                                      handleInfoClick("input", "smoking")
                                    }
                                  />{" "}
                                  <ToggleButton
                                    label="HTN Meds"
                                    name="onAntihypertensive"
                                    checked={formState.onAntihypertensive}
                                    onChange={handleToggleChange}
                                    onInfoClick={() =>
                                      handleInfoClick(
                                        "input",
                                        "onAntihypertensive"
                                      )
                                    }
                                  />{" "}
                                  <ToggleButton
                                    label="Statin"
                                    name="onStatin"
                                    checked={formState.onStatin}
                                    onChange={handleToggleChange}
                                    onInfoClick={() =>
                                      handleInfoClick("input", "onStatin")
                                    }
                                  />{" "}
                                </div>{" "}
                              </>
                            )}
                            {activeTab === "krfe" && (
                              <div>
                                {" "}
                                <h3 className="text-sm font-semibold text-gray-800 my-2 border-t pt-2">
                                  8-Variable KFRE (Optional)
                                </h3>{" "}
                                <div className="grid grid-cols-4 gap-3">
                                  {" "}
                                  <CompactInputField
                                    label="Calcium"
                                    name="calcium"
                                    value={formState.calcium}
                                    onChange={handleInputChange}
                                    onBlur={handleInputBlur}
                                    unit="mg/dL"
                                    error={validationErrors.calcium}
                                    onInfoClick={() =>
                                      handleInfoClick("input", "calcium")
                                    }
                                  />{" "}
                                  <CompactInputField
                                    label="Phosphate"
                                    name="phosphate"
                                    value={formState.phosphate}
                                    onChange={handleInputChange}
                                    onBlur={handleInputBlur}
                                    unit="mg/dL"
                                    error={validationErrors.phosphate}
                                    onInfoClick={() =>
                                      handleInfoClick("input", "phosphate")
                                    }
                                  />{" "}
                                  <CompactInputField
                                    label="Albumin"
                                    name="albumin"
                                    value={formState.albumin}
                                    onChange={handleInputChange}
                                    onBlur={handleInputBlur}
                                    unit="g/dL"
                                    error={validationErrors.albumin}
                                    onInfoClick={() =>
                                      handleInfoClick("input", "albumin")
                                    }
                                  />{" "}
                                  <CompactInputField
                                    label="Bicarbonate"
                                    name="bicarbonate"
                                    value={formState.bicarbonate}
                                    onChange={handleInputChange}
                                    onBlur={handleInputBlur}
                                    unit="mEq/L"
                                    error={validationErrors.bicarbonate}
                                    onInfoClick={() =>
                                      handleInfoClick("input", "bicarbonate")
                                    }
                                  />{" "}
                                </div>{" "}
                              </div>
                            )}{" "}
                          </>
                        )}
                      </>
                    )}
                  </div>
                  </>
                )}
              </section>
              <section
                className={`bg-white rounded-xl shadow-lg transition-all duration-300 w-full ${
                  outputsCollapsed ? "lg:w-16 lg:flex-none" : "lg:flex-1"
                }`}
              >
                {outputsCollapsed ? (
                  <button
                    onClick={() => setOutputsCollapsed(false)}
                    className="w-full lg:h-full flex flex-row lg:flex-col items-center justify-center gap-3 lg:gap-4 p-4 lg:py-6 hover:bg-gray-50 rounded-xl transition-colors text-gray-600"
                    title="Expand results panel"
                  >
                    {activeTab === "krfe" && (
                      <Droplets className="w-4 h-4 text-purple-600 shrink-0" />
                    )}
                    {activeTab === "prevent" && (
                      <Heart className="w-4 h-4 text-purple-600 shrink-0" />
                    )}
                    {activeTab === "kdigo" && (
                      <Zap className="w-4 h-4 text-purple-600 shrink-0" />
                    )}
                    <span className="text-sm font-semibold lg:hidden">
                      Results — tap to expand
                    </span>
                    <span className="hidden lg:block text-xs font-semibold text-gray-500 [writing-mode:vertical-rl]">
                      Results
                    </span>
                    <ChevronLeft className="w-4 h-4 shrink-0" />
                  </button>
                ) : (
                  <>
                    <header className="flex justify-between items-center p-4 border-b flex-wrap gap-y-2">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    {activeTab === "krfe" && (
                      <>
                        <Droplets className="w-5 h-5 mr-2 text-purple-600" />
                        KFRE Results{" "}
                        <InfoButton
                          onClick={() => handleInfoClick("output", "krfe")}
                        />
                      </>
                    )}
                    {activeTab === "prevent" && (
                      <>
                        <Heart className="w-5 h-5 mr-2 text-purple-600" />
                        PREVENT Results{" "}
                        <InfoButton
                          onClick={() => handleInfoClick("output", "prevent")}
                        />
                      </>
                    )}
                    {activeTab === "kdigo" && (
                      <>
                        <Zap className="w-5 h-5 mr-2 text-purple-600" />
                        KDIGO Results{" "}
                        <InfoButton
                          onClick={() => handleInfoClick("output", "kdigo")}
                        />
                      </>
                    )}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setApplyGdmt((prev) => !prev)}
                      className={`flex items-center px-2 py-1 text-xs rounded transition-colors font-medium ${
                        applyGdmt
                          ? "bg-green-600 text-white"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {" "}
                      <Shield className="w-3 h-3 mr-1" /> Apply GDMT{" "}
                    </button>
                    <ViewToggle />
                    <button
                      onClick={() => exportToPdf(viewMode)}
                      className="flex items-center px-2 py-1 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded transition-colors"
                      title={`Export a ${viewMode}-facing PDF of these results`}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Export PDF
                    </button>
                    {viewMode === "clinician" && (
                      <button
                        onClick={() =>
                          handleInfoClick(
                            "formula",
                            activeTab as "krfe" | "prevent" | "kdigo"
                          )
                        }
                        className="flex items-center px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors"
                      >
                        <BookOpen className="w-3 h-3 mr-1" />
                        Formula
                      </button>
                    )}
                    <button
                      onClick={() => setOutputsCollapsed(true)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Collapse panel"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </header>
                <div className="p-4">{renderResults()}</div>
                  </>
                )}
              </section>
            </>
          )}
        </main>
        <footer className="mt-6 text-center">
          <div className="mb-3">
            <a
              href="https://www.rueyhu.com/tools"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Like this? Check out our other tools
            </a>
          </div>
          <div className="text-gray-500 text-xs leading-relaxed max-w-4xl mx-auto">
            <p>
              This educational tool designed to help clinicians learn about
              guideline-directed medical therapy for patients with kidney
              disease (without dialysis) +/- concomitant heart disease. The
              design and development of the tool is funded by NIH K99/R00 grant
              4R00HL157721-03 from the NHLBI. This tool is not certified for use
              in direct patient care. Please discuss specific dosing with your
              local cardiologist/nephrologist/pharmacist. By using this
              interactive application, you certify that you are a licensed
              healthcare professional in the United States/Canada or enrolled in
              a medical training program, and that you will exercise your
              independent clinical judgment based on patient-specific
              characteristics prior to applying the knowledge in your clinical
              practice.
            </p>
          </div>
        </footer>
      </div>

      <InfoModal
        show={showInfoModal.show}
        title={showInfoModal.title}
        content={showInfoModal.content}
        inputExplanations={showInfoModal.inputExplanations}
        patientMode={showInfoModal.patientMode}
        formulaTabs={showInfoModal.formulaTabs}
        onClose={() =>
          setShowInfoModal({
            show: false,
            title: "",
            content: null,
            inputExplanations: null,
            patientMode: false,
            formulaTabs: null,
          })
        }
      />

      <EvidenceModal
        show={showEvidenceModal.show}
        data={showEvidenceModal.data}
        onClose={() => setShowEvidenceModal({ show: false, data: null })}
      />
    </div>
  );
};

export default ClinicalRiskCalculator;
