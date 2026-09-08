import {ensure} from './errors.mjs';
export const PRICE_TIERS=Object.freeze([1000,2500,5000]);
export const MINUTES_PER_BLOCK=15;
export const COMMISSION_BPS=500;
export const MAX_BLOCKS=32;
export function toCents(value) {
  ensure(typeof value==='string'||typeof value==='number',422,'INVALID_MONEY','Importe monetario inválido.');
  const s=String(value);ensure(/^\d+(\.\d{1,2})?$/.test(s),422,'INVALID_MONEY','Se requieren pesos con hasta dos decimales.');
  const [whole,dec='']=s.split('.');const cents=Number(whole)*100+Number(dec.padEnd(2,'0'));
  ensure(Number.isSafeInteger(cents),422,'INVALID_MONEY','Importe fuera de rango.');return cents;
}
export function commissionFor(grossCents) {
  ensure(Number.isSafeInteger(grossCents)&&grossCents>=0&&grossCents<=10**10,422,'INVALID_MONEY','Importe fuera de rango.');
  // Round half up, entirely in integer cents. Service quotes divide exactly by 20.
  return Math.floor((grossCents*COMMISSION_BPS+5000)/10000);
}
export function quote(priceArs,blocks) {
  ensure(PRICE_TIERS.includes(priceArs),422,'INVALID_TIER','Elegí $1.000, $2.500 o $5.000 por bloque.');
  ensure(Number.isSafeInteger(blocks)&&blocks>=1&&blocks<=MAX_BLOCKS,422,'INVALID_BLOCKS','Elegí entre 1 y 32 bloques enteros.');
  const grossCents=priceArs*100*blocks;const commissionCents=commissionFor(grossCents);
  return Object.freeze({currency:'ARS',priceArs,blocks,minutes:blocks*15,unitCents:priceArs*100,grossCents,commissionBps:500,commissionCents,sellerBeforeProcessorCents:grossCents-commissionCents});
}
