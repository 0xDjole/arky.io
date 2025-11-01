import { animations } from "../../lib/animation";

function init() {
	const { gsap, ScrollTrigger, SplitText } = animations();

	const faqSplitText = document.querySelector(".faq-split-text");
	
	if (faqSplitText) {
		const split = new SplitText(faqSplitText, { type: "words" });
		
		gsap.from(split.words, {
			y: 50,
			opacity: 0,
			duration: 0.8,
			stagger: 0.08,
			ease: "power2.out",
			scrollTrigger: {
				trigger: faqSplitText,
				start: "top 85%",
				end: "bottom 15%",
				toggleActions: "play none none reverse"
			}
		});
	}
}

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("astro:after-swap", init);