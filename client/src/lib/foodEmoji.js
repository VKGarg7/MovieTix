export const foodEmoji = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('popcorn')) return '🍿';
  if (n.includes('coke') || n.includes('pepsi') || n.includes('soda') || n.includes('cola')) return '🥤';
  if (n.includes('hotdog') || n.includes('hot dog')) return '🌭';
  if (n.includes('pizza')) return '🍕';
  if (n.includes('nachos')) return '🧀';
  if (n.includes('candy') || n.includes('choc')) return '🍫';
  if (n.includes('coffee') || n.includes('tea')) return '☕';
  if (n.includes('ice cream') || n.includes('sundae')) return '🍦';
  if (n.includes('burger')) return '🍔';
  return '🍽️';
};
