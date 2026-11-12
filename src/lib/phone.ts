/** Accept Sudanese 09/01 mobile numbers with optional +249 or 00249 prefix. */
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/[\s\-()]/g, "").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  if (digits.startsWith("+249")) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith("00249")) digits = `0${digits.slice(5)}`;
  else if (digits.startsWith("249")) digits = `0${digits.slice(3)}`;
  else if (/^[19]\d{8}$/.test(digits)) digits = `0${digits}`;
  return /^0[19]\d{8}$/.test(digits) ? digits : null;
}
