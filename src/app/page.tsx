import Link from "next/link";
import Image from "next/image";
import {
  CalendarClock,
  CreditCard,
  Target,
  PiggyBank,
  Upload,
  BarChart3,
  ArrowUp,
  Landmark,
  ShieldCheck,
  Tag,
  Smartphone,
  ListChecks,
  SlidersHorizontal,
  BellRing,
  Wallet,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import { CtaButton } from "@/components/marketing/cta-button";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";
import { FaqItem } from "@/components/marketing/faq-item";
import { Eyebrow, FeatureList, IconBadge, ScreenCard, SectionHeading } from "@/components/marketing/pieces";
import { Character } from "@/components/marketing/character";
import {
  PhoneMockup,
  AgendaMockup,
  CardsMockup,
  BudgetMockup,
  FloatingCard,
} from "@/components/marketing/product-mockup";

const ROUTINE = [
  {
    icon: <BellRing className="size-5" aria-hidden="true" />,
    title: "Nada vence sem você saber",
    body: "Contas fixas e faturas aparecem antes do vencimento, no dia em que ainda dá para agir.",
  },
  {
    icon: <CreditCard className="size-5" aria-hidden="true" />,
    title: "Controle seus cartões",
    body: "Cada parcela cai na fatura certa, considerando o fechamento. Pagar a fatura não conta a despesa de novo.",
  },
  {
    icon: <Wallet className="size-5" aria-hidden="true" />,
    title: "Planejamento simples",
    body: "Veja quanto já saiu no mês e quanto ainda cabe até a próxima entrada, sem refazer conta na mão.",
  },
  {
    icon: <ShieldCheck className="size-5" aria-hidden="true" />,
    title: "Seus dados são seus",
    body: "Exporte tudo em CSV ou apague sua conta quando quiser. Sem senha de banco, sem conexão automática.",
  },
];

const TAILORED = [
  {
    icon: <LineChart className="size-5" aria-hidden="true" />,
    title: "Saúde do mês",
    body: "Saldo projetado dia a dia, alerta quando um dia fecha no vermelho antes da próxima entrada.",
  },
  {
    icon: <SlidersHorizontal className="size-5" aria-hidden="true" />,
    title: "Ajuste antes de gastar",
    body: "Simule um gasto a mais ou um aporte extra e veja o efeito na hora, sem salvar nada até decidir.",
  },
  {
    icon: <Upload className="size-5" aria-hidden="true" />,
    title: "Comece com o que já tem",
    body: "Importe o extrato em CSV, revise a prévia e confirme. Se algo sair errado, o lote inteiro volta atrás.",
  },
];

const FEATURES = [
  {
    icon: CalendarClock,
    title: "Mapa do mês",
    body: "Saldo projetado dia a dia, não só um número no fim do mês.",
  },
  { icon: CreditCard, title: "Cartões e faturas", body: "Parcelas na fatura certa, sem despesa duplicada." },
  { icon: PiggyBank, title: "Orçamentos", body: "Limite por categoria, com o realizado somado de verdade." },
  { icon: Target, title: "Metas com prazo", body: "Reserve por transferência real entre contas." },
  { icon: Upload, title: "Importação de CSV", body: "Extrato do banco com prévia e checagem de duplicata." },
  { icon: BarChart3, title: "Relatórios", body: "Competência e caixa lado a lado, sem confundir os dois." },
];

const STEPS = [
  {
    number: "01",
    icon: ListChecks,
    title: "Registre o que já existe",
    body: "Contas, cartões e contas fixas do mês. Alguns minutos, sem senha de banco.",
  },
  {
    number: "02",
    icon: CalendarClock,
    title: "Veja o mapa do mês",
    body: "Entradas, saídas e saldo projetado dia a dia, na mesma tela onde você lança.",
  },
  {
    number: "03",
    icon: SlidersHorizontal,
    title: "Ajuste antes de gastar",
    body: "Simule o gasto e veja o efeito na hora, antes de tirar o dinheiro da conta.",
  },
];

const FAQ: { icon: LucideIcon; question: string; answer: string }[] = [
  {
    icon: Landmark,
    question: "A Setiva conecta com meu banco automaticamente?",
    answer:
      "Não nesta versão. O registro é manual, e você pode importar um extrato em CSV para adiantar o trabalho. Não simulamos conexão bancária que não existe.",
  },
  {
    icon: ShieldCheck,
    question: "Meus dados financeiros ficam seguros?",
    answer:
      "Cada lançamento fica protegido por regras no próprio banco de dados: mesmo se algo na interface falhar, ninguém lê ou grava dado de outra conta. Você pode exportar tudo ou excluir sua conta a qualquer momento.",
  },
  {
    icon: Tag,
    question: "Preciso pagar para usar?",
    answer:
      "Ainda não definimos um plano comercial. Por enquanto, criar conta não custa nada, e não prometemos que isso é permanente.",
  },
  {
    icon: Smartphone,
    question: "Funciona no celular?",
    answer:
      "Sim, é um site responsivo, funciona no navegador do celular. Não existe aplicativo nativo nesta versão.",
  },
  {
    icon: CreditCard,
    question: "Uma compra parcelada no cartão conta como gasto duas vezes?",
    answer:
      "Não. A compra entra como despesa no mês em que aconteceu, parcela a parcela. Pagar a fatura depois só move dinheiro da sua conta, sem duplicar a despesa.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col overflow-x-clip bg-background">
      <SiteHeader />
      <Hero />
      <Routine />
      <MonthMap />
      <HowItWorks />
      <Tailored />
      <FeatureGrid />
      <Faq />
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-surface shadow-sm">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" className="inline-flex shrink-0 items-center gap-2">
          <Image src="/brand/symbol.png" alt="" width={30} height={30} />
          <span className="font-display text-xl font-extrabold tracking-tight text-foreground">Setiva</span>
        </Link>
        <nav className="hidden items-center gap-7 text-[15px] font-semibold text-foreground-muted lg:flex">
          <a href="#recursos" className="hover:text-brand">
            Recursos
          </a>
          <a href="#como-funciona" className="hover:text-brand">
            Como funciona
          </a>
          <a href="#perguntas" className="hover:text-brand">
            Perguntas
          </a>
          <Link href="/ajuda" className="hover:text-brand">
            Ajuda
          </Link>
        </nav>
        <div className="flex shrink-0 items-center gap-4">
          <Link
            href="/entrar"
            className="hidden text-[15px] font-bold text-foreground hover:text-brand sm:inline"
          >
            Acessar conta
          </Link>
          <CtaButton href="/cadastro" variant="solid-green">
            Criar conta
          </CtaButton>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-forest text-white">
      <svg
        className="pointer-events-none absolute -right-24 top-1/2 h-[150%] w-auto -translate-y-1/2 opacity-20"
        viewBox="0 0 400 400"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="200" cy="200" r="190" stroke="#f2b705" strokeWidth="2" />
        <circle cx="200" cy="200" r="150" stroke="#f2b705" strokeWidth="2" />
      </svg>

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_480px] lg:py-20">
        <div className="max-w-xl">
          <Eyebrow tone="onDark">Finanças pessoais</Eyebrow>
          <h1 className="mt-6 font-display text-[2.5rem] font-extrabold leading-[1.08] tracking-tight text-balance sm:text-[3.4rem]">
            Do café da manhã ao imprevisto. Seu mês inteiro à vista.
          </h1>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-white/75">
            Contas, cartões, faturas e metas em um mapa diário. Você sabe hoje o que ainda cabe até o fim do
            mês, não só quando ele acaba.
          </p>
          <div className="mt-8">
            <CtaButton href="/cadastro" size="lg">
              Teste grátis
            </CtaButton>
          </div>
        </div>

        <div className="relative mx-auto h-[430px] w-full max-w-[480px] sm:h-[460px]">
          {/* personagem dentro do círculo, celular sobreposto à direita */}
          <div className="absolute bottom-4 -left-10 size-[270px] overflow-hidden rounded-full bg-accent sm:size-[300px]">
            <Character seed="rotina" size={300} className="size-full object-cover" />
          </div>
          <div className="absolute right-0 top-2 origin-top-right scale-90 sm:scale-100">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function Routine() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      {/* alinhado pelo topo: com items-center a foto descia bem abaixo do
          título, deixando um vazio enorme no começo da coluna */}
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal className="relative mx-auto h-[400px] w-full max-w-[420px]">
          {/* retrato recortado em círculo, com cartões do produto sobrepostos */}
          <div className="absolute left-1/2 top-0 size-[320px] -translate-x-1/2 overflow-hidden rounded-full sm:size-[350px]">
            <Image
              src="/images/portrait-user.jpg"
              alt="Pessoa de óculos, em retrato sobre fundo amarelo"
              fill
              className="object-cover object-[50%_35%]"
              sizes="(min-width: 640px) 350px, 320px"
            />
          </div>
          <div className="absolute left-0 top-8">
            <FloatingCard icon={ArrowUp} label="Salário, dia 5" value="R$ 4.200" tone="up" />
          </div>
          <div className="absolute right-0 top-44">
            <FloatingCard icon={Target} label="Meta viagem" value="62%" />
          </div>
          <div className="absolute bottom-8 left-2 hidden sm:block">
            <FloatingCard icon={CreditCard} label="Fatura, dia 10" value="R$ 1.180" tone="down" />
          </div>
        </Reveal>

        <div>
          <SectionHeading
            align="left"
            withMark
            eyebrow="Conheça a plataforma"
            title="Sua rotina financeira pronta para o dia a dia."
            subtitle="Receitas, despesas e cartões em um lugar só, com o efeito de cada um deles no seu saldo."
          />
          <div className="mt-6">
            <FeatureList items={ROUTINE} />
          </div>
        </div>
      </div>
    </section>
  );
}

function MonthMap() {
  return (
    <section className="bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="O mapa do mês"
            title="Suas contas sob controle. Ontem, hoje e no dia 30."
            subtitle="A tela que você abre todo dia mostra cada entrada e cada saída no dia em que elas acontecem."
          />
        </Reveal>
        <Reveal delay={0.1} className="mt-14">
          <ScreenCard align="bottom" className="pt-12">
            <div className="mx-auto max-w-3xl">
              <AgendaMockup />
            </div>
          </ScreenCard>
        </Reveal>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <Reveal>
        <SectionHeading
          eyebrow="Como funciona"
          title="Três passos, sem curso de planilha."
        />
      </Reveal>
      <RevealGroup className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
        {STEPS.map((step) => (
          <RevealItem key={step.number}>
            <div className="h-full rounded-3xl bg-surface p-7 shadow-sm">
              <div className="flex items-center justify-between">
                <IconBadge tone="solid" size="lg">
                  <step.icon className="size-6" aria-hidden="true" />
                </IconBadge>
                <span className="font-display text-4xl font-extrabold text-border-strong">{step.number}</span>
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-foreground">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-foreground-muted">{step.body}</p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}

function Tailored() {
  return (
    <section className="bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Como a Setiva resolve"
            title="Controle financeiro sob medida."
          />
        </Reveal>
        <div className="mt-14 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <ScreenCard className="py-12">
              <div className="space-y-5">
                <CardsMockup />
                <BudgetMockup className="ml-6" />
              </div>
            </ScreenCard>
          </Reveal>
          <Reveal delay={0.1}>
            <FeatureList items={TAILORED} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section id="recursos" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <Reveal>
        <SectionHeading eyebrow="Recursos" title="Tudo o que um mês de verdade precisa." />
      </Reveal>
      <RevealGroup className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <RevealItem key={f.title}>
            <div className="h-full rounded-3xl bg-surface p-6 shadow-sm transition-shadow duration-[var(--motion-base)] hover:shadow-lg">
              <IconBadge tone="soft">
                <f.icon className="size-5" aria-hidden="true" />
              </IconBadge>
              <h3 className="mt-5 font-display text-lg font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-foreground-muted">{f.body}</p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}

function Faq() {
  return (
    <section id="perguntas" className="bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-2xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading eyebrow="Perguntas" title="O que perguntam antes de começar." />
        </Reveal>
        <Reveal delay={0.1} className="mt-12 rounded-3xl bg-background px-6 shadow-sm sm:px-8">
          {FAQ.map((item) => (
            <FaqItem
              key={item.question}
              icon={<item.icon className="size-4" aria-hidden="true" />}
              question={item.question}
              answer={item.answer}
            />
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-forest-deep py-12 text-white/65">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/brand/symbol.png" alt="" width={26} height={26} />
            <span className="font-display text-lg font-extrabold text-white">Setiva</span>
          </Link>
          <div className="flex flex-wrap items-center gap-6 text-sm font-semibold">
            <Link href="/ajuda" className="hover:text-white">
              Ajuda
            </Link>
            <Link href="/termos" className="hover:text-white">
              Termos de uso
            </Link>
            <Link href="/privacidade" className="hover:text-white">
              Privacidade
            </Link>
            <Link href="/creditos" className="hover:text-white">
              Créditos
            </Link>
          </div>
        </div>
        <p className="border-t border-white/10 pt-6 text-sm">
          Setiva, finanças pessoais para o Brasil. Registro manual e importação de CSV, sem conexão automática
          com bancos.
        </p>
      </div>
    </footer>
  );
}
