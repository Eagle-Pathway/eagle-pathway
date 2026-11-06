export function formatDate(dateInput: string | Date | null | undefined, formatStr?: string): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const day = date.getDay();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  if (formatStr === 'EEEE, MMMM d, yyyy') {
    return `${fullDays[day]}, ${fullMonths[m]} ${d}, ${y}`;
  }
  if (formatStr === 'MMMM d, yyyy') {
    return `${fullMonths[m]} ${d}, ${y}`;
  }
  if (formatStr === 'h:mm a') {
    return `${hours}:${minutes} ${ampm}`;
  }
  if (formatStr === 'MMM d, h:mm a') {
    return `${months[m]} ${d}, ${hours}:${minutes} ${ampm}`;
  }
  if (formatStr === 'MMM d') {
    return `${months[m]} ${d}`;
  }
  return `${months[m]} ${d}, ${y}`;
}

export function differenceInDays(targetDate: string | Date, fromDate: string | Date = new Date()): number {
  const t = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const f = typeof fromDate === 'string' ? new Date(fromDate) : fromDate;
  const diffTime = t.getTime() - f.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

