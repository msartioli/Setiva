import type { Metadata } from "next";
import { PublicPage } from "@/components/layout/public-page";

export const metadata: Metadata = { title: "Créditos" };

export default function CreditosPage() {
  return (
    <PublicPage title="Créditos" updatedAt="08/09/2026">
      <p>Setiva é construída com as seguintes ferramentas e materiais de terceiros.</p>

      <h2>Tecnologia</h2>
      <p>
        Next.js, React e TypeScript (interface e servidor); Supabase (banco PostgreSQL, autenticação e
        armazenamento); Tailwind CSS (estilos); Recharts (gráficos); Lucide (ícones, licença ISC).
      </p>

      <h2>Avatares</h2>
      <p>
        Gerados localmente com DiceBear (
        <span className="tabular-figures">@dicebear/core</span>), estilos Notionists, Shapes e Thumbs, todos
        licenciados sob CC0 1.0 (uso livre, sem exigência de atribuição). Detalhes em{" "}
        <code>docs/ASSETS.md</code>.
      </p>

      <h2>Tipografia</h2>
      <p>Bricolage Grotesque (títulos) e Inter (interface e tabelas), via Google Fonts.</p>

      <h2>Marca</h2>
      <p>Logo, símbolo e ícones do aplicativo são material próprio do operador da Setiva.</p>
    </PublicPage>
  );
}
