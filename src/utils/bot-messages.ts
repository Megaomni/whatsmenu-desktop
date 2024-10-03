import { VoucherNotification } from "../@types/store";
import { ProfileType } from "../@types/profile";
import { formatCurrency } from "./format-currency";

export const botMessages = {
  cashback: {
    afterPurchase: ({
      voucher,
      profile,
    }: {
      voucher: VoucherNotification;
      profile: ProfileType;
    }) =>
      `*${voucher.client.name}*,\n\nAgora o ${profile.name} tem CashBack\n\n *Você ganhou ${formatCurrency(voucher.value)}* em desconto no seu próximo pedido\n\n*https://www.whatsmenu.com.br/${profile.slug}*\n\n*VOCÊ TEM ${formatCurrency(voucher.client.vouchersTotal)} EM CASHBACK*`,
    remember: ({
      voucher,
      profile,
    }: {
      voucher: VoucherNotification;
      profile: ProfileType;
    }) =>
      `*Atenção ${voucher.client.name}*,\n\nO seu saldo CashBack vence em ${voucher.rememberDays} dias, use agora para não perder\n\nSeu saldo é de *${formatCurrency(voucher.value)}* em desconto no seu próximo pedido\n\n*https://www.whatsmenu.com.br/${profile.slug}*\n\n*VOCÊ TEM ${formatCurrency(voucher.client.vouchersTotal)} EM CASHBACK USE AGORA PARA NÃO PERDER*`,
    expire: ({
      voucher,
      profile,
    }: {
      voucher: VoucherNotification;
      profile: ProfileType;
    }) =>
      `*${voucher.client.name}, agora é urgente*\n\n*Último dia*, O seu saldo CashBack de *${formatCurrency(voucher.value)}* vence hoje use agora para não perder\n\n*https://www.whatsmenu.com.br/${profile.slug}*\n\n*VOCÊ TEM ${formatCurrency(voucher.client.vouchersTotal)} EM CASHBACK USE AGORA PARA NÃO PERDER*`,
  },
};
