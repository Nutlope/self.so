export const getYear = (date: string) => {
  const dateObject = new Date(date);
  return isNaN(dateObject.getFullYear()) ? 'Present' : dateObject.getFullYear();
};

export const getShortMonth = (date: string) => {
  const dateObject = new Date(date);
  return (dateObject.toLocaleDateString('en-us', { month: 'short' }) === 'Invalid Date') ? '' : dateObject.toLocaleDateString('en-us', { month: 'short' });
};
