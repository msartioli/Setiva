import { SectionTabs } from "./section-tabs";

export function VisaoGeralTabs() {
  return (
    <SectionTabs
      items={[
        { href: "/visao-geral", label: "Contas" },
        { href: "/visao-geral/cartoes", label: "Cartões" },
        { href: "/relatorios", label: "Relatórios" },
      ]}
    />
  );
}
