import { Building2, ClipboardList, HardHat, ShieldCheck, Users } from '@lucide/vue'

export type PreviewRole = 'holding' | 'requester' | 'permanent' | 'temporary' | 'security'

export const useRolePreview = () => {
  const activeRoleId = useState<PreviewRole>('preview_role', () => 'requester')
  const roles = [
    { id: 'holding' as PreviewRole, label: 'Holding Yöneticisi', description: 'Üst seviye operasyon ve performans görünümü', icon: Building2 },
    { id: 'requester' as PreviewRole, label: 'İş Talebi Oluşturan', description: 'Talep oluşturma, planlama ve onay', icon: ClipboardList },
    { id: 'permanent' as PreviewRole, label: 'Taşeron · Daimi', description: 'Lokasyona bağlı sürekli taşeron', icon: Users },
    { id: 'temporary' as PreviewRole, label: 'Taşeron · Geçici', description: 'İş talebi ve saha hazırlığı', icon: HardHat },
    { id: 'security' as PreviewRole, label: 'Güvenlik', description: 'QR, eğitim ve giriş kontrolü', icon: ShieldCheck },
  ]
  const activeRole = computed(() => roles.find(role => role.id === activeRoleId.value) ?? roles[1])
  const setRole = (role: PreviewRole) => { activeRoleId.value = role }
  return { activeRoleId, activeRole, roles, setRole }
}
