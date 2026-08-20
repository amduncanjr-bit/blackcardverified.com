/* Black Card Verified — motion (dependency-free, original implementation) */
(function () {
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* smooth inertial scroll (wheel-only; keyboard, touch, scrollbar stay native) */
  if (!RM && matchMedia('(pointer: fine)').matches) {
    var target = window.scrollY, current = target, running = false;
    var max = function () {
      return document.documentElement.scrollHeight - innerHeight;
    };
    /* horizontally scrollable ancestor (category rail etc.) — let native
       handle horizontal-dominant gestures there instead of hijacking */
    var hscroller = function (el) {
      while (el && el !== document.body) {
        if (el.scrollWidth > el.clientWidth + 4) {
          var o = getComputedStyle(el).overflowX;
          if (o === 'auto' || o === 'scroll') return el;
        }
        el = el.parentElement;
      }
      return null;
    };
    addEventListener('wheel', function (e) {
      if (e.ctrlKey) return;               // pinch-zoom stays native
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && hscroller(e.target)) return;
      e.preventDefault();
      target = Math.max(0, Math.min(max(), target + e.deltaY));
      if (!running) { running = true; requestAnimationFrame(step); }
    }, { passive: false });
    var step = function () {
      current += (target - current) * 0.11;
      if (Math.abs(target - current) < 0.6) {
        current = target; running = false;
      }
      window.scrollTo(0, current);
      if (running) requestAnimationFrame(step);
    };
    /* keep target in sync when scroll happens by other means */
    addEventListener('scroll', function () {
      if (!running) { target = window.scrollY; current = target; }
    }, { passive: true });
  }

  /* category rail: mouse drag-to-scroll (touch + trackpad are native) */
  document.querySelectorAll('.catrail').forEach(function (rail) {
    var down = false, startX = 0, startLeft = 0, moved = false;
    rail.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; startX = e.clientX; startLeft = rail.scrollLeft;
      rail.classList.add('dragging');
    });
    addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      rail.scrollLeft = startLeft - dx;
    });
    addEventListener('pointerup', function () {
      down = false; rail.classList.remove('dragging');
    });
    /* swallow the click that ends a drag so cards don't activate */
    rail.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);
  });

  /* finale: flip the whole site luxe while the Black Card is on screen */
  var finale = document.getElementById('finale');
  if (finale && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        document.documentElement.classList.toggle('luxe', e.intersectionRatio > 0.35);
      });
    }, { threshold: [0, .35, .6] }).observe(finale);
  }
  /* the card tilts toward the cursor, like it's being handed to you */
  var bc = document.getElementById('bcard');
  if (bc && matchMedia('(pointer: fine)').matches && !RM) {
    bc.addEventListener('mousemove', function (e) {
      var r = bc.getBoundingClientRect();
      bc.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 10 + 'deg');
      bc.style.setProperty('--rx', (.5 - (e.clientY - r.top) / r.height) * 8 + 'deg');
    });
    bc.addEventListener('mouseleave', function () {
      bc.style.setProperty('--rx', '0deg'); bc.style.setProperty('--ry', '0deg');
    });
  }

  /* nav: hide on scroll down, show on scroll up */
  var nav = document.querySelector('.nav'), lastY = 0;
  addEventListener('scroll', function () {
    var y = window.scrollY;
    if (nav) nav.classList.toggle('hid', y > 140 && y > lastY);
    lastY = y;
  }, { passive: true });

  /* wordmark: per-letter rise */
  var wm = document.querySelector('.wordmark');
  if (wm) {
    var text = wm.textContent;
    wm.textContent = '';
    text.split('').forEach(function (ch, i) {
      var s = document.createElement('span');
      s.className = 'l';
      s.textContent = ch === ' ' ? ' ' : ch;
      s.style.transitionDelay = (i * 45) + 'ms';
      wm.appendChild(s);
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { wm.classList.add('in'); });
    });
  }

  /* reveals + staggered pop-ins + parade growth */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      if (el.hasAttribute('data-stagger')) {
        var i = 0;
        el.querySelectorAll('.pop').forEach(function (c) {
          c.style.transitionDelay = (i++ * 70) + 'ms';
          c.classList.add('in');
        });
      }
      el.classList.add('in');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('.rv, .parade, [data-stagger]').forEach(function (el) { io.observe(el); });

  /* gallery: tap-to-expand on touch */
  document.querySelectorAll('.gcol').forEach(function (col) {
    col.addEventListener('click', function () {
      document.querySelectorAll('.gcol.on').forEach(function (c) {
        if (c !== col) c.classList.remove('on');
      });
      col.classList.toggle('on');
    });
  });
})();
