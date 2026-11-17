import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { createChatGPTSearchProvider, installChatGPTSearch } from '../search/provider.js'
import { installAutomaticSearch } from '../search/auto.js'
assert.ok(process.versions.electron)
const require=createRequire(join(process.env.DSH_INSTALL_DIR,'package.json'))
const installed=async name=>{
  const pi='@earendil-works/pi-ai'
  const file=name===pi?join(process.env.DSH_INSTALL_DIR,'..','..',pi,'dist/index.js'):name.startsWith(pi+'/providers/')?join(process.env.DSH_INSTALL_DIR,'..','..',pi,'dist/providers',name.slice((pi+'/providers/').length)+'.js'):require.resolve(name)
  return import(pathToFileURL(file).href)
}
// Exercise installed Models/auth cancellation, not a synthetic iterator. OAuth
// refresh is deliberately noncooperative, as native refresh must persist even
// after resolveProviderAuth's raceWithAbortSignal has returned to its caller.
async function refreshQuiescence(createModels, openaiCodexProvider) {
  const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve}}
  const started=deferred(),finish=deferred(),persisted=deferred()
  let releases=0,inference=0,refreshes=0
  let credential={type:'oauth',access:'synthetic-expired',refresh:'synthetic-refresh',expires:0}
  const native=openaiCodexProvider()
  native.auth={...native.auth,oauth:{...native.auth.oauth,refresh:async current=>{
    refreshes++;started.resolve();await finish.promise
    return {...current,access:'synthetic-new',refresh:'synthetic-rotated',expires:Date.now()+3600000}
  }}}
  const store={read:async()=>credential,modify:async(id,update)=>{
    const next=await update(credential)
    if(next!==undefined)credential=next
    persisted.resolve()
    return credential
  },list:async()=>[],delete:async()=>{throw Error('unexpected delete')}}
  const installation=createChatGPTSearchProvider({agents:{currentInitiator:()=>({session:{id:'synthetic-session'}})}},{
    acquireSession:async()=>({accountId:'synthetic-account',release:()=>{releases++}}),credentialStore:()=>store,
  },{createModels,openaiCodexProvider:()=>native,fetch:async()=>{inference++;throw Error('unexpected inference')}})
  const controller=new AbortController()
  const result=installation.provider.search({query:'synthetic'},controller.signal)
  const turn=()=>new Promise(resolve=>setImmediate(resolve))
  const bounded=async promise=>{let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('native cancellation regression timed out')),3000)})])}finally{clearTimeout(timer)}}
  try {
    await bounded(started.promise)
    controller.abort()
    await bounded(assert.rejects(result,{code:'SEARCH_ABORTED'}))
    // Let installed auth's abort race and native iterator completely unwind.
    for(let i=0;i<5;i++)await turn()
    assert.equal(releases,0,'native auth iterator ended before refresh persistence: keep lease')
    assert.equal(credential.refresh,'synthetic-refresh')
    assert.equal(inference,0)
    finish.resolve()
    await bounded(persisted.promise)
    for(let i=0;i<5;i++)await turn()
    assert.equal(credential.refresh,'synthetic-rotated')
    assert.equal(refreshes,1)
    assert.equal(releases,1)
    assert.equal(inference,0)
    installation.dispose()
    await turn()
    assert.equal(releases,1,'no duplicate release after dispose')
  } finally {finish.resolve();installation.dispose()}
}
const registrations=[],effects=[]
const settings=[{ns:'web-deepseek-api',value:{count:10,searchRequestsPerSecond:5,sendOriginalQuestion:false,searchBilling:'api-key',fetchBilling:'api-key',searchBaseURL:'https://search.invalid/v1/tools',searchApiKeyEnv:'SYNTHETIC_MISSING'}}]
let networkStarted=false
const ctx={loader:{import:installed},settings:{describe:()=>settings},agents:{currentInitiator:()=>undefined},web:{registerSearchProvider:p=>{registrations.push(p);return()=>{}}},effect:start=>effects.push(start()),get(name){return {agents:this.agents,credentials:{describe:async()=>({configured:false}),resolve:async()=>undefined},launchEnvironment:{get:()=>undefined}}[name]}}
const accounts={acquireSession:()=>{networkStarted=true;throw Error('must not call')},credentialStore:()=>{throw Error('must not read')}}
try{
 const gpt=await installChatGPTSearch(ctx,accounts)
 const auto=await installAutomaticSearch(ctx,gpt.provider)
 assert.deepEqual(registrations.map(x=>x.id),['chatgpt-session-search','model-aware-search'])
 assert.equal(await gpt.provider.ready('chatgpt-session'),true)
 assert.equal(await auto.provider.ready('deepseek-official'),false)
 await assert.rejects(auto.provider.search({query:'synthetic'}),{code:'SEARCH_INITIATOR_REQUIRED'})
 const {createModels}=await installed('@earendil-works/pi-ai');const {openaiCodexProvider}=await installed('@earendil-works/pi-ai/providers/openai-codex');const m=createModels({credentials:{read:async()=>undefined},authContext:{env:async()=>undefined,fileExists:async()=>false}});m.setProvider(openaiCodexProvider());assert.ok(m.getModel('openai-codex','gpt-6.1-sol'))
 await refreshQuiescence(createModels,openaiCodexProvider)
 assert.equal(networkStarted,false)
 console.log(JSON.stringify({ok:true,electron:process.versions.electron,providers:registrations.map(x=>x.id),nativeDeepSeekApply:true,nativeReadyNoCredential:false,nativeGPTModel:true,nativeRefreshQuiescence:true,profileSecretsRead:false,networkStarted:false}))
}finally{for(const dispose of effects.reverse())await dispose?.()}
