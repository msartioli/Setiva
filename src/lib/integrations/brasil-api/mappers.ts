import type { FinancialInstitution } from "../financial-institutions/types";
import { digitsOnly } from "../financial-institutions/normalize";
import type { BrasilApiBank } from "./types";

export function mapBrasilApiBank(bank: BrasilApiBank): FinancialInstitution {
  const ispb = digitsOnly(bank.ispb).padStart(8, "0");
  return {
    id: ispb,
    ispb,
    compe: bank.code != null ? String(bank.code).padStart(3, "0") : null,
    name: bank.fullName?.trim() || bank.name.trim(),
    shortName: bank.name.trim(),
    logoUrl: bank.logo_url?.trim() || null,
    pixParticipant: false,
    source: "brasilapi",
  };
}
