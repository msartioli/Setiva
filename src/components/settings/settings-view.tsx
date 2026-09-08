"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AVATAR_FAMILIES, avatarDataUri, getFamilySeeds, type AvatarFamilyKey } from "@/lib/avatars";
import { Chip } from "@/components/onboarding/step-shell";
import { changePassword, deleteAccount, updatePreferences, updateProfile } from "@/actions/account";
import { archiveCategory, createCategory } from "@/actions/categories";

export interface SettingsProfile {
  displayName: string;
  nickname: string;
  avatarFamily: AvatarFamilyKey;
  avatarSeed: string;
  theme: "light" | "dark" | "system";
  density: "comfortable" | "compact";
  hideValues: boolean;
  showCents: boolean;
  firstDayOfWeek: 0 | 1;
  animationsEnabled: boolean;
  mascotEnabled: boolean;
}

export interface SettingsCategory {
  id: string;
  name: string;
  kind: "income" | "expense";
}

export function SettingsView({ profile, categories }: { profile: SettingsProfile; categories: SettingsCategory[] }) {
  return (
    <div className="flex flex-col gap-8">
      <ProfileSection profile={profile} />
      <AppearanceSection profile={profile} />
      <CategoriesSection categories={categories} />
      <SecuritySection />
      <DataSection />
    </div>
  );
}

function CategoriesSection({ categories }: { categories: SettingsCategory[] }) {
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <SectionCard title="Categorias">
      <p className="mb-4 text-sm text-foreground-muted">
        Categorias do sistema (sem botão de remover) ficam disponíveis para todo mundo. As suas próprias podem
        ser arquivadas.
      </p>
      <ul className="mb-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <li
            key={c.id}
            className="flex items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-background px-3 py-1.5 text-sm"
          >
            {c.name}
            <button
              type="button"
              aria-label={`Arquivar categoria ${c.name}`}
              disabled={isPending}
              onClick={() => startTransition(async () => { await archiveCategory(c.id); })}
              className="text-foreground-muted hover:text-negative"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setError(null);
          startTransition(async () => {
            const result = await createCategory({ name, kind });
            if (result.success) setName("");
            else setError(result.error);
          });
        }}
      >
        <div className="flex gap-2">
          <Button type="button" variant={kind === "expense" ? "primary" : "secondary"} size="sm" onClick={() => setKind("expense")}>
            Despesa
          </Button>
          <Button type="button" variant={kind === "income" ? "primary" : "secondary"} size="sm" onClick={() => setKind("income")}>
            Receita
          </Button>
        </div>
        <Field label="Nova categoria" htmlFor="newCategoryName">
          <Input id="newCategoryName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Pets" />
        </Field>
        <Button type="submit" size="sm" disabled={isPending}>
          Adicionar
        </Button>
      </form>
      {error && <p role="alert" className="mt-2 text-sm text-negative">{error}</p>}
    </SectionCard>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <h2 className="mb-4 font-display text-lg text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function ProfileSection({ profile }: { profile: SettingsProfile }) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [nickname, setNickname] = useState(profile.nickname);
  const [avatarFamily, setAvatarFamily] = useState<AvatarFamilyKey>(profile.avatarFamily);
  const [avatarSeed, setAvatarSeed] = useState(profile.avatarSeed);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <SectionCard title="Perfil">
      <div className="flex flex-col gap-4">
        <Field label="Nome de exibição" htmlFor="settingsDisplayName">
          <Input id="settingsDisplayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </Field>
        <Field label="Apelido" htmlFor="settingsNickname" optional>
          <Input id="settingsNickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </Field>
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Avatar</p>
          <div className="mb-3 flex gap-2">
            {(Object.keys(AVATAR_FAMILIES) as AvatarFamilyKey[]).map((key) => (
              <Chip key={key} selected={avatarFamily === key} onClick={() => setAvatarFamily(key)}>
                {AVATAR_FAMILIES[key].label}
              </Chip>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-3">
            {getFamilySeeds(avatarFamily).map((seed) => (
              <button
                key={seed}
                type="button"
                onClick={() => setAvatarSeed(seed)}
                aria-pressed={avatarSeed === seed}
                aria-label="Escolher este avatar"
                className={`rounded-[var(--radius-md)] border-2 p-1 ${avatarSeed === seed ? "border-brand" : "border-transparent"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarDataUri(avatarFamily, seed)} alt="" width={40} height={40} />
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                setSaved(false);
                const result = await updateProfile({ displayName, nickname, avatarFamily, avatarSeed });
                setSaved(result.success);
              })
            }
          >
            {isPending ? "Salvando..." : "Salvar perfil"}
          </Button>
          {saved && <span className="text-sm text-positive">Salvo.</span>}
        </div>
      </div>
    </SectionCard>
  );
}

function AppearanceSection({ profile }: { profile: SettingsProfile }) {
  const [theme, setTheme] = useState(profile.theme);
  const [density, setDensity] = useState(profile.density);
  const [hideValues, setHideValues] = useState(profile.hideValues);
  const [showCents, setShowCents] = useState(profile.showCents);
  const [animationsEnabled, setAnimationsEnabled] = useState(profile.animationsEnabled);
  const [mascotEnabled, setMascotEnabled] = useState(profile.mascotEnabled);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <SectionCard title="Aparência e privacidade">
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-sm font-medium">Tema</p>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <Chip key={t} selected={theme === t} onClick={() => setTheme(t)}>
                {t === "light" ? "Claro" : t === "dark" ? "Escuro" : "Automático"}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Densidade</p>
          <div className="flex gap-2">
            {(["comfortable", "compact"] as const).map((d) => (
              <Chip key={d} selected={density === d} onClick={() => setDensity(d)}>
                {d === "comfortable" ? "Confortável" : "Compacta"}
              </Chip>
            ))}
          </div>
        </div>
        <ToggleRow label="Ocultar valores por padrão" checked={hideValues} onChange={setHideValues} />
        <ToggleRow label="Mostrar centavos" checked={showCents} onChange={setShowCents} />
        <ToggleRow label="Animações" checked={animationsEnabled} onChange={setAnimationsEnabled} />
        <ToggleRow label="Mostrar a Tiva (mascote)" checked={mascotEnabled} onChange={setMascotEnabled} />
        <div className="flex items-center gap-3">
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                setSaved(false);
                const result = await updatePreferences({
                  theme,
                  density,
                  hideValues,
                  showCents,
                  firstDayOfWeek: profile.firstDayOfWeek,
                  animationsEnabled,
                  mascotEnabled,
                });
                setSaved(result.success);
              })
            }
          >
            {isPending ? "Salvando..." : "Salvar preferências"}
          </Button>
          {saved && <span className="text-sm text-positive">Salvo.</span>}
        </div>
      </div>
    </SectionCard>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-background px-4 py-3 text-sm">
      {label}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[var(--color-brand)]" />
    </label>
  );
}

function SecuritySection() {
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  return (
    <SectionCard title="Segurança">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(null);
          startTransition(async () => {
            const result = await changePassword(password);
            if (result.success) {
              setMessage({ type: "success", text: "Senha atualizada." });
              setPassword("");
            } else {
              setMessage({ type: "error", text: result.error });
            }
          });
        }}
      >
        <Field label="Nova senha" htmlFor="newPassword" hint="Pelo menos 8 caracteres.">
          <Input
            id="newPassword"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </Field>
        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-positive" : "text-negative"}`}>{message.text}</p>
        )}
        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? "Salvando..." : "Alterar senha"}
        </Button>
      </form>
    </SectionCard>
  );
}

function DataSection() {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <SectionCard title="Seus dados">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-background px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Exportar meus dados</p>
            <p className="text-xs text-foreground-muted">Baixe um arquivo com tudo que você cadastrou na Setiva.</p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <a href="/api/exportar-dados">
              <Download className="size-4" aria-hidden="true" />
              Exportar
            </a>
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-negative/30 bg-negative-soft px-4 py-3">
          <div>
            <p className="text-sm font-medium text-negative">Excluir conta</p>
            <p className="text-xs text-negative/80">Remove permanentemente seus dados. Não pode ser desfeito.</p>
          </div>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="size-4" aria-hidden="true" />
                Excluir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Excluir sua conta</DialogTitle>
                <DialogDescription>
                  Confirme sua senha para excluir permanentemente sua conta e todos os seus dados.
                </DialogDescription>
              </DialogHeader>
              <DeleteAccountForm onCancel={() => setDeleteOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </SectionCard>
  );
}

function DeleteAccountForm({ onCancel }: { onCancel: () => void }) {
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await deleteAccount(password);
          if (result.success) {
            router.push("/");
          } else {
            setError(result.error);
          }
        });
      }}
    >
      <Field label="Sua senha" htmlFor="deletePassword">
        <Input
          id="deletePassword"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </Field>
      {error && <p role="alert" className="text-sm text-negative">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="destructive" disabled={isPending}>
          {isPending ? "Excluindo..." : "Excluir minha conta"}
        </Button>
      </DialogFooter>
    </form>
  );
}
