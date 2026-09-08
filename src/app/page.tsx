import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

// Landing provisoria: funcional e no tom certo, mas ainda sem as
// composicoes editoriais completas da Fase H (fotos, mascote, secoes de
// recursos). Prioridade foi dada ao cadastro, onboarding e app funcionando.
export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="inline-flex items-center gap-2">
          <Image src="/brand/symbol.png" alt="" width={28} height={28} />
          <span className="font-display text-lg text-foreground">Setiva</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Button asChild variant="ghost">
            <Link href="/entrar">Entrar</Link>
          </Button>
          <Button asChild>
            <Link href="/cadastro">Criar conta</Link>
          </Button>
        </nav>
      </header>

      <main className="flex flex-1 items-center px-6 sm:px-10">
        <div className="mx-auto max-w-2xl py-16 text-center">
          <h1 className="font-display text-4xl leading-tight text-balance sm:text-5xl">
            Veja o que cabe no seu mês.
          </h1>
          <p className="mt-5 text-lg text-foreground-muted text-balance">
            Setiva é o caderno financeiro que junta contas, cartões, orçamentos e metas num mapa do mês
            com os seus números — sem inventar médias nem prometer o que não faz.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/cadastro">Criar minha conta</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/entrar">Já tenho conta</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="flex flex-wrap items-center justify-center gap-4 px-6 py-6 text-sm text-foreground-muted sm:px-10">
        <Link href="/termos" className="hover:text-foreground">
          Termos de uso
        </Link>
        <Link href="/privacidade" className="hover:text-foreground">
          Privacidade
        </Link>
        <Link href="/creditos" className="hover:text-foreground">
          Créditos
        </Link>
      </footer>
    </div>
  );
}
