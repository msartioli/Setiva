import type { Metadata } from "next";
import { PublicPage } from "@/components/layout/public-page";
import { PRIVACY_VERSION } from "@/lib/legal";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacidadePage() {
  return (
    <PublicPage title="Política de privacidade" updatedAt={`versão ${PRIVACY_VERSION}, 08/09/2026`}>
      <p>
        Esta política descreve, de forma concreta, quais dados a Setiva coleta e o que faz com eles, sem
        linguagem genérica de modelo pronto.
      </p>

      <h2>Dados que coletamos</h2>
      <p>
        Email e senha (autenticação, via Supabase Auth); nome de exibição, apelido e seed do avatar (o avatar em
        si é gerado localmente a partir da seed, nunca enviado a um serviço externo); os dados financeiros que
        você cadastra (contas, lançamentos, cartões, orçamentos, metas, dívidas); e metadados técnicos mínimos
        de sessão necessários para manter você autenticado.
      </p>

      <h2>Onde os dados ficam</h2>
      <p>
        Em um banco PostgreSQL gerenciado pelo Supabase, protegido por políticas de segurança em nível de linha
        (RLS): cada usuário só consegue ler ou escrever os próprios dados, verificado pelo banco em toda
        consulta, não apenas pela interface.
      </p>

      <h2>O que não fazemos</h2>
      <p>
        Não vendemos dados a terceiros. Não instalamos rastreadores de publicidade. Não usamos seus dados
        financeiros para treinar modelos de terceiros. Não compartilhamos dados entre contas.
      </p>

      <h2>Seus direitos</h2>
      <p>
        Você pode exportar uma cópia completa dos seus dados e excluir sua conta permanentemente a qualquer
        momento, em Configurações. A exclusão remove os registros do banco e os arquivos que você enviou
        (avatar próprio, capas de meta).
      </p>

      <h2>Retenção</h2>
      <p>
        Mantemos seus dados enquanto sua conta existir. Ao excluir a conta, os dados são removidos do banco de
        produção; cópias de backup de curto prazo do provedor de infraestrutura seguem a política padrão de
        retenção da Supabase, fora do nosso controle direto.
      </p>

      <h2>Contato e base legal</h2>
      <p>
        O canal formal de contato do operador e a base legal detalhada por finalidade de tratamento (LGPD, Lei
        13.709/2018) serão publicados aqui junto com a identificação jurídica completa do operador, antes da
        abertura de cadastro ao público em geral.
      </p>
    </PublicPage>
  );
}
