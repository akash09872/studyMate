import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    }).format(new Date(date));
  } catch (e) {
    return '—';
  }
}

export function formatRelativeTime(date: string | Date | undefined | null): string {
  if (!date) return '—';
  try {
    const now = new Date();
    const d = new Date(date);
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(date);
  } catch (e) {
    return '—';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  NOTES: 'Notes', ASSIGNMENT: 'Assignment', PYQ: 'PYQ',
  LAB_MANUAL: 'Lab Manual', PRACTICAL_FILE: 'Practical File',
  MINI_PROJECT: 'Mini Project', MAJOR_PROJECT: 'Major Project',
  BOOK: 'Book', PPT: 'PPT', CHEAT_SHEET: 'Cheat Sheet',
  SYLLABUS: 'Syllabus', REFERENCE: 'Reference', OTHER: 'Other',
};

export const RESOURCE_TYPE_CLASSES: Record<string, string> = {
  NOTES: 'type-notes', ASSIGNMENT: 'type-assignment', PYQ: 'type-pyq',
  LAB_MANUAL: 'type-lab', PRACTICAL_FILE: 'type-lab',
  MINI_PROJECT: 'type-ppt', MAJOR_PROJECT: 'type-ppt',
  BOOK: 'type-book', PPT: 'type-ppt', CHEAT_SHEET: 'type-cheat',
  SYLLABUS: 'type-notes', REFERENCE: 'type-notes', OTHER: 'badge-ghost',
};

export const LEVEL_NAMES = [
  'Newcomer', 'Contributor', 'Scholar', 'Expert', 'Specialist',
  'Mentor', 'Authority', 'Master', 'Grandmaster', 'Legend', 'Elite'
];

export const getLevelName = (level: number) => LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length - 1)];

export const RARITY_COLORS: Record<string, string> = {
  COMMON: '#9CA3AF', UNCOMMON: '#34D399', RARE: '#60A5FA',
  EPIC: '#A78BFA', LEGENDARY: '#F59E0B',
};
