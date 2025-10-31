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





