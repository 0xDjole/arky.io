import { animations } from "../../lib/animation";

function init() {
	const { gsap, ScrollTrigger, SplitText } = animations();

	const track = document.querySelector(".testimonial-track");
	const heartEmoji = document.querySelector(".heart-emoji");
	const joinText = document.querySelector(".join-text");
	const testimonialSplitText = document.querySelector(".testimonial-split-text");

	// Split text animation for heading
	if (testimonialSplitText) {
		const headingSplit = new SplitText(testimonialSplitText, { type: "words" });

		gsap.from(headingSplit.words, {
			y: 60,
			opacity: 0,
			duration: 0.8,
			stagger: 0.1,
			ease: "power2.out",
			scrollTrigger: {
				trigger: testimonialSplitText,
				start: "top 85%",
				end: "bottom 15%",
				toggleActions: "play none none reverse",
			},
		});
	}

	const tl = gsap.timeline({
		scrollTrigger: {
			trigger: "#testimonial",
			start: "top top",
			end: "+=300%",
			scrub: 1,
			pin: true,
		},
	});

	tl.to(track, {
		x: () => -track.scrollWidth + track.parentElement.clientWidth / 2 + 150,
		ease: "none",
	});

	// Animate heart and split text at the end
	tl.to(
		heartEmoji,
		{
			scale: 2,
			ease: "back.out(1.7)",
		},
		"heart",
	);

	// Split text animation
	const split = new SplitText(joinText, { type: "chars" });
	tl.from(
		split.chars,
		{
			y: 30,
			scale: 1.2,
			opacity: 0,
			ease: "power2.out",
		},
		"heart",
	);
}

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("astro:after-swap", init);
