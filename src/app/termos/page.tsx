import type { Metadata } from "next";
import { PublicPage } from "@/components/layout/public-page";
import { TERMS_VERSION } from "@/lib/legal";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermosPage() {
  return (
    <PublicPage title="Termos de uso" updatedAt={`versão ${TERMS_VERSION}, 08/09/2026`}>
      <p>
        Este documento descreve as condições de uso da Setiva, um aplicativo web de organização financeira
        pessoal, no estado atual de desenvolvimento. Ele cobre exatamente o que o aplicativo faz hoje, sem
        prometer funcionalidades futuras.
      </p>

      <h2>O que a Setiva é</h2>
      <p>
        Uma ferramenta de registro manual de contas, cartões, lançamentos, orçamentos, metas e dívidas, com
        importação de extratos em CSV. A Setiva não tem conexão automática com bancos (Open Finance), não
        oferece produtos financeiros, não processa pagamentos e não dá conselho de investimento.
      </p>

      <h2>Sua conta</h2>
      <p>
        Você é responsável pela veracidade dos dados que cadastra e pela guarda da sua senha. Cadastro exige
        confirmação de email. Você pode exportar todos os seus dados e excluir sua conta a qualquer momento em
        Configurações.
      </p>

      <h2>Limites do que mostramos</h2>
      <p>
        Projeções de saldo, sugestões e simulações são cálculos determinísticos a partir dos dados que você
        cadastrou. Não são garantia, previsão de mercado nem recomendação de investimento. Dados incompletos
        geram estimativas incompletas: a Setiva não deve ser o único critério para uma decisão financeira
        importante.
      </p>

      <h2>Uso aceitável</h2>
      <p>
        Não use a Setiva para armazenar dados de terceiros sem autorização, tentar contornar as permissões de
        acesso, ou qualquer atividade que viole a legislação brasileira aplicável.
      </p>

      <h2>Mudanças nestes termos</h2>
      <p>
        Alterações relevantes recebem uma nova versão, e o aceite anterior fica registrado com a versão e a
        data em que foi dado. Continuar usando a conta após uma atualização publicada implica ciência dos novos
        termos.
      </p>

      <h2>Identificação do operador</h2>
      <p>
        A identificação jurídica completa do operador deste serviço (razão social, CNPJ, endereço e canal
        formal de contato) ainda está em definição e será publicada aqui antes da abertura de cadastro ao
        público em geral. Enquanto isso, o app opera em ambiente de desenvolvimento e testes.
      </p>
    </PublicPage>
  );
}
