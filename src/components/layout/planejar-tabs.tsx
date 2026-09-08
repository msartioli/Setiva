import { SectionTabs } from "./section-tabs";

export function PlanejarTabs() {
  return (
    <SectionTabs
      items={[
        { href: "/planejar/orcamentos", label: "Orçamentos" },
        { href: "/planejar/metas", label: "Metas" },
        { href: "/planejar/recorrencias", label: "Recorrências" },
        { href: "/planejar/dividas", label: "Dívidas" },
      ]}
    />
  );
}
