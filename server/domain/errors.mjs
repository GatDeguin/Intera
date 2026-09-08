export class AppError extends Error {
  constructor(status, code, message) { super(message); this.status=status;this.code=code; }
}
export function ensure(condition, status, code, message) { if (!condition) throw new AppError(status,code,message); }
export function text(value, min=1, max=1000, label='Texto') {
  ensure(typeof value==='string',422,'VALIDATION',`${label}: completá un texto válido.`);
  const v=value.trim().normalize('NFC');
  ensure(v.length>=min&&v.length<=max&&!/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(v),422,'VALIDATION',`${label}: entre ${min} y ${max} caracteres.`);return v;
}
export const safeId = value => typeof value==='string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
