export const formatCurrency = (value: number, currency = 'BRL') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
};