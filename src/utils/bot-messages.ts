import { VoucherNotification } from "../@types/store";
import { ProfileType } from "./../@types/profile";
import { formatCurrency } from "./format-currency";

export const botMessages = {
  cashback: {
    afterPurchase: ({
      voucher,
      profile,
    }: {
      voucher: VoucherNotification;
      profile: ProfileType;
    }) => {
      const language = profile.options.locale.language;
      switch (language) {
        case "pt-BR":
        case "pt-PT":
        case "fr-CH":
          return `*${voucher.client.name}*,\n\nAgora o ${profile.name} tem CashBack\n\n *Você ganhou ${formatCurrency(voucher.value)}* em desconto no seu próximo pedido\n\n*https://www.whatsmenu.com.br/${profile.slug}*\n\n*VOCÊ TEM ${formatCurrency(voucher.client.vouchersTotal)} EM CASHBACK*`;
        case "ar-AE":
        case "en-US":
        case 'en-GB':
          return `*${voucher.client.name}*,\n\nNow ${profile.name} has CashBack\n\n *You won ${formatCurrency(voucher.value)}* in discount on your next order\n\n*https://www.whatsmenu.com.br/${profile.slug}*\n\n*YOU HAVE ${formatCurrency(voucher.client.vouchersTotal)} IN CASHBACK*`;
        default:
          return `*${voucher.client.name}*,\n\nAgora o ${profile.name} tem CashBack\n\n *Você ganhou ${formatCurrency(voucher.value)}* em desconto no seu próximo pedido\n\n*https://www.whatsmenu.com.br/${profile.slug}*\n\n*VOCÊ TEM ${formatCurrency(voucher.client.vouchersTotal)} EM CASHBACK*`;
      }
    },
    remember: ({
      voucher,
      profile,
    }: {
      voucher: VoucherNotification;
      profile: ProfileType;
    }) => {
      const language = profile.options.locale.language;
      switch (language) {
        case "pt-BR":
        case "pt-PT":
        case "fr-CH":
          return `*Atenção ${voucher.client.name}*,\n\nO seu saldo CashBack vence em ${voucher.rememberDays} dias, use agora para não perder\n\nSeu saldo é de *${formatCurrency(voucher.value)}* em desconto no seu próximo pedido\n\n*https://www.whatsmenu.com.br/${profile.slug}*\n\n*VOCÊ TEM ${formatCurrency(voucher.client.vouchersTotal)} EM CASHBACK USE AGORA PARA NÃO PERDER*`;
        case "ar-AE":
        case "en-US":
        case 'en-GB':
          return `*Attention ${voucher.client.name}*,\n\nYour CashBack balance expires in ${voucher.rememberDays} days, use it now to avoid losing\n\nYour balance is *${formatCurrency(voucher.value)}* in discount on your next order\n\n*https://www.whatsmenu.com.br/${profile.slug}*\n\n*YOU HAVE ${formatCurrency(voucher.client.vouchersTotal)} IN CASHBACK USE IT NOW TO AVOID LOSING*`;
        default:
          return `*Atenção ${voucher.client.name}*,\n\nO seu saldo CashBack vence em ${voucher.rememberDays} dias, use agora para não perder\n\nSeu saldo é de *${formatCurrency(voucher.value)}* em desconto no seu próximo pedido\n\n*https://www.whatsmenu.com.br/${profile.slug}*\n\n*VOCÊ TEM ${formatCurrency(voucher.client.vouchersTotal)} EM CASHBACK USE AGORA PARA NÃO PERDER*`;
      }
    },
    expire: ({
      voucher,
      profile,
    }: {
      voucher: VoucherNotification;
      profile: ProfileType;
    }) => {
      const language = profile.options.locale.language;
      switch (language) {
        case "pt-BR":
        case "pt-PT":
        case "fr-CH":
          return `*${voucher.client.name}, agora é urgente*\n\n*Último dia*, O seu saldo CashBack de *${formatCurrency(voucher.value)}* vence hoje use agora para não perder\n\n*https://www.whatsmenu.com.br/${profile.slug}*\n\n*VOCÊ TEM ${formatCurrency(voucher.client.vouchersTotal)} EM CASHBACK USE AGORA PARA NÃO PERDER*`;
        case "ar-AE":
        case "en-US":
        case 'en-GB':
          return `*${voucher.client.name}, it's urgent now*\n\n*Last day*, Your CashBack balance of *${formatCurrency(voucher.value)}* expires today, use it now to avoid losing\n\n*https://www.whatsmenu.com.br/${profile.slug}*\n\n*YOU HAVE ${formatCurrency(voucher.client.vouchersTotal)} IN CASHBACK USE IT NOW TO AVOID LOSING*`;
        default:
          return `*${voucher.client.name}, agora é urgente*\n\n*Último dia*, O seu saldo CashBack de *${formatCurrency(voucher.value)}* vence hoje use agora para não perder\n\n*https://www.whatsmenu.com.br/${profile.slug}*\n\n*VOCÊ TEM ${formatCurrency(voucher.client.vouchersTotal)} EM CASHBACK USE AGORA PARA NÃO PERDER*`;
      }
    },
  },
};
