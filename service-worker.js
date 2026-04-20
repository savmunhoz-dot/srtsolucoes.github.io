// service-worker.js

const CACHE_NAME = 'srt-lista-v3'; // Versão incrementada para forçar atualização
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
  // FIX: Removidos arquivos de imagem do cache obrigatório (icon-192.png, icon-512.png, srt-logo.png)
  // pois se eles não existirem, o install do Service Worker vai falhar e o app não funcionará offline.
  // As imagens serão cacheadas dinamicamente na primeira vez que forem carregadas.
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Ativa imediatamente sem esperar o reload
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          response => {
            // Só cacheia respostas válidas de tipo 'basic' (mesma origem) ou 'cors'
            if (!response || response.status !== 200 ||
                (response.type !== 'basic' && response.type !== 'cors')) {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // FIX: Se a rede falhar e não tiver cache, retorna uma resposta de fallback
          // para navegação (evita tela em branco offline)
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Assume controle imediato das páginas abertas
  );
});
