export interface Currency {
  code: string;
  name: string;
}

export interface ExchangeRate {
  currency: string;
  date: string;
  buy: number;
  sell: number;
  source: "brasilapi" | "bcb" | "cache";
}

export interface SelicRate {
  value: number;
  date: string;
  source: "brasilapi" | "bcb" | "cache";
}
