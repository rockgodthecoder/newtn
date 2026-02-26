"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type Step = 1 | 2 | 3;
type Strategy = "lazy" | "ratio" | "ppp" | "final";

interface Country {
  iso3: string;
  iso2: string;
  name: string;
  currency: string;
  ppp: number; // World Bank 2022 PPP conversion factor (LCU per international $)
}

interface Product {
  name: string;
  price: number;
}

// ─────────────────────────────────────────────
// COUNTRY + PPP DATA  (World Bank 2022)
// ─────────────────────────────────────────────

// PPP values from World Bank 2024 data (LCU per international $)
// Source: World Development Indicators — PA.NUS.PPP (updated 2026-01-28)
// Taiwan (TWN) not covered by World Bank; value is an estimate.
const COUNTRIES: Country[] = [
  { iso3: "USA", iso2: "US", name: "United States",   currency: "USD", ppp: 1.000     },
  { iso3: "GBR", iso2: "GB", name: "United Kingdom",  currency: "GBP", ppp: 0.664153  },
  { iso3: "DEU", iso2: "DE", name: "Germany",          currency: "EUR", ppp: 0.700862  },
  { iso3: "FRA", iso2: "FR", name: "France",           currency: "EUR", ppp: 0.681239  },
  { iso3: "ITA", iso2: "IT", name: "Italy",            currency: "EUR", ppp: 0.599627  },
  { iso3: "ESP", iso2: "ES", name: "Spain",            currency: "EUR", ppp: 0.562107  },
  { iso3: "NLD", iso2: "NL", name: "Netherlands",      currency: "EUR", ppp: 0.731421  },
  { iso3: "JPN", iso2: "JP", name: "Japan",            currency: "JPY", ppp: 94.4626   },
  { iso3: "CAN", iso2: "CA", name: "Canada",           currency: "CAD", ppp: 1.150472  },
  { iso3: "AUS", iso2: "AU", name: "Australia",        currency: "AUD", ppp: 1.366527  },
  { iso3: "CHE", iso2: "CH", name: "Switzerland",      currency: "CHF", ppp: 0.948875  },
  { iso3: "CHN", iso2: "CN", name: "China",            currency: "CNY", ppp: 3.532549  },
  { iso3: "IND", iso2: "IN", name: "India",            currency: "INR", ppp: 20.4220   },
  { iso3: "BRA", iso2: "BR", name: "Brazil",           currency: "BRL", ppp: 2.487317  },
  { iso3: "KOR", iso2: "KR", name: "South Korea",      currency: "KRW", ppp: 809.267   },
  { iso3: "MEX", iso2: "MX", name: "Mexico",           currency: "MXN", ppp: 9.916562  },
  { iso3: "IDN", iso2: "ID", name: "Indonesia",        currency: "IDR", ppp: 4747.909  },
  { iso3: "TUR", iso2: "TR", name: "Turkey",           currency: "TRY", ppp: 11.42387  },
  { iso3: "SWE", iso2: "SE", name: "Sweden",           currency: "SEK", ppp: 8.490485  },
  { iso3: "NOR", iso2: "NO", name: "Norway",           currency: "NOK", ppp: 9.142143  },
  { iso3: "DNK", iso2: "DK", name: "Denmark",          currency: "DKK", ppp: 6.050211  },
  { iso3: "POL", iso2: "PL", name: "Poland",           currency: "PLN", ppp: 1.949414  },
  { iso3: "ZAF", iso2: "ZA", name: "South Africa",     currency: "ZAR", ppp: 7.431913  },
  { iso3: "MYS", iso2: "MY", name: "Malaysia",         currency: "MYR", ppp: 1.401327  },
  { iso3: "THA", iso2: "TH", name: "Thailand",         currency: "THB", ppp: 10.49237  },
  { iso3: "SGP", iso2: "SG", name: "Singapore",        currency: "SGD", ppp: 0.804050  },
  { iso3: "NZL", iso2: "NZ", name: "New Zealand",      currency: "NZD", ppp: 1.463912  },
  { iso3: "SAU", iso2: "SA", name: "Saudi Arabia",     currency: "SAR", ppp: 1.845262  },
  { iso3: "ARE", iso2: "AE", name: "UAE",              currency: "AED", ppp: 2.330334  },
  { iso3: "PHL", iso2: "PH", name: "Philippines",      currency: "PHP", ppp: 19.35653  },
  { iso3: "VNM", iso2: "VN", name: "Vietnam",          currency: "VND", ppp: 6956.928  },
  { iso3: "EGY", iso2: "EG", name: "Egypt",            currency: "EGP", ppp: 6.247820  },
  { iso3: "ARG", iso2: "AR", name: "Argentina",        currency: "ARS", ppp: 419.901   },
  { iso3: "RUS", iso2: "RU", name: "Russia",           currency: "RUB", ppp: 29.06297  },
  { iso3: "NGA", iso2: "NG", name: "Nigeria",          currency: "NGN", ppp: 176.331   },
  { iso3: "HKG", iso2: "HK", name: "Hong Kong",        currency: "HKD", ppp: 5.611867  },
  { iso3: "TWN", iso2: "TW", name: "Taiwan",           currency: "TWD", ppp: 15.8      }, // estimate (not in World Bank data)
  { iso3: "ISR", iso2: "IL", name: "Israel",           currency: "ILS", ppp: 3.501980  },
  { iso3: "CHL", iso2: "CL", name: "Chile",            currency: "CLP", ppp: 435.779   },
  { iso3: "COL", iso2: "CO", name: "Colombia",         currency: "COP", ppp: 1443.719  },
  { iso3: "HUN", iso2: "HU", name: "Hungary",          currency: "HUF", ppp: 175.578   },
  { iso3: "CZE", iso2: "CZ", name: "Czech Republic",   currency: "CZK", ppp: 12.82323  },
  { iso3: "ROU", iso2: "RO", name: "Romania",          currency: "RON", ppp: 1.863182  },
  { iso3: "MAR", iso2: "MA", name: "Morocco",          currency: "MAD", ppp: 3.964540  },
  { iso3: "KEN", iso2: "KE", name: "Kenya",            currency: "KES", ppp: 43.27129  },
  { iso3: "PAK", iso2: "PK", name: "Pakistan",         currency: "PKR", ppp: 66.95915  },
  { iso3: "BGD", iso2: "BD", name: "Bangladesh",       currency: "BDT", ppp: 29.87879  },
];

const SAMPLE_CSV = `Product Name,Price\nLong Black Jeans,49\nLinen Summer Shirt,35\nLeather Ankle Boots,120\nCotton Basic Tee,25\nWool Blend Coat,189\n`;

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function flag(iso2: string): string {
  return [...iso2.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let cell = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cell += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === "," && !inQ) {
        row.push(cell.trim());
        cell = "";
      } else {
        cell += ch;
      }
    }
    row.push(cell.trim());
    if (row.some((c) => c !== "")) rows.push(row);
  }
  return rows;
}

function cleanPrice(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) || n <= 0 ? null : n;
}

function guessIndex(headers: string[], keywords: string[]): number {
  const h = headers.map((x) => x.toLowerCase());
  for (const kw of keywords) {
    const idx = h.findIndex((col) => col.includes(kw));
    if (idx !== -1) return idx;
  }
  return -1;
}

const ZERO_DECIMALS = new Set(["JPY", "KRW", "VND", "IDR", "CLP", "COP", "HUF"]);

function fmt(amount: number, currency: string): string {
  if (!isFinite(amount)) return "N/A";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: ZERO_DECIMALS.has(currency) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function calcValue(
  basePrice: number,
  home: Country,
  target: Country,
  rates: Record<string, number> | null,
  strategy: Strategy
): number | null {
  const ratio = target.ppp / home.ppp;
  switch (strategy) {
    case "lazy": {
      if (!rates) return null;
      const r = rates[target.currency];
      return r != null ? basePrice * r : null;
    }
    case "ratio":
      return ratio;
    case "ppp":
      return basePrice * ratio;
    case "final": {
      const p = basePrice * ratio;
      return p < 1 ? 0.99 : Math.floor(p) + 0.99;
    }
  }
}

// ─────────────────────────────────────────────
// UNIQUE CURRENCIES for the selector
// ─────────────────────────────────────────────

const UNIQUE_CURRENCY_COUNTRIES = COUNTRIES.filter(
  (c, i, arr) => arr.findIndex((x) => x.currency === c.currency) === i
);

// ─────────────────────────────────────────────
// STEP INDICATOR
// ─────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps: { label: string }[] = [
    { label: "Upload" },
    { label: "Configure" },
    { label: "Results" },
  ];
  return (
    <div className="flex items-center mb-8" role="navigation" aria-label="Progress">
      {steps.map((s, i) => {
        const n = (i + 1) as Step;
        const active = current === n;
        const done = current > n;
        return (
          <div key={s.label} className="flex items-center">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold select-none"
              style={{
                background: active || done ? "var(--accent)" : "var(--surface-2)",
                color: active || done ? "white" : "var(--text-secondary)",
              }}
              aria-current={active ? "step" : undefined}
            >
              {done ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                <span>{n}</span>
              )}
              {active && <span>{s.label}</span>}
            </div>
            {i < 2 && (
              <div
                className="w-8 h-px mx-1"
                style={{ background: current > n ? "var(--accent)" : "var(--border)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function GlobalPriceCalculator() {
  // ── Step ──
  const [step, setStep] = useState<Step>(1);

  // ── Step 1 ──
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Step 2 ──
  const [nameIdx, setNameIdx] = useState(0);
  const [priceIdx, setPriceIdx] = useState(1);
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [homeCountry, setHomeCountry] = useState<Country>(COUNTRIES[0]);
  const [currencyQuery, setCurrencyQuery] = useState("");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);

  // ── Step 3 ──
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [strategy, setStrategy] = useState<Strategy>("ppp");
  const [fxRates, setFxRates] = useState<Record<string, number> | null>(null);
  const [fxCache, setFxCache] = useState<Record<string, Record<string, number>>>({});
  const [loadingRates, setLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState("");

  // Click-outside currency dropdown
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setCurrencyOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // ── File processing ──
  function processFile(file: File) {
    setFileError("");
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFileError("Please upload a CSV file (.csv)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text?.trim()) { setFileError("File is empty."); return; }
      const rows = parseCSV(text);
      if (rows.length < 2) { setFileError("CSV must have a header row and at least one data row."); return; }
      if (rows[0].length < 2) { setFileError("CSV must have at least 2 columns."); return; }
      const h = rows[0];
      const data = rows.slice(1).filter((r) => r.some((c) => c));
      if (data.length === 0) { setFileError("No data rows found after the header."); return; }
      setHeaders(h);
      setCsvRows(data);
      setFileName(file.name);
      const ni = guessIndex(h, ["name", "title", "product", "item"]);
      const pi = guessIndex(h, ["price", "amount", "cost", "value"]);
      setNameIdx(ni !== -1 ? ni : 0);
      setPriceIdx(pi !== -1 ? pi : ni !== 0 ? 0 : 1);
    };
    reader.readAsText(file);
  }

  function clearFile() {
    setFileName(""); setCsvRows([]); setHeaders([]); setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "sample-products.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Currency selection helper ──
  function selectCurrency(country: Country) {
    setBaseCurrency(country.currency);
    setCurrencyQuery(country.currency);
    setCurrencyOpen(false);
    // auto-pick home country for this currency
    const matching = COUNTRIES.filter((c) => c.currency === country.currency);
    setHomeCountry(matching[0]);
  }

  const filteredCurrencies = UNIQUE_CURRENCY_COUNTRIES.filter(
    (c) =>
      c.currency.toLowerCase().includes(currencyQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(currencyQuery.toLowerCase())
  );

  // Countries sharing the selected base currency (for home selection)
  const currencyCountries = COUNTRIES.filter((c) => c.currency === baseCurrency);

  // ── Step 2 → 3 ──
  const fetchRates = useCallback(async (currency: string) => {
    if (fxCache[currency]) { setFxRates(fxCache[currency]); return; }
    setLoadingRates(true); setRatesError("");
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${currency}`);
      const data = await res.json();
      if (data.result !== "success") throw new Error();
      setFxRates(data.rates);
      setFxCache((prev) => ({ ...prev, [currency]: data.rates }));
    } catch {
      setRatesError("Live rates unavailable. Lazy Conversion will show N/A.");
    } finally {
      setLoadingRates(false);
    }
  }, [fxCache]);

  async function generatePrices() {
    const parsed: Product[] = [];
    for (const row of csvRows) {
      const name = row[nameIdx]?.trim();
      const raw = row[priceIdx]?.trim() ?? "";
      if (!name) continue;
      const price = cleanPrice(raw);
      if (price === null) continue;
      parsed.push({ name, price });
    }
    if (parsed.length === 0) {
      setFileError("No valid products found. Check your column selections.");
      setStep(2);
      return;
    }
    setProducts(parsed);
    setSelected(parsed[0]);
    setStep(3);
    await fetchRates(baseCurrency);
  }

  function startOver() {
    setStep(1); clearFile();
    setProducts([]); setSelected(null); setProductSearch("");
    setFxRates(null); setRatesError(""); setFxCache({});
    setBaseCurrency("USD"); setHomeCountry(COUNTRIES[0]);
    setCurrencyQuery(""); setStrategy("ppp");
  }

  // ── Export CSV ──
  function exportCSV() {
    if (!selected) return;
    const rows = [
      `"Product: ${selected.name}"`,
      `"Base Price: ${fmt(selected.price, baseCurrency)}"`,
      `""`,
      `Country,Currency,"PPP (target/home)","Lazy Bank Conversion","PPP Power Price","Final (.99 rounded)"`,
    ];
    const sorted = [
      homeCountry,
      ...COUNTRIES.filter((c) => c.iso3 !== homeCountry.iso3),
    ];
    for (const c of sorted) {
      const isHome = c.iso3 === homeCountry.iso3;
      const ratio = c.ppp / homeCountry.ppp;
      const lazy = fxRates?.[c.currency] != null
        ? fmt(selected.price * fxRates[c.currency], c.currency)
        : "N/A";
      const pppPrice = selected.price * ratio;
      const finalPrice = pppPrice < 1 ? 0.99 : Math.floor(pppPrice) + 0.99;
      rows.push(
        `"${flag(c.iso2)} ${c.name}${isHome ? " (Home)" : ""}",${c.currency},${ratio.toFixed(4)},${lazy},${fmt(pppPrice, c.currency)},${fmt(finalPrice, c.currency)}`
      );
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selected.name.replace(/\s+/g, "-").toLowerCase()}-global-pricing.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Validation ──
  const step1Valid = fileName && csvRows.length > 0;
  const step2Valid =
    nameIdx >= 0 && priceIdx >= 0 && nameIdx !== priceIdx && baseCurrency && homeCountry;

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const displayCountries = selected
    ? [homeCountry, ...COUNTRIES.filter((c) => c.iso3 !== homeCountry.iso3)]
    : [];

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div className="min-h-full p-6 lg:p-8" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm mb-3" style={{ color: "var(--text-secondary)" }} aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span aria-hidden>/</span>
          <span style={{ color: "var(--text-primary)" }}>Global Price Calculator</span>
        </nav>
        <h1 style={{ color: "var(--text-primary)" }} className="text-2xl font-bold tracking-tight">
          Global Price Calculator
        </h1>
        <p style={{ color: "var(--text-secondary)" }} className="mt-1 text-sm max-w-xl">
          Upload your product CSV and get localized pricing across {COUNTRIES.length} countries using
          World Bank PPP data and live exchange rates.
        </p>
      </div>

      <StepIndicator current={step} />

      {/* ══════════════════════════════════════
          STEP 1: UPLOAD
      ══════════════════════════════════════ */}
      {step === 1 && (
        <div className="max-w-2xl">
          {!fileName ? (
            <label
              htmlFor="csv-upload"
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault(); setIsDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) processFile(f);
              }}
              className="rounded-2xl p-14 flex flex-col items-center justify-center text-center cursor-pointer transition-all block"
              style={{
                border: `2px dashed ${isDragging ? "var(--accent)" : "rgba(124,58,237,0.4)"}`,
                background: isDragging ? "var(--accent-glow)" : "var(--surface)",
              }}
            >
              <div
                style={{ background: "var(--accent-glow)", color: "var(--accent-light)" }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p style={{ color: "var(--text-primary)" }} className="font-semibold text-base">
                Drag & drop your CSV here
              </p>
              <p style={{ color: "var(--text-secondary)" }} className="text-sm mt-1">
                Or click to browse files
              </p>
              <p style={{ color: "var(--text-secondary)" }} className="text-xs mt-3 opacity-50">
                CSV files only
              </p>
              <input
                id="csv-upload"
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
              />
            </label>
          ) : (
            /* File Success Card */
            <div
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              className="rounded-2xl p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    style={{ background: "var(--green-glow)", color: "var(--green)" }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ color: "var(--text-primary)" }} className="font-medium text-sm">
                      {fileName}
                    </p>
                    <p style={{ color: "var(--green)" }} className="text-xs mt-0.5">
                      {csvRows.length} product{csvRows.length !== 1 ? "s" : ""} found
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  style={{ color: "var(--text-secondary)" }}
                  className="hover:text-white transition-colors p-1 rounded-lg"
                  aria-label="Remove file"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "var(--surface-2)" }}>
                      {headers.map((h, i) => (
                        <th
                          key={i}
                          style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border)" }}
                          className="text-left px-3 py-2 font-semibold whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.slice(0, 3).map((row, i) => (
                      <tr key={i} style={{ borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                        {row.map((cell, j) => (
                          <td key={j} style={{ color: "var(--text-primary)" }} className="px-3 py-2 whitespace-nowrap">
                            {cell || <span style={{ color: "var(--text-secondary)" }}>—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvRows.length > 3 && (
                <p style={{ color: "var(--text-secondary)" }} className="text-xs mt-2 px-1">
                  + {csvRows.length - 3} more rows not shown
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {fileError && (
            <div
              style={{ background: "#3f1212", border: "1px solid #7f1d1d", color: "#fca5a5" }}
              className="rounded-xl px-4 py-3 mt-3 text-sm flex items-center gap-2"
              role="alert"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
              </svg>
              {fileError}
            </div>
          )}

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${step1Valid ? "btn-ready" : ""}`}
              style={{
                background: step1Valid ? "var(--accent)" : "var(--surface-2)",
                color: step1Valid ? "white" : "var(--text-secondary)",
                cursor: step1Valid ? "pointer" : "not-allowed",
              }}
            >
              Continue →
            </button>
            <button
              onClick={downloadSample}
              style={{ color: "var(--text-secondary)", border: "1px solid var(--border)", background: "var(--surface)" }}
              className="px-4 py-2.5 rounded-xl text-sm font-medium hover:text-white transition-colors"
            >
              Download Sample CSV
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          STEP 2: CONFIGURE
      ══════════════════════════════════════ */}
      {step === 2 && (
        <div className="max-w-lg">
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-2xl p-6">
            <h2 style={{ color: "var(--text-primary)" }} className="font-semibold mb-5">
              Map Your Data
            </h2>

            {/* Product Name Column */}
            <div className="mb-4">
              <label
                htmlFor="name-col"
                style={{ color: "var(--text-secondary)" }}
                className="text-xs font-medium mb-1.5 block"
              >
                Product Name Column
              </label>
              <select
                id="name-col"
                value={nameIdx}
                onChange={(e) => setNameIdx(Number(e.target.value))}
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500/40 cursor-pointer"
              >
                {headers.map((h, i) => (
                  <option key={i} value={i}>{h}</option>
                ))}
              </select>
            </div>

            {/* Price Column */}
            <div className="mb-4">
              <label
                htmlFor="price-col"
                style={{ color: "var(--text-secondary)" }}
                className="text-xs font-medium mb-1.5 block"
              >
                Price Column
              </label>
              <select
                id="price-col"
                value={priceIdx}
                onChange={(e) => setPriceIdx(Number(e.target.value))}
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500/40 cursor-pointer"
              >
                {headers.map((h, i) => (
                  <option key={i} value={i}>{h}</option>
                ))}
              </select>
              {nameIdx === priceIdx && (
                <p style={{ color: "#fca5a5" }} className="text-xs mt-1.5" role="alert">
                  Name and price columns cannot be the same.
                </p>
              )}
            </div>

            {/* Base Currency — searchable combobox */}
            <div className="mb-4" ref={currencyRef}>
              <label
                htmlFor="currency-input"
                style={{ color: "var(--text-secondary)" }}
                className="text-xs font-medium mb-1.5 block"
              >
                Base Currency (your prices are in)
              </label>
              <div className="relative">
                <input
                  id="currency-input"
                  type="text"
                  autoComplete="off"
                  placeholder="Search (e.g. USD, Euro, British...)"
                  value={currencyQuery}
                  onChange={(e) => { setCurrencyQuery(e.target.value); setCurrencyOpen(true); }}
                  onFocus={() => setCurrencyOpen(true)}
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500/40"
                  aria-autocomplete="list"
                  aria-expanded={currencyOpen}
                />
                {currencyOpen && filteredCurrencies.length > 0 && (
                  <div
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    className="absolute z-20 w-full mt-1 rounded-xl shadow-xl overflow-hidden"
                    role="listbox"
                  >
                    <div className="max-h-52 overflow-y-auto">
                      {filteredCurrencies.map((c) => (
                        <button
                          key={c.iso3}
                          onMouseDown={(e) => { e.preventDefault(); selectCurrency(c); }}
                          className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-colors"
                          style={{ color: "var(--text-primary)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          role="option"
                          aria-selected={baseCurrency === c.currency}
                        >
                          <span className="text-base">{flag(c.iso2)}</span>
                          <span className="font-semibold">{c.currency}</span>
                          <span style={{ color: "var(--text-secondary)" }}>— {c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {baseCurrency && !currencyOpen && (
                <div
                  style={{ background: "var(--accent-glow)", border: "1px solid rgba(124,58,237,0.3)", color: "var(--accent-light)" }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mt-2"
                >
                  {flag(COUNTRIES.find((c) => c.currency === baseCurrency)?.iso2 ?? "US")}
                  {" "}{baseCurrency} selected
                </div>
              )}
            </div>

            {/* Home Country (if multiple share the currency) */}
            {currencyCountries.length > 1 && baseCurrency && (
              <div className="mb-4">
                <label
                  htmlFor="home-country"
                  style={{ color: "var(--text-secondary)" }}
                  className="text-xs font-medium mb-1.5 block"
                >
                  Your Country <span className="opacity-60">(sets your PPP baseline)</span>
                </label>
                <select
                  id="home-country"
                  value={homeCountry?.iso3 ?? ""}
                  onChange={(e) => {
                    const c = COUNTRIES.find((x) => x.iso3 === e.target.value);
                    if (c) setHomeCountry(c);
                  }}
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500/40 cursor-pointer"
                >
                  {currencyCountries.map((c) => (
                    <option key={c.iso3} value={c.iso3}>
                      {flag(c.iso2)} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => setStep(1)}
              style={{ color: "var(--text-secondary)", border: "1px solid var(--border)", background: "var(--surface)" }}
              className="px-4 py-2.5 rounded-xl text-sm font-medium hover:text-white transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={generatePrices}
              disabled={!step2Valid}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${step2Valid ? "btn-ready" : ""}`}
              style={{
                background: step2Valid ? "var(--accent)" : "var(--surface-2)",
                color: step2Valid ? "white" : "var(--text-secondary)",
                cursor: step2Valid ? "pointer" : "not-allowed",
              }}
            >
              Generate Prices →
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          STEP 3: RESULTS
      ══════════════════════════════════════ */}
      {step === 3 && homeCountry && (
        <div>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <p style={{ color: "var(--text-secondary)" }} className="text-sm">
              <span style={{ color: "var(--text-primary)" }} className="font-semibold">{products.length} products</span>
              {" · "}
              <span style={{ color: "var(--text-primary)" }} className="font-semibold">{COUNTRIES.length} countries</span>
              {" · "}
              {flag(homeCountry.iso2)} {homeCountry.name} ({baseCurrency})
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStep(2)}
                style={{ color: "var(--text-secondary)", border: "1px solid var(--border)", background: "var(--surface)" }}
                className="px-3.5 py-2 rounded-xl text-xs font-medium hover:text-white transition-colors"
              >
                ← Configure
              </button>
              <button
                onClick={exportCSV}
                disabled={!selected}
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                className="px-3.5 py-2 rounded-xl text-xs font-medium hover:border-purple-500/50 transition-all flex items-center gap-1.5 disabled:opacity-40"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export CSV
              </button>
              <button
                onClick={startOver}
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                className="px-3.5 py-2 rounded-xl text-xs font-medium hover:text-white transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
            {/* ── Product List ── */}
            <div
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              className="rounded-2xl p-4 xl:col-span-1"
            >
              <h3 style={{ color: "var(--text-primary)" }} className="font-semibold text-sm mb-3">
                Products
              </h3>
              <div className="relative mb-3">
                <svg
                  width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="search"
                  placeholder="Search products…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  className="w-full rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-purple-500/40"
                  aria-label="Search products"
                />
              </div>
              <div className="space-y-0.5 max-h-[420px] overflow-y-auto pr-1">
                {filteredProducts.length === 0 && (
                  <p style={{ color: "var(--text-secondary)" }} className="text-xs text-center py-4">
                    No products match
                  </p>
                )}
                {filteredProducts.map((p, i) => {
                  const active = selected?.name === p.name;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelected(p)}
                      className="w-full text-left rounded-xl px-3 py-2.5 text-xs transition-all"
                      style={{
                        background: active ? "var(--accent-glow)" : "transparent",
                        border: `1px solid ${active ? "rgba(124,58,237,0.3)" : "transparent"}`,
                      }}
                      aria-pressed={active}
                    >
                      <p
                        className="font-medium truncate"
                        style={{ color: active ? "var(--accent-light)" : "var(--text-primary)" }}
                      >
                        {p.name}
                      </p>
                      <p
                        className="mt-0.5 tabular-nums"
                        style={{ color: active ? "var(--accent-light)" : "var(--text-secondary)", opacity: 0.8 }}
                      >
                        {fmt(p.price, baseCurrency)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Right Panel ── */}
            <div className="xl:col-span-3 flex flex-col gap-4">
              {/* Strategy Toggle */}
              <div
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                className="rounded-2xl p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p style={{ color: "var(--text-secondary)" }} className="text-xs font-medium mr-1">
                    Pricing Strategy:
                  </p>
                  {(
                    [
                      { key: "lazy",  label: "Lazy Conversion", hint: "Live FX rate only" },
                      { key: "ratio", label: "PPP Ratio",        hint: "Purchasing power ratio" },
                      { key: "ppp",   label: "PPP Power",        hint: "PPP-adjusted price" },
                      { key: "final", label: "Final (.99)",       hint: "Psychological pricing" },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setStrategy(s.key)}
                      title={s.hint}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: strategy === s.key ? "var(--accent)" : "var(--surface-2)",
                        color: strategy === s.key ? "white" : "var(--text-secondary)",
                        border: `1px solid ${strategy === s.key ? "var(--accent)" : "var(--border)"}`,
                      }}
                      aria-pressed={strategy === s.key}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {strategy === "lazy" && (loadingRates || ratesError) && (
                  <p
                    style={{ color: ratesError ? "#fca5a5" : "var(--text-secondary)" }}
                    className="text-xs mt-2 flex items-center gap-1.5"
                  >
                    {loadingRates && (
                      <span className="w-3 h-3 rounded-full border border-purple-500/30 border-t-purple-500 animate-spin inline-block" />
                    )}
                    {loadingRates ? "Fetching live rates…" : ratesError}
                  </p>
                )}

                {/* Strategy description */}
                <p style={{ color: "var(--text-secondary)" }} className="text-xs mt-2 opacity-70">
                  {strategy === "lazy" && "Direct currency conversion using today's live exchange rate."}
                  {strategy === "ratio" && "Shows the relative purchasing power difference (× multiplier) between your home country and each target market."}
                  {strategy === "ppp" && "Adjusts your price based on local purchasing power — what consumers in that country can afford relative to yours."}
                  {strategy === "final" && "PPP-adjusted price rounded to the nearest .99 psychological price point."}
                </p>
              </div>

              {/* Selected product pill */}
              {selected && (
                <div
                  style={{ background: "var(--accent-glow)", border: "1px solid rgba(124,58,237,0.25)" }}
                  className="rounded-xl px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1"
                >
                  <div>
                    <p style={{ color: "var(--text-secondary)" }} className="text-[10px] uppercase tracking-wide font-semibold">Selected</p>
                    <p style={{ color: "var(--text-primary)" }} className="font-semibold text-sm">{selected.name}</p>
                  </div>
                  <div style={{ borderLeft: "1px solid rgba(124,58,237,0.25)" }} className="pl-4">
                    <p style={{ color: "var(--text-secondary)" }} className="text-[10px] uppercase tracking-wide font-semibold">Base Price</p>
                    <p style={{ color: "var(--accent-light)" }} className="font-bold text-sm tabular-nums">
                      {fmt(selected.price, baseCurrency)}
                    </p>
                  </div>
                  <div style={{ borderLeft: "1px solid rgba(124,58,237,0.25)" }} className="pl-4">
                    <p style={{ color: "var(--text-secondary)" }} className="text-[10px] uppercase tracking-wide font-semibold">Home</p>
                    <p style={{ color: "var(--text-primary)" }} className="font-semibold text-sm">
                      {flag(homeCountry.iso2)} {homeCountry.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Country Cards Grid */}
              {selected ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {displayCountries.map((country) => {
                    const isHome = country.iso3 === homeCountry.iso3;
                    const val = calcValue(selected.price, homeCountry, country, fxRates, strategy);
                    const spinning = strategy === "lazy" && loadingRates;

                    return (
                      <div
                        key={country.iso3}
                        className="rounded-xl p-3.5 transition-all"
                        style={{
                          background: isHome ? "rgba(124,58,237,0.12)" : "var(--surface)",
                          border: `1px solid ${isHome ? "rgba(124,58,237,0.35)" : "var(--border)"}`,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl leading-none">{flag(country.iso2)}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p
                                style={{ color: "var(--text-primary)" }}
                                className="text-xs font-semibold leading-tight truncate"
                              >
                                {country.name}
                              </p>
                              {isHome && (
                                <span
                                  style={{ background: "rgba(124,58,237,0.2)", color: "var(--accent-light)" }}
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                >
                                  HOME
                                </span>
                              )}
                            </div>
                            <p style={{ color: "var(--text-secondary)" }} className="text-[10px]">
                              {country.currency}
                            </p>
                          </div>
                        </div>

                        <p
                          style={{ color: isHome ? "var(--accent-light)" : "var(--text-primary)" }}
                          className="text-base font-bold tabular-nums"
                        >
                          {spinning ? (
                            <span
                              className="inline-block rounded animate-pulse"
                              style={{ background: "var(--surface-2)", width: "70px", height: "18px", display: "inline-block" }}
                            />
                          ) : val === null ? (
                            <span style={{ color: "var(--text-secondary)" }} className="text-sm font-normal">N/A</span>
                          ) : strategy === "ratio" ? (
                            <span>{val.toFixed(2)}×</span>
                          ) : (
                            fmt(val, country.currency)
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  className="rounded-2xl p-16 text-center"
                >
                  <p style={{ color: "var(--text-secondary)" }}>Select a product to see pricing</p>
                </div>
              )}
            </div>
          </div>

          {/* Data Source Note */}
          <div
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            className="mt-5 rounded-xl px-5 py-3.5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs"
          >
            <div className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              PPP data: World Bank 2024
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
              </svg>
              FX rates: open.er-api.com
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
              </svg>
              For reference only — not financial advice
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
