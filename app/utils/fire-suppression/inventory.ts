import {
  Bell,
  Cylinder,
  Droplets,
  FileText,
  FireExtinguisher,
  Gauge,
  ShieldCheck,
  Waves,
} from '@lucide/vue'

export const CATEGORY_ICONS: Partial<Record<string, typeof Droplets>> = {
  sprinkler: Droplets,
  yangin_dolabi: FireExtinguisher,
  hidrant: Waves,
  yangin_pompasi: Gauge,
  su_deposu: Cylinder,
  sabit_boru: Waves,
  su_alma_verme: Waves,
  gazli_sondurme: ShieldCheck,
  yangin_algilama: Bell,
  diger: FileText,
}

export const categoryIcon = (category: string) => CATEGORY_ICONS[category] ?? FileText

export const formatDate = (value?: string | null) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export const daysRemaining = (value?: string | null) => {
  if (!value) return null

  const target = new Date(value)
  target.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export type InventorySystemStatus = 'uygun' | 'uygun_degil' | null

export const statusLabel = (status: InventorySystemStatus) => {
  if (status === 'uygun') return 'Uygun'
  if (status === 'uygun_degil') return 'Uygunsuzluk Var'
  return 'Kontrol Edilmedi'
}

export const statusClass = (status: InventorySystemStatus) => {
  if (status === 'uygun') return 'status-success'
  if (status === 'uygun_degil') return 'status-danger'
  return 'status-neutral'
}

type AmountLabelItem = {
  pumpBreakdown: { main: number; jokey: number } | null
  unitCount: number
  category: string
}

export const amountLabel = (item: AmountLabelItem) => {
  if (item.pumpBreakdown) return `${item.pumpBreakdown.main} ana + ${item.pumpBreakdown.jokey} jokey pompa`
  if (item.unitCount > 0) {
    return `${item.unitCount} adet ${item.category === 'yangin_dolabi' ? 'dolap' : item.category === 'sprinkler' ? 'başlık' : 'birim'}`
  }
  return 'Tesisat geneli'
}
