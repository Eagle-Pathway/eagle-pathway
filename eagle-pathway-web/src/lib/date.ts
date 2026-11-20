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

export interface DeadlineStatus {
  days: number;
  isPassed: boolean;
  isToday: boolean;
  label: string; // e.g. "81 days remaining", "Due today (Final day!)", "Closed (Passed 81 days ago)"
  shortLabel: string; // e.g. "81d left", "Today!", "Closed"
  urgency: 'overdue' | 'critical' | 'soon' | 'normal';
}

export function getDeadlineStatus(deadline: string | Date | null | undefined, fromDate: string | Date = new Date()): DeadlineStatus | null {
  if (!deadline) return null;
  const days = differenceInDays(deadline, fromDate);
  if (Number.isNaN(days)) return null;

  if (days < 0) {
    const passedDays = Math.abs(days);
    return {
      days,
      isPassed: true,
      isToday: false,
      label: `Closed (Passed ${passedDays} ${passedDays === 1 ? 'day' : 'days'} ago)`,
      shortLabel: 'Closed',
      urgency: 'overdue',
    };
  }

  if (days === 0) {
    return {
      days: 0,
      isPassed: false,
      isToday: true,
      label: 'Due today (Final day!)',
      shortLabel: 'Today!',
      urgency: 'critical',
    };
  }

  if (days === 1) {
    return {
      days: 1,
      isPassed: false,
      isToday: false,
      label: '1 day remaining',
      shortLabel: '1d left',
      urgency: 'critical',
    };
  }

  return {
    days,
    isPassed: false,
    isToday: false,
    label: `${days} days remaining`,
    shortLabel: `${days}d left`,
    urgency: days <= 7 ? 'critical' : days <= 30 ? 'soon' : 'normal',
  };
}


