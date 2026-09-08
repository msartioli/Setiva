import Link from "next/link";
import Image from "next/image";

export function PublicPage({ title, updatedAt, children }: { title: string; updatedAt: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="inline-flex items-center gap-2">
          <Image src="/brand/symbol.png" alt="" width={26} height={26} />
          <span className="font-display text-lg text-foreground">Setiva</span>
        </Link>
        <Link href="/" className="text-sm text-foreground-muted hover:text-foreground">
          Voltar
        </Link>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pb-16 sm:px-0">
        <h1 className="mt-4 font-display text-3xl text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-foreground-muted">Última atualização: {updatedAt}</p>
        <div className="prose-setiva mt-8 flex flex-col gap-5 text-sm leading-relaxed text-foreground [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-lg [&_h2]:text-foreground [&_strong]:font-medium">
          {children}
        </div>
      </main>
    </div>
  );
}
