import Link from "next/link";
import Image from "next/image";
import { Character } from "@/components/marketing/character";
import { CtaButton } from "@/components/marketing/cta-button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-forest text-white">
      <svg
        className="pointer-events-none absolute -right-24 top-1/2 h-[95%] w-auto -translate-y-1/2 opacity-20"
        viewBox="0 0 400 400"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="200" cy="200" r="190" stroke="#f2b705" strokeWidth="2" />
        <circle cx="200" cy="200" r="145" stroke="#f2b705" strokeWidth="2" />
      </svg>

      <header className="relative mx-auto flex w-full max-w-6xl items-center px-5 py-8 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <Image src="/brand/symbol.png" alt="" width={30} height={30} />
          <span className="font-display text-xl font-extrabold">Setiva</span>
        </Link>
      </header>

      <main className="relative mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-10 px-5 pb-16 sm:px-8 lg:grid-cols-[1fr_auto]">
        <div className="max-w-lg">
          <p className="font-display text-[5rem] font-extrabold leading-none text-accent sm:text-[6.5rem]">404</p>
          <h1 className="mt-4 font-display text-[2rem] font-extrabold leading-tight text-balance sm:text-[2.5rem]">
            Essa página não está no mapa.
          </h1>
          <p className="mt-4 max-w-md text-[17px] leading-relaxed text-white/75">
            O endereço não existe ou foi movido. Seu mês continua exatamente onde você deixou.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <CtaButton href="/hoje" size="lg">
              Voltar para o meu mês
            </CtaButton>
            <Link
              href="/"
              className="text-[15px] font-bold text-white/85 underline-offset-4 hover:text-white hover:underline"
            >
              Ir para a página inicial
            </Link>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-[420px] items-center justify-center">
          <div className="size-[300px] overflow-hidden rounded-full bg-accent sm:size-[340px]">
            <Character seed="planilha" size={340} className="size-full" />
          </div>
        </div>
      </main>
    </div>
  );
}
