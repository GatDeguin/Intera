export function currentRoute(hash = globalThis.location?.hash || '#/') {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const path = raw || '/';
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  if (!parts.length) return { name: 'home', path: '/' };
  if (parts[0] === 'explorar') return { name: 'explore', path: '/explorar' };
  if (parts[0] === 'publicar') return { name: 'publish', path: '/publicar' };
  if (parts[0] === 'onboarding') return { name: 'onboarding', path: '/onboarding' };
  if (parts[0] === 'ofertas' && parts[1] === 'nueva') return { name: 'new-offer', path: '/ofertas/nueva' };
  if (parts[0] === 'ofertas' && parts[1]) return { name: 'offer', id: parts[1], path };
  if (parts[0] === 'solicitudes' && parts[1] === 'nueva') return { name: 'new-request', path: '/solicitudes/nueva' };
  if (parts[0] === 'solicitudes' && parts[1]) return { name: 'request', id: parts[1], path };
  if (parts[0] === 'intercambios' && parts[1]) return { name: 'exchange-detail', id: parts[1], path };
  if (parts[0] === 'intercambios') return { name: 'exchanges', path: '/intercambios' };
  if (parts[0] === 'perfil' && parts[1]) return { name: 'profile', id: parts[1], path };
  if (parts[0] === 'mi-perfil') return { name: 'my-profile', path: '/mi-perfil' };
  if (parts[0] === 'historial') return { name: 'history', path: '/historial' };
  if (parts[0] === 'como-funciona') return { name: 'how', path: '/como-funciona' };
  return { name: 'not-found', path };
}
