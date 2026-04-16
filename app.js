// app.js — Lógica compartida para projector y control
// Usa `auth.js` como punto único de conexión a Supabase (rellena credenciales ahí)
import { supabase, makeChannel } from './auth.js';

// Utilidades
const safePreventDefault = (e)=>{ try{ if (e && e.cancelable) e.preventDefault(); }catch{} };

function getRoomFromUrl(){
  try{
    const params = new URLSearchParams(location.search);
    let room = params.get('room');
    if (!room){
      room = 'room-' + Math.random().toString(36).slice(2,9).toUpperCase();
      params.set('room', room);
      const newUrl = location.pathname + '?' + params.toString();
      history.replaceState(null, '', newUrl);
    }
    return room;
  }catch(e){
    return 'room-' + Math.random().toString(36).slice(2,9).toUpperCase();
  }
}

// Canal y reconexión
let currentChannel = null;
let currentRoom = null;
let reconnectAttempts = 0;

function attachHandlers(ch, handlers){
  if (!ch) return;
  if (handlers.moveLaser) ch.on('broadcast', { event: 'move-laser' }, handlers.moveLaser);
  if (handlers.nav) ch.on('broadcast', { event: 'nav' }, handlers.nav);
}

function connectChannel(room, handlers){
  try{ if (currentChannel && typeof currentChannel.unsubscribe === 'function') currentChannel.unsubscribe(); }catch{}
  currentRoom = room;
  reconnectAttempts = 0;
  currentChannel = makeChannel(room);
  attachHandlers(currentChannel, handlers);
  return currentChannel;
}

function attemptReconnect(room, handlers){
  reconnectAttempts = Math.min(reconnectAttempts + 1, 10);
  const delay = Math.min(30000, Math.pow(2, reconnectAttempts) * 1000);
  console.warn('Supabase: reconnecting in', delay);
  setTimeout(()=>{
    try{
      connectChannel(room, handlers);
      reconnectAttempts = 0;
      console.info('Supabase: reconnected to', room);
    }catch(err){
      attemptReconnect(room, handlers);
    }
  }, delay);
}

// Punto de entrada: detecta qué página es
document.addEventListener('DOMContentLoaded', ()=>{
  const page = document.body.dataset.page;
  if (page === 'projector') initProjector();
  if (page === 'control') initControl();
});

/* -------------------- PROJECTOR (index.html) -------------------- */
function initProjector(){
  if (window.Reveal){
    Reveal.initialize({ controls:true, progress:true, center:true, hash:true });
  }

  function renderMath(){
    if (window.renderMathInElement){
      renderMathInElement(document.querySelector('.slides'), {
        delimiters:[{left:'$$', right:'$$', display:true},{left:'\\(', right:'\\)', display:false}]
      });
    }
  }
  renderMath();
  setTimeout(renderMath, 600);

  const laser = document.getElementById('laser');
  let pos = { x: window.innerWidth/2, y: window.innerHeight/2 };

  // Usar GSAP para suavizar el movimiento
  function setLaserAnimated(x,y){
    pos.x = x; pos.y = y;
    if (window.gsap && typeof gsap.to === 'function'){
      gsap.to(laser, { duration: 0.1, left: x + 'px', top: y + 'px', ease: 'power2.out' });
    } else {
      laser.style.left = x + 'px';
      laser.style.top = y + 'px';
    }
  }
  // posición inicial
  if (window.gsap && typeof gsap.set === 'function') gsap.set(laser, { left: pos.x + 'px', top: pos.y + 'px' });
  else setLaserAnimated(pos.x, pos.y);

  const room = getRoomFromUrl();

  const handlers = {
    moveLaser: (msg)=>{
      const payload = msg?.payload ?? msg;
      const dx = Number(payload?.dx) || 0;
      const dy = Number(payload?.dy) || 0;
      const newX = Math.min(Math.max(0, pos.x + dx), window.innerWidth);
      const newY = Math.min(Math.max(0, pos.y + dy), window.innerHeight);
      setLaserAnimated(newX, newY);
    },
    nav: (msg)=>{
      const payload = msg?.payload ?? msg;
      const dir = payload?.direction;
      if (dir === 'next') Reveal.next();
      else if (dir === 'prev') Reveal.prev();
    }
  };

  connectChannel(room, handlers);
}

/* -------------------- CONTROL (control.html) -------------------- */
function initControl(){
  const trackpad = document.getElementById('trackpad');
  const btnNext = document.getElementById('next');
  const btnPrev = document.getElementById('prev');

  const room = getRoomFromUrl();

  // handlers de control (no necesitamos procesar entradas recibidas aquí, pero mantenemos stubs)
  const handlers = { moveLaser: ()=>{}, nav: ()=>{} };
  connectChannel(room, handlers);

  // Envío con reconexión en caso de fallo
  function safeSend(event, payload){
    if (!currentChannel){
      attemptReconnect(room, handlers);
      return Promise.reject(new Error('No channel'));
    }
    return currentChannel.send({ type: 'broadcast', event, payload }).catch(err=>{
      console.warn('Supabase send error, reconnecting', err);
      attemptReconnect(room, handlers);
      throw err;
    });
  }

  // Throttled move: acumulador + flush cada ~16ms (60fps)
  let pending = { dx: 0, dy: 0 };
  let moveTimer = null;
  function scheduleFlush(){
    if (moveTimer) return;
    moveTimer = setTimeout(flushMove, 16);
  }
  function flushMove(){
    moveTimer = null;
    const payload = { dx: pending.dx, dy: pending.dy };
    // reset antes de enviar para acumular nuevos eventos mientras se envía
    pending.dx = 0; pending.dy = 0;
    // enviar solo si hay movimiento
    if (Math.abs(payload.dx) > 0.001 || Math.abs(payload.dy) > 0.001){
      safeSend('move-laser', payload).catch(()=>{});
    }
  }

  // Throttled nav (100ms)
  let lastNav = 0;
  function sendNavThrottled(direction){
    const now = Date.now();
    if (now - lastNav < 100) return;
    lastNav = now;
    safeSend('nav', { direction }).catch(()=>{});
  }

  // Variables de seguimiento
  let lastX = null, lastY = null;
  let twoFingerStartY = null;
  let twoFingerSent = false;
  let trackActive = false;
  const NAV_THRESHOLD = 30;

  // Evitar scroll de la página cuando el trackpad está activo
  window.addEventListener('touchmove', (e)=>{ if (trackActive) safePreventDefault(e); }, { passive:false });

  trackpad.addEventListener('touchstart', (e)=>{
    safePreventDefault(e);
    trackActive = true;
    if (e.touches.length === 1){
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2){
      twoFingerStartY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      twoFingerSent = false;
    }
  }, { passive:false });

  trackpad.addEventListener('touchmove', (e)=>{
    safePreventDefault(e);
    if (e.touches.length === 1){
      const t = e.touches[0];
      const dx = t.clientX - lastX;
      const dy = t.clientY - lastY;
      lastX = t.clientX; lastY = t.clientY;
      // acumular deltas y programar envío throttled
      pending.dx += dx; pending.dy += dy;
      scheduleFlush();
    } else if (e.touches.length === 2){
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const deltaY = centerY - twoFingerStartY;
      if (!twoFingerSent && Math.abs(deltaY) > NAV_THRESHOLD){
        if (deltaY < 0) sendNavThrottled('next'); else sendNavThrottled('prev');
        twoFingerSent = true;
      }
    }
  }, { passive:false });

  trackpad.addEventListener('touchend', (e)=>{
    if (e.touches.length === 0){
      lastX = null; lastY = null; twoFingerStartY = null; twoFingerSent = false; trackActive = false;
      // asegurar flush final
      if (moveTimer) { clearTimeout(moveTimer); moveTimer = null; flushMove(); }
    }
  });

  // Botones con throttling nav
  btnNext.addEventListener('click', ()=> sendNavThrottled('next'));
  btnPrev.addEventListener('click', ()=> sendNavThrottled('prev'));
}
