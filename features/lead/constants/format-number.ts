import { CountryCode, parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * Форматирует любой номер в международный формат E.164
 * @param phone - номер в любом формате
 * @param defaultCountry - страна по умолчанию (CA = Канада)
 * @returns строка в формате +14161234567 или null
 */
export function formatPhoneForTel(
    phone: string,
    defaultCountry: CountryCode = "CA"
): string | null {
    if (!phone) return null;

    const phoneNumber = parsePhoneNumberFromString(
        phone.trim(),
        defaultCountry
    );

    if (!phoneNumber || !phoneNumber.isValid()) {
        return null;
    }

    return phoneNumber.format("E.164");
}