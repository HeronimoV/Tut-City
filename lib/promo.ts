import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "promo-codes.json");
const TMP_PATH = "/tmp/promo-codes.json";

export interface PromoCode {
  type: "unlimited" | "limited" | "single-use" | "expiring";
  description?: string;
  active: boolean;
  uses: number;
  maxUses?: number;
  expiresAt?: string | null;
  createdAt: string;
}

interface PromoData {
  codes: Record<string, PromoCode>;
}

function readData(): PromoData {
  try {
    // Try /tmp first (writable on Vercel), fall back to bundled data
    if (fs.existsSync(TMP_PATH)) {
      const raw = fs.readFileSync(TMP_PATH, "utf-8");
      return JSON.parse(raw);
    }
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { codes: {} };
  }
}

function writeData(data: PromoData): void {
  try {
    // Write to /tmp on Vercel (writable), also try data dir for local dev
    fs.writeFileSync(TMP_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch {}
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch {}
}

// Initialize /tmp from bundled data if not present
function ensureTmpData(): void {
  if (!fs.existsSync(TMP_PATH)) {
    try {
      const raw = fs.readFileSync(DATA_PATH, "utf-8");
      fs.writeFileSync(TMP_PATH, raw, "utf-8");
    } catch {}
  }
}

export function getAllPromoCodes(): Record<string, PromoCode> {
  ensureTmpData();
  return readData().codes;
}

export function getPromoCode(code: string): PromoCode | undefined {
  ensureTmpData();
  return readData().codes[code.toUpperCase().trim()];
}

export function createPromoCode(
  code: string,
  promo: Omit<PromoCode, "uses" | "createdAt" | "active"> & { active?: boolean }
): PromoCode {
  ensureTmpData();
  const data = readData();
  const upper = code.toUpperCase().trim();
  if (data.codes[upper]) throw new Error("Code already exists");
  const entry: PromoCode = {
    ...promo,
    active: promo.active ?? true,
    uses: 0,
    createdAt: new Date().toISOString().split("T")[0],
  };
  data.codes[upper] = entry;
  writeData(data);
  return entry;
}

export function updatePromoCode(
  code: string,
  updates: Partial<Pick<PromoCode, "active" | "maxUses" | "expiresAt" | "description">>
): PromoCode {
  ensureTmpData();
  const data = readData();
  const upper = code.toUpperCase().trim();
  if (!data.codes[upper]) throw new Error("Code not found");
  Object.assign(data.codes[upper], updates);
  writeData(data);
  return data.codes[upper];
}

export function deactivatePromoCode(code: string): void {
  updatePromoCode(code, { active: false });
}

export function validatePromoCode(code: string): { valid: boolean; message: string } {
  ensureTmpData();
  const upper = code.toUpperCase().trim();
  const data = readData();
  const promo = data.codes[upper];

  if (!promo) {
    return { valid: false, message: "Invalid promo code 😕" };
  }

  if (!promo.active) {
    return { valid: false, message: "This code is no longer active 😢" };
  }

  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return { valid: false, message: "This code has expired 😢" };
  }

  if (promo.type === "single-use" && promo.uses >= 1) {
    return { valid: false, message: "This code has already been used 😢" };
  }

  if (promo.type === "limited" && promo.maxUses && promo.uses >= promo.maxUses) {
    return { valid: false, message: "This code has been fully redeemed 😢" };
  }

  // Increment uses
  promo.uses++;
  data.codes[upper] = promo;
  writeData(data);

  if (promo.type === "unlimited") {
    return { valid: true, message: "VIP access activated! 🎉✨" };
  }

  return { valid: true, message: "Promo code applied! Enjoy free access! 🎊" };
}
