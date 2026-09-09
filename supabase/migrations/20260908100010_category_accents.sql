-- Setiva: 10 - acentuacao dos nomes de catalogo
-- Pre-condicao: migration 02 aplicada.
--
-- O seed de categorias e instituicoes da migration 02 foi gravado sem
-- acentos, e esses nomes aparecem direto na interface (o usuario lia
-- "Educacao", "Saude", "Salario"). Corrige so as linhas de catalogo
-- (user_id nulo para categorias); categoria criada pelo usuario nao e
-- tocada. Idempotente: rodar de novo nao muda nada.

begin;

update public.categories set name = 'Salário' where user_id is null and name = 'Salario';
update public.categories set name = 'Saúde' where user_id is null and name = 'Saude';
update public.categories set name = 'Educação' where user_id is null and name = 'Educacao';
update public.categories set name = 'Presentes e doações' where user_id is null and name = 'Presentes e doacoes';

update public.institutions set name = 'Caixa Econômica Federal', short_name = 'Caixa'
  where name = 'Caixa Economica Federal';
update public.institutions set name = 'Itaú', short_name = 'Itaú' where name = 'Itau';

commit;
