import test from 'node:test';
import assert from 'node:assert/strict';
import {quote, toCents, commissionFor, PRICE_TIERS, MINUTES_PER_BLOCK} from '../server/domain/pricing.mjs';
for(const price of [1000,2500,5000]) for(const blocks of [1,2,4,32]) {
 test(`${blocks} bloques de ${price}: tiempo y comisión exactos`,()=>{
   const q=quote(price,blocks);
   assert.equal(q.minutes,blocks*15);assert.equal(q.grossCents,price*blocks*100);
   assert.equal(q.commissionCents,price*blocks*5);assert.equal(q.sellerBeforeProcessorCents,q.grossCents-q.commissionCents);
 });
}
test('1000, 2500 y 5000 son los únicos precios',()=>{
 assert.deepEqual(PRICE_TIERS,[1000,2500,5000]);assert.equal(MINUTES_PER_BLOCK,15);
 for(const p of [0,-1000,1500,2500.01,'1000',Infinity,NaN])assert.throws(()=>quote(p,1));
});
test('bloques enteros positivos acotados',()=>{for(const n of [0,-1,.5,33,'2',NaN,Infinity])assert.throws(()=>quote(1000,n));});
test('decimal monetario sin redondeo binario oculto',()=>{
 assert.equal(toCents('0.29'),29);assert.equal(toCents(2500),250000);assert.equal(toCents('2500.50'),250050);
 for(const v of ['1.001','1e5','-1','bad',null,{},Infinity]) assert.throws(()=>toCents(v));
 assert.equal(commissionFor(1000000),50000);assert.equal(commissionFor(1),0);
});
