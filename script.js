//scroll smooth
let smoother = ScrollSmoother.create({
  smooth: 2,
  effects: true,
  normalizeScroll: true,
  smoothTouch: 0.1,
});

//on refresh it resets to the same position

window.addEventListener("beforeunload", () => {
  localStorage.setItem("scrollY", smoother.scrollTop());
});

window.addEventListener("load", () => {
  smoother.scrollTop(localStorage.getItem("scrollY") || 0, false);
});

function getNumber(value, fallback = 0) {
  const num = parseFloat(value);
  return isNaN(num) ? fallback : num;
}

// Split text

function splitText(targetElement, type = "words") {
  const split = new SplitText(targetElement, {
    type: "chars,words,lines",
    mask: "words", // <-- this can be "lines" or "words" or "chars"
  });

  const parts = type === "words" ? split.words : split.chars;

  if (!parts.length) {
    console.warn(`No ${type} found in:`, targetElement);
    return null;
  }

  return parts;
}

document.addEventListener("DOMContentLoaded", function () {
  // Define breakpoints for different screen sizes

  const breakpoints = {
    mobilePortrait: 479,
    mobileLandscape: 767,
    tablet: 991,
  };

  // Calculates scroll distance for 'bottom of .selector' style strings
  function resolveEnd(element, endAttr) {
    if (!endAttr?.includes(" of ")) return endAttr;

    const [edge, selector] = endAttr.split(" of ");
    const target = document.querySelector(selector.trim());
    if (!target) return "+=1000";

    const tRect = element.getBoundingClientRect();
    const eRect = target.getBoundingClientRect();
    const scroll = window.scrollY;

    const offsets = {
      top: eRect.top + scroll - (tRect.top + scroll),
      bottom: eRect.bottom + scroll - (tRect.top + scroll),
    };

    return `+=${Math.round(offsets[edge] ?? 1000)}`;
  }

  // Loop through elements that have the data-animation attribute

  document.querySelectorAll("[data-animation]").forEach(function (element) {
    let $this = element;
    let windowWidth = window.innerWidth;
    let disableOn = $this.getAttribute("disable-on");

    // Skip animation if disabled on this viewport

    if (disableOn) {
      if (
        (disableOn.includes("mobilePortrait") &&
          windowWidth <= breakpoints.mobilePortrait) ||
        (disableOn.includes("mobileLandscape") &&
          windowWidth > breakpoints.mobilePortrait &&
          windowWidth <= breakpoints.mobileLandscape) ||
        (disableOn.includes("tablet") &&
          windowWidth > breakpoints.mobileLandscape &&
          windowWidth <= breakpoints.tablet)
      ) {
        return; // skip this element
      }
    }

    // Checks if data-yoffset is in Px or %

    function parseUnit(value) {
      if (typeof value === "string" && value.includes("px")) {
        return { value: parseFloat(value), unit: "px" };
      } else {
        return { value: parseFloat(value), unit: "%" };
      }
    }

    function resolveEnd(element, endAttr) {
      if (!endAttr?.includes(" of ")) return endAttr;

      const [edge, selector] = endAttr.split(" of ");
      const target = document.querySelector(selector.trim());
      if (!target) return "+=1000";

      const tRect = element.getBoundingClientRect();
      const eRect = target.getBoundingClientRect();
      const scroll = window.scrollY;

      const triggerTop = tRect.top + scroll;
      const triggerBottom = tRect.bottom + scroll;

      const offsets = {
        top: eRect.top + scroll - triggerTop,
        bottom: eRect.bottom + scroll - triggerBottom,
      };

      return `+=${Math.round(offsets[edge] ?? 1000)}`;
    }

    const duration = parseFloat($this.getAttribute("data-duration")) || 1;
    const xOffset = parseUnit($this.getAttribute("data-xoffset") || "0");
    const yOffset = parseUnit($this.getAttribute("data-yoffset") || "0");
    const delay = parseFloat($this.getAttribute("data-delay")) || 0;
    const ease = $this.getAttribute("data-ease") || "power1.out";
    const stagger = parseFloat($this.getAttribute("data-stagger")) || 0.1;
    const start = $this.getAttribute("data-start") || "top 80%";
    const rawEnd = $this.getAttribute("data-end") || "bottom top";
    const end = resolveEnd($this, rawEnd);
    const rawScrub = $this.getAttribute("data-scrub");
    const scrub = rawScrub !== null ? rawScrub === "true" ? true: parseFloat(rawScrub): undefined;
    const markers = $this.getAttribute("data-markers") === "true";
    const animationName = $this.getAttribute("data-animation");
    const animationType = $this.getAttribute("data-animation-type");
    const toggleActions = $this.getAttribute("data-toggle-actions") || "play none none reverse";
    const pin = $this.hasAttribute("data-pin") ? $this.getAttribute("data-pin") === "true" : undefined;
    const pinSpacing = $this.hasAttribute("data-pin-spacing") ? $this.getAttribute("data-pin-spacing") === "true" : undefined;
    const scrambleDelay = parseFloat($this.getAttribute("data-scramble-delay")) || 0.5;
    const scrambleSpeed = parseFloat($this.getAttribute("data-scramble-speed")) || 1;
    const scrambleChars = $this.getAttribute("data-scramble-chars");
    const scrambleClass = $this.getAttribute("data-scramble-class") || null;
    const scrambleText = $this.getAttribute("data-scramble-text") || $this.textContent;
    const swapText = $this.getAttribute("data-swap-text") || $this.textContent;
    const rtl = $this.getAttribute("data-swap-rtl") === "true";

    // Set up GSAP params
    const params = {
      x: xOffset.unit === "px" ? xOffset.value : undefined,
      xPercent: xOffset.unit === "%" ? xOffset.value : undefined,
      y: yOffset.unit === "px" ? yOffset.value : undefined,
      yPercent: yOffset.unit === "%" ? yOffset.value : undefined,
      duration: duration,
      delay: delay,
      ease: ease,
      text: swapText,
      rtl: rtl,
      stagger: stagger,
      scrambleText: {
        text: scrambleText,
        chars: scrambleChars,
        revealDelay: scrambleDelay,
        speed: scrambleSpeed,
        newClass: scrambleClass,
      },
      scrollTrigger: {
        trigger: $this,
        start: start,
        end: end,
        scrub: scrub,
        markers: markers,
        toggleActions: toggleActions,
        pin: pin,
        pinSpacing: pinSpacing,
      },
    };

    // Run animation if valid
    if (animationName && animationType) {
      const animationExists =
        animations[animationName] &&
        typeof animations[animationName][animationType] === "function";

      if (animationExists) {
        animations[animationName][animationType]($this, params, animationType);
      } else {
        console.warn(
          `Animation type "${animationType}" not found for "${animationName}"`
        );
      }
    }
  });
});

const animations = {
  "fade-up": {
    standard: (element, params = {}) => {
      $(element).css("transition-property", "none");
      gsap.from(element, {
        opacity: 0,
        delay: params.delay || 0,
        duration: params.duration || 1,
        y: params.y || 0,
        yPercent: params.yPercent || 50,
        ease: params.ease || "power1.out",
        scrollTrigger: params.scrollTrigger, // Directly using scrollTrigger from params
        onComplete: () => $(element).css("transition-property", ""),
      });
    },

    scroll: (element, params = {}) => {
      $(element).css("transition-property", "none");
      gsap.from(element, {
        opacity: 0,
        y: params.y || 0,
        yPercent: params.yPercent || 50,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        scrollTrigger: params.scrollTrigger,
        onComplete: () => $(element).css("transition-property", ""),
      });
    },

    stagger: (element, params = {}) => {
      $(element)
        .children()
        .each(function () {
          $(this).css("transition-property", "none");
        });

      gsap.from($(element).children(), {
        opacity: 0,
        y: params.y || 0,
        yPercent: params.yPercent || 50,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
        onComplete: () => {
          $(element)
            .children()
            .each(function () {
              $(this).css("transition-property", "");
            });
        },
      });
    },

    // ➕ Added support for word-based animation
    words: (element, params = {}) => {
      const splitParts = splitText(element, "words");
      if (!splitParts) return;
      gsap.from(splitParts, {
        opacity: 0,
        y: params.y || 0,
        yPercent: params.yPercent || 100,
        duration: params.duration || 1,
        ease: params.ease || "back.out(2)",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
      });
    },
    letters: (element, params = {}) => {
      const chars = splitText(element, "chars");
      if (!chars) return;
      gsap.from(chars, {
        opacity: 0,
        y: params.y || 0,
        yPercent: params.yPercent || 100,
        duration: params.duration || 1,
        ease: params.ease || "back.out(2)",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
      });
    },
  },

  "fade-down": {
    standard: (element, params = {}) => {
      $(element).css("transition-property", "none");
      gsap.from(element, {
        opacity: 0,
        y: params.y || 0,
        yPercent: params.yPercent || -50,
        duration: params.duration || 1,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        scrollTrigger: params.scrollTrigger, // Directly using scrollTrigger from params
        onComplete: () => $(element).css("transition-property", ""),
      });
    },

    scroll: (element, params = {}) => {
      $(element).css("transition-property", "none");
      gsap.from(element, {
        opacity: 0,
        y: params.y || 0,
        yPercent: params.yPercent || -50,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        scrollTrigger: params.scrollTrigger,
        onComplete: () => $(element).css("transition-property", ""),
      });
    },

    stagger: (element, params = {}) => {
      $(element)
        .children()
        .each(function () {
          $(this).css("transition-property", "none");
        });

      gsap.from($(element).children(), {
        opacity: 0,
        y: params.y || 0,
        yPercent: params.yPercent || -50,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
        onComplete: () => {
          $(element)
            .children()
            .each(function () {
              $(this).css("transition-property", "");
            });
        },
      });
    },

    // ➕ Added support for word-based animation with fade down
    words: (element, params = {}) => {
      const splitParts = splitText(element, "words");
      if (!splitParts) return;
      gsap.from(splitParts, {
        opacity: 0,
        yPercent: params.yPercent || -100,
        duration: params.duration || 1,
        ease: params.ease || "back.out(2)",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
      });
    },

    // ➕ Added support for character-based animation with fade down
    letters: (element, params = {}) => {
      const chars = splitText(element, "chars");
      if (!chars) return;
      gsap.from(chars, {
        opacity: 0,
        yPercent: params.yPercent || -100,
        duration: params.duration || 1,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
      });
    },
  },

  "fade-in": {
    standard: (element, params = {}) => {
      $(element).css("transition-property", "none");
      gsap.from(element, {
        opacity: 0, // Start with 0 opacity for fade-in effect
        duration: params.duration || 1,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        scrollTrigger: params.scrollTrigger, // Directly using scrollTrigger from params
        onComplete: () => $(element).css("transition-property", ""),
      });
    },

    scroll: (element, params = {}) => {
      $(element).css("transition-property", "none");
      gsap.from(element, {
        opacity: 0,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        scrollTrigger: params.scrollTrigger,
        onComplete: () => $(element).css("transition-property", ""),
      });
    },

    stagger: (element, params = {}) => {
      $(element)
        .children()
        .each(function () {
          $(this).css("transition-property", "none");
        });

      gsap.from($(element).children(), {
        opacity: 0, // Start with 0 opacity
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
        onComplete: () => {
          $(element)
            .children()
            .each(function () {
              $(this).css("transition-property", "");
            });
        },
      });
    },

    // ➕ Added support for word-based animation with fade-in effect
    words: (element, params = {}) => {
      const splitParts = splitText(element, "words");
      if (!splitParts) return;
      gsap.from(splitParts, {
        opacity: 0, // Start with 0 opacity
        duration: params.duration || 1,
        ease: params.ease || "back.out(2)",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
      });
    },

    // ➕ Added support for character-based animation with fade-in effect
    letters: (element, params = {}) => {
      const chars = splitText(element, "chars");
      if (!chars) return;
      gsap.from(chars, {
        opacity: 0, // Start with 0 opacity
        duration: params.duration || 1,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
      });
    },
  },

  "fade-left": {
    standard: (element, params = {}) => {
      $(element).css("transition-property", "none");
      gsap.from(element, {
        opacity: 0, // Start with 0 opacity
        x: params.x || 0,
        xPercent: params.xPercent || -50,
        duration: params.duration || 1,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        scrollTrigger: params.scrollTrigger, // Directly using scrollTrigger from params
        onComplete: () => $(element).css("transition-property", ""),
      });
    },

    scroll: (element, params = {}) => {
      $(element).css("transition-property", "none");
      gsap.from(element, {
        opacity: 0,
        x: params.x || 0,
        xPercent: params.xPercent || -50,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        scrollTrigger: params.scrollTrigger,
        onComplete: () => $(element).css("transition-property", ""),
      });
    },

    stagger: (element, params = {}) => {
      $(element)
        .children()
        .each(function () {
          $(this).css("transition-property", "none");
        });

      gsap.from($(element).children(), {
        opacity: 0, // Start with opacity 0
        x: params.x || 0,
        xPercent: params.xPercent || -50,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
        onComplete: () => {
          $(element)
            .children()
            .each(function () {
              $(this).css("transition-property", "");
            });
        },
      });
    },

    // ➕ Added support for word-based animation with fade left
    words: (element, params = {}) => {
      const splitParts = splitText(element, "words");
      if (!splitParts) return;
      gsap.from(splitParts, {
        opacity: 0, // Start with 0 opacity
        x: params.x || 0,
        xPercent: params.xPercent || -50,
        duration: params.duration || 1,
        ease: params.ease || "back.out(2)",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
      });
    },

    // ➕ Added support for character-based animation with fade left
    letters: (element, params = {}) => {
      const chars = splitText(element, "chars");
      if (!chars) return;
      gsap.from(chars, {
        opacity: 0, // Start with 0 opacity
        x: params.x || 0,
        xPercent: params.xPercent || -50,
        duration: params.duration || 1,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
      });
    },
  },

  "fade-right": {
    standard: (element, params = {}) => {
      $(element).css("transition-property", "none");
      gsap.from(element, {
        opacity: 0, // Start with 0 opacity
        x: params.x || 0,
        xPercent: params.xPercent || 50,
        duration: params.duration || 1,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        scrollTrigger: params.scrollTrigger, // Directly using scrollTrigger from params
        onComplete: () => $(element).css("transition-property", ""),
      });
    },

    scroll: (element, params = {}) => {
      $(element).css("transition-property", "none");
      gsap.fromTo(
        element,
        { opacity: 0, xPercent: params.xPercent || 50 }, // Start with opacity 0 and off-screen to the right
        {
          opacity: 1, // Fade to full opacity
          xPercent: 0, // Move the element to its original position
          ease: params.ease || "power1.out",
          delay: params.delay || 0,
          scrollTrigger: params.scrollTrigger,
          onComplete: () => $(element).css("transition-property", ""),
        }
      );
    },

    stagger: (element, params = {}) => {
      $(element)
        .children()
        .each(function () {
          $(this).css("transition-property", "none");
        });

      gsap.from($(element).children(), {
        opacity: 0, // Start with opacity 0
        x: params.x || 0,
        xPercent: params.xPercent || 50,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
        onComplete: () => {
          $(element)
            .children()
            .each(function () {
              $(this).css("transition-property", "");
            });
        },
      });
    },

    // ➕ Added support for word-based animation with fade right
    words: (element, params = {}) => {
      const splitParts = splitText(element, "words");
      if (!splitParts) return;
      gsap.from(splitParts, {
        opacity: 0, // Start with 0 opacity
        x: params.x || 0,
        xPercent: params.xPercent || 50,
        duration: params.duration || 1,
        ease: params.ease || "back.out(2)",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
      });
    },

    // ➕ Added support for character-based animation with fade right
    letters: (element, params = {}) => {
      const chars = splitText(element, "chars");
      if (!chars) return;
      gsap.from(chars, {
        opacity: 0, // Start with 0 opacity
        x: params.x || 0,
        xPercent: params.xPercent || 50,
        duration: params.duration || 1,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
      });
    },
  },

  "scale-in": {
    standard: (element, params = {}) => {
      $(element).css("transition-property", "none");
      gsap.from(element, {
        opacity: 0, // Start with 0 opacity
        scale: 0.5, // Start scaled down
        duration: params.duration || 1,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        scrollTrigger: params.scrollTrigger, // Directly using scrollTrigger from params
        onComplete: () => $(element).css("transition-property", ""),
      });
    },

    scroll: (element, params = {}) => {
      $(element).css("transition-property", "none");
      gsap.from(element, {
        scale: 0.5,
        opacity: 0,
        y: params.y || 0,
        yPercent: params.yPercent || 50,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        scrollTrigger: params.scrollTrigger,
        onComplete: () => $(element).css("transition-property", ""),
      });
    },

    stagger: (element, params = {}) => {
      $(element)
        .children()
        .each(function () {
          $(this).css("transition-property", "none");
        });

      gsap.from($(element).children(), {
        opacity: 0, // Start with 0 opacity
        scale: 0.5, // Start scaled down
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
        onComplete: () => {
          $(element)
            .children()
            .each(function () {
              $(this).css("transition-property", "");
            });
        },
      });
    },

    // ➕ Added support for word-based animation with scale-in
    words: (element, params = {}) => {
      const splitParts = splitText(element, "words");
      if (!splitParts) return;
      gsap.from(splitParts, {
        opacity: 0, // Start with 0 opacity
        scale: 0.5, // Start scaled down
        ease: params.ease || "back.out(2)",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
      });
    },

    // ➕ Added support for character-based animation with scale-in
    letters: (element, params = {}) => {
      const chars = splitText(element, "chars");
      if (!chars) return;
      gsap.from(chars, {
        opacity: 0, // Start with 0 opacity
        scale: 0.5, // Start scaled down
        duration: params.duration || 1,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
      });
    },
  },

  "scale-up": {
    standard: (element, params = {}) => {
      $(element).css("transition-property", "none");
      gsap.from(element, {
        opacity: 0,
        scale: 0.5,
        y: params.y || 0,
        yPercent: params.yPercent || 50,
        duration: params.duration || 1,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        scrollTrigger: params.scrollTrigger,
        onComplete: () => $(element).css("transition-property", ""),
      });
    },

    scroll: (element, params = {}) => {
      $(element).css("transition-property", "none");
      gsap.from(element, {
        scale: 0.5,
        opacity: 0,
        y: params.y || 0,
        yPercent: params.yPercent || 50,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        scrollTrigger: params.scrollTrigger,
        onComplete: () => $(element).css("transition-property", ""),
      });
    },

    stagger: (element, params = {}) => {
      $(element)
        .children()
        .each(function () {
          $(this).css("transition-property", "none");
        });

      gsap.from($(element).children(), {
        opacity: 0,
        scale: 0.5,
        y: params.y || 0,
        yPercent: params.yPercent || 50,
        duration: params.duration || 1,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
        onComplete: () => {
          $(element)
            .children()
            .each(function () {
              $(this).css("transition-property", "");
            });
        },
      });
    },

    words: (element, params = {}) => {
      const splitParts = splitText(element, "words");
      if (!splitParts) return;
      gsap.from(splitParts, {
        opacity: 0,
        scale: 0.5,
        y: params.y || 0,
        yPercent: params.yPercent || 50,
        duration: params.duration || 1,
        ease: params.ease || "back.out(2)",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
      });
    },

    letters: (element, params = {}) => {
      const chars = splitText(element, "chars");
      if (!chars) return;
      gsap.from(chars, {
        opacity: 0,
        scale: 0.5,
        y: params.y || 0,
        yPercent: params.yPercent || 50,
        duration: params.duration || 1,
        ease: params.ease || "power1.out",
        delay: params.delay || 0,
        stagger: getNumber(params.stagger, 0.1),
        scrollTrigger: params.scrollTrigger,
      });
    },
  },

  pin: {
    standard: (element, params = {}) => {
      gsap.from(element, {
        ease: params.ease || "power1.out",
        scrollTrigger: {
          trigger: element,
          start: params.scrollTrigger.start || "top top",
          end: params.scrollTrigger.end || "+=250",
          scrub: params.scrollTrigger.scrub || false,
          markers: params.scrollTrigger.markers || false,
          toggleActions:
            params.scrollTrigger.toggleActions || "play none none reverse",
          pin: true,
          pinSpacing: params.scrollTrigger.pinSpacing !== false,
        },
        onComplete: () => $(element).css("transition-property", ""),
      });
    },
  },

  "scramble-text": {
    to: (element, params = {}) => {
      const originalText = params.scrambleText?.text || element.textContent;
      const proxy = document.createElement("div");
      proxy.textContent = originalText;

      const spaceIndexes = [...originalText]
        .map((char, i) => (char === " " ? i : -1))
        .filter((i) => i !== -1);

      gsap.to(proxy, {
        duration: params.duration || 2,
        ease: params.ease || "power1.out",
        scrambleText: {
          text: originalText,
          revealDelay: params.scrambleText?.revealDelay || 0,
          chars: params.scrambleText?.chars || "lowerCase",
          speed: params.scrambleText?.speed || 1,
          newClass: params.scrambleText?.newClass || null,
        },
        scrollTrigger: params.scrollTrigger,
        onUpdate: () => {
          const scrambled = proxy.textContent.split("");
          spaceIndexes.forEach((i) => (scrambled[i] = " "));
          element.textContent = scrambled.join("");
        },
      });
    },

    "from-empty": (element, params = {}) => {
      const finalText = element.textContent;

      // Start from empty text
      element.textContent = "";

      gsap.to(element, {
        duration: params.duration || 2,
        ease: params.ease || "power1.out",
        scrambleText: {
          text: finalText,
          revealDelay: params.scrambleText?.revealDelay || 0,
          chars: params.scrambleText?.chars || "lowerCase",
          speed: params.scrambleText?.speed || 1,
        },
        scrollTrigger: params.scrollTrigger,
      });
    },
  },

  "swap-text": {
    to: (element, params = {}) => {
      gsap.to(element, {
        duration: params.duration || 1,
        text: {
          value: params.text || element.textContent,
          rtl: params.rtl || false,
        },
        ease: params.ease || "power1.out",
        scrollTrigger: params.scrollTrigger,
      });
    },

    "from-empty": (element, params = {}) => {
      const finalText = element.textContent;

      // Set it to empty so the animation starts from nothing
      element.textContent = "";

      gsap.to(element, {
        duration: params.duration || 1,
        text: {
          value: finalText, // animate to what's already in Webflow
          rtl: params.rtl || false,
        },
        ease: params.ease || "power1.out",
        scrollTrigger: params.scrollTrigger,
      });
    },
  },
};
