import { animations } from "../../lib/animation";

function initHeroAnimations() {
	const { gsap, ScrollTrigger } = animations();

	// Initial entrance animation timeline
	const entranceTl = gsap.timeline({ delay: 0.5 });

	// Video entrance
	entranceTl.to("#hero-video", {
		opacity: 1,
		scale: 1,
		duration: 2,
		ease: "power2.out"
	});

	// Badge entrance
	entranceTl.to(".hero-badge", {
		opacity: 1,
		y: 0,
		duration: 0.8,
		ease: "back.out(1.7)"
	}, "-=1.5");

	// Title lines entrance - cinematic 3D flip
	entranceTl.to(".title-line", {
		opacity: 1,
		y: 0,
		rotateX: 0,
		duration: 1,
		stagger: 0.2,
		ease: "power3.out",
		transformOrigin: "center bottom"
	}, "-=1");

	// Subtitle lines
	entranceTl.to(".subtitle-line", {
		opacity: 1,
		y: 0,
		duration: 0.8,
		stagger: 0.1,
		ease: "power2.out"
	}, "-=0.5");

	// CTA button
	entranceTl.to(".hero-cta", {
		opacity: 1,
		y: 0,
		duration: 0.8,
		ease: "back.out(1.7)"
	}, "-=0.3");

	// Stats cards
	entranceTl.to(".stat-card", {
		opacity: 1,
		y: 0,
		scale: 1,
		duration: 0.8,
		stagger: 0.1,
		ease: "back.out(1.7)"
	}, "-=0.4");

	// Floating elements
	entranceTl.to(".float-circle", {
		opacity: 0.6,
		duration: 1,
		stagger: 0.2,
		ease: "power2.out"
	}, "-=1");

	// Scroll indicator
	entranceTl.to(".scroll-indicator", {
		opacity: 1,
		duration: 0.8,
		ease: "power2.out"
	}, "-=0.5");

	// Continuous floating animation for circles
	gsap.to(".float-1", {
		y: -20,
		rotation: 5,
		duration: 3,
		repeat: -1,
		yoyo: true,
		ease: "sine.inOut"
	});

	gsap.to(".float-2", {
		y: -15,
		rotation: -3,
		duration: 4,
		repeat: -1,
		yoyo: true,
		ease: "sine.inOut",
		delay: 1
	});

	gsap.to(".float-3", {
		y: -10,
		rotation: 7,
		duration: 2.5,
		repeat: -1,
		yoyo: true,
		ease: "sine.inOut",
		delay: 0.5
	});

	// Scroll indicator animation
	gsap.to(".scroll-line", {
		scaleY: 0.5,
		duration: 1.5,
		repeat: -1,
		yoyo: true,
		ease: "sine.inOut",
		transformOrigin: "top"
	});

	// Parallax and scroll effects
	ScrollTrigger.create({
		trigger: "#hero",
		start: "top top",
		end: "bottom top",
		scrub: 1,
		onUpdate: (self) => {
			const progress = self.progress;
			
			// Video parallax and zoom
			gsap.to("#hero-video", {
				scale: 1.1 + (progress * 0.3),
				y: progress * 100,
				duration: 0.3,
				ease: "none"
			});

			// Content parallax
			gsap.to(".hero-content", {
				y: progress * -150,
				scale: 1 - (progress * 0.1),
				opacity: 1 - (progress * 0.8),
				duration: 0.3,
				ease: "none"
			});

			// Floating elements parallax
			gsap.to(".float-1", {
				y: progress * -200,
				x: progress * 50,
				rotation: progress * 20,
				duration: 0.3,
				ease: "none"
			});

			gsap.to(".float-2", {
				y: progress * -150,
				x: progress * -30,
				rotation: progress * -15,
				duration: 0.3,
				ease: "none"
			});

			gsap.to(".float-3", {
				y: progress * -100,
				x: progress * 40,
				rotation: progress * 25,
				duration: 0.3,
				ease: "none"
			});

			// Scroll indicator fade
			gsap.to(".scroll-indicator", {
				opacity: 1 - (progress * 2),
				y: progress * 50,
				duration: 0.3,
				ease: "none"
			});

			// Video overlay intensity
			gsap.to(".video-overlay", {
				background: `linear-gradient(135deg, rgba(0,0,0,${0.6 + progress * 0.3}) 0%, rgba(0,0,0,${0.3 + progress * 0.4}) 100%)`,
				duration: 0.3,
				ease: "none"
			});
		}
	});

	// Simple clipping effect as we scroll
	ScrollTrigger.create({
		trigger: "#hero",
		start: "top top",
		end: "bottom top",
		scrub: 1,
		onUpdate: (self) => {
			const progress = self.progress;
			
			// Clip more aggressively, especially the top (falling backwards effect)
			const clipPath = `polygon(${0 + progress * 8}% ${0 + progress * 15}%, ${100 - progress * 6}% ${0 + progress * 12}%, ${100 - progress * 5}% ${100 - progress * 4}%, ${0 + progress * 7}% ${100 - progress * 6}%)`;
			
			gsap.set("#hero", {
				clipPath: clipPath
			});
		}
	});

	// Magnetic effect for CTA button
	const ctaButton = document.querySelector('.cta-button');
	if (ctaButton) {
		ctaButton.addEventListener('mousemove', (e) => {
			const rect = ctaButton.getBoundingClientRect();
			const x = e.clientX - rect.left - rect.width / 2;
			const y = e.clientY - rect.top - rect.height / 2;
			
			gsap.to(ctaButton, {
				x: x * 0.3,
				y: y * 0.3,
				duration: 0.3,
				ease: "power2.out"
			});
		});

		ctaButton.addEventListener('mouseleave', () => {
			gsap.to(ctaButton, {
				x: 0,
				y: 0,
				duration: 0.5,
				ease: "back.out(1.7)"
			});
		});
	}

	// Handle reduced motion
	const handleReducedMotion = () => {
		const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		
		if (prefersReducedMotion) {
			ScrollTrigger.getAll().forEach(st => {
				if (st.animation) st.disable();
			});
			gsap.globalTimeline.clear();
			
			// Set final states without animation
			gsap.set("#hero-video", { opacity: 1, scale: 1 });
			gsap.set([".hero-badge", ".title-line", ".subtitle-line", ".hero-cta", ".stat-card", ".scroll-indicator"], { opacity: 1, y: 0, rotateX: 0, scale: 1 });
			gsap.set(".float-circle", { opacity: 0.6 });
		}
	};

	handleReducedMotion();
	window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', handleReducedMotion);
}

document.addEventListener("DOMContentLoaded", initHeroAnimations);
document.addEventListener("astro:after-swap", initHeroAnimations);