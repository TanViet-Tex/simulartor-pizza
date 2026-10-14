import {test,expect} from '@playwright/test';
import {build} from 'esbuild';

test('PWA manifest and Apple metadata use Tiệm Pizza with complete pizza icons',async({page,request,browserName})=>{
 await page.goto('/');await expect(page).toHaveTitle('Tiệm Pizza');
 await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content','Tiệm Pizza');
 await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content','yes');
 await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute('content','default');
 const manifestURL=await page.locator('link[rel="manifest"]').evaluate((link:HTMLLinkElement)=>link.href);
 const response=await request.get(manifestURL);expect(response.ok()).toBe(true);expect(response.headers()['content-type']).toMatch(/manifest\+json|application\/json/);
 const manifest=await response.json();expect(manifest).toMatchObject({name:'Tiệm Pizza',short_name:'Tiệm Pizza',display:'standalone',lang:'vi',theme_color:'#382019'});
 const launch=new URL(manifest.start_url,manifestURL),scope=new URL(manifest.scope,manifestURL);expect(launch.href).toBe(new URL('/',page.url()).href);expect(new URL(manifest.id,manifestURL).href).toBe(launch.href);expect(launch.href.startsWith(scope.href)).toBe(true);expect(launch.search).toBe('');
 expect(manifest.icons.map((icon:any)=>icon.sizes).sort()).toEqual(['192x192','512x512']);
 const images=[...manifest.icons.map((icon:any)=>({url:new URL(icon.src,manifestURL).href,size:Number(icon.sizes.split('x')[0])})),{url:await page.locator('link[rel="apple-touch-icon"]').evaluate((link:HTMLLinkElement)=>link.href),size:180},{url:await page.locator('link[rel="icon"]').evaluate((link:HTMLLinkElement)=>link.href),size:32}];
 for(const image of images){const icon=await request.get(image.url);expect(icon.ok()).toBe(true);expect(icon.headers()['content-type']).toContain('image/png');const bytes=await icon.body();expect([...bytes.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);expect(bytes.readUInt32BE(16)).toBe(image.size);expect(bytes.readUInt32BE(20)).toBe(image.size);}
 if(browserName==='chromium'){const cdp=await page.context().newCDPSession(page);try{const parsed=await cdp.send('Page.getAppManifest');expect(parsed.errors).toEqual([]);expect(JSON.parse(parsed.data)).toMatchObject({name:'Tiệm Pizza',display:'standalone'});}finally{await cdp.detach();}}
});

test('PWA packaging boots the original menu and preserves native campaign storage on reload',async({page})=>{
 test.setTimeout(60000);await page.goto('/');await expect(page.locator('canvas')).toHaveAttribute('data-menu-dialog','none',{timeout:30000});
 const moduleName:string='node:path',paths=await import(moduleName);
 const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
 import {CozyRuntime} from './src/runtime/CozyRuntime';import {CozySaveRepository} from './src/infrastructure/CozySaveRepository';
 (async()=>{const repo=new CozySaveRepository(),loaded=await repo.load(),r=new CozyRuntime(false,true,{eventSeed:123});r.claimTestCode('VIETVUIVE');const result=await repo.commit({campaignId:'pwa-existing-campaign',commitId:'pwa-existing-save',sourceRevision:0,replacementToken:loaded.replacementToken,payload:r.exportCheckpoint()});if(!result.ok)throw Error(result.message);window.pwaStored=result.envelope;localStorage.setItem('pwa-storage-sentinel','kept');})();
 `},bundle:true,platform:'browser',format:'iife',minify:true,write:false});
 await page.addScriptTag({content:bundle.outputFiles[0].text});await expect.poll(()=>page.evaluate(()=>(window as any).pwaStored?.commitId)).toBe('pwa-existing-save');const original=await page.evaluate(()=>(window as any).pwaStored);
 await page.reload();await expect.poll(async()=>JSON.parse(await page.locator('canvas').getAttribute('data-save-state')||'null')?.state,{timeout:30000}).toBe('ready');
 const saved=await page.evaluate(()=>new Promise<any>((resolve,reject)=>{const q=indexedDB.open('pizza-cozy-checkpoints',1);q.onerror=()=>reject(q.error);q.onsuccess=()=>{const db=q.result,tx=db.transaction('latest','readonly'),read=tx.objectStore('latest').get('active');tx.oncomplete=()=>{db.close();resolve(read.result);};};}));expect(saved).toEqual(original);expect(await page.evaluate(()=>localStorage.getItem('pwa-storage-sentinel'))).toBe('kept');
 await expect(page.locator('#game-container')).toHaveAttribute('aria-label','Tiệm Pizza Ấm Áp — Ngày 1');
 expect(await page.evaluate(()=>navigator.serviceWorker.getRegistrations().then(registrations=>registrations.length))).toBe(0);
});
