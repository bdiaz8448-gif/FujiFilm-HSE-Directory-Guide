/* AURA HSE Directory — Service Worker
   Strategy: Network-first with cache fallback.
   - Online: always fetches fresh content, updates cache silently.
   - Offline: serves last-cached version so Emergency tab, contacts,
     and all embedded tools remain fully functional without internet.
*/
const CACHE = 'aura-hse-v2';

const PRECACHE = [
  './Aura-HSE-Directory-Safety-Reference.html',
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore-compat.js'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(PRECACHE); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  // Only handle GET requests; skip non-http schemes (blob:, data:, etc.)
  if(e.request.method !== 'GET') return;
  var url = e.request.url;
  if(!url.startsWith('http')) return;

  e.respondWith(
    fetch(e.request).then(function(resp){
      // Clone and cache the fresh response
      var clone = resp.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
      return resp;
    }).catch(function(){
      // Network failed → serve from cache
      return caches.match(e.request);
    })
  );
});
