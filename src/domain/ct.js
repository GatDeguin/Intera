export const QUARTERS_PER_CT = 4;
export const MINUTES_PER_CT = 15;

export function ctToQuarters(ct) {
  if (!Number.isInteger(ct) || ct < 0) {
    throw new TypeError('Los servicios se expresan en CT enteros no negativos.');
  }
  return ct * QUARTERS_PER_CT;
}

export function quartersToCt(quarters) {
  assertQuarters(quarters);
  return quarters / QUARTERS_PER_CT;
}

export function quartersToMinutes(quarters) {
  assertQuarters(quarters);
  return quarters * (MINUTES_PER_CT / QUARTERS_PER_CT);
}

export function formatCt(quarters) {
  const ct = quartersToCt(quarters);
  const minutes = quartersToMinutes(quarters);
  const ctLabel = Number.isInteger(ct) ? `${ct} CT` : `${ct.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')} CT`;
  const timeLabel = minutes >= 60 && minutes % 60 === 0 ? `${minutes / 60} h` : `${minutes} min`;
  return `${ctLabel} · ${timeLabel}`;
}

function assertQuarters(quarters) {
  if (!Number.isInteger(quarters)) {
    throw new TypeError('ct_quarters debe ser un entero.');
  }
}
