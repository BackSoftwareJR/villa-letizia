/* Villa Letizia - JavaScript v1.2.0 - Footer interactivity */
document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll for elements with [data-scroll] and internal nav links
  const smoothLinks = Array.from(document.querySelectorAll('[data-scroll], .nav a[href^="#"], .footer-nav a[href*="#"]'));
  smoothLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Enhanced reveal on scroll with staggered animations
  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const container = element.closest('.quotes, .cards, .slider-track, .tiles');
          
          if (container) {
            // Staggered animation for grouped elements
            const siblings = Array.from(container.querySelectorAll('.reveal:not(.visible)'));
            const index = siblings.indexOf(element);
            
            setTimeout(() => {
              element.classList.add('visible');
            }, index * 150); // 150ms delay between each element
          } else {
            // Single element animation
            element.classList.add('visible');
          }
          
          io.unobserve(element);
        }
      });
    }, { 
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });
    revealEls.forEach(el => io.observe(el));
  } else {
    // Fallback
    revealEls.forEach(el => el.classList.add('visible'));
  }

  // Activities slider with infinite loop (supports multiple visible slides)
  const slider = document.querySelector('.slider');
  if (slider) {
    const viewport = slider.querySelector('.slider-viewport');
    const track = slider.querySelector('.slider-track');
    const prevBtn = slider.querySelector('.prev');
    const nextBtn = slider.querySelector('.next');

    let baseSlides = Array.from(slider.querySelectorAll('.slide'));
    let slides = [];
    let index = 0;
    let slideWidth = 0;
    let visibleCount = 1;
    let cloneCount = 1;

    const getGap = () => {
      const styles = getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap || '12');
      return Number.isFinite(gap) && gap >= 0 ? gap : 12;
    };

    const computeMetrics = () => {
      const first = track.querySelector('.slide');
      const gap = getGap();
      // Use offsetWidth to avoid frazioni che causano sovrastime
      slideWidth = first ? (first.offsetWidth + gap) : 0;
      const vpW = (viewport || slider).clientWidth;
      // Stima quante card stanno nel viewport
      const approx = slideWidth > 0 ? (vpW + gap) / slideWidth : 1;
      visibleCount = slideWidth > 0 ? Math.max(1, Math.round(approx)) : 1;
      // Su desktop allineiamo al layout CSS (4 card)
      if (window.innerWidth >= 1024) {
        visibleCount = Math.max(4, visibleCount);
      }
      visibleCount = Math.min(baseSlides.length, visibleCount);
      // Clona almeno visibleCount, aggiungi 1 buffer se possibile
      cloneCount = Math.max(visibleCount, Math.min(baseSlides.length, visibleCount + 1));
    };

    const goToIndex = (i, animate = true) => {
      if (animate) {
        track.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      } else {
        track.style.transition = 'none';
      }
      track.style.transform = `translateX(${-i * slideWidth}px)`;
    };

    const removeClones = () => {
      Array.from(track.querySelectorAll('.slide.clone')).forEach(n => n.remove());
    };

    const buildClones = () => {
      removeClones();
      computeMetrics();
      if (baseSlides.length <= 1) {
        slides = Array.from(track.querySelectorAll('.slide'));
        index = 0;
        goToIndex(index, false);
        return;
      }
      // append first N e prepend last N per riempire sempre il viewport
      for (let i = 0; i < cloneCount; i++) {
        const head = baseSlides[i].cloneNode(true);
        head.classList.add('clone');
        track.appendChild(head);
      }
      for (let i = 0; i < cloneCount; i++) {
        const tail = baseSlides[baseSlides.length - 1 - i].cloneNode(true);
        tail.classList.add('clone');
        track.insertBefore(tail, track.firstElementChild);
      }
      slides = Array.from(track.querySelectorAll('.slide'));
      index = cloneCount; // start at first real slide fully aligned
      goToIndex(index, false);
    };

    const handleResize = () => {
      // Rebuild clones according to new visible count
      baseSlides = Array.from(track.querySelectorAll('.slide')).filter(s => !s.classList.contains('clone'));
      buildClones();
      // Force reflow to apply no-transition jump cleanly
      // eslint-disable-next-line no-unused-expressions
      track.offsetHeight;
      track.style.transition = '';
    };

    computeMetrics();
    buildClones();
    // keep buttons always enabled for loop UX
    prevBtn.disabled = false;
    nextBtn.disabled = false;

    window.addEventListener('resize', handleResize);

    prevBtn.addEventListener('click', () => {
      const minStartIndex = cloneCount; // first real window start
      if (index <= minStartIndex) {
        // jump to tail real window then animate one step left
        const lastRealStart = cloneCount + baseSlides.length - visibleCount;
        goToIndex(lastRealStart, false);
        index = lastRealStart - 1;
        requestAnimationFrame(() => goToIndex(index, true));
      } else {
        index -= 1;
        goToIndex(index, true);
      }
      prevBtn.disabled = false; nextBtn.disabled = false;
    });

    nextBtn.addEventListener('click', () => {
      const maxStartIndex = cloneCount + baseSlides.length - visibleCount; // last full real window start
      if (index >= maxStartIndex) {
        // pre-wrap: jump to start real window, then animate one step
        goToIndex(cloneCount, false);
        index = cloneCount + 1;
        requestAnimationFrame(() => goToIndex(index, true));
      } else {
        index += 1;
        goToIndex(index, true);
      }
      prevBtn.disabled = false; nextBtn.disabled = false;
    });

    track.addEventListener('transitionend', () => {
      // If we reached clone area, jump senza animazione alla slide reale
      if (baseSlides.length <= 1) return;
      slides = Array.from(track.querySelectorAll('.slide'));
      const lastRealStart = slides.length - cloneCount * 2; // index of first real at tail section
      if (index >= slides.length - cloneCount) {
        // moved into appended clones -> reset to start real region
        index = cloneCount;
        goToIndex(index, false);
      } else if (index < cloneCount) {
        // moved into prepended clones -> jump to matching real at tail
        index = lastRealStart;
        goToIndex(index, false);
      }
      prevBtn.disabled = false; nextBtn.disabled = false;
    });
  }

  // Enhanced hero parallax with smoother animations
  const enableParallax = () => {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const hero = document.querySelector('#hero.hero--parallax');
    if (!hero) return;
    
    // Use JS-driven background position for broader support
    hero.style.backgroundAttachment = 'scroll';
    hero.style.willChange = 'background-position';
    const heroInner = hero.querySelector('.hero-inner');
    const heroCopy = hero.querySelector('.hero-copy');
    
    if (heroInner) {
      heroInner.style.willChange = 'transform';
    }
    if (heroCopy) {
      heroCopy.style.willChange = 'transform';
    }

    const bgSpeed = 0.4; // background parallax speed
    const fgSpeed = 0.12; // foreground content speed
    const copySpeed = 0.08; // text content speed
    let ticking = false;
    let lastScrollY = 0;

    const update = () => {
      const y = window.scrollY || window.pageYOffset;
      const base = hero.offsetTop;
      const heroHeight = hero.offsetHeight;
      
      // Only apply parallax when hero is in viewport
      if (y + window.innerHeight > base && y < base + heroHeight) {
        const scrollProgress = Math.max(0, Math.min(1, (y - base) / heroHeight));
        const offset = (y - base) * bgSpeed;
        
        // Background parallax with easing
        hero.style.backgroundPosition = `center calc(50% ${offset >= 0 ? '+' : '-'} ${Math.abs(offset)}px)`;
        
        // Foreground elements with different speeds for depth
        if (heroInner) {
          const fgOffset = (y - base) * fgSpeed;
          heroInner.style.transform = `translateY(${fgOffset * -1}px)`;
        }
        
        if (heroCopy) {
          const copyOffset = (y - base) * copySpeed;
          heroCopy.style.transform = `translateY(${copyOffset * -1}px)`;
        }
        
        // Subtle scale effect based on scroll progress
        const scale = 1 + (scrollProgress * 0.02);
        if (heroCopy) {
          heroCopy.style.transform += ` scale(${scale})`;
        }
      }
      
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  };

  enableParallax();

  // Mobile hamburger menu
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isActive = hamburger.classList.contains('active');
      
      if (isActive) {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      } else {
        hamburger.classList.add('active');
        mobileNav.classList.add('active');
        hamburger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      }
    });

    // Close menu when clicking on a link
    const mobileNavLinks = mobileNav.querySelectorAll('a');
    mobileNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  // Enhanced header scroll effect and sticky bar visibility
  const header = document.querySelector('.site-header');
  const stickyBar = document.querySelector('.sticky-bar');
  const heroSection = document.querySelector('#hero');
  
  if (header) {
    let lastScrollY = 0;
    let ticking = false;
    
    const updateHeader = () => {
      const scrollY = window.scrollY;
      
      // Header scroll effect
      if (scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      
      // Sticky bar visibility - show only after hero section
      if (stickyBar && heroSection) {
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        const heroThreshold = heroBottom - 100; // Show 100px before hero ends
        
        if (scrollY > heroThreshold) {
          stickyBar.classList.add('visible');
        } else {
          stickyBar.classList.remove('visible');
        }
      }
      
      lastScrollY = scrollY;
      ticking = false;
    };
    
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
    
    // Initial check
    updateHeader();
  }

  // Villa Carousel - Automatic carousel with manual controls
  const villaCarousel = document.querySelector('.villa-carousel');
  if (villaCarousel) {
    const slides = Array.from(villaCarousel.querySelectorAll('.carousel-slide'));
    const dots = Array.from(villaCarousel.querySelectorAll('.carousel-dot'));
    let currentSlide = 0;
    let autoSlideInterval;
    let isUserInteracting = false;

    const showSlide = (index) => {
      // Safety check: ensure slides and dots arrays exist and index is valid
      if (!slides || slides.length === 0) {
        console.warn('Carousel slides not found');
        return;
      }
      
      if (index < 0 || index >= slides.length) {
        console.warn(`Invalid slide index: ${index}. Available slides: ${slides.length}`);
        return;
      }
      
      // Remove active class from all slides and dots
      slides.forEach(slide => slide.classList.remove('active'));
      if (dots && dots.length > 0) {
        dots.forEach(dot => dot.classList.remove('active'));
      }
      
      // Add active class to current slide and dot (if dot exists)
      if (slides[index]) {
        slides[index].classList.add('active');
      }
      if (dots && dots[index]) {
        dots[index].classList.add('active');
      }
      
      currentSlide = index;
    };

    const nextSlide = () => {
      if (slides.length === 0) {
        console.warn('No slides available for carousel');
        return;
      }
      const nextIndex = (currentSlide + 1) % slides.length;
      showSlide(nextIndex);
    };

    const startAutoSlide = () => {
      if (autoSlideInterval) clearInterval(autoSlideInterval);
      autoSlideInterval = setInterval(() => {
        if (!isUserInteracting) {
          nextSlide();
        }
      }, 3500); // Change slide every 3.5 seconds
    };

    const stopAutoSlide = () => {
      if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
        autoSlideInterval = null;
      }
    };

    // Add click handlers to dots (if they exist)
    if (dots && dots.length > 0) {
      dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
          isUserInteracting = true;
          showSlide(index);
          stopAutoSlide();
          
          // Resume auto-slide after 10 seconds of no interaction
          setTimeout(() => {
            isUserInteracting = false;
            startAutoSlide();
          }, 10000);
        });
      });
    }

    // Add touch support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    villaCarousel.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      isUserInteracting = true;
      stopAutoSlide();
    });
    
    villaCarousel.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
      
      // Resume auto-slide after 5 seconds of no interaction
      setTimeout(() => {
        isUserInteracting = false;
        startAutoSlide();
      }, 5000);
    });
    
    const handleSwipe = () => {
      const swipeThreshold = 50; // Minimum distance for a swipe
      const swipeDistance = touchEndX - touchStartX;
      
      if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0) {
          // Swipe right - go to previous slide
          const prevIndex = currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
          showSlide(prevIndex);
        } else {
          // Swipe left - go to next slide
          nextSlide();
        }
      }
    };

    // Pause auto-slide on hover (desktop only)
    villaCarousel.addEventListener('mouseenter', () => {
      if (window.innerWidth > 768) { // Only on desktop
        isUserInteracting = true;
        stopAutoSlide();
      }
    });

    villaCarousel.addEventListener('mouseleave', () => {
      if (window.innerWidth > 768) { // Only on desktop
        isUserInteracting = false;
        startAutoSlide();
      }
    });

    // Pause auto-slide when page is not visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoSlide();
      } else {
        isUserInteracting = false;
        startAutoSlide();
      }
    });

    // Initialize carousel only if slides exist
    if (slides.length > 0) {
      showSlide(0);
      startAutoSlide();
    } else {
      console.warn('No carousel slides found, skipping initialization');
    }
  }

  // Hero Carousel - Automatic carousel for hero section
  const heroCarousel = document.querySelector('.hero-carousel');
  if (heroCarousel) {
    const heroSlides = Array.from(heroCarousel.querySelectorAll('.hero-carousel-slide'));
    let heroCurrentSlide = 0;
    let heroAutoSlideInterval;
    let heroIsUserInteracting = false;

    const showHeroSlide = (index) => {
      // Safety check: ensure slides array exists and index is valid
      if (!heroSlides || heroSlides.length === 0) {
        console.warn('Hero carousel slides not found');
        return;
      }
      
      if (index < 0 || index >= heroSlides.length) {
        console.warn(`Invalid hero slide index: ${index}. Available slides: ${heroSlides.length}`);
        return;
      }
      
      // Remove active class from all slides
      heroSlides.forEach(slide => slide.classList.remove('active'));
      
      // Add active class to current slide
      if (heroSlides[index]) {
        heroSlides[index].classList.add('active');
      }
      
      heroCurrentSlide = index;
    };

    const nextHeroSlide = () => {
      if (heroSlides.length === 0) {
        console.warn('No hero slides available for carousel');
        return;
      }
      const nextIndex = (heroCurrentSlide + 1) % heroSlides.length;
      showHeroSlide(nextIndex);
    };

    const startHeroAutoSlide = () => {
      if (heroAutoSlideInterval) clearInterval(heroAutoSlideInterval);
      heroAutoSlideInterval = setInterval(() => {
        if (!heroIsUserInteracting) {
          nextHeroSlide();
        }
      }, 4000); // Change slide every 4 seconds
    };

    const stopHeroAutoSlide = () => {
      if (heroAutoSlideInterval) {
        clearInterval(heroAutoSlideInterval);
        heroAutoSlideInterval = null;
      }
    };

    // Pause auto-slide on hover
    heroCarousel.addEventListener('mouseenter', () => {
      heroIsUserInteracting = true;
      stopHeroAutoSlide();
    });

    heroCarousel.addEventListener('mouseleave', () => {
      heroIsUserInteracting = false;
      startHeroAutoSlide();
    });

    // Pause auto-slide when page is not visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopHeroAutoSlide();
      } else {
        heroIsUserInteracting = false;
        startHeroAutoSlide();
      }
    });

    // Initialize hero carousel only if slides exist
    if (heroSlides.length > 0) {
      showHeroSlide(0);
      startHeroAutoSlide();
    } else {
      console.warn('No hero carousel slides found, skipping initialization');
    }
  }

  // Testimonials read more functionality
  window.toggleTestimonial = function() {
    const testimonial = document.getElementById('long-testimonial');
    const preview = testimonial.querySelector('.testimonial-preview');
    const full = testimonial.querySelector('.testimonial-full');
    const moreBtn = testimonial.querySelector('.read-more-btn');
    const lessBtn = testimonial.querySelector('.read-less-btn');
    
    if (full.style.display === 'none') {
      full.style.display = 'inline';
      preview.style.display = 'none';
    } else {
      full.style.display = 'none';
      preview.style.display = 'inline';
    }
  };

  // Footer accordion (mobile)
  const footerToggles = Array.from(document.querySelectorAll('.footer-toggle'));
  const footerMq = window.matchMedia('(max-width: 900px)');

  const syncFooterPanels = () => {
    const isMobile = footerMq.matches;
    footerToggles.forEach((toggle, index) => {
      toggle.setAttribute('aria-expanded', isMobile ? (index === 0 ? 'true' : 'false') : 'true');
    });
  };

  footerToggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      if (!footerMq.matches) return;
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
    });
  });

  if (footerMq.addEventListener) {
    footerMq.addEventListener('change', syncFooterPanels);
  } else {
    footerMq.addListener(syncFooterPanels);
  }
  syncFooterPanels();

  // Back to top button
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    const showOffset = 400;
    let backToTopTicking = false;

    const updateBackToTop = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      if (scrollY > showOffset) {
        backToTop.classList.add('is-visible');
        backToTop.hidden = false;
      } else {
        backToTop.classList.remove('is-visible');
        backToTop.hidden = true;
      }
      backToTopTicking = false;
    };

    window.addEventListener('scroll', () => {
      if (!backToTopTicking) {
        window.requestAnimationFrame(updateBackToTop);
        backToTopTicking = true;
      }
    }, { passive: true });

    backToTop.addEventListener('click', () => {
      const homeTarget = document.querySelector('#hero') || document.body;
      homeTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    updateBackToTop();
  }
});

// Call button behavior - desktop vs mobile
document.addEventListener('DOMContentLoaded', function() {
  const callButtons = document.querySelectorAll('.call-btn');
  
  callButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      // Check if it's desktop (screen width > 768px)
      if (window.innerWidth > 768) {
        e.preventDefault(); // Prevent default tel: behavior
        
        const phoneNumber = this.getAttribute('data-number');
        
        // Copy to clipboard
        navigator.clipboard.writeText(phoneNumber).then(() => {
          // Show feedback
          const originalText = this.textContent;
          this.textContent = 'Numero copiato!';
          this.style.background = '#39c6a5';
          
          setTimeout(() => {
            this.textContent = originalText;
            this.style.background = '';
          }, 2000);
        }).catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = phoneNumber;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          const originalText = this.textContent;
          this.textContent = 'Numero copiato!';
          this.style.background = '#39c6a5';
          
          setTimeout(() => {
            this.textContent = originalText;
            this.style.background = '';
          }, 2000);
        });
      }
      // On mobile, let the default tel: behavior work (opens phone app)
    });
  });
});
