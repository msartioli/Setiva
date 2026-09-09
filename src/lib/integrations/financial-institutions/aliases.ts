/**
 * Apelidos curados para busca, chaveados por ISPB (identidade oficial).
 * Nunca substitui o nome oficial guardado/exibido — so entra como termo
 * extra de busca (ex: digitar "nu" ou "bb" tambem encontra o banco certo).
 * ISPBs conferidos contra o dataset oficial (logos-bancos-br / BCB), nunca
 * inventados.
 */
export const INSTITUTION_SEARCH_ALIASES: Record<string, string[]> = {
  "18236120": ["nu", "nubank"], // Nu Pagamentos S.A.
  "60701190": ["itau", "itaú"], // Itaú Unibanco S.A.
  "60746948": ["bradesco"], // Banco Bradesco S.A.
  "00000000": ["bb", "banco do brasil", "bdb"], // Banco do Brasil S.A.
  "00360305": ["caixa", "cef", "caixa economica federal"], // Caixa Econômica Federal
  "90400888": ["santander"], // Banco Santander (Brasil) S.A.
  "00416968": ["inter", "banco inter"], // Banco Inter S.A.
  "10573521": ["mercado pago", "mercadopago", "mp"], // Mercado Pago Instituição de Pagamento Ltda.
  "22896431": ["picpay", "pic pay"], // PicPay Instituição de Pagamento S.A.
  "31872495": ["c6", "c6 bank"], // Banco C6 S.A.
};

/**
 * Ordem de exibicao dos bancos populares (secao "Populares" do seletor).
 * Curadoria de UX apenas — a lista tecnica completa continua vindo do
 * dataset, nada e removido, so reordenado visualmente.
 */
export const POPULAR_INSTITUTION_ISPBS = [
  "18236120", // Nubank
  "60701190", // Itaú
  "60746948", // Bradesco
  "00000000", // Banco do Brasil
  "00360305", // Caixa
  "90400888", // Santander
  "00416968", // Inter
  "10573521", // Mercado Pago
  "22896431", // PicPay
  "31872495", // C6 Bank
];
