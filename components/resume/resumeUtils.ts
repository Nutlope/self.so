// Resume dates are date-only ISO strings ("2019-01-01", "2014"), which JS parses as UTC.
// Read them back in UTC too, or every timezone west of UTC shows the previous month/year.
export const getYear = (date: string) => {
  const dateObject = new Date(date);
  return isNaN(dateObject.getTime()) ? 'Present' : dateObject.getUTCFullYear();
};

export const getShortMonth = (date: string) => {
  const dateObject = new Date(date);
  return isNaN(dateObject.getTime())
    ? ''
    : dateObject.toLocaleDateString('en-us', { month: 'short', timeZone: 'UTC' });
};
