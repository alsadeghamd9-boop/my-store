/**
 * EDIT THIS FILE before taking real payments. All details below are placeholders.
 * Each entry may have different account details; no credentials belong here.
 */
export const BANK_ACCOUNTS = [
  { id: "bank-of-khartoum", name: "بنك الخرطوم — بنكك", accountName: "اسم صاحب الحساب — يُعدّل", accountNumber: "رقم الحساب — يُعدّل" },
  { id: "faisal-islamic", name: "بنك فيصل الإسلامي السوداني", accountName: "اسم صاحب الحساب — يُعدّل", accountNumber: "رقم الحساب — يُعدّل" },
  { id: "al-jazira", name: "بنك الجزيرة السوداني الأردني", accountName: "اسم صاحب الحساب — يُعدّل", accountNumber: "رقم الحساب — يُعدّل" },
  { id: "omdurman-national", name: "بنك أم درمان الوطني", accountName: "اسم صاحب الحساب — يُعدّل", accountNumber: "رقم الحساب — يُعدّل" },
  { id: "blue-nile-mashreg", name: "بنك النيل الأزرق المشرق", accountName: "اسم صاحب الحساب — يُعدّل", accountNumber: "رقم الحساب — يُعدّل" },
  { id: "farmers-commercial", name: "مصرف المزارع التجاري", accountName: "اسم صاحب الحساب — يُعدّل", accountNumber: "رقم الحساب — يُعدّل" },
  { id: "animal-resources", name: "بنك الثروة الحيوانية", accountName: "اسم صاحب الحساب — يُعدّل", accountNumber: "رقم الحساب — يُعدّل" },
  { id: "agricultural", name: "البنك الزراعي السوداني", accountName: "اسم صاحب الحساب — يُعدّل", accountNumber: "رقم الحساب — يُعدّل" },
  { id: "sudanese-french", name: "البنك السوداني الفرنسي", accountName: "اسم صاحب الحساب — يُعدّل", accountNumber: "رقم الحساب — يُعدّل" },
  { id: "al-baraka", name: "بنك البركة السوداني", accountName: "اسم صاحب الحساب — يُعدّل", accountNumber: "رقم الحساب — يُعدّل" },
  { id: "al-salam", name: "بنك السلام السودان", accountName: "اسم صاحب الحساب — يُعدّل", accountNumber: "رقم الحساب — يُعدّل" },
  { id: "tadamon", name: "بنك التضامن الإسلامي", accountName: "اسم صاحب الحساب — يُعدّل", accountNumber: "رقم الحساب — يُعدّل" },
  { id: "al-neelain", name: "بنك النيلين", accountName: "اسم صاحب الحساب — يُعدّل", accountNumber: "رقم الحساب — يُعدّل" },
  { id: "al-shamal", name: "بنك الشمال الإسلامي", accountName: "اسم صاحب الحساب — يُعدّل", accountNumber: "رقم الحساب — يُعدّل" },
  { id: "export-development", name: "بنك تنمية الصادرات", accountName: "اسم صاحب الحساب — يُعدّل", accountNumber: "رقم الحساب — يُعدّل" },
  { id: "savings", name: "بنك الادخار والتنمية الاجتماعية", accountName: "اسم صاحب الحساب — يُعدّل", accountNumber: "رقم الحساب — يُعدّل" },
  { id: "family", name: "بنك الأسرة", accountName: "اسم صاحب الحساب — يُعدّل", accountNumber: "رقم الحساب — يُعدّل" },
  { id: "al-nile", name: "بنك النيل", accountName: "اسم صاحب الحساب — يُعدّل", accountNumber: "رقم الحساب — يُعدّل" },
] as const;

export const WALLET_ACCOUNTS = [
  { id: "mcash", name: "mCash", accountName: "اسم صاحب المحفظة — يُعدّل", accountNumber: "رقم المحفظة — يُعدّل" },
  { id: "zain-cash", name: "Zain Cash", accountName: "اسم صاحب المحفظة — يُعدّل", accountNumber: "رقم المحفظة — يُعدّل" },
] as const;

export const PAYMENT_LABELS: Record<string, string> = {
  cod: "الدفع عند الاستلام",
  bank: "تحويل بنكي",
  wallet: "محفظة إلكترونية",
};
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار التحقق",
  paid: "تم التحقق من الدفع",
};
export function paymentProviderName(id: string) {
  return [...BANK_ACCOUNTS, ...WALLET_ACCOUNTS].find((provider) => provider.id === id)?.name ?? id;
}
