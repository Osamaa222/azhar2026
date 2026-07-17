(() => {
  'use strict';

  const MOBILE_BREAKPOINT = 1200;
  const SLIDE_DURATION = 7000;

  const ready = (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  };

  const initLoader = () => {
    const loader = document.getElementById('loader');
    if (!loader) return;

    const hideLoader = () => {
      window.setTimeout(() => loader.classList.add('hidden'), 350);
    };

    if (document.readyState === 'complete') {
      hideLoader();
    } else {
      window.addEventListener('load', hideLoader, { once: true });
    }
  };

  const initNavigation = () => {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    if (!menuToggle || !navMenu) return;

    const icon = menuToggle.querySelector('i');

    const setMenuState = (open) => {
      navMenu.classList.toggle('active', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'إغلاق القائمة الرئيسية' : 'فتح القائمة الرئيسية');
      if (icon) {
        icon.classList.toggle('fa-bars', !open);
        icon.classList.toggle('fa-times', open);
      }
    };

    menuToggle.addEventListener('click', () => {
      setMenuState(!navMenu.classList.contains('active'));
    });

    const dropdownItems = navMenu.querySelectorAll('.has-dropdown, .has-sub-dropdown');
    dropdownItems.forEach((item) => {
      const trigger = item.querySelector(':scope > a');
      if (!trigger) return;

      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');

      trigger.addEventListener('click', (event) => {
        if (window.innerWidth > MOBILE_BREAKPOINT) return;
        event.preventDefault();
        event.stopPropagation();

        const shouldOpen = !item.classList.contains('active');
        item.classList.toggle('active', shouldOpen);
        trigger.setAttribute('aria-expanded', String(shouldOpen));
      });
    });

    document.addEventListener('click', (event) => {
      if (window.innerWidth > MOBILE_BREAKPOINT) return;
      if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
        setMenuState(false);
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        setMenuState(false);
        dropdownItems.forEach((item) => {
          item.classList.remove('active');
          item.querySelector(':scope > a')?.setAttribute('aria-expanded', 'false');
        });
      }
    });
  };

  const initNewsSlider = () => {
    const slider = document.querySelector('.news-slider-container');
    if (!slider) return;

    const slides = Array.from(slider.querySelectorAll('.news-slide'));
    const bullets = Array.from(slider.querySelectorAll('.bullet'));
    const arrows = Array.from(slider.querySelectorAll('[data-slider-direction]'));
    const progressBar = slider.querySelector('#progressBar');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (slides.length < 2) return;

    let currentIndex = 0;
    let autoTimer = null;
    let progressTimer = null;
    let progressStartedAt = 0;
    let paused = false;
    let touchStartX = 0;

    const clearTimers = () => {
      window.clearInterval(autoTimer);
      window.clearInterval(progressTimer);
      autoTimer = null;
      progressTimer = null;
    };

    const resetProgress = () => {
      if (!progressBar) return;
      progressBar.style.width = '0%';
      if (reduceMotion.matches || paused) return;

      progressStartedAt = performance.now();
      progressTimer = window.setInterval(() => {
        const elapsed = performance.now() - progressStartedAt;
        const percentage = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
        progressBar.style.width = `${percentage}%`;
        if (percentage >= 100) window.clearInterval(progressTimer);
      }, 80);
    };

    const render = (index) => {
      currentIndex = (index + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === currentIndex;
        slide.classList.toggle('active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });

      bullets.forEach((bullet, bulletIndex) => {
        const active = bulletIndex === currentIndex;
        bullet.classList.toggle('active', active);
        if (active) bullet.setAttribute('aria-current', 'true');
        else bullet.removeAttribute('aria-current');
      });

      window.clearInterval(progressTimer);
      resetProgress();
    };

    const startAutoPlay = () => {
      clearTimers();
      if (reduceMotion.matches || paused || document.hidden) return;
      resetProgress();
      autoTimer = window.setInterval(() => render(currentIndex + 1), SLIDE_DURATION);
    };

    const goTo = (index) => {
      render(index);
      startAutoPlay();
    };

    arrows.forEach((button) => {
      button.addEventListener('click', () => {
        const direction = Number(button.dataset.sliderDirection || 0);
        goTo(currentIndex + direction);
      });
    });

    bullets.forEach((bullet) => {
      bullet.addEventListener('click', () => goTo(Number(bullet.dataset.slideIndex || 0)));
    });

    slider.addEventListener('mouseenter', () => {
      paused = true;
      clearTimers();
    });

    slider.addEventListener('mouseleave', () => {
      paused = false;
      startAutoPlay();
    });

    slider.addEventListener('focusin', () => {
      paused = true;
      clearTimers();
    });

    slider.addEventListener('focusout', (event) => {
      if (!slider.contains(event.relatedTarget)) {
        paused = false;
        startAutoPlay();
      }
    });

    slider.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(currentIndex - 1);
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(currentIndex + 1);
      }
      if (event.key === 'Home') {
        event.preventDefault();
        goTo(0);
      }
      if (event.key === 'End') {
        event.preventDefault();
        goTo(slides.length - 1);
      }
    });

    slider.addEventListener('touchstart', (event) => {
      touchStartX = event.changedTouches[0].clientX;
      paused = true;
      clearTimers();
    }, { passive: true });

    slider.addEventListener('touchend', (event) => {
      const distance = touchStartX - event.changedTouches[0].clientX;
      if (Math.abs(distance) >= 45) {
        goTo(currentIndex + (distance > 0 ? 1 : -1));
      }
      paused = false;
      startAutoPlay();
    }, { passive: true });

    document.addEventListener('visibilitychange', startAutoPlay);
    reduceMotion.addEventListener?.('change', startAutoPlay);

    render(0);
    startAutoPlay();
  };

  const initFaq = () => {
    const items = Array.from(document.querySelectorAll('.faq-section .accordion-item'));
    if (!items.length) return;

    const closeItem = (item) => {
      const button = item.querySelector('.accordion-header');
      const body = item.querySelector('.accordion-body');
      const icon = item.querySelector('.accordion-icon');
      item.classList.remove('active');
      button?.setAttribute('aria-expanded', 'false');
      if (body) body.style.maxHeight = '0px';
      icon?.classList.remove('fa-minus');
      icon?.classList.add('fa-plus');
    };

    const openItem = (item) => {
      const button = item.querySelector('.accordion-header');
      const body = item.querySelector('.accordion-body');
      const icon = item.querySelector('.accordion-icon');
      item.classList.add('active');
      button?.setAttribute('aria-expanded', 'true');
      if (body) body.style.maxHeight = `${body.scrollHeight}px`;
      icon?.classList.remove('fa-plus');
      icon?.classList.add('fa-minus');
    };

    items.forEach((item) => {
      const button = item.querySelector('.accordion-header');
      if (!button) return;

      if (item.classList.contains('active')) openItem(item);
      else closeItem(item);

      button.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');
        items.forEach(closeItem);
        if (!isOpen) openItem(item);
      });
    });

    window.addEventListener('resize', () => {
      const activeBody = document.querySelector('.faq-section .accordion-item.active .accordion-body');
      if (activeBody) activeBody.style.maxHeight = `${activeBody.scrollHeight}px`;
    });
  };

  const initTabs = () => {
    const tabList = document.querySelector('[role="tablist"]');
    if (!tabList) return;

    const buttons = Array.from(tabList.querySelectorAll('[role="tab"][data-tab]'));
    const panels = Array.from(document.querySelectorAll('[data-tab-panel]'));
    if (!buttons.length || !panels.length) return;

    const activateTab = (button, moveFocus = false) => {
      const target = button.dataset.tab;
      buttons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.tabPanel !== target;
      });
      if (moveFocus) button.focus();
    };

    buttons.forEach((button, index) => {
      button.addEventListener('click', () => activateTab(button));
      button.addEventListener('keydown', (event) => {
        if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let nextIndex = index;
        if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = buttons.length - 1;
        else if (event.key === 'ArrowRight') nextIndex = (index - 1 + buttons.length) % buttons.length;
        else if (event.key === 'ArrowLeft') nextIndex = (index + 1) % buttons.length;
        activateTab(buttons[nextIndex], true);
      });
    });

    activateTab(buttons.find((button) => button.classList.contains('active')) || buttons[0]);
  };

  ready(() => {
    initLoader();
    initNavigation();
    initNewsSlider();
    initFaq();
    initTabs();
  });
})();
