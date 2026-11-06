import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { products } from '../src/data/products.ts';

const compile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const commerce = {};
vm.runInNewContext(compile('../src/lib/commerce.ts'), {exports:commerce,process:{env:{}},require:name => name === './order-recipients' ? {storeOrderRecipients:()=>['support@maisonamiral.co.za','maisonamiral@gmail.com']} : {getProductBySlug:slug=>products.find(p=>p.slug===slug),getDeliveryFee:items=>items.some(i=>i.slug==='boat-floating-wheel')?4000:0}});
const id='abcde123-1234-4123-8123-123456789012';
const buyer={firstName:'TEST',lastName:'DO NOT FULFIL',email:'test@example.invalid',phone:'0000000000',address:'TEST',suburb:'',city:'TEST',province:'Gauteng',postalCode:'0000'};
const items=[{slug:'automobile-tee',size:'M',quantity:1}];
function setup(existing, failRecipient) {
  let row=existing, inserts=0;
  const emails=[];
  const exports={};
  vm.runInNewContext(compile('../src/app/api/checkout/route.ts'), {
    exports,Response,Date,Promise,Number,JSON,console:{error:()=>{}},setTimeout:fn=>fn(),
    require:name => name.includes('commerce') ? {...commerce,getEftSettings:()=>({enabled:true,bank:{},key:'fake',sender:'sender@example.invalid',adminRecipients:['support@maisonamiral.co.za','maisonamiral@gmail.com']})} : name.includes('eft-invoice') ? {referenceFor:()=> 'MA-TEST', sendOrderEmail:async(to)=>{emails.push(to);if(to===failRecipient)throw Error('temporary failure');return 'email-id';}} : {storeDb:async(_table,method,options)=>{
      if(method==='GET')return row?[row]:[];
      if(method==='POST'){inserts++;row={...options.body,created_at:new Date().toISOString()};return [];}
      if(method==='PATCH'){Object.assign(row,options.body);return [];}
    }},
  });
  return {submit:async(customer=buyer,orderItems=items)=>{
    const result=await exports.POST(new Request('https://example.invalid/api/checkout',{method:'POST',body:JSON.stringify({customer,items:orderItems,checkoutId:id})}));
    return {status:result.status,body:await result.json()};
  },emails,get row(){return row;},get inserts(){return inserts;}};
}
const saved = () => ({id,email:buyer.email,total_cents:45000,notification_status:'sent',status:'awaiting_payment',first_name:buyer.firstName,last_name:buyer.lastName,phone:buyer.phone,address:buyer.address,suburb:buyer.suburb,city:buyer.city,province:buyer.province,postal_code:buyer.postalCode,items:commerce.validateItems(items),created_at:new Date().toISOString()});
test('new checkout saves server prices and sends all three distinct copies',async()=>{
 const run=setup();const result=await run.submit();assert.equal(result.status,201);assert.equal(run.inserts,1);assert.equal(run.row.total_cents,45000);assert.equal(run.row.delivery_cents,0);assert.equal(run.row.notification_status,'sent');assert.deepEqual(run.emails,[buyer.email,'support@maisonamiral.co.za','maisonamiral@gmail.com']);
});
test('an exact retry returns the same order without another invoice',async()=>{
 const run=setup(saved());assert.equal((await run.submit()).status,200);assert.equal(run.inserts,0);assert.equal(run.emails.length,0);
});
test('same-price different item and changed address cannot reuse an order ID',async()=>{
 const run=setup(saved());assert.equal((await run.submit(buyer,[{slug:'emblem-tee',size:'M',quantity:1}])).status,409);assert.equal((await run.submit({...buyer,address:'DIFFERENT'})).status,409);assert.equal(run.emails.length,0);
});
test('recent interrupted notifications resume without a second order',async()=>{
 const run=setup({...saved(),notification_status:'pending'});assert.equal((await run.submit()).body.notificationStatus,'sent');assert.equal(run.inserts,0);assert.equal(run.emails.length,3);
});
test('old partial orders are referred to support rather than risking duplicate emails',async()=>{
 const run=setup({...saved(),notification_status:'needs_attention',created_at:'2020-01-01T00:00:00Z'});assert.equal((await run.submit()).body.notificationStatus,'needs_attention');assert.equal(run.emails.length,0);
});
test('one rejected copy preserves the order and flags reconciliation',async()=>{
 const run=setup(null,'maisonamiral@gmail.com');assert.equal((await run.submit()).body.notificationStatus,'needs_attention');assert.equal(run.row.status,'awaiting_payment');assert.equal(run.emails.length,3);
});
