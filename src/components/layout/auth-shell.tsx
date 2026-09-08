import Image from "next/image";
import Link from "next/link";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="hidden flex-col justify-between bg-brand px-12 py-10 text-brand-foreground lg:flex">
        <Link href="/" className="inline-flex items-center gap-2">
          <Image src="/brand/symbol.png" alt="" width={32} height={32} priority />
          <span className="font-display text-lg">Setiva</span>
        </Link>
        <div className="max-w-sm">
          <p className="font-display text-3xl leading-tight text-balance">
            Veja o que cabe no seu mês, todo mês.
          </p>
          <p className="mt-4 text-sm text-brand-foreground/80">
            Um mapa dos seus dias, contas e cartões — com os seus números, não uma média genérica.
          </p>
        </div>
        <p className="text-xs text-brand-foreground/60">
          Setiva. Registro manual e importação de CSV; sem conexão automática com bancos nesta versão.
        </p>
      </aside>

      <main className="flex items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 lg:hidden">
            <Image src="/brand/symbol.png" alt="" width={28} height={28} />
            <span className="font-display text-lg text-foreground">Setiva</span>
          </Link>
          <p className="text-sm font-medium text-brand">{eyebrow}</p>
          <h1 className="mt-1 font-display text-2xl text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-foreground-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
