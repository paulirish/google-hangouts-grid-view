'use strict';

console.log('gridview content');
const setTimeoutPromise = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.clicked) run();
});

run();

async function run() {
  // running this multiple times just toggles between ON and OFF
  const isAlreadyOn = document.querySelector('.__gv_css');
  if (isAlreadyOn) return disableGrid();

  function disableGrid() {
    console.log('Disabling grid');
    // globalThis.__gv_mo && globalThis.__gv_mo.disconnect();
    for (const elem of document.querySelectorAll('.__gv_css')) elem.remove();
  }


  // Wait for call to join
  let participantCount = 0;
  let wait = true;
  while (wait) {
    participantCount = document.querySelectorAll('[data-participant-id][aria-label]').length;
    if (participantCount > 0) {
      wait = false;
    }
    console.log('waiting to join call');
    await setTimeoutPromise(500);
  }

  console.log('call joined, lets go');
  console.log('Enabling grid');

  const container = document.querySelector('[data-participant-id][aria-label]').parentElement;
  container.classList.add('thumb-container');
  container.parentElement.classList.add('bottom-row-container');
  container.previousElementSibling.classList.add('bottom-controls');


  // Get one grid update going first..
  let pinnedIndex = -1;
  gridUpdateLoop();


  // update the grid whenever thumbnails are added/removed
  globalThis.__gv_mo = new MutationObserver(gridUpdateLoop);
  globalThis.__gv_mo.observe(container, { childList: true });

  // This continually probes the number of participants & screen size to ensure videos are max possible size regardless of window layout
  // thanks https://github.com/Fugiman/google-meet-grid-view
  function gridUpdateLoop() {
    // the [aria-label] attribute is set lazily, so we can't look for it at this point
    const items = Array.from(container.children).filter(e => e.matches('[data-participant-id]'));
    for (const elem of items) elem.classList.add('thumb-item');
    participantCount = items.length;
    if (participantCount === 1) return disableGrid();
    if (participantCount > 1) ensureStylesApplied();

    const w = window.innerWidth / 16;
    const h = (window.innerHeight - 48) / 9;
    let n = participantCount;
    if (pinnedIndex >= 0 && pinnedIndex < n) {
      // Simulate having an extra quarter of videos so we can dedicate a quarter to the pinned video
      n = Math.ceil((4 / 3) * (n - 1));
    }
    let size = 0;
    let col;
    for (col = 1; col < 9; col++) {
      let s = Math.min(w / col, h / Math.ceil(n / col));
      if (s < size) {
        col--;
        break;
      }
      size = s;
    }

    container.style.gridTemplateColumns = `repeat(${col}, 1fr)`;

    // makes one bigger i think..
    for (let v of container.children) {
      if (+v.dataset.allocationIndex === pinnedIndex) {
        const span = Math.ceil(col / 2);
        v.style.order = -1;
        v.style.gridArea = `span ${span} / span ${span}`;
      } else {
        v.style.order = v.dataset.allocationIndex;
        v.style.gridArea = '';
      }
    }
  }
}

function ensureStylesApplied() {
  if (document.querySelector('.__gv_css')) return;

  const styles = `
.thumb-item {
/* [jscontroller="XUjPoc"] { */
    display: block;
    width: 100% !important;
    height: 100% !important;
    transform: none !important;
}

.thumb-item video {
    width: 100%;
    height: 100%;
}

.thumb-container {
/* [jscontroller="hw217b"] { */
    display: grid;
    direction: ltr;
    position: static;
    /* flex-wrap: wrap; */
    grid-auto-rows: 1fr;
    grid-template-columns: repeat(1, 1fr);
    position: absolute;
    top: -1px !important;
    right: 5px !important;
    left: 5px !important;
    bottom: 0 !important;
    height: 100vh;
}

/* could use a better selector */
.thumb-item > div[jsname][style] {
    width: 100% !important;
    height: 100% !important;
    opacity: 1;
}

/* .p2hjYe.zDyG0c */
.thumb-item [data-ssrc] {
    width: 100% !important;
    height: 100% !important;
    /* avoid shifting thumbnails when one is selected. */
    position: static !important;
}




/* .G1OBde { */
.bottom-row-container {
    position: static;
}

/* .L0HJ1e.cnqxLd-hJDwNd { */
.bottom-controls {
    bottom: 0;
    height: auto;
    left: 0;
    position: absolute;
    text-align: center;
    right: 0;
    z-index: 1;
}

/* TODO FIX THIS SELECTORRRR */
.GhN39b {
  z-index: 11;
}

/* Hide current speaker from the background */
.qMwJZe {
  visibility: hidden;
}
    `;

  const elem = document.createElement('style');
  elem.append(document.createTextNode(styles));
  elem.classList.add('__gv_css');
  document.head.append(elem);
}
