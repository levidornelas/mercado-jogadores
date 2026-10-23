# Sistema de design do Passe

Referência persistida a partir das pranchas “Fundamentos” e “Componentes”.
As telas devem consumir os tokens CSS em `app/globals.css`, nunca valores de
cor aplicados diretamente.

## Fundamentos

- Tipografia: Geist (Regular 400, Medium 500 e SemiBold 600). Enquanto a fonte
  não estiver disponibilizada como arquivo local, o fallback é a pilha sans-serif
  do sistema.
- Grade: incrementos de 4 px; os campos móveis nunca ficam abaixo de 16 px.
- Raios: `sm` 6 px (itens de menu), `md` 8 px (controles), `lg` 10 px
  (alertas e diálogos), `xl` 14 px (cards/painéis) e `full` para avatares,
  badges e switches.
- Foco: anel azul de 3 px em qualquer controle navegável por teclado.
- Sombras: `xs` para botões e campos, `sm` para painel principal, `md` para
  popovers, `lg` para diálogos, sheets e toasts.

## Semântica visual

- `primary` é reservado para uma ação preenchida por tela: criar, comprar,
  vender, salvar ou jogar.
- `secondary` é usado em ações auxiliares; links e ghost usam o azul sem fundo.
- Estados de sucesso, atenção e erro usam sempre seus pares `*-soft`,
  `*-soft-foreground` e `*-soft-border`.
- Valores positivos usam sucesso; saídas ou prejuízos usam destructive; valor
  ausente usa `muted-foreground`.
- Moeda usa duas casas e locale `pt-BR`; datas são exibidas no horário de
  Brasília. Nenhum cálculo do backend é repetido no frontend.

## Componentes compartilhados

- Botões: variantes preenchida, secundária, outline, ghost, destrutiva e
  apenas-ícone; um único botão preenchido por tela.
- Campos e selects: rótulo sempre visível, placeholder é apenas exemplo;
  exibem foco, erro e desabilitado.
- Alertas e toasts: informação, erro, atenção e sucesso; o texto inclui título
  e descrição curta, usando o `message` devolvido pela API quando aplicável.
- Sidebar: navegação por Mercado (Jogadores, Clubes), Liga (Partidas,
  Classificação) e clubes cadastrados. O item ativo recebe superfície accent.
- Cards KPI, tabelas, tabs, badges e diálogos seguem os tokens acima e serão
  implementados com os primitivos shadcn/ui já instalados no projeto.
