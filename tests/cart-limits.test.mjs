import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { products } from '../src/data/products.ts';
function cart() {
 const exports={};
 const source=ts.transpileModule(readFileSync(new URL('../src/lib/cart.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(source,{exports,window:{localStorage:{getItem:()=>null,setItem:()=>{}},addEventListener:()=>{}},require:name=>name==='react'?{useSyncExternalStore:(_sub,get)=>get()}:{getProductBySlug:slug=>products.find(p=>p.slug===slug)}});
 return exports;
}
test('cart never exceeds the server total and line limits',()=>{
 const c=cart();c.addToCart('automobile-tee','M',10);c.addToCart('emblem-tee','M',10);
 assert.match(c.addToCart('boat-floating-wheel','ONE SIZE'),/maximum of 20/);
 assert.equal(c.cartCount(c.useCart()),20);
 c.changeQuantity('automobile-tee','M',9);c.addToCart('boat-floating-wheel','ONE SIZE');
 assert.equal(c.cartCount(c.useCart()),20);c.changeQuantity('automobile-tee','M',10);assert.equal(c.cartCount(c.useCart()),20);
 c.clearCart();
 for(const slug of ['automobile-tee','emblem-tee','guerrilla-tee'])for(const size of ['S','M','L','XL'])c.addToCart(slug,size);
 assert.match(c.addToCart('boat-floating-wheel','ONE SIZE'),/12 different/);assert.equal(c.useCart().length,12);
});
test('adding beyond an existing size limit explains failure without silently truncating',()=>{
 const c=cart();c.addToCart('automobile-tee','M',9);assert.match(c.addToCart('automobile-tee','M',2),/maximum of 10/);assert.equal(c.useCart()[0].quantity,9);
});
