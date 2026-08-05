export const CATEGORY_OPTIONS = [
  { value: 'popcorn', label: 'Popcorn' },
  { value: 'drinks', label: 'Drinks' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'nachos', label: 'Nachos' },
  { value: 'candy', label: 'Candy' },
  { value: 'combo', label: 'Combo' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'other', label: 'Other' },
];

export const guessCategory = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('popcorn')) return 'popcorn';
  if (n.includes('nachos')) return 'nachos';
  if (n.includes('combo')) return 'combo';
  if (n.includes('candy') || n.includes('choc')) return 'candy';
  if (n.includes('cake') || n.includes('sundae') || n.includes('ice cream')) return 'dessert';
  if (n.includes('cola') || n.includes('pepsi') || n.includes('coke') || n.includes('juice') || n.includes('drink') || n.includes('soda')) return 'drinks';
  return 'snacks';
};

export const getStockStatus = (item) => {
  if (!item.isAvailable) return 'out';
  return 'available';
};

export const getMenuInsights = (item) => {
  const insights = [];
  const category = guessCategory(item.name);
  if (category === 'popcorn') {
    insights.push({ label: `${item.name} sells better on weekends`, tone: 'cyan' });
  }
  if (category === 'combo') {
    insights.push({ label: 'Combo meals increase revenue by ~18%', tone: 'violet' });
  }
  if (!item.isAvailable) {
    insights.push({ label: `Low stock detected for ${item.name}`, tone: 'primary' });
  }
  return insights;
};
