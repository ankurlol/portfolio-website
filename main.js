import Lenis from 'lenis'

// 1. Initialize Lenis Smooth Scroll
try {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true
  });
  window.lenisInstance = lenis;

  function raf(time) {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }
  requestAnimationFrame(raf);
} catch (error) {
  console.error("Lenis smooth scroll failed to initialize:", error);
}

// 2. Custom Cursor & Dual Layer Masking
const cursor = document.getElementById('cursor');
const redLayer = document.getElementById('red-layer');

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let cursorX = mouseX;
let cursorY = mouseY;
let isHovering = false;
let currentRadius = 0;
let targetRadius = 0;

// Track mouse movement
window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// Detect hover over designated content zones to expand the mask
const hoverElements = document.querySelectorAll('h1, h2, h3, .hover-expand');

hoverElements.forEach(el => {
  el.addEventListener('mouseenter', () => { isHovering = true; });
  el.addEventListener('mouseleave', () => { isHovering = false; });
});

// Animation loop for smooth cursor, mask interpolation & parallax
const massiveNames = document.querySelectorAll('.massive-name');
const portraitCutouts = document.querySelectorAll('.portrait-cutout img');
const skillsSection = document.getElementById('skills');

function renderCursor() {
  // Smoothly interpolate cursor position
  cursorX += (mouseX - cursorX) * 0.2;
  cursorY += (mouseY - cursorY) * 0.2;
  
  // Move custom cursor div
  cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
  
  // Determine if mouse is in the skills section or below
  let isBelowAbout = false;
  if (skillsSection) {
    const skillsRect = skillsSection.getBoundingClientRect();
    if (mouseY >= skillsRect.top) {
      isBelowAbout = true;
    }
  }

  // Determine target radius based on hover state
  // Force radius to 0 below about section to disable the red mask completely
  // Only show mask over designated hover zones; hide everywhere else
  targetRadius = isBelowAbout ? 0 : (isHovering ? 200 : 0); 
  
  // Smoothly interpolate radius
  currentRadius += (targetRadius - currentRadius) * 0.04;
  
  // Apply clip-path to the red layer
  redLayer.style.clipPath = `circle(${currentRadius}px at ${cursorX}px ${cursorY + window.scrollY}px)`;

  // Hero Parallax — text moves slower, image scales up
  const scrollY = window.scrollY;
  const heroHeight = window.innerHeight;
  if (scrollY < heroHeight) {
    massiveNames.forEach(name => {
      // Keep the original -50% X/Y translate while adding parallax Y
      name.style.transform = `translate(-50%, calc(-50% + ${scrollY * 0.4}px))`;
    });
    portraitCutouts.forEach(img => {
      // Slight scale and parallax to the image
      img.style.transform = `translateY(${scrollY * 0.15}px) scale(${1 + scrollY * 0.0005})`;
    });
  }

  // Project Image Parallax Scroll
  const projectImages = document.querySelectorAll('.project-img');
  projectImages.forEach(img => {
    const rect = img.parentElement.getBoundingClientRect();
    // Check if parent container is visible within viewport
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      // Calculate scrolling progress from 0 (enters screen) to 1 (leaves screen)
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      const translateY = (progress - 0.5) * 45; // -22.5px to 22.5px shift range
      img.style.transform = `translateY(${translateY}px)`;
    }
  });
  
  requestAnimationFrame(renderCursor);
}
requestAnimationFrame(renderCursor);

// 3. Scroll Reveal Animations
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.2
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.remove('hidden');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.reveal-text').forEach((el) => {
  el.classList.add('hidden');
  observer.observe(el);
});

// 4. Text Scramble Glitch Effect for Menu Links
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.update = this.update.bind(this);
  }
  setText(newText) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => this.resolve = resolve);
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 20);
      const end = start + Math.floor(Math.random() * 20);
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameId);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let output = '';
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="glitch-char">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameId = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

// Initialize TextScramble on load & hover for both layers
document.querySelectorAll('[data-scramble]').forEach(el => {
  const fx = new TextScramble(el);
  const originalText = el.innerText;
  
  // Scramble on load
  setTimeout(() => {
    fx.setText(originalText);
  }, 300);
  
  // Scramble on hover
  el.addEventListener('mouseenter', () => {
    fx.setText(originalText);
  });
});

// 5. Menu Overlay Toggle and Click Handlers
const toggles = document.querySelectorAll('.menu-toggle');
const overlays = document.querySelectorAll('.menu-overlay');

toggles.forEach(toggle => {
  toggle.addEventListener('click', () => {
    const isOpen = toggle.classList.contains('is-open');
    
    // Sync toggles open/close state
    toggles.forEach(t => {
      if (isOpen) t.classList.remove('is-open');
      else t.classList.add('is-open');
    });
    
    // Sync overlay open/close animations
    overlays.forEach(o => {
      if (isOpen) {
        o.classList.remove('is-open');
        o.classList.add('is-closing');
        setTimeout(() => {
          o.classList.remove('is-closing');
        }, 500);
      } else {
        o.classList.add('is-open');
        // Trigger text scramble when menu overlays reveal
        o.querySelectorAll('[data-scramble]').forEach(el => {
          const fx = new TextScramble(el);
          fx.setText(el.innerText);
        });
      }
    });
  });
});

// Smooth Scroll for Menu Links & Close Overlay
document.querySelectorAll('.menu-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href');
    
    // Close overlays
    toggles.forEach(t => t.classList.remove('is-open'));
    overlays.forEach(o => {
      o.classList.remove('is-open');
      o.classList.add('is-closing');
      setTimeout(() => {
        o.classList.remove('is-closing');
      }, 500);
    });
    
    // Scroll to target element
    const targetEl = document.querySelector(targetId);
    if (targetEl) {
      if (window.lenisInstance) {
        window.lenisInstance.scrollTo(targetId);
      } else {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});
