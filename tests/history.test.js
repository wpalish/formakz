import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import definition from '../module.js';
import {WorkStore} from '../core/store.js';
import {createServer} from '../core/server.js';
const save=(s,collection,data,id)=>{const n=s.transact({operation:'save',collection,data,id,revision:s.read().revision});return id||n.data[collection].at(-1).id;};
const audit=s=>s.db.prepare('SELECT * FROM audit ORDER BY rowid').all();
const fields={name:'SYNTHETIC request',description:'SYNTHETIC only',questions:'SYNTHETIC service?\nSYNTHETIC day?',status:'published'};

test('archived form preserves readable questions/answers and review edits through file restart and empty restore',()=>{
 const dir=mkdtempSync(join(tmpdir(),'formakz-history-')),path=join(dir,'workspace.sqlite');let s=new WorkStore(definition,path);const restored=new WorkStore(definition);
 try{const form=save(s,'forms',fields),entry={form,answers:JSON.stringify(['SYNTHETIC consultation','SYNTHETIC Monday']),status:'new'},id=save(s,'submissions',entry);
 s.transact({operation:'archive',collection:'forms',id:form,revision:s.read().revision});assert.equal(definition.publicForm(s.read().data,form),null);
 save(s,'submissions',{...entry,status:'reviewed'},id);const before=s.read(),events=audit(s),copy=s.export();s.close();s=new WorkStore(definition,path);assert.deepEqual(s.read(),before);assert.deepEqual(audit(s),events);restored.restore(copy);assert.deepEqual(restored.read().data,before.data);
 for(const current of [s,restored]){const unchanged=current.read(),log=audit(current);assert.throws(()=>save(current,'submissions',{...entry,answers:JSON.stringify(['SYNTHETIC changed','SYNTHETIC Monday'])},id),/меня/);assert.deepEqual(current.read(),unchanged);assert.deepEqual(audit(current),log);save(current,'submissions',{...entry,status:'reviewed'},id);assert.equal(current.read().data.forms[0].questions,fields.questions);assert.equal(current.read().data.forms[0].archived,true);assert.equal(current.read().data.submissions[0].form,form);assert.equal(current.read().data.submissions[0].answers,entry.answers);assert.equal(current.read().data.submissions[0].status,'reviewed');}
 }finally{s.close();restored.close();rmSync(dir,{recursive:true,force:true});}
});

test('public GET and stale public POST reject draft/archived forms without changing workspace or audit',async t=>{
 const {server,store}=createServer(definition);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));const origin='http://127.0.0.1:'+server.address().port,id=save(store,'forms',fields),input={q0:'SYNTHETIC answer',q1:'SYNTHETIC Monday'};
 assert.equal((await fetch(origin+'/api/public/'+id)).status,200);
 const post=()=>fetch(origin+'/api/public/'+id,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(input)});
 const first=await post();assert.equal(first.status,201);assert.ok((await first.json()).id);
 for(const mode of ['draft','archive']){if(mode==='draft')save(store,'forms',{...fields,status:'draft'},id);else{save(store,'forms',fields,id);assert.equal((await fetch(origin+'/api/public/'+id)).status,200);store.transact({operation:'archive',collection:'forms',id,revision:store.read().revision});}const before=store.read(),events=audit(store);
 for(const response of [await fetch(origin+'/api/public/'+id),await post()]){assert.equal(response.status,400);const body=await response.json();assert.match(body.error,/не найдена|не опубликована/);assert.equal(body.data,undefined);assert.equal(body.fields,undefined);assert.deepEqual(store.read(),before);assert.deepEqual(audit(store),events);}
 assert.equal(store.read().data.submissions.length,1);}
});
