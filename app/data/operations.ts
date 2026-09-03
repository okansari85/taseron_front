export type WorkRequestStatus = 'Taslak' | 'Planlandı' | 'Taşeron Onayı Bekliyor' | 'Onaylandı' | 'Barkod Hazır' | 'Tamamlandı'

export const operationStats = {
  openRequests: 12,
  pendingContractorApproval: 4,
  plannedToday: 7,
  readyForEntry: 5,
}

export const workRequests = [
  { id: 'IT-2026-0184', title: 'Elektrik pano bakımı', company: 'Arçelik', lbe: 'Çerkezköy Fabrikası SGK', location: 'Çerkezköy Fabrikası', contractor: 'Tepe Güvenlik', requester: 'Mert Kaya', date: '08 Eylül 2026', time: '09:30', status: 'Taşeron Onayı Bekliyor' as WorkRequestStatus, people: 2, documents: 8, vehicles: 1, chemicals: 0 },
  { id: 'IT-2026-0183', title: 'Yangın sistemi periyodik kontrolü', company: 'Arçelik Pazarlama', lbe: 'İstanbul Merkez SGK', location: 'İstanbul Merkez', contractor: 'ABC Teknik', requester: 'Selin Yılmaz', date: '08 Eylül 2026', time: '13:00', status: 'Onaylandı' as WorkRequestStatus, people: 3, documents: 11, vehicles: 1, chemicals: 0 },
  { id: 'IT-2026-0182', title: 'Kimyasal hat temizliği', company: 'Arçelik', lbe: 'Eskişehir Fabrikası SGK', location: 'Eskişehir Fabrikası', contractor: 'Tepe Güvenlik', requester: 'Ali Demir', date: '09 Eylül 2026', time: '10:00', status: 'Barkod Hazır' as WorkRequestStatus, people: 4, documents: 14, vehicles: 2, chemicals: 3 },
  { id: 'IT-2026-0181', title: 'HVAC bakım çalışması', company: 'Arçelik', lbe: 'Ankara Ofis SGK', location: 'Ankara Ofis', contractor: 'XYZ Mekanik', requester: 'Bora Çelik', date: '10 Eylül 2026', time: '11:00', status: 'Planlandı' as WorkRequestStatus, people: 2, documents: 7, vehicles: 1, chemicals: 0 },
]

export const documentTemplates = [
  { id: 'personnel', name: 'Personel Evrakları', type: 'Personel', scope: 'Grup geneli', assignedTo: 'Tüm taşeronlar', required: 6, active: true, customized: 1 },
  { id: 'company', name: 'Şirket Evrakları', type: 'Şirket', scope: 'Grup geneli', assignedTo: 'Tüm taşeronlar', required: 5, active: true, customized: 0 },
  { id: 'chemical', name: 'Kimyasal Evrakları', type: 'Kimyasal', scope: 'LBE / Lokasyon', assignedTo: 'İlgili iş talepleri', required: 4, active: true, customized: 3 },
  { id: 'vehicle', name: 'Araç Evrakları', type: 'Araç', scope: 'Grup geneli', assignedTo: 'Tüm taşeronlar', required: 4, active: true, customized: 2 },
]

export const contractorPeople = [
  { name: 'Ahmet Yıldız', role: 'Teknisyen', status: 'Belgeleri tam', expires: '31.12.2026' },
  { name: 'Burak Aydın', role: 'Elektrikçi', status: '2 belge eksik', expires: '18.10.2026' },
  { name: 'Cem Özkan', role: 'Mekanikçi', status: 'Belgeleri tam', expires: '04.01.2027' },
]

export const training = {
  title: 'Saha Giriş ve İş Güvenliği Eğitimi',
  duration: '18 dk',
  mandatory: true,
  progress: 72,
}

export const securityChecks = [
  { code: 'TSR-8A42K', request: 'IT-2026-0182', contractor: 'Tepe Güvenlik', location: 'Eskişehir Fabrikası', person: 'Ahmet Yıldız', time: '09:45', status: 'Girişe Uygun' },
  { code: 'TSR-8A41P', request: 'IT-2026-0183', contractor: 'ABC Teknik', location: 'İstanbul Merkez', person: 'Mehmet Kaya', time: '12:41', status: 'Eğitim Bekliyor' },
]
