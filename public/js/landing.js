/**
 * LANDING PAGE JAVASCRIPT
 * Handles strictly 3D Parallax Tilt effects and Scroll Animations.
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. STICKY NAVBAR EFFECT
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

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
