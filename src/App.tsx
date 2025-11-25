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
  BookOpen,
  X,
  ChevronDown,
  ChevronUp,
  User,
  Users,
  Info,
  Shield,
  AlertTriangle,
  BookText,
} from "lucide-react";

// Import explanations from external JSON file
import explanations from "./explanations.json";

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
  }: {
    baseValue: number;
    treatedValue: number;
    colors: { base: string; treated: string; bg: string };
  }) => {
    const total = 100;
    const baseCount = Math.round(baseValue);
    const treatedCount = Math.round(treatedValue);

    const squares = Array.from({ length: total }, (_, i) => {
      let colorClass = colors.bg;
      if (i < treatedCount) {
        colorClass = colors.treated;
      } else if (i < baseCount) {
        colorClass = colors.base;
      }
      return (
        <div key={i} className={`w-full h-full rounded-[2px] ${colorClass}`} />
      );
    });

    return (
      <div className="grid grid-cols-10 gap-1 w-32 h-32 p-1 border rounded-md bg-gray-50 shrink-0">
        {squares}
      </div>
    );
  }
);

// Improved Modal Component
const InfoModal = ({
  show,
  title,
  content,
  onClose,
}: {
  show: boolean;
  title: string;
  content: string;
  onClose: () => void;
}) => {
  if (!show) return null;

  const isFormula = title.toLowerCase().includes("formula");

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
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
              <p className="text-sm text-gray-600">
                {isFormula
                  ? "Mathematical formulation and implementation details"
                  : "Parameter explanation and clinical context"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors duration-200 group"
          >
            <X className="w-6 h-6 text-gray-500 group-hover:text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          <div
            className={`prose prose-gray max-w-none ${
              isFormula ? "font-mono text-sm" : ""
            }`}
          >
            {isFormula ? (
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed bg-gray-50 p-4 rounded-lg border overflow-x-auto">
                {content}
              </pre>
            ) : (
              <div className="text-gray-700 leading-relaxed">
                {content.split("\n").map((paragraph, index) => (
                  <p key={index} className="mb-3 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {isFormula
                ? "Equations as published in peer-reviewed literature"
                : "Clinical parameter information"}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm font-medium"
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
    content: string;
  }>({ show: false, title: "", content: "" });
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
  const [viewMode, setViewMode] = useState<"clinician" | "patient">(
    "clinician"
  );
  const [applyGdmt, setApplyGdmt] = useState(false);
  const [inputMode, setInputMode] = useState<"calculate" | "manual">("calculate");
  const [manualRisks, setManualRisks] = useState({
    krfe: "",
    cvd: "",
    ascvd: "",
    hf: "",
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

  const handleInfoClick = useCallback(
    (type: "input" | "output" | "formula", key: string) => {
      let content, title;
      if (type === "input") {
        content = explanations.inputs[key as keyof typeof explanations.inputs];
        title = `About ${key.charAt(0).toUpperCase() + key.slice(1)}`;
      } else if (type === "output") {
        content =
          explanations.outputs[key as keyof typeof explanations.outputs];
        title = `About ${key.toUpperCase()} Results`;
      } else {
        // formula
        content =
          explanations.formulas[key as keyof typeof explanations.formulas];
        title = `Formula Details for ${key.toUpperCase()}`;
      }
      setShowInfoModal({ show: true, title, content });
    },
    []
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
      krfe: "",
      cvd: "",
      ascvd: "",
      hf: "",
      kdigoCvd: "",
      kdigoCkd: "",
    });
  }, [initialPatientData]);

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
        phosphate: 0.3204,
        albumin: -0.0805,
        bicarbonate: -0.03852,
      };
      const means = {
        male: 0.56422,
        age: 7.0355,
        eGFR: 7.2216,
        ACR: 5.2774,
        calcium: 9.351,
        phosphate: 4.445,
        albumin: 38.3,
        bicarbonate: 23.3,
      };
      const transformed = {
        male: sex === "male" ? 1 : 0,
        age: parseFloat(age) / 10,
        eGFR: parseFloat(eGFR) / 5,
        ACR: Math.log(parseFloat(uACR)),
        calcium: parseFloat(calcium),
        phosphate: parseFloat(phosphate),
        albumin: parseFloat(albumin) * 10,
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
      fiveYearRisk = 1 - Math.pow(0.925, Math.exp(linearPredictor));
    } else {
      const ageNum = parseFloat(age);
      const egfrNum = parseFloat(eGFR);
      const uacrNum = parseFloat(uACR);
      const sexNum = sex === "male" ? 1 : 0;
      const logACR = Math.log(Math.max(uacrNum, 0.1));
      const score4var =
        -3.0 +
        0.067 * (ageNum - 50) +
        0.36 * sexNum +
        -0.065 * (egfrNum - 30) +
        0.45 * (logACR - 3);
      twoYearRisk = 1 - Math.pow(0.929, Math.exp(score4var));
      fiveYearRisk = 1 - Math.pow(0.772, Math.exp(score4var));
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
    const sex = data.sex;
    const bmi = parseFloat(data.bmi || "25");
    const calculateCVD = () => {
      let logOdds = 0;
      if (sex === "female") {
        logOdds =
          -3.307728 +
          0.7939329 * ((age - 55) / 10) +
          0.0305239 * ((tc - hdl) * 0.02586 - 3.5) -
          0.1606857 * ((hdl * 0.02586 - 1.3) / 0.3) +
          0.360078 * ((Math.max(sbp, 110) - 130) / 20) -
          0.2394 * ((Math.min(sbp, 110) - 110) / 20) +
          (data.diabetes ? 0.8667604 : 0) +
          (data.smoking ? 0.5360739 : 0) +
          0.6045917 * Math.min(0, (egfr - 60) / -15) -
          0.285859 * Math.max(0, (egfr - 90) / 15) +
          (data.onAntihypertensive ? 0.3151672 : 0) +
          (data.onStatin ? -0.1477655 : 0);
      } else {
        logOdds =
          -3.031168 +
          0.7688528 * ((age - 55) / 10) +
          0.0736174 * ((tc - hdl) * 0.02586 - 3.5) -
          0.0954431 * ((hdl * 0.02586 - 1.3) / 0.3) +
          0.3362658 * ((Math.max(sbp, 110) - 130) / 20) -
          0.1896749 * ((Math.min(sbp, 110) - 110) / 20) +
          (data.diabetes ? 0.7692857 : 0) +
          (data.smoking ? 0.4386871 : 0) +
          0.5378979 * Math.min(0, (egfr - 60) / -15) -
          0.219842 * Math.max(0, (egfr - 90) / 15) +
          (data.onAntihypertensive ? 0.288879 : 0) +
          (data.onStatin ? -0.1337349 : 0);
      }
      return (Math.exp(logOdds) / (1 + Math.exp(logOdds))) * 100;
    };
    const calculateASCVD = () => {
      let logOdds = 0;
      if (sex === "female") {
        logOdds =
          -3.819975 +
          0.719883 * ((age - 55) / 10) +
          0.1176967 * ((tc - hdl) * 0.02586 - 3.5) -
          0.151185 * ((hdl * 0.02586 - 1.3) / 0.3) +
          0.3592852 * ((Math.max(sbp, 110) - 130) / 20) -
          0.198971 * ((Math.min(sbp, 110) - 110) / 20) +
          (data.diabetes ? 0.8348585 : 0) +
          (data.smoking ? 0.4831078 : 0) +
          0.4864619 * Math.min(0, (egfr - 60) / -15) -
          0.222378 * Math.max(0, (egfr - 90) / 15) +
          (data.onAntihypertensive ? 0.2265309 : 0) +
          (data.onStatin ? -0.0592374 : 0);
      } else {
        logOdds =
          -3.500655 +
          0.7099847 * ((age - 55) / 10) +
          0.1658663 * ((tc - hdl) * 0.02586 - 3.5) -
          0.1144285 * ((hdl * 0.02586 - 1.3) / 0.3) +
          0.3239977 * ((Math.max(sbp, 110) - 130) / 20) -
          0.138406 * ((Math.min(sbp, 110) - 110) / 20) +
          (data.diabetes ? 0.7189597 : 0) +
          (data.smoking ? 0.3956973 : 0) +
          0.3690075 * Math.min(0, (egfr - 60) / -15) -
          0.165844 * Math.max(0, (egfr - 90) / 15) +
          (data.onAntihypertensive ? 0.2036522 : 0) +
          (data.onStatin ? -0.0865581 : 0);
      }
      return (Math.exp(logOdds) / (1 + Math.exp(logOdds))) * 100;
    };
    const calculateHF = () => {
      let logOdds = 0;
      if (sex === "female") {
        logOdds =
          -4.310409 +
          0.8998235 * ((age - 55) / 10) +
          0.3576505 * ((Math.max(sbp, 110) - 130) / 20) -
          0.203102 * ((Math.min(sbp, 110) - 110) / 20) +
          (data.diabetes ? 1.038346 : 0) +
          (data.smoking ? 0.583916 : 0) +
          0.2997706 * Math.max(0, (bmi - 30) / 5) -
          0.231922 * Math.min(0, (bmi - 25) / -5) +
          0.7451638 * Math.min(0, (egfr - 60) / -15) -
          0.384594 * Math.max(0, (egfr - 90) / 15) +
          (data.onAntihypertensive ? 0.3534442 : 0);
      } else {
        logOdds =
          -3.946391 +
          0.8972642 * ((age - 55) / 10) +
          0.3634461 * ((Math.max(sbp, 110) - 130) / 20) -
          0.145789 * ((Math.min(sbp, 110) - 110) / 20) +
          (data.diabetes ? 0.923776 : 0) +
          (data.smoking ? 0.5023736 : 0) +
          0.3726929 * Math.max(0, (bmi - 30) / 5) -
          0.217743 * Math.min(0, (bmi - 25) / -5) +
          0.6926917 * Math.min(0, (egfr - 60) / -15) -
          0.315512 * Math.max(0, (egfr - 90) / 15) +
          (data.onAntihypertensive ? 0.2980922 : 0);
      }
      return (Math.exp(logOdds) / (1 + Math.exp(logOdds))) * 100;
    };
    return {
      cvd: Math.max(0, Math.min(100, calculateCVD())),
      ascvd: Math.max(0, Math.min(100, calculateASCVD())),
      heartFailure: Math.max(0, Math.min(100, calculateHF())),
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
      const krfeValue = parseRisk(manualRisks.krfe);
      const cvdValue = parseRisk(manualRisks.cvd);
      const ascvdValue = parseRisk(manualRisks.ascvd);
      const hfValue = parseRisk(manualRisks.hf);
      const kdigoCvdValue = parseRisk(manualRisks.kdigoCvd);
      const kdigoCkdValue = parseRisk(manualRisks.kdigoCkd);

      return {
        krfe: krfeValue !== null ? { 
          twoYear: krfeValue, 
          fiveYear: krfeValue, 
          riskLevel: krfeValue > 40 ? "High" : krfeValue > 10 ? "Moderate" : "Low" 
        } : null,
        prevent: (cvdValue !== null || ascvdValue !== null || hfValue !== null) ? {
          cvd: cvdValue !== null ? cvdValue : 0,
          ascvd: ascvdValue !== null ? ascvdValue : 0,
          heartFailure: hfValue !== null ? hfValue : 0,
        } : null,
        kdigo: (kdigoCvdValue !== null || kdigoCkdValue !== null) ? {
          cvdMortality: kdigoCvdValue !== null ? kdigoCvdValue : 0,
          ckdProgression: kdigoCkdValue !== null ? kdigoCkdValue : 0,
          egfrCategory: "Unknown",
          acrCategory: "Unknown",
        } : null,
      };
    } else {
      // Calculate from inputs
      return {
        krfe: calculateKFRE(calculationState),
        prevent: calculatePREVENT(calculationState),
        kdigo: calculateKDIGO(calculationState),
      };
    }
  }, [inputMode, manualRisks, calculationState, calculateKFRE, calculatePREVENT, calculateKDIGO]);

  const hasHardErrors = useMemo(() => {
    return Object.values(validationErrors).some((e) => e?.severity === "hard");
  }, [validationErrors]);

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
              <div className="grid grid-cols-3 gap-3">
                {" "}
                <div className="p-3 bg-red-50 rounded">
                  <h4 className="font-semibold text-red-800 text-xs">
                    CVD Risk
                  </h4>
                  <p className="text-lg font-bold text-red-600">
                    {currentResult.cvd.toFixed(1)}%
                  </p>
                </div>{" "}
                <div className="p-3 bg-orange-50 rounded">
                  <h4 className="font-semibold text-orange-800 text-xs">
                    ASCVD Risk
                  </h4>
                  <p className="text-lg font-bold text-orange-600">
                    {currentResult.ascvd.toFixed(1)}%
                  </p>
                </div>{" "}
                <div className="p-3 bg-purple-50 rounded">
                  <h4 className="font-semibold text-purple-800 text-xs">
                    Heart Failure
                  </h4>
                  <p className="text-lg font-bold text-purple-600">
                    {currentResult.heartFailure.toFixed(1)}%
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
                  />
                  {" "}
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
                  <CustomHRNotification
                    medications={[
                      { name: "SGLT2i (CVD)", key: "sglt2i", outcome: "cvd" },
                      { name: "SGLT2i (HF)", key: "sglt2i", outcome: "hf" },
                      { name: "GLP-1 RA (CVD)", key: "glp1ra", outcome: "cvd" },
                      { name: "nsMRA (CVD)", key: "nsmra", outcome: "cvd" },
                      { name: "nsMRA (HF)", key: "nsmra", outcome: "hf" },
                    ]}
                  />
                  {" "}
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
                  ].map((med) => (
                    <div
                      key={med.name}
                      className="grid grid-cols-5 gap-3 p-2 rounded bg-gray-50 items-center"
                    >
                      {" "}
                      <div className="font-semibold text-sm text-gray-800">
                        {med.name}
                      </div>{" "}
                      <div className="text-center text-lg font-bold text-red-600">
                        {(currentResult.cvd * med.hr.cvd).toFixed(1)}%<br />
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
                        {(currentResult.ascvd * med.hr.cvd).toFixed(1)}%<br />
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
                          ? `${(currentResult.heartFailure * med.hr.hf).toFixed(
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
                  ))}{" "}
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
                  />
                  {" "}
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
          { name: "SGLT2i", risk: baseRisk * hazardRatios.sglt2i.ckd },
          { name: "GLP-1 RA", risk: baseRisk * hazardRatios.glp1ra.ckd },
          { name: "nsMRA", risk: baseRisk * hazardRatios.nsmra.ckd },
        ];
        return (
          <div className="space-y-6">
            {" "}
            <div>
              {" "}
              <h4 className="font-semibold text-blue-800 mb-2">
                Your 5-Year Kidney Failure Risk
              </h4>{" "}
              <p className="text-sm text-gray-700 mb-3">
                {" "}
                Out of 100 people with your health profile, about{" "}
                <strong>{baseRisk.toFixed(0)}</strong> may need dialysis or a
                kidney transplant in the next 5 years.{" "}
              </p>{" "}
              <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                {" "}
                <WaffleChart
                  baseValue={baseRisk}
                  treatedValue={0}
                  colors={waffleColors.krfe}
                />{" "}
              </div>{" "}
            </div>{" "}
            {applyGdmt && (
              <div className="space-y-4 pt-4 border-t">
                {" "}
                <h4 className="font-semibold text-gray-800 mb-2">
                  How Medications Can Lower Your Risk:
                </h4>{" "}
                {meds.map((med) => (
                  <div
                    key={med.name}
                    className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg"
                  >
                    {" "}
                    <div className="flex-1">
                      {" "}
                      <h5 className="font-bold text-blue-900">
                        {med.name}
                      </h5>{" "}
                      <p className="text-sm text-gray-700">
                        This medication could lower the number of people
                        affected from {baseRisk.toFixed(0)} to about{" "}
                        <strong>{med.risk.toFixed(0)} in 100 people</strong>.
                      </p>{" "}
                    </div>{" "}
                    <WaffleChart
                      baseValue={baseRisk}
                      treatedValue={med.risk}
                      colors={waffleColors.krfe}
                    />{" "}
                  </div>
                ))}{" "}
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
          { name: "SGLT2i", hr: hazardRatios.sglt2i },
          { name: "GLP-1 RA", hr: hazardRatios.glp1ra },
          { name: "nsMRA", hr: hazardRatios.nsmra },
        ];

        return (
          <div className="space-y-6">
            {risks.map((riskItem) => {
              const baseRisk =
                currentResult[riskItem.key as keyof typeof currentResult];
              return (
                <div key={riskItem.key} className="p-4 rounded-lg bg-gray-50">
                  <h4 className={`font-semibold text-gray-800 mb-2`}>
                    {riskItem.title} Risk (10-Year)
                  </h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Out of 100 people like you, about{" "}
                    <strong>{baseRisk.toFixed(0)}</strong> may develop this in
                    10 years.
                  </p>
                  <div className="flex justify-center mb-3">
                    <WaffleChart
                      baseValue={baseRisk}
                      treatedValue={0}
                      colors={
                        waffleColors[
                          riskItem.colorKey as keyof typeof waffleColors
                        ]
                      }
                    />
                  </div>
                  {applyGdmt && (
                    <div className="space-y-4 pt-4 mt-4 border-t">
                      <h5 className="font-semibold text-gray-800 text-sm">
                        Medication Impact:
                      </h5>
                      {meds
                        .filter(
                          (med) =>
                            med.hr[riskItem.hrKey as keyof typeof med.hr] !==
                            null
                        )
                        .map((med) => {
                          const treatedRisk =
                            baseRisk *
                            (med.hr[riskItem.hrKey as keyof typeof med.hr] ||
                              1);
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
                                  {baseRisk.toFixed(0)} to{" "}
                                  <strong>
                                    {treatedRisk.toFixed(0)} in 100 people
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
                              />
                            </div>
                          );
                        })}
                    </div>
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
          { name: "SGLT2i", hr: hazardRatios.sglt2i },
          { name: "GLP-1 RA", hr: hazardRatios.glp1ra },
          { name: "nsMRA", hr: hazardRatios.nsmra },
        ];

        return (
          <div className="space-y-6">
            {risks.map((riskItem) => {
              const baseRisk = riskItem.value;
              return (
                <div key={riskItem.title} className="p-4 rounded-lg bg-gray-50">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Annual Risk of {riskItem.title}
                  </h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Each year, about{" "}
                    <strong>{baseRisk.toFixed(0)} in 100 people</strong> like
                    you may have this outcome.
                  </p>
                  <div className="flex justify-center mb-3">
                    <WaffleChart
                      baseValue={baseRisk}
                      treatedValue={0}
                      colors={
                        waffleColors[
                          riskItem.colorKey as keyof typeof waffleColors
                        ]
                      }
                    />
                  </div>
                  {applyGdmt && (
                    <div className="space-y-4 pt-4 mt-4 border-t">
                      <h5 className="font-semibold text-gray-800 text-sm">
                        Medication Impact:
                      </h5>
                      {meds.map((med) => {
                        const treatedRisk =
                          baseRisk *
                          (med.hr[riskItem.hrKey as keyof typeof med.hr] || 1);
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
                                {baseRisk.toFixed(0)} to{" "}
                                <strong>
                                  {treatedRisk.toFixed(0)} in 100 people
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
                            />
                          </div>
                        );
                      })}
                    </div>
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
            <Calculator className="w-6 h-6 mr-3 text-purple-600" /> Kidney
            RiskMate{" "}
          </h1>{" "}
        </header>
        <nav className="flex justify-center mb-4 space-x-3">
          <TabButton
            id="krfe"
            label="KRFE"
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
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeTab === "specifications" ||
          activeTab === "learn" ||
          activeTab === "about" ? (
            <div className="lg:col-span-2">
              {activeTab === "specifications" && <SpecificationsTab />}
              {activeTab === "learn" && <LearnTab />}
              {activeTab === "about" && <AboutTab />}
            </div>
          ) : (
            <>
              <section className="bg-white rounded-xl shadow-lg">
                <header className="flex justify-between items-center p-4 border-b">
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
                      onClick={resetAllData}
                      className="flex items-center px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Reset
                    </button>
                    <button
                      onClick={() => setInputsCollapsed(!inputsCollapsed)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {inputsCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </header>
                {!inputsCollapsed && (
                  <div className="p-4 space-y-3">
                    {inputMode === "manual" ? (
                      // Manual Risk Input Mode
                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                          <p className="text-sm text-blue-800">
                            Enter the risk percentages you've already calculated. The app will apply GDMT effects to these values.
                          </p>
                        </div>
                        {activeTab === "krfe" && (
                          <div className="grid grid-cols-1 gap-3">
                            <CompactInputField
                              label="5-Year Kidney Failure Risk"
                              name="krfe"
                              value={manualRisks.krfe}
                              onChange={(e) => handleManualRiskChange("krfe", e.target.value)}
                              onBlur={() => {}}
                              unit="%"
                              required
                              onInfoClick={() => handleInfoClick("output", "krfe")}
                            />
                          </div>
                        )}
                        {activeTab === "prevent" && (
                          <div className="grid grid-cols-3 gap-3">
                            <CompactInputField
                              label="10-Year CVD Risk"
                              name="cvd"
                              value={manualRisks.cvd}
                              onChange={(e) => handleManualRiskChange("cvd", e.target.value)}
                              onBlur={() => {}}
                              unit="%"
                              required
                              onInfoClick={() => handleInfoClick("output", "prevent")}
                            />
                            <CompactInputField
                              label="10-Year ASCVD Risk"
                              name="ascvd"
                              value={manualRisks.ascvd}
                              onChange={(e) => handleManualRiskChange("ascvd", e.target.value)}
                              onBlur={() => {}}
                              unit="%"
                              required
                              onInfoClick={() => handleInfoClick("output", "prevent")}
                            />
                            <CompactInputField
                              label="10-Year Heart Failure Risk"
                              name="hf"
                              value={manualRisks.hf}
                              onChange={(e) => handleManualRiskChange("hf", e.target.value)}
                              onBlur={() => {}}
                              unit="%"
                              required
                              onInfoClick={() => handleInfoClick("output", "prevent")}
                            />
                          </div>
                        )}
                        {activeTab === "kdigo" && (
                          <div className="grid grid-cols-2 gap-3">
                            <CompactInputField
                              label="CVD Mortality Risk"
                              name="kdigoCvd"
                              value={manualRisks.kdigoCvd}
                              onChange={(e) => handleManualRiskChange("kdigoCvd", e.target.value)}
                              onBlur={() => {}}
                              unit="%"
                              required
                              onInfoClick={() => handleInfoClick("output", "kdigo")}
                            />
                            <CompactInputField
                              label="CKD Progression Risk"
                              name="kdigoCkd"
                              value={manualRisks.kdigoCkd}
                              onChange={(e) => handleManualRiskChange("kdigoCkd", e.target.value)}
                              onBlur={() => {}}
                              unit="%"
                              required
                              onInfoClick={() => handleInfoClick("output", "kdigo")}
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
                              onInfoClick={() => handleInfoClick("input", "eGFR")}
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
                              onInfoClick={() => handleInfoClick("input", "uACR")}
                            />{" "}
                          </div>
                        ) : (
                          <>
                            {" "}
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
                                onInfoClick={() => handleInfoClick("input", "age")}
                              />{" "}
                              <SexToggle
                                sex={formState.sex}
                                onSexChange={handleSexChange}
                                onInfoClick={() => handleInfoClick("input", "sex")}
                              />{" "}
                              <CompactInputField
                                label="eGFR"
                                name="eGFR"
                                value={formState.eGFR}
                                onChange={handleInputChange}
                                onBlur={handleInputBlur}
                                unit="mL/min/1.73mÂ²"
                                required
                                error={validationErrors.eGFR}
                                onInfoClick={() => handleInfoClick("input", "eGFR")}
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
                                onInfoClick={() => handleInfoClick("input", "uACR")}
                              />{" "}
                            </div>
                            {activeTab === "prevent" && (
                          <>
                            {" "}
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
                                  handleInfoClick("input", "totalCholesterol")
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
                            <div className="grid grid-cols-1">
                              {" "}
                              <CompactInputField
                                label="BMI"
                                name="bmi"
                                value={formState.bmi}
                                onChange={handleInputChange}
                                onBlur={handleInputBlur}
                                unit="kg/mÂ²"
                                error={validationErrors.bmi}
                                onInfoClick={() =>
                                  handleInfoClick("input", "bmi")
                                }
                              />{" "}
                            </div>{" "}
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
                                  handleInfoClick("input", "onAntihypertensive")
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
                )}
              </section>
              <section className="bg-white rounded-xl shadow-lg">
                <header className="flex justify-between items-center p-4 border-b">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    {activeTab === "krfe" && (
                      <>
                        <Droplets className="w-5 h-5 mr-2 text-purple-600" />
                        KRFE Results{" "}
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
                    <button
                      onClick={() => setOutputsCollapsed(!outputsCollapsed)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {outputsCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </header>
                {!outputsCollapsed && (
                  <div className="p-4">{renderResults()}</div>
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
        onClose={() =>
          setShowInfoModal({ show: false, title: "", content: "" })
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