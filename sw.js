'use strict';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const scope=self.registration.scope;
  for(const key of await caches.keys()){
    if(!/^intera-(demo|mvp)/.test(key))continue;
    const cache=await caches.open(key);
    for(const request of await cache.keys()){
      if(request.url.startsWith(scope))await cache.delete(request);
    }
  }
  await self.clients.claim();
  await self.registration.unregister();
})()));
