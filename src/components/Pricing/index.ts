import { animations } from "../../lib/animation";

function init() {
	const { gsap, ScrollTrigger } = animations();

	const pricingCards = document.querySelectorAll(".pricing-plan");
	
	// Subtle 3D scrub effects with random angles
	pricingCards.forEach((card, index) => {
		// Random angles for each card
		const randomRotationY = (Math.random() - 0.5) * 30; // -15 to 15
		const randomRotationX = (Math.random() - 0.5) * 20; // -10 to 10
		const randomY = -15 - (Math.random() * 20); // -15 to -35
		const randomZ = Math.random() * 30; // 0 to 30
		
		gsap.to(card, {
			rotationY: randomRotationY,
			rotationX: randomRotationX,
			y: randomY,
			z: randomZ,
			ease: "none",
			scrollTrigger: {
				trigger: card,
				start: "top 90%",
				end: "top 30%",
				scrub: 1,
			}
		});
	});
}

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("astro:after-swap", init);