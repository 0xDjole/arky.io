import lottie from 'lottie-web';
import gearAnimationData from '@assets/videos/gear.json';
import { animations } from '@lib/animation';

// Store gear animation instance globally
let gearAnimation = null;
// Store ScrollTrigger instances for this component
let workflowScrollTriggers = [];

function init() {
  const { gsap, ScrollTrigger } = animations();
  
  const section = document.querySelector('.workflow-section');
  const gearContainer = document.getElementById('gear-lottie');
  
  if (!gearContainer || !section) return;

  // Clean up existing ScrollTriggers for this component
  workflowScrollTriggers.forEach(st => st.kill());
  workflowScrollTriggers = [];

  // Clean up existing gear animation if it exists
  if (gearAnimation) {
    gearAnimation.destroy();
  }
  
  // Clear the container to prevent duplicates
  gearContainer.innerHTML = '';
  
  // Load gear animation
  gearAnimation = lottie.loadAnimation({
    container: gearContainer,
    renderer: 'svg',
    loop: false,
    autoplay: false,
    animationData: gearAnimationData,
  });

  // Check if mobile using matchMedia (most reliable)
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  
  if (!isMobile) {
    // Desktop: Pin and animate
    const colLeft = document.querySelector('.left-column');
    const timeline = gsap.timeline({ paused: true });

    timeline.fromTo(
      colLeft,
      { y: 0 },
      { y: section?.scrollHeight - colLeft?.offsetHeight, duration: 1, ease: "none" }
    );

    const desktopST = ScrollTrigger.create({
      animation: timeline,
      trigger: section,
      start: "top center",
      end: "bottom center",
      scrub: true,
      onUpdate: (self) => {
        const frame = self.progress * (gearAnimation.totalFrames - 1);
        gearAnimation.goToAndStop(frame, true);
      },
    });
    workflowScrollTriggers.push(desktopST);
  } else {
    // Mobile: Just animate the gear without pinning
    const mobileST = ScrollTrigger.create({
      trigger: section,
      start: "top 80%",
      end: "bottom 20%",
      scrub: true,
      onUpdate: (self) => {
        const frame = self.progress * (gearAnimation.totalFrames - 1);
        gearAnimation.goToAndStop(frame, true);
      },
    });
    workflowScrollTriggers.push(mobileST);
  }

  // Highlight each line individually - snap effect
  const workflowItems = document.querySelectorAll('.workflow-item');
  
  workflowItems.forEach((item) => {
    const title = item.querySelector('.step-title');
    const description = item.querySelector('.step-description');
    const features = item.querySelectorAll('.step-features li');
    
    // Create array of all elements to highlight
    const allElements = [];
    if (title) allElements.push(title);
    if (description) allElements.push(description);
    features.forEach(feature => allElements.push(feature));
    
    // Create individual triggers for each line
    allElements.forEach((element, index) => {
      const lineST = ScrollTrigger.create({
        trigger: element,
        start: 'center 60%',
        end: 'center 40%',
        onEnter: () => {
          // Reset all elements in this item
          allElements.forEach(el => el.style.color = '');
          // Highlight only current line
          element.style.color = '#8B5CF6';
        },
        onEnterBack: () => {
          // Reset all elements in this item
          allElements.forEach(el => el.style.color = '');
          // Highlight only current line
          element.style.color = '#8B5CF6';
        }
      });
      workflowScrollTriggers.push(lineST);
    });
    
    // Reset all when leaving the entire item
    const itemST = ScrollTrigger.create({
      trigger: item,
      start: 'top 80%',
      end: 'bottom 20%',
      onLeave: () => allElements.forEach(el => el.style.color = ''),
      onLeaveBack: () => allElements.forEach(el => el.style.color = '')
    });
    workflowScrollTriggers.push(itemST);
  });
}

document.addEventListener('DOMContentLoaded', init);
document.addEventListener('astro:after-swap', init);

// Reinitialize on window resize (for responsive testing)
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    // Only kill ScrollTriggers from this component and reinitialize
    init();
  }, 250);
});