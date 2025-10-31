<<<<<<< HEAD
(function(){
  const viewport = document.getElementById('viewport');
  const track = document.getElementById('track');

  // settings
  const visibleSlots = 3;        // always reserve 3 slots in viewport width
  const step = 1;                // move one by one
  const pauseBetween = 1000;     // ms to pause between slides
  const transitionTime = 500;    // must match CSS var(--transition)
  let autoplayTimer = null;

  function setup() {
    // grab original .item nodes that user placed (ignore any clones or other nodes)
    const originalItemsAll = Array.from(track.children).filter(n => n.classList && n.classList.contains('item'));
    const n = originalItemsAll.length;

    // remove any placeholder nodes inside viewport (from earlier runs)
    const existingPlaceholder = document.querySelector('.placeholder');
    if (existingPlaceholder) existingPlaceholder.remove();

    // case 0: no items -> show placeholder and exit
    if (n === 0) {
      track.innerHTML = '';
      const ph = document.createElement('div');
      ph.className = 'placeholder';
      ph.innerHTML = '<strong>No photo is there</strong>';
      viewport.innerHTML = '';
      viewport.appendChild(ph);
      return;
    }

    // clear track and rebuild depending on number of items
    track.innerHTML = '';

    // If less than 3 items: we DO NOT want sliding; we want fixed slots with empty fillers
    if (n < visibleSlots) {
      // append original items in their original order
      originalItemsAll.forEach(it => track.appendChild(it));

      // create filler empty slots to reach visibleSlots count
      const toAdd = visibleSlots - n;
      for (let i=0;i<toAdd;i++){
        const empty = document.createElement('div');
        empty.className = 'item empty';
        // keep it visually subtle (lighter background)
        empty.style.background = 'linear-gradient(180deg,#f8f9fb,#f2f4f7)';
        empty.innerHTML = ''; // empty content – will appear as blank slot
        track.appendChild(empty);
      }

      // compute widths so all three slots shown and items don't stretch
      function setSizesNoSlide(){
        const viewportWidth = viewport.clientWidth;
        const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap')) || 12;
        const totalGap = gap * (visibleSlots - 1);
        const itemWidth = (viewportWidth - totalGap) / visibleSlots;
        Array.from(track.children).forEach(child => {
          child.style.width = itemWidth + 'px';
        });
        // ensure track is positioned at start (no transform)
        track.style.transition = 'none';
        track.style.transform = 'translateX(0)';
      }

      setSizesNoSlide();
      // resize handler
      let debounce;
      window.addEventListener('resize', ()=> {
        clearTimeout(debounce);
        debounce = setTimeout(setSizesNoSlide, 120);
      });

      // ensure autoplay is disabled for <3 items
      stopAutoplay();
      return;
    }

    // For n >= visibleSlots: previous behavior with clones, autoplay and looping
    const clonesAtStart = visibleSlots;
    const clonesAtEnd = visibleSlots;

    // nodes: last-clones, originals, first-clones
    const nodes = [];
    const lastSlice = originalItemsAll.slice(-clonesAtStart);
    lastSlice.forEach(node => {
      const c = node.cloneNode(true);
      c.classList.add('clone');
      nodes.push(c);
    });
    originalItemsAll.forEach(node => nodes.push(node));
    const firstSlice = originalItemsAll.slice(0, clonesAtEnd);
    firstSlice.forEach(node => {
      const c = node.cloneNode(true);
      c.classList.add('clone');
      nodes.push(c);
    });

    nodes.forEach(nod => track.appendChild(nod));

    // set sizes and layout
    let slidesToShow = visibleSlots;
    function setSizes(){
      const viewportWidth = viewport.clientWidth;
      const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap')) || 12;
      const totalGap = gap * (slidesToShow - 1);
      const itemWidth = (viewportWidth - totalGap) / slidesToShow;
      Array.from(track.children).forEach(child => {
        child.style.width = itemWidth + 'px';
      });

      // initial placement to show first original at index = clonesAtStart
      track.style.transition = 'none';
      currentIndex = clonesAtStart;
      updateTransform();
      requestAnimationFrame(()=> {
        void track.offsetWidth;
        track.style.transition = `transform ${transitionTime}ms ease`;
      });
    }

    let currentIndex = clonesAtStart;
    function updateTransform() {
      const firstChild = track.children[0];
      if (!firstChild) return;
      const itemWidth = firstChild.getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap')) || 12;
      const move = (itemWidth + gap) * currentIndex * -1;
      track.style.transform = `translateX(${move}px)`;
    }

    let isTransitioning = false;
    function next() {
      if (isTransitioning) return;
      isTransitioning = true;
      currentIndex += step;
      updateTransform();
      setTimeout(()=> {
        isTransitioning = false;
        const total = track.children.length;
        const clonesStart = clonesAtStart;
        const clonesEndBoundary = total - clonesAtEnd;
        if (currentIndex >= clonesEndBoundary) {
          // teleport
          currentIndex = clonesStart + (currentIndex - clonesEndBoundary);
          track.style.transition = 'none';
          updateTransform();
          requestAnimationFrame(()=>{
            void track.offsetWidth;
            track.style.transition = `transform ${transitionTime}ms ease`;
          });
        }
      }, transitionTime);
    }

    function startAutoplay(){
      stopAutoplay();
      autoplayTimer = setInterval(()=> {
        next();
      }, pauseBetween + transitionTime);
    }
    function stopAutoplay(){
      if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
    }

    setSizes();
    startAutoplay();
    viewport.addEventListener('mouseenter', stopAutoplay);
    viewport.addEventListener('mouseleave', startAutoplay);

    // responsive: only recalc sizes (do not change logic) on resize
    window.addEventListener('resize', ()=> {
      clearTimeout(window._carouselResizeDebounce);
      window._carouselResizeDebounce = setTimeout(()=> {
        // Rebuild entire carousel to keep clone math safe
        setup();
      }, 120);
    }, {passive:true});
  } // end setup

  function stopAutoplay(){
    if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
  }

  // initial call
  setup();

})();
=======
// most wanted

function createSlider(trackId, visibleCards = 3, delay = 3000) {
    const track = document.getElementById(trackId);
    const cards = Array.from(track.children);
    const totalCards = cards.length;
    const cardWidthPercent = 100 / visibleCards;

    // Clone first few cards to end for smooth infinite scroll
    for (let i = 0; i < visibleCards; i++) {
        const clone = cards[i].cloneNode(true);
        track.appendChild(clone);
    }

    let index = 0;

    setInterval(() => {
        index++;
        track.style.transition = "transform 1s linear";
        track.style.transform = `translateX(-${index * cardWidthPercent}%)`;

        // Reset position after transition finishes
        if (index >= totalCards) {
            setTimeout(() => {
                track.style.transition = "none"; // remove animation
                track.style.transform = `translateX(0)`; // reset position
                index = 0;
            }, 1000); // must match transition duration
        }
    }, delay);
}

// Initialize sliders
createSlider('wantedTrack', 3, 3000);
createSlider('eventTrack', 3, 3500);





// ...........................................Last sliding..............................................


function startTripleSlider(trackId, visibleCards = 3, delay = 2500) {
  const track = document.getElementById(trackId);
  const cards = Array.from(track.children);
  const totalCards = cards.length;

  // Clone first few cards for seamless infinite scroll
  for (let i = 0; i < visibleCards; i++) {
    const clone = cards[i].cloneNode(true);
    track.appendChild(clone);
  }

  let index = 0;

  function slide() {
    index++;
    track.style.transition = "transform 0.8s ease";
    track.style.transform = `translateX(-${(100 / visibleCards) * index}%)`;

    // Reset without visual jump
    if (index === totalCards) {
      setTimeout(() => {
        track.style.transition = "none";
        track.style.transform = "translateX(0)";
        index = 0;
      }, 800); // match transition duration
    }
  }

  setInterval(slide, delay);
}

startTripleSlider("tripleEventTrack", 3, 2500);





>>>>>>> 132b8f82f56e7d1e008b21a13246773a74faba26
