export type DangerClass = "Çok Tehlikeli" | "Tehlikeli" | "Az Tehlikeli";

export type Company = {
  id: number;
  name: string;
  logo: string;
  operationalArea: string;
  nace: string;
  dangerClass: DangerClass;
  sgk: string;
  status: "active" | "passive";
};

export type Contractor = Company & {
  activity: string;
  subActivity: string;
  contractorType: "Daimi" | "Geçici";
};

export type OperationalArea = {
  id: number;
  name: string;
  description: string;
  status: "active" | "passive";
};

export type CompanyOption = {
  name: string;
  logo: string;
  group: string;
};

export const companies: Company[] = [
  {
    id: 1,
    name: "Arçelik A.Ş.",
    logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Arcelik_Logo.svg",
    operationalArea: "Üretim Alanı",
    nace: "27.51.01",
    dangerClass: "Çok Tehlikeli",
    sgk: "1234567890",
    status: "active",
  },
  {
    id: 2,
    name: "Arçelik Pazarlama A.Ş.",
    logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Arcelik_Logo.svg",
    operationalArea: "İdari Alan",
    nace: "46.43.02",
    dangerClass: "Az Tehlikeli",
    sgk: "9876543210",
    status: "active",
  },
  {
    id: 3,
    name: "Beko Elektronik A.Ş.",
    logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Beko_logo.svg",
    operationalArea: "Üretim Alanı",
    nace: "27.51.02",
    dangerClass: "Çok Tehlikeli",
    sgk: "1122334455",
    status: "active",
  },
];

export const contractors: Contractor[] = [
  {
    id: 1,
    name: "ISS Tesis Yönetim Hizmetleri A.Ş.",
    logo: "",
    operationalArea: "Temizlik Hizmetleri",
    activity: "Temizlik",
    subActivity: "Genel Temizlik",
    nace: "81.21.01",
    dangerClass: "Az Tehlikeli",
    sgk: "481210101103597601140113000",
    status: "active",
    contractorType: "Daimi",
  },
  {
    id: 2,
    name: "Tepe Savunma ve Güvenlik Sistemleri A.Ş.",
    logo: "",
    operationalArea: "Güvenlik Hizmetleri",
    activity: "Güvenlik",
    subActivity: "Özel Güvenlik",
    nace: "80.10.01",
    dangerClass: "Az Tehlikeli",
    sgk: "48001010110479600140166000",
    status: "active",
    contractorType: "Daimi",
  },
  {
    id: 3,
    name: "ABC Teknik Hizmetler Ltd. Şti.",
    logo: "",
    operationalArea: "Teknik Bakım",
    activity: "Teknik Hizmet",
    subActivity: "Bakım ve Onarım",
    nace: "33.12.01",
    dangerClass: "Çok Tehlikeli",
    sgk: "—",
    status: "active",
    contractorType: "Daimi",
  },
];

export const areas: OperationalArea[] = [
  {
    id: 1,
    name: "Üretim Alanı",
    description: "Ana üretim faaliyetlerinin yürütüldüğü alan.",
    status: "active",
  },
  {
    id: 2,
    name: "Bakım Alanı",
    description: "Bakım ve teknik faaliyetlerin yürütüldüğü alan.",
    status: "active",
  },
  {
    id: 3,
    name: "İdari Alan",
    description: "Ofis ve idari faaliyetlerin yürütüldüğü alan.",
    status: "active",
  },
];

export const groupOptions = [
  "Arçelik Grubu",
  "Arçelik Pazarlama Grubu",
  "Beko Grubu",
];

export const companyOptions: CompanyOption[] = [
  {
    name: "Arçelik A.Ş.",
    logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Arcelik_Logo.svg",
    group: "Arçelik Grubu",
  },
  {
    name: "Arçelik Pazarlama A.Ş.",
    logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Arcelik_Logo.svg",
    group: "Arçelik Pazarlama Grubu",
  },
  {
    name: "Beko Elektronik A.Ş.",
    logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Beko_logo.svg",
    group: "Beko Grubu",
  },
];

export const permanentContractorOptions = [
  { name: "ISS Tesis Yönetim Hizmetleri A.Ş.", logo: "" },
  { name: "Tepe Savunma ve Güvenlik Sistemleri A.Ş.", logo: "" },
  { name: "ABC Teknik Hizmetler Ltd. Şti.", logo: "" },
];