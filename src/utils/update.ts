interface IUpgrade {
  plan: 'all' | 'delivery' | 'table' | 'package'
  type?: 'new' | 'upgrade' | 'fix'
  name?: string
  items: string[]
}

export interface IUpdate {
  id: number
  description: string
  upgrades: IUpgrade[]
  createdAt: string
}

export const updates: IUpdate[] = [
  {
    id: 1,
    description: 'Implementação de novas funcionalidades e correção de bugs',
    upgrades: [
      {
        plan: 'all',
        items: [
          'Link de compartilhamento de categorias e produtos do cardápio (Facebook e WhatsApp)',
          'Confirmação de endereço ao finalizar pedido (Delivery e Agendamentos) Complementos - (Cardápio)',
        ],
      },
      {
        plan: 'all',
        name: 'Complementos - (Cardápio)',
        items: ['Possibilidade de editar o complemento reutilizado de outro item - (Usar complementos de outro item)'],
      },
      {
        plan: 'table',
        name: 'Geral',
        items: ['Mesa pausada durante processo de encerramento (comandas e mesas)'],
      },
      {
        plan: 'table',
        name: 'Garçom',
        type: 'new',
        items: [
          'Criar garçons com niveis de acesso (garçom e gerente)',
          'Garçons de tipo gerente podem cancelar pedidos',
          'Pausar/desapausar garçons para desabilitar/habilitar pedidos do mesmo',
          'Definir quais categorias o garçom poderá pedir (por padrão todas estarão habilitadas)',
          'Opção de pedir senha somente uma vez ao entra na mesa ou pedir sempre (por padrão pedirá somente uma vez)',
          'Garçom criará comandas, realizará pedidos',
          'Resumo de tudo que já foi pedido para até o momento',
          'Resumo com valor total vendas de cada garçom nos relatórios mensais e diários no painel',
        ],
      },
      {
        plan: 'package',
        name: 'Geral',
        type: 'upgrade',
        items: [
          'Horários de disponibilidade para encomendas (substituindo Habilitar Horários)',
          'Definir várias encomendas por horário',
          'Definir intervalo de datas entre encomendas',
          'Intervalo entre encomendas agora será em dias ao invés de semanas.\nEx: de 0 dias (a partir de hoje) até 7 dias (sete dias contados a partir de hoje)',
        ],
      },
    ],
    createdAt: '2023-01-11T03:00:00.000Z',
  },
  {
    id: 2,
    description: 'Correção de bugs',
    upgrades: [
      {
        plan: 'all',
        items: ['Imagens de capa padrão de pizza exibindo normalmente'],
      },
      {
        plan: 'delivery',
        type: 'fix',
        name: 'Listagem de pedidos',
        items: ['Pedidos sempre listados por código do pedido do maior para o menor'],
      },
      {
        plan: 'all',
        type: 'fix',
        name: 'Impressão',
        items: ['Pedidos imprimindo mais de uma vez'],
      },
      {
        plan: 'all',
        type: 'fix',
        name: 'Reordernar Cardápio',
        items: ['Arrastar itens em smartphones melhorada', 'Reordernar itens de complemento corrigido'],
      },
      {
        plan: 'all',
        type: 'fix',
        name: 'Dispositivos IOS',
        items: ['Página recarregando/travando ao rolar para baixo'],
      },
      {
        plan: 'table',
        type: 'fix',
        name: 'Pedidos pelo painel',
        items: ['Fazer pedidos em varias mesas através do painel'],
      },
      {
        plan: 'table',
        type: 'upgrade',
        name: 'Encerramento de mesa/comanda',
        items: ['Pausa a mesa ao iniciar ação de encerramento e despausa ao finalizar ou cancelar o encerramento '],
      },
      {
        plan: 'package',
        type: 'fix',
        name: 'Listagem de pedidos',
        items: ['Pedidos listados por data de entrega'],
      },
    ],
    createdAt: '2023-01-13T16:16:29.350Z',
  },
  {
    id: 3,
    description: 'Implementação de resumo de cupons e correção de bugs',
    upgrades: [
      {
        plan: 'all',
        type: 'upgrade',
        name: 'Relatórios',
        items: ['Agora os relatórios de delivery e encomendas exibiram os valores de cada cupom utilizado no dia'],
      },
      {
        plan: 'table',
        type: 'fix',
        name: 'Garçom',
        items: [
          'Tela sempre carregando ao acessar uma mesa com a opção "Manter garçom logado" corrigido',
          'Correção no cálculo da quantidade itens de um complemento obrigatório',
        ],
      },
    ],
    createdAt: '2023-01-28T03:00:00.000Z',
  },
  {
    id: 4,
    description: 'Separação do layout da loja das informações do perfil',
    upgrades: [
      {
        items: ['Agora na tela de perfil terá uma nova aba "Layout da Loja" para edição de cor da loja e imagens de logo e plano de fundo da loja'],
        plan: 'all',
        type: 'upgrade',
        name: 'Aba Layout da Loja',
      },
    ],
    createdAt: '2023-03-29T14:54:20.942Z',
  },
  {
    id: 5,
    description: 'Exportando Relatórios',
    upgrades: [
      {
        items: ['Agora na tela de relatórios tera um botão para exportação do relatório para uma planilha excel'],
        plan: 'all',
        type: 'new',
        name: 'Aba Layout da Loja',
      },
    ],
    createdAt: '2023-04-04T17:34:23.901Z',
  },
  {
    id: 6,
    description: 'Últimas atualizações na Loja, PDV e Painel de ADM.',
    upgrades: [
      {
        plan: 'all',
        type: 'new',
        name: 'Pagamentos Online e Automatizados ',
        items: ['Receba pagamentos de cartão de crédito e pix de maneira automática com segurança e confiabilidade.'],
      },

      {
        plan: 'all',
        type: 'new',
        name: 'Taxas ou Descontos por forma de pagamento',
        items: ['Cadastre taxas ou descontos para cada forma de pagamento na entrega.'],
      },
      {
        plan: 'all',
        type: 'new',
        name: 'Ícone de Entregadores ',
        items: ['Cadastre e controle todas as entregas feitas pela equipe de entregadores.'],
      },
      {
        plan: 'all',
        type: 'new',
        name: 'Relatórios de Produtos mais Vendidos',
        items: ['Um relatório listando todos os seus produtos.'],
      },
      {
        plan: 'all',
        type: 'new',
        name: 'Relatórios de Clientes',
        items: ['Clientes Top 10 e ticket médio.'],
      },
      {
        plan: 'all',
        type: 'new',
        name: 'Adicionar CPF na via do cliente',
        items: ['Chave para adicionar ou ocultar o CPF na via do cliente.'],
      },
      {
        plan: 'all',
        type: 'new',
        name: 'Foto e Descrição do seu produto',
        items: ['Escolha onde exibir a foto e descrição do seu produto.'],
      },
      {
        plan: 'all',
        type: 'new',
        name: 'Controle de Estoque',
        items: ['Ative ou desative o controle de estoque, onde você pode controlar todos seus produtos e complementos.'],
      },
      {
        plan: 'all',
        type: 'fix',
        name: 'WM-Status',
        items: ['Atualização do recurso para um envio mais rápido e estantâneo.'],
      },
      {
        plan: 'table',
        type: 'new',
        name: 'Garçom',
        items: ['Botão para chamar Garçom no painel do cliente (Mesas).'],
      },
    ],
    createdAt: '2024-04-11T17:34:23.901Z',
  },
]
 