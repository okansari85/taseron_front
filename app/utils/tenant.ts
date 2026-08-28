export const getInitials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('tr-TR')

export const structureLabel = (type?: string | null) =>
  ({ holding: 'Holding', group: 'Grup', company: 'Şirket' }[type ?? ''] || type || '-')

export const structureTone = (type?: string | null) =>
  ({ holding: 'brand', group: 'warning', company: 'success' }[type ?? ''] as 'brand' | 'warning' | 'success' | undefined) ?? 'gray'

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
