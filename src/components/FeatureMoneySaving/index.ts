import lottie from 'lottie-web';
import moneyAnimationData from '@assets/videos/money.json';
import { animations } from '../../lib/animation';

function initMoneySaving() {
  const { gsap, ScrollTrigger } = animations();

  const moneyLottie = document.getElementById('money-lottie');
  if (!moneyLottie) return;

  // Load money animation
  const moneyAnimation = lottie.loadAnimation({
    container: moneyLottie,
    renderer: 'svg',
    loop: false,
    autoplay: false,
    animationData: moneyAnimationData,
  });

  // Animate on scroll
  ScrollTrigger.create({
    trigger: '#money-saving',
    start: 'top center',
    end: 'bottom center',
    scrub: true,
    onUpdate: (self) => {
      const frame = self.progress * (moneyAnimation.totalFrames - 1);
      moneyAnimation.goToAndStop(frame, true);
    },
  });

  // Content animations
  gsap.fromTo(
    '.money-content .feature-title',
    { opacity: 0, y: 50 },
    {
      opacity: 1,
      y: 0,
      duration: 1,
      scrollTrigger: {
        trigger: '.money-content',
        start: 'top 80%',
      },
    }
  );

  gsap.fromTo(
    '.money-content .feature-content',
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      y: 0,
      duration: 1,
      delay: 0.2,
      scrollTrigger: {
        trigger: '.money-content',
        start: 'top 80%',
      },
    }
  );

  gsap.fromTo(
    '.feature-buttons',
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: 1,
      delay: 0.4,
      scrollTrigger: {
        trigger: '.money-content',
        start: 'top 80%',
      },
    }
  );
}

document.addEventListener('DOMContentLoaded', initMoneySaving);
document.addEventListener('astro:after-swap', initMoneySaving);