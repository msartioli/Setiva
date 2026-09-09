"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, ArrowLeftRight, LayoutGrid, Compass, Plus, LogOut, Settings, Bell, Upload, CircleHelp, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { logOutAction } from "@/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { href: "/hoje", label: "Hoje", icon: Home },
  { href: "/movimentacoes", label: "Movimentações", icon: ArrowLeftRight },
  { href: "/planejar", label: "Planejar", icon: Compass },
  { href: "/visao-geral", label: "Visão geral", icon: LayoutGrid },
];

export function AppShell({
  displayName,
  avatarUri,
  unreadNotifications,
  onNewTransaction,
  children,
}: {
  displayName: string;
  avatarUri: string;
  unreadNotifications: number;
  onNewTransaction: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6">
          <Link href="/hoje" className="flex items-center gap-2 justify-self-start">
            <Image src="/brand/symbol.png" alt="" width={26} height={26} />
            <span className="hidden font-display text-lg text-foreground sm:inline">Setiva</span>
          </Link>

          <nav
            aria-label="Navegação principal"
            className="hidden min-w-0 items-center justify-self-center gap-1 rounded-[var(--radius-pill)] border border-border bg-surface p-1 shadow-sm md:flex"
          >
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-[var(--radius-pill)] px-3 py-2 text-sm font-medium transition-colors duration-[var(--motion-fast)] lg:px-4",
                    active ? "bg-brand text-brand-foreground" : "text-foreground-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-self-end gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onNewTransaction}
              className="hidden items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-pill)] bg-accent px-3 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-strong sm:inline-flex lg:px-4"
            >
              <Plus className="size-4 shrink-0" aria-hidden="true" />
              <span className="hidden lg:inline">Novo lançamento</span>
            </button>
            <Link
              href="/notificacoes"
              aria-label={unreadNotifications > 0 ? `Notificações, ${unreadNotifications} não lidas` : "Notificações"}
              className="relative flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-pill)] text-foreground-muted hover:bg-surface hover:text-foreground"
            >
              <Bell className="size-5" aria-hidden="true" />
              {unreadNotifications > 0 && (
                <span className="absolute right-2 top-2 flex size-2 rounded-full bg-negative" aria-hidden="true" />
              )}
            </Link>
            <ProfileMenu displayName={displayName} avatarUri={avatarUri} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-10">{children}</main>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium",
                active ? "text-brand" : "text-foreground-muted"
              )}
            >
              <item.icon className="size-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onNewTransaction}
        aria-label="Novo lançamento"
        className="fixed right-4 bottom-20 z-30 flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg md:hidden"
      >
        <Plus className="size-6" aria-hidden="true" />
      </button>
    </div>
  );
}

function ProfileMenu({ displayName, avatarUri }: { displayName: string; avatarUri: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-surface p-1 pr-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUri} alt="" width={28} height={28} className="rounded-full" />
          <span className="hidden max-w-24 truncate sm:inline">{displayName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <Link href="/sugestoes">
            <Lightbulb className="size-4" aria-hidden="true" />
            Sugestões
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/importar">
            <Upload className="size-4" aria-hidden="true" />
            Importar e exportar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/ajuda">
            <CircleHelp className="size-4" aria-hidden="true" />
            Ajuda
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/configuracoes">
            <Settings className="size-4" aria-hidden="true" />
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => logOutAction()}>
          <LogOut className="size-4" aria-hidden="true" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
