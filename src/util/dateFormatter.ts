export const formatDate = (date: string | null | undefined): string => {
  return date ? new Date(date).toLocaleDateString() : '';
};
