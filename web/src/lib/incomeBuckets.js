// incomeBuckets.js — конвертація "дохід від X грн" → мінімальний hinctnta-дециль.
//
// Стратегія: повертаємо найменший дециль, чия НИЖНЯ межа ≥ X грн.
// Це означає що всі респонденти у цьому і вищих децилях ГАРАНТОВАНО мають дохід ≥ X.
// Респонденти у нижчому, прикордонному децилі частково б підходили — їх
// упускаємо. Це невелике зміщення вниз, документується в METHODOLOGY.

export function uahToMinDecile(monthlyUah, external) {
  if (monthlyUah == null || !isFinite(monthlyUah) || monthlyUah <= 0) return null;

  const bounds = external?.income_deciles?.bounds_uah;
  if (!Array.isArray(bounds) || bounds.length === 0) return null;

  // bounds[i] = верхня межа децилю (i+1). bounds[9] зазвичай null = +∞.
  // нижня межа децилю i: bounds[i-2] (0-indexed: bounds[i-2]); для i=1 нижня межа = 0.
  for (let i = 1; i <= 10; i++) {
    const lower = i === 1 ? 0 : bounds[i - 2];
    if (lower != null && lower >= monthlyUah) return i;
  }
  // Дохід вищий за верхню межу 9-го децилю — лише топ-дециль гарантовано
  return 10;
}
