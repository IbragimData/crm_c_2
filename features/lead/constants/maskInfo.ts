export function maskPhone(phone: string) {
  if (!phone) return "";
  return phone.slice(0, 2) + "*".repeat(phone.length - 2) + phone.slice(8, 12);
}

// Функция для маскировки email
export function maskEmail(email: string) {
  if (!email) return "";
  const [name, domain] = email.split("@");
  return name[0] + "*".repeat(name.length - 1) + "@" + domain;
}
