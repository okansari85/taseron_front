export type ContractorType = "Daimi" | "Geçici";
export type ContractorStatus = "active" | "passive";

export type Contractor = {
  id: number;
  name: string;
  shortName: string;
  type: ContractorType;
  status: ContractorStatus;
  initials: string;
  avatarClass: string;
};

export const contractors: Contractor[] = [
  { id: 1, name: "ISS Tesis Yönetim Hizmetleri A.Ş.", shortName: "ISS", type: "Daimi", status: "active", initials: "IS", avatarClass: "bg-blue-50 text-blue-600" },
  { id: 2, name: "Tepe Savunma ve Güvenlik Sistemleri A.Ş.", shortName: "Tepe", type: "Daimi", status: "active", initials: "TS", avatarClass: "bg-slate-100 text-slate-600" },
  { id: 3, name: "Sofra Yemek Üretim ve Hizmet A.Ş.", shortName: "Sofra", type: "Daimi", status: "active", initials: "SY", avatarClass: "bg-orange-50 text-orange-600" },
  { id: 4, name: "Bantaş Temizlik Hizmetleri Ltd. Şti.", shortName: "Bantaş", type: "Geçici", status: "active", initials: "BT", avatarClass: "bg-emerald-50 text-emerald-600" },
  { id: 5, name: "ABC Teknik Bakım Hizmetleri Ltd. Şti.", shortName: "ABC Teknik", type: "Geçici", status: "active", initials: "AB", avatarClass: "bg-violet-50 text-violet-600" },
  { id: 6, name: "Protek Güvenlik Hizmetleri A.Ş.", shortName: "Protek", type: "Daimi", status: "passive", initials: "PG", avatarClass: "bg-rose-50 text-rose-600" },
  { id: 7, name: "CleanPro Endüstriyel Temizlik A.Ş.", shortName: "CleanPro", type: "Geçici", status: "active", initials: "CP", avatarClass: "bg-cyan-50 text-cyan-600" },
  { id: 8, name: "Güven Plus Özel Güvenlik Ltd. Şti.", shortName: "Güven Plus", type: "Daimi", status: "active", initials: "GP", avatarClass: "bg-indigo-50 text-indigo-600" },
  { id: 9, name: "Lezzet Catering Hizmetleri A.Ş.", shortName: "Lezzet", type: "Geçici", status: "active", initials: "LC", avatarClass: "bg-amber-50 text-amber-600" },
  { id: 10, name: "TeknikServis Bakım ve Onarım A.Ş.", shortName: "TeknikServis", type: "Daimi", status: "active", initials: "TB", avatarClass: "bg-teal-50 text-teal-600" },
  { id: 11, name: "Hijyen Profesyonel Temizlik Ltd. Şti.", shortName: "Hijyen", type: "Daimi", status: "passive", initials: "HP", avatarClass: "bg-pink-50 text-pink-600" },
  { id: 12, name: "Anadolu Personel Destek Hizmetleri A.Ş.", shortName: "Anadolu", type: "Geçici", status: "active", initials: "AP", avatarClass: "bg-lime-50 text-lime-600" },
];
