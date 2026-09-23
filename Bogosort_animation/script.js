// === PUT YOUR PICTURE FILENAMES HERE ===
// Make sure the images are in the exact same folder as index.html
const TEAM = [
  { id: 'p1', name: 'Sophia', height: 162, color: '#E63329', img: 'sophia.png' },
  { id: 'p2', name: 'Sin', height: 173, color: '#555', img: 'sin.png' },
  { id: 'p3', name: 'Sak', height: 175, color: '#1A1A1A', img: 'sak.png' },
  { id: 'p4', name: 'Pikun', height: 175, color: '#1A1A1A', img: 'pikun.png' },
  { id: 'p5', name: 'Rozanel', height: 200, color: '#555', img: 'rozanel.png' }
];
// ========================================

let arr = [];
let domElements = {};
let attempts = 0, comparisons = 0, swaps = 0;
let cpuTime = 0; 
let stepStart = 0; 
let running = false, paused = false;
let animTimeout = null;
let speeds = [800, 400, 150, 50];
let speedNames = ['SLOW', 'NORMAL', 'FAST', 'TURBO'];
let speedIdx = 1;

const minH = Math.min(...TEAM.map(p=>p.height));
const maxH = Math.max(...TEAM.map(p=>p.height));

function personHeight(h) {
  const ratio = (h - minH) / (maxH - minH);
  return 120 + ratio * 150; 
}

function initDOM() {
  const stage = document.getElementById('stage');
  const floor = stage.querySelector('.floor');
  const banner = document.getElementById('sorted-banner');
  
  stage.innerHTML = '';
  stage.appendChild(floor);
  stage.appendChild(banner);

  TEAM.forEach((p) => {
    const ph = personHeight(p.height);
    const div = document.createElement('div');
    div.className = 'person';
    div.id = p.id;

    const imgBox = document.createElement('div');
    imgBox.className = 'img-placeholder';
    imgBox.style.height = ph + 'px';
    imgBox.style.border = `2px dashed ${p.color}`;
    imgBox.innerHTML = `<img src="${p.img}" alt="${p.name}" onerror="this.style.display='none'; this.parentNode.innerHTML='[Add ${p.name} Image]'">`;
    div.appendChild(imgBox);

    const nt = document.createElement('div');
    nt.className = 'nametag';
    nt.style.background = p.color;
    nt.textContent = p.name;
    div.appendChild(nt);

    const hl = document.createElement('div');
    hl.className = 'height-label';
    hl.textContent = p.height + 'cm';
    div.appendChild(hl);

    stage.appendChild(div);
    domElements[p.id] = div;
  });
}

function updatePositions(array, glow = false) {
  array.forEach((p, index) => {
    const el = domElements[p.id];
    el.style.left = (20 * index + 10) + '%';
    
    if (glow) {
      el.classList.add('sorted-glow');
    } else {
      el.classList.remove('sorted-glow');
    }
  });
}

function getDelay() { return speeds[speedIdx]; }

function cycleSpeed() {
  speedIdx = (speedIdx + 1) % speeds.length;
  document.getElementById('speed-label').textContent = speedNames[speedIdx];
  
  const transitionTime = speeds[speedIdx] / 1000;
  Object.values(domElements).forEach(el => {
    el.style.transition = `left ${transitionTime * 0.8}s ease-in-out, transform 0.2s, filter 0.3s`;
  });
}

function clearLog() {
  document.getElementById('log').innerHTML = '';
}

function log(msg, cls='') {
  const el = document.getElementById('log');
  const d = document.createElement('div');
  d.className = cls;
  d.textContent = msg;
  el.appendChild(d);
  el.scrollTop = el.scrollHeight;
}

function updateStats() {
  document.getElementById('s-attempts').textContent = attempts;
  document.getElementById('s-comparisons').textContent = comparisons;
  document.getElementById('s-swaps').textContent = swaps;
  
  let currentTotal = cpuTime;
  if (running && !paused && stepStart > 0) {
      currentTotal += (performance.now() - stepStart);
  }
  
  document.getElementById('s-time').textContent = currentTotal.toFixed(2) + 'ms';
}

function isSorted(a) {
  for (let i = 0; i < a.length-1; i++) {
    comparisons++;
    if (a[i].height > a[i+1].height) return false;
  }
  return true;
}

function shuffle(a) {
  for (let i = a.length-1; i >= 1; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
    swaps++;
  }
}

function resetSort() {
  running = false; paused = false;
  clearTimeout(animTimeout);
  
  arr = [...TEAM];
  for (let i = arr.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  
  attempts = 0; comparisons = 0; swaps = 0; 
  cpuTime = 0; stepStart = 0;
  
  updateStats();
  updatePositions(arr);
  
  document.getElementById('sorted-banner').className = 'sorted-banner';
  document.getElementById('status-text').textContent = 'Press START to begin BogoSort';
  document.getElementById('status-phase').textContent = '';
  document.getElementById('btn-start').disabled = false;
  document.getElementById('btn-pause').disabled = true;
  document.getElementById('btn-pause').textContent = 'PAUSE';
  
  clearLog();
  log('// Array reset ready for chaos');
  log('// Initial order: ' + arr.map(p=>p.name).join(', '));
}

function sleep(ms) {
  return new Promise(r => { animTimeout = setTimeout(r, ms); });
}

async function startSort() {
  if (running) return;
  running = true; paused = false;
  document.getElementById('btn-start').disabled = true;
  document.getElementById('btn-pause').disabled = false;

  log('// bogoSort() started!', 'log-attempt');

  while (true) {
    stepStart = performance.now(); 
    
    if (!running) break;
    
    if (paused) {
      cpuTime += (performance.now() - stepStart);
      while (paused) {
        await sleep(100);
        if (!running) break;
      }
      stepStart = performance.now(); 
    }
    
    if (!running) break;

    if (isSorted(arr)) {
      cpuTime += (performance.now() - stepStart);
      break;
    }

    attempts++;
    document.getElementById('status-text').textContent = `Attempt #${attempts} shuffling...`;
    document.getElementById('status-phase').textContent = 'SHUFFLING';

    shuffle(arr);
    updatePositions(arr);

    log(`// Attempt ${attempts}: [${arr.map(p=>p.height).join(', ')}]`, 'log-attempt');

    cpuTime += (performance.now() - stepStart); 
    stepStart = 0;
    updateStats();
    
    await sleep(getDelay());
  }

  if (!isSorted(arr)) {
    log('// Stopped by user', 'log-check');
    return;
  }

  updatePositions(arr, true);
  document.getElementById('sorted-banner').className = 'sorted-banner show';
  document.getElementById('status-text').textContent = `SORTED after ${attempts} attempts!`;
  document.getElementById('status-phase').textContent = 'DONE';
  document.getElementById('btn-pause').disabled = true;
  updateStats();

  log(`// SORTED! After ${attempts} attempts, ${comparisons} comparisons, ${swaps} swaps`, 'log-sorted');
  log(`// Final order: ${arr.map(p=>`${p.name}(${p.height}cm)`).join(' < ')}`, 'log-sorted');
  running = false;
}

function togglePause() {
  paused = !paused;
  document.getElementById('btn-pause').textContent = paused ? 'RESUME' : 'PAUSE';
  document.getElementById('status-text').textContent = paused ? 'Paused press RESUME to continue' : 'Resuming...';
}

document.getElementById('btn-start').addEventListener('click', startSort);
document.getElementById('btn-pause').addEventListener('click', togglePause);
document.getElementById('btn-reset').addEventListener('click', resetSort);
document.getElementById('btn-speed').addEventListener('click', cycleSpeed);

initDOM();
cycleSpeed(); 
cycleSpeed();
cycleSpeed();
resetSort();
