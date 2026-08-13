export default function dateParse(date?: string | Date | null, format = 'mm/dd/yyyy'): string {
  if (!date) return '--';

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return date.toString();

  const components: Record<string, string> = {
    dd: parsedDate.getDate().toString().padStart(2, '0'),
    mm: (parsedDate.getMonth() + 1).toString().padStart(2, '0'),
    yyyy: parsedDate.getFullYear().toString(),
  };

  return format.replace(/dd|mm|yyyy/g, (match) => components[match]);
}
