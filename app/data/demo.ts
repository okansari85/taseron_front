export type DemoRole = 'holding' | 'requester' | 'permanent' | 'temporary' | 'security'

export const demoRoles = [
  { id: 'holding' as DemoRole, name: 'Holding Yöneticisi', short: 'Holding', description: 'Genel durum ve operasyon özeti' },
  { id: 'requester' as DemoRole, name: 'İş Talebi Oluşturan', short: 'Talep Oluşturan', description: 'Talep oluşturma ve onay akışı' },
  { id: 'permanent' as DemoRole, name: 'Taşeron · Daimi', short: 'Daimi Taşeron', description: 'Lokasyona bağlı sürekli taşeron' },
  { id: 'temporary' as DemoRole, name: 'Taşeron · Geçici', short: 'Geçici Taşeron', description: 'İş talebi bazlı saha çalışması' },
  { id: 'security' as DemoRole, name: 'Güvenlik', short: 'Güvenlik', description: 'QR kontrolü ve saha girişi' },
]

export const demoSteps = [
  { id: 1, label: 'İş Talebi', description: 'Lokasyon, işyeri ve taşeron' },
  { id: 2, label: 'Taşeron Hazırlığı', description: 'Tarih, ekip, araç, kimyasal' },
  { id: 3, label: 'Arçelik Onayı', description: 'Kontrol ve onay' },
  { id: 4, label: 'QR / Barkod', description: 'Giriş kodunun oluşması' },
  { id: 5, label: 'Güvenlik', description: 'Tarama ve giriş kararı' },
]

export const demoRequest = {
  id: 'IT-2026-0184',
  title: 'Elektrik pano bakımı',
  company: 'Arçelik',
  workplace: 'Çerkezköy Fabrikası SGK',
  location: 'Çerkezköy Fabrikası',
  contractor: 'Tepe Güvenlik',
  date: '08 Eylül 2026',
  time: '09:30',
  proposedTime: '10:30',
  qr: 'TSR-8A42K',
}

export const demoNavigation: Record<DemoRole, string[]> = {
  holding: ['Genel Bakış', 'İş Talepleri', 'Taşeronlar', 'Evrak Şablonları', 'Raporlar'],
  requester: ['Genel Bakış', 'İş Taleplerim', 'Yeni İş Talebi', 'Onay Bekleyenler'],
  permanent: ['Genel Bakış', 'Belgeler', 'Personel', 'Lokasyonlar'],
  temporary: ['Genel Bakış', 'İş Talepleri', 'Personel', 'Araçlar', 'Kimyasallar', 'Eğitim'],
  security: ['Giriş Kontrolü', 'QR / Barkod', 'Bugünkü Girişler', 'Eğitim Kontrolü'],
}
