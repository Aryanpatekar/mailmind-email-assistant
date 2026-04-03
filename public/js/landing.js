/**
 * LANDING PAGE JAVASCRIPT
 * Handles navbar motion, 3D parallax tilt, and scroll animations.
 */

document.addEventListener('DOMContentLoaded', () => {

  // 1. NAVBAR SCROLL + HOVER EFFECTS
  const navbar = document.getElementById('site-nav');
  const navLinks = navbar ? Array.from(navbar.querySelectorAll('.site-nav__link')) : [];
  const navIndicator = navbar ? navbar.querySelector('.site-nav__indicator') : null;
  const navLinksWrap = navbar ? navbar.querySelector('.site-nav__links') : null;
  const navCta = navbar ? navbar.querySelector('.site-nav__cta') : null;

  if (navbar && window.gsap) {
    gsap.fromTo(
      navbar,
      { y: -28, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    );
  }

  const syncNavbarState = () => {
    if (!navbar || !window.gsap) {
      return;
    }

    const scrolled = window.scrollY > 40;
    navbar.classList.toggle('is-scrolled', scrolled);

    gsap.to(navbar, {
      paddingTop: scrolled ? 14 : 22,
      paddingBottom: scrolled ? 14 : 22,
      duration: 0.25,
      ease: 'power2.out'
    });

    const inner = navbar.querySelector('.site-nav__inner');
    if (inner) {
      gsap.to(inner, {
        scale: scrolled ? 0.99 : 1,
        duration: 0.25,
        ease: 'power2.out'
      });
    }
  };

  window.addEventListener('scroll', syncNavbarState, { passive: true });
  syncNavbarState();

  const animateIndicatorTo = (target) => {
    if (!navIndicator || !navLinksWrap || !window.gsap) {
      return;
    }

    const linkRect = target.getBoundingClientRect();
    const wrapRect = navLinksWrap.getBoundingClientRect();
    const x = linkRect.left - wrapRect.left;

    gsap.to(navIndicator, {
      x,
      width: linkRect.width,
      opacity: 1,
      duration: 0.32,
      ease: 'power3.out'
    });
  };

  const hideIndicator = () => {
    if (!navIndicator || !window.gsap) {
      return;
    }

    gsap.to(navIndicator, {
      opacity: 0,
      width: 0,
      duration: 0.2,
      ease: 'power2.out'
    });
  };

  navLinks.forEach((link) => {
    link.addEventListener('mouseenter', () => animateIndicatorTo(link));
    link.addEventListener('focus', () => animateIndicatorTo(link));
  });

  if (navLinksWrap) {
    navLinksWrap.addEventListener('mouseleave', hideIndicator);
  }

  if (navCta && window.gsap) {
    navCta.addEventListener('mouseenter', () => {
      gsap.to(navCta, { y: -2, duration: 0.22, ease: 'power2.out' });
    });

    navCta.addEventListener('mouseleave', () => {
      gsap.to(navCta, { y: 0, duration: 0.22, ease: 'power2.out' });
    });
  }

  // 2. 3D PARALLAX TILT EFFECT (HERO CARD)
  const wrapper = document.getElementById('tilt-wrapper');
  const card = document.getElementById('tilt-card');
  
  if (wrapper && card) {
    wrapper.addEventListener('mousemove', handleMouseMove);
    wrapper.addEventListener('mouseleave', handleMouseLeave);
    wrapper.addEventListener('mouseenter', handleMouseEnter);
  }

  function handleMouseMove(e) {
    const rect = wrapper.getBoundingClientRect();
    
    // Calculate cursor position relative to the center of the element
    const x = e.clientX - rect.left; // x position within the element.
    const y = e.clientY - rect.top;  // y position within the element.
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation percentage (max 15 degrees)
    const rotateX = ((y - centerY) / centerY) * -15; 
    const rotateY = ((x - centerX) / centerX) * 15;
    
    // Apply transform
    card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    
    // Optional: add a dynamic glare/glow effect based on mouse pos
    const glow = card.querySelector('.card-glow');
    if (glow) {
      const glowX = (x / rect.width) * 100;
      const glowY = (y / rect.height) * 100;
      glow.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.15), transparent 50%)`;
    }
  }

  function handleMouseLeave() {
    card.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
    card.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg)`;
    
    const glow = card.querySelector('.card-glow');
    if (glow) {
      glow.style.background = `radial-gradient(circle at top left, rgba(255,255,255,0.1), transparent 50%)`;
    }
  }

  function handleMouseEnter() {
    card.style.transition = 'none'; // Remove transition for snappier follow
  }

  // 3. SCROLL REVEAL ANIMATIONS using IntersectionObserver
  const revealElements = document.querySelectorAll('.scroll-reveal');
  
  const revealOptions = {
    threshold: 0.15, // Trigger when 15% of the element is visible
    rootMargin: "0px 0px -50px 0px"
  };

  const revealOnScroll = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        return;
      } else {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Stop observing once revealed
      }
    });
  }, revealOptions);

  revealElements.forEach(el => revealOnScroll.observe(el));

});
