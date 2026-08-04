export const toDateInput = (date) => date.toISOString().slice(0, 10);

export const defaultDateRange = (days = 30) => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: toDateInput(from), to: toDateInput(to) };
};
