
// Carousel class — instance-based, safe for concurrent calls
class Carousel {
  constructor(viewportID, trackID, visibleSlots = 3, {
    step = 1,
    pauseBetween = 1500,
    transitionTime = 2500,
    gapVar = '--gap'
  } = {}) {
    this.viewport = document.getElementById(viewportID);
    this.track = document.getElementById(trackID);
    if (!this.viewport || !this.track) {
      throw new Error(`Invalid viewport or track id: ${viewportID}, ${trackID}`);
    }

    // settings
    this.visibleSlots = visibleSlots;
    this.step = step;
    this.pauseBetween = pauseBetween;
    this.transitionTime = transitionTime;
    this.gapVar = gapVar;

    // instance state
    this.autoplayTimer = null;
    this.resizeDebounce = null;
    this.isDestroyed = false;
    this.currentIndex = 0;
    this.isTransitioning = false;

    // bound handlers so we can remove them later
    this._onMouseEnter = this.stopAutoplay.bind(this);
    this._onMouseLeave = this.startAutoplay.bind(this);
    this._onResize = this._onResize.bind(this);
  }

  // if you need any async setup (e.g., loading images), you can await this
  async init() {
    this._setup();
  }

  _setup() {
    // take original items (only .item nodes, not clones)
    const originalItemsAll = Array.from(this.track.children).filter(n => n.classList && n.classList.contains('item'));
    const n = originalItemsAll.length;

    // remove placeholders only inside this viewport (safer)
    const existingPlaceholder = this.viewport.querySelector('.placeholder');
    if (existingPlaceholder) existingPlaceholder.remove();

    // case 0: no items
    if (n === 0) {
      this.track.innerHTML = '';
      const ph = document.createElement('div');
      ph.className = 'placeholder';
      ph.innerHTML = '<strong>No photo is there</strong>';
      this.viewport.innerHTML = '';
      this.viewport.appendChild(ph);
      // make sure autoplay disabled
      this.stopAutoplay();
      return;
    }

    // clear track and rebuild the nodes for this instance
    // NOTE: We clone nodes when necessary but avoid reusing nodes that might
    // belong to other carousels.
    const originals = originalItemsAll.map(node => node.cloneNode(true));
    this.track.innerHTML = '';

    // small-item case: show fixed slots
    if (n < this.visibleSlots) {
      originals.forEach(it => this.track.appendChild(it));

      const toAdd = this.visibleSlots - n;
      for (let i = 0; i < toAdd; i++) {
        const empty = document.createElement('div');
        empty.className = 'item empty';
        empty.style.background = 'linear-gradient(180deg,#f8f9fb,#f2f4f7)';
        this.track.appendChild(empty);
      }

      const setSizesNoSlide = () => {
        const viewportWidth = this.viewport.clientWidth;
        const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(this.gapVar)) || 12;
        const totalGap = gap * (this.visibleSlots - 1);
        const itemWidth = (viewportWidth - totalGap) / this.visibleSlots;
        Array.from(this.track.children).forEach(child => {
          child.style.width = itemWidth + 'px';
        });
        this.track.style.transition = 'none';
        this.track.style.transform = 'translateX(0)';
      };

      setSizesNoSlide();
      // add resize listener (instance-specific)
      window.addEventListener('resize', () => {
        clearTimeout(this.resizeDebounce);
        this.resizeDebounce = setTimeout(setSizesNoSlide, 120);
      }, { passive: true });

      this.stopAutoplay();
      return;
    }

    // n >= visibleSlots -> cloning for infinite scroll
    const clonesAtStart = this.visibleSlots;
    const clonesAtEnd = this.visibleSlots;

    const nodes = [];
    const lastSlice = originals.slice(-clonesAtStart);
    lastSlice.forEach(node => {
      const c = node.cloneNode(true);
      c.classList.add('clone');
      nodes.push(c);
    });
    originals.forEach(node => nodes.push(node));
    const firstSlice = originals.slice(0, clonesAtEnd);
    firstSlice.forEach(node => {
      const c = node.cloneNode(true);
      c.classList.add('clone');
      nodes.push(c);
    });

    nodes.forEach(nod => this.track.appendChild(nod));

    // set sizes and placement
    this.slidesToShow = this.visibleSlots;
    const setSizes = () => {
      const viewportWidth = this.viewport.clientWidth;
      const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(this.gapVar)) || 12;
      const totalGap = gap * (this.slidesToShow - 1);
      const itemWidth = (viewportWidth - totalGap) / this.slidesToShow;
      Array.from(this.track.children).forEach(child => {
        child.style.width = itemWidth + 'px';
      });

      // initial placement
      this.track.style.transition = 'none';
      this.currentIndex = clonesAtStart;
      this._updateTransform();
      requestAnimationFrame(() => {
        void this.track.offsetWidth;
        this.track.style.transition = `transform ${this.transitionTime}ms ease`;
      });
    };

    setSizes();

    // transition end safety using a timeout matching transitionTime
    this._next = () => {
      if (this.isTransitioning) return;
      this.isTransitioning = true;
      this.currentIndex += this.step;
      this._updateTransform();

      setTimeout(() => {
        this.isTransitioning = false;
        const total = this.track.children.length;
        const clonesStart = clonesAtStart;
        const clonesEndBoundary = total - clonesAtEnd;
        if (this.currentIndex >= clonesEndBoundary) {
          // teleport (no transition)
          this.currentIndex = clonesStart + (this.currentIndex - clonesEndBoundary);
          this.track.style.transition = 'none';
          this._updateTransform();
          requestAnimationFrame(() => {
            void this.track.offsetWidth;
            this.track.style.transition = `transform ${this.transitionTime}ms ease`;
          });
        }
      }, this.transitionTime);
    };

    // start autoplay
    this.startAutoplay();

    // mouse handlers per-instance
    this.viewport.addEventListener('mouseenter', this._onMouseEnter);
    this.viewport.addEventListener('mouseleave', this._onMouseLeave);

    // instance-specific resize listener
    window.addEventListener('resize', this._onResize, { passive: true });
  }

  _updateTransform() {
    const firstChild = this.track.children[0];
    if (!firstChild) return;
    const itemWidth = firstChild.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(this.gapVar)) || 12;
    const move = (itemWidth + gap) * this.currentIndex * -1;
    this.track.style.transform = `translateX(${move}px)`;
  }

  startAutoplay() {
    this.stopAutoplay();
    this.autoplayTimer = setInterval(() => {
      this._next();
    }, this.pauseBetween + this.transitionTime);
  }

  stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  _onResize() {
    clearTimeout(this.resizeDebounce);
    this.resizeDebounce = setTimeout(() => {
      // rebuild (safe) — only if still present
      if (this.isDestroyed) return;
      // Re-run setup to recalculate clones & sizes
      this._setup();
    }, 120);
  }

  // call this to teardown listeners & timers
  destroy() {
    this.stopAutoplay();
    this.viewport.removeEventListener('mouseenter', this._onMouseEnter);
    this.viewport.removeEventListener('mouseleave', this._onMouseLeave);
    window.removeEventListener('resize', this._onResize);
    this.isDestroyed = true;
  }
}


const c1 = new Carousel('viewport1', 'track1', 2, { pauseBetween: 1500, transitionTime: 2000 });
c1.init(); // async-safe init

const c2 = new Carousel('viewport', 'track', 3, { pauseBetween: 1700, transitionTime: 2000 });
c2.init();

const c3 = new Carousel('viewport2', 'track2', 2, { pauseBetween: 1500, transitionTime: 2000 });
c3.init();

const c4 = new Carousel('viewport3', 'track3', 1, { pauseBetween: 1500, transitionTime: 2000 });
c4.init();

const c5 = new Carousel('viewport4', 'track4', 1, { pauseBetween: 1500, transitionTime: 2000 });
c5.init();

const c6 = new Carousel('viewport6', 'track6', 1, { pauseBetween: 1500, transitionTime: 2000 });
c6.init();