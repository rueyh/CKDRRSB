// KFRE_Formulas_Reference.ts
// Kidney Failure Risk Equation (KFRE) — formula reference text
// Tangri N, et al. JAMA. 2011;305(15):1553–1559.
// Tangri N, et al. Ann Intern Med. 2016;164(1):24–30.  (8-variable international validation)

const kfreFormulasRaw = `
KIDNEY FAILURE RISK EQUATION (KFRE)
════════════════════════════════════════════════════════════════════════

OVERVIEW
────────
The KFRE estimates 2-year and 5-year risk of kidney failure (dialysis or
transplant) in adults with CKD stages 3–5 (eGFR < 60 mL/min/1.73 m²).
Two versions are available:

  • 4-variable model  — requires Age, Sex, eGFR, uACR
  • 8-variable model  — adds Calcium, Phosphate, Albumin, Bicarbonate
                        (used automatically when all four are provided)

Source: Tangri N, et al. JAMA 2011;305(15):1553–1559
        Tangri N, et al. Ann Intern Med 2016;164(1):24–30


════════════════════════════════════════════════════════════════════════
4-VARIABLE MODEL
════════════════════════════════════════════════════════════════════════

Formula
───────
  Risk(t) = 1 − S₀(t) ^ exp(LP)

where the linear predictor LP is:

  LP = −0.2201 × (Age/10 − 7.036)
     + 0.2467 × (Male − 0.5642)
     − 0.5567 × (eGFR/5 − 7.222)
     + 0.4510 × (ln[ACR] − 5.137)

Baseline survival terms
───────────────────────
  S₀(2 years) = 0.9750   →  Risk₂ᵧ = 1 − 0.9750 ^ exp(LP)
  S₀(5 years) = 0.9240   →  Risk₅ᵧ = 1 − 0.9240 ^ exp(LP)

Coefficients and centering constants
─────────────────────────────────────
  Variable          Coeff      Centering constant   Units / transform
  ──────────────    ───────    ──────────────────   ─────────────────
  Age               −0.2201    7.036                Age / 10 (per decade)
  Sex (male=1)      +0.2467    0.5642               Binary (1=male, 0=female)
  eGFR              −0.5567    7.222                eGFR / 5 (per 5 mL/min/1.73 m²)
  ln(uACR)          +0.4510    5.137                Natural log of uACR (mg/g)


════════════════════════════════════════════════════════════════════════
8-VARIABLE MODEL
════════════════════════════════════════════════════════════════════════

Formula
───────
  Risk(t) = 1 − S₀(t) ^ exp(LP)

where the linear predictor LP is:

  LP = 0.16117 × (Male      − 0.5642 )
     − 0.19883 × (Age/10    − 7.0355 )
     − 0.49360 × (eGFR/5    − 7.2216 )
     + 0.35066 × (ln[ACR]   − 5.2774 )
     − 0.22129 × (Calcium   − 9.3510 )
     + 0.24197 × (Phosphate − 3.9221 )
     − 0.33867 × (Albumin   − 3.9925 )
     − 0.07429 × (Bicarb    − 25.5441)

Baseline survival terms
───────────────────────
  S₀(2 years) = 0.976    →  Risk₂ᵧ = 1 − 0.976 ^ exp(LP)
  S₀(5 years) = 0.929    →  Risk₅ᵧ = 1 − 0.929 ^ exp(LP)

Coefficients, centering constants, and units
─────────────────────────────────────────────
  Variable          Coeff       Centering (X̄)   Units / transform
  ──────────────    ────────    ─────────────   ─────────────────────────────
  Sex (male=1)      +0.16117    0.5642          Binary (1=male, 0=female)
  Age               −0.19883    7.0355          Age / 10 (per decade)
  eGFR              −0.49360    7.2216          eGFR / 5 (per 5 mL/min/1.73 m²)
  ln(uACR)          +0.35066    5.2774          Natural log of uACR (mg/g)
  Calcium           −0.22129    9.3510          mg/dL (entered directly)
  Phosphate         +0.24197    3.9221          mg/dL (entered directly)
  Albumin           −0.33867    3.9925          g/dL (entered directly)
  Bicarbonate       −0.07429    25.5441         mEq/L (entered directly)


════════════════════════════════════════════════════════════════════════
WORKED EXAMPLE  (8-variable)
════════════════════════════════════════════════════════════════════════

Inputs: Age 50, Male, eGFR 30, uACR 50, Ca 9.8, Phos 3.8, Alb 4.0, Bicarb 26

Transformed values:
  Male      = 1           ln(ACR) = ln(50) = 3.912
  Age/10    = 5.0         Calcium = 9.8
  eGFR/5    = 6.0         Phosphate = 3.8
                          Albumin = 4.0
                          Bicarbonate = 26

Term-by-term LP:
  Male:        +0.16117 × (1     − 0.5642 ) = +0.0702
  Age:         −0.19883 × (5.0   − 7.0355 ) = +0.4047
  eGFR:        −0.49360 × (6.0   − 7.2216 ) = +0.6030
  ln(ACR):     +0.35066 × (3.912 − 5.2774 ) = −0.4788
  Calcium:     −0.22129 × (9.8   − 9.3510 ) = −0.0994
  Phosphate:   +0.24197 × (3.8   − 3.9221 ) = −0.0295
  Albumin:     −0.33867 × (4.0   − 3.9925 ) = −0.0025
  Bicarbonate: −0.07429 × (26    − 25.5441 ) = −0.0339
                                               ────────
  LP (sum)                                   = +0.4338

  exp(LP) = exp(0.4338) = 1.543

  5-year risk = 1 − 0.929^1.543 = 1 − 0.893 = 10.7%
  2-year risk = 1 − 0.976^1.543 = 1 −  0.963 =  3.7%


════════════════════════════════════════════════════════════════════════
RISK THRESHOLDS (as used in this calculator)
════════════════════════════════════════════════════════════════════════

  2-year risk < 10%   → Low
  2-year risk 10–40%  → Moderate
  2-year risk > 40%   → High

These thresholds are based on published KFRE validation studies and
align with KDIGO 2022 guidance for nephrology referral and care intensity.


════════════════════════════════════════════════════════════════════════
REFERENCES
════════════════════════════════════════════════════════════════════════

1. Tangri N, Stevens LA, Griffith J, et al. A predictive model for
   progression of chronic kidney disease to kidney failure. JAMA.
   2011;305(15):1553–1559. doi:10.1001/jama.2011.451

2. Tangri N, Grams ME, Levey AS, et al. Multinational assessment of
   accuracy of equations for predicting risk of kidney failure: a
   meta-analysis. JAMA. 2016;315(2):164–174. doi:10.1001/jama.2015.18202

3. Tangri N, Bart Jassal S, Knoll G, et al. Consideration for use of
   the kidney failure risk equation (KFRE) in clinical practice.
   Ann Intern Med. 2016;164(1):24–30.

4. KDIGO 2022 CKD guideline. Kidney Int. 2022;102(4 Suppl):S31–S48.
`;

export default kfreFormulasRaw;
