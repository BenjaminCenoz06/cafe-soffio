document.documentElement.classList.add("js");
// Rueda de especialidades: gira 90° cada tanto y la pieza de arriba es la activa
(() => {
  const section = document.querySelector(".showcase");
  const wheel = document.querySelector(".wheel");
  if (!section || !wheel) return;

  const items = [...wheel.querySelectorAll(".item")];
  const words = [...section.querySelectorAll(".words")];
  const INTERVAL = 2600;
  let step = 0;
  let timer = null;

  const show = (index) => {
    items.forEach((el, i) => el.classList.toggle("is-active", i === index));
    words.forEach((el, i) => el.classList.toggle("is-active", i === index));
  };

  const tick = () => {
    step += 1;
    wheel.style.setProperty("--rot", `${-90 * step}deg`);
    show(step % items.length);
  };

  show(0);

  // Solo gira mientras la sección está a la vista
  new IntersectionObserver(([entry]) => {
    clearInterval(timer);
    if (entry.isIntersecting) timer = setInterval(tick, INTERVAL);
  }, { threshold: 0.35 }).observe(section);
})();

// Las tarjetas entran al hacer scroll
(() => {
  const cards = document.querySelector(".cards");
  if (!cards) return;
  new IntersectionObserver(([e], obs) => {
    if (e.isIntersecting) { cards.classList.add("is-visible"); obs.disconnect(); }
  }, { threshold: 0.15 }).observe(cards);
})();

// Galería infinita: duplica la fila para que el bucle no tenga saltos
(() => {
  const track = document.querySelector(".gallery__track");
  const row = track?.querySelector(".gallery__row");
  if (!row) return;
  const clone = row.cloneNode(true);
  clone.setAttribute("aria-hidden", "true");
  track.appendChild(clone);
})();

// Las filas entran al hacer scroll
(() => {
  const rows = document.querySelectorAll(".strip");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } });
  }, { threshold: 0.25 });
  rows.forEach((r) => io.observe(r));
})();

// Collage de Instagram: se pueden arrastrar las fotos
(() => {
  const stage = document.querySelector(".social__stage");
  if (!stage) return;
  let z = 10;

  stage.querySelectorAll(".snap, .snap-drag").forEach((el) => {
    el.addEventListener("pointerdown", (e) => {
      if (e.button > 0) return;
      const box = stage.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - rect.left;
      const dy = e.clientY - rect.top;
      el.setPointerCapture(e.pointerId);
      el.classList.add("is-dragging");
      el.style.zIndex = ++z;

      const move = (ev) => {
        const x = Math.min(Math.max(ev.clientX - dx - box.left, -rect.width * 0.4), box.width - rect.width * 0.6);
        const y = Math.min(Math.max(ev.clientY - dy - box.top, -rect.height * 0.3), box.height - rect.height * 0.7);
        el.style.left = (x / box.width) * 100 + "%";
        el.style.top = (y / box.height) * 100 + "%";
      };
      const up = () => {
        el.classList.remove("is-dragging");
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    });
  });
})();

// Piezas que caen con gravedad (alfajores en el header, croissants en el footer)
function createDropper(layer, { floorOffset = 64, max = 60, size = 46, ttl = 0, src = "img/pieza-alfajor.webp", imgW = 92 } = {}) {
  const GRAVITY = 0.7;
  const bodies = [];
  let raf = null;
  const R = size;
  const html = `<img src="${src}" alt="" style="position:absolute;left:50%;top:50%;width:${imgW}%;height:auto;transform:translate(-50%,-50%)">`;

  const spawn = () => {
    const box = layer.getBoundingClientRect();
    const el = document.createElement("div");
    el.className = "dropped";
    el.innerHTML = html;
    el.style.width = el.style.height = R * 2 + "px";
    layer.appendChild(el);
    const b = {
      el, r: R,
      x: box.width * (0.15 + Math.random() * 0.7),
      y: -R - Math.random() * 60,
      vx: (Math.random() - 0.5) * 6,
      vy: 2,
      a: Math.random() * 360,
      va: (Math.random() - 0.5) * 8,
    };
    bodies.push(b);
    if (bodies.length > max) layer.removeChild(bodies.shift().el);
    if (ttl) {
      setTimeout(() => el.classList.add("is-fading"), ttl);
      setTimeout(() => { const i = bodies.indexOf(b); if (i > -1) bodies.splice(i, 1); el.remove(); }, ttl + 800);
    }
    if (!raf) raf = requestAnimationFrame(step);
  };

  const step = () => {
    const w = layer.clientWidth;
    const floor = layer.clientHeight - floorOffset;

    bodies.forEach((b) => {
      b.vy += GRAVITY;
      b.x += b.vx;
      b.y += b.vy;
      b.a += b.va;
      if (b.x < b.r) { b.x = b.r; b.vx *= -0.6; }
      if (b.x > w - b.r) { b.x = w - b.r; b.vx *= -0.6; }
      if (b.y > floor - b.r) {
        b.y = floor - b.r;
        b.vy *= -0.45;
        b.vx *= 0.9;
        b.va *= 0.8;
        if (Math.abs(b.vy) < 1.2) b.vy = 0;
      }
    });

    // choques entre piezas
    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const p = bodies[i], q = bodies[j];
          const dx = q.x - p.x, dy = q.y - p.y;
          const d = Math.hypot(dx, dy) || 0.01;
          const min = (p.r + q.r) * 0.85;
          if (d < min) {
            const nx = dx / d, ny = dy / d;
            const push = (min - d) / 2;
            p.x -= nx * push; p.y -= ny * push;
            q.x += nx * push; q.y += ny * push;
            const rel = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
            if (rel < 0) {
              const imp = rel * 0.5;
              p.vx += imp * nx; p.vy += imp * ny;
              q.vx -= imp * nx; q.vy -= imp * ny;
            }
          }
        }
      }
    }

    let moving = false;
    bodies.forEach((b) => {
      b.el.style.transform = `translate(${b.x - b.r}px, ${b.y - b.r}px) rotate(${b.a}deg)`;
      if (Math.abs(b.vx) > 0.15 || Math.abs(b.vy) > 0.5 || Math.abs(b.va) > 0.3 || b.y < floor - b.r - 2) moving = true;
    });
    raf = moving ? requestAnimationFrame(step) : null;
  };

  return { spawn };
}

// Footer: lluvia de croissants al llegar y al hacer click en el sticker
(() => {
  const btn = document.getElementById("dropBtn");
  const layer = document.getElementById("dropLayer");
  if (!btn || !layer) return;
  const mobile = matchMedia("(max-width: 900px)").matches;
  const { spawn } = createDropper(layer, { floorOffset: 64, max: mobile ? 30 : 60, size: mobile ? 36 : 46, src: "img/pieza-croissant.webp", imgW: 150 });

  const footerEl = btn.closest(".footer");
  if (footerEl) {
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return;
      o.disconnect();
      const n = mobile ? 12 : 18;
      for (let i = 0; i < n; i++) setTimeout(spawn, 300 + i * 130);
    }, { threshold: 0.3 }).observe(footerEl);
  }
  btn.addEventListener("click", () => { for (let i = 0; i < 8; i++) setTimeout(spawn, i * 90); });
})();

// Header: "Soltá un alfajor. O 20" — letras que entran una a una y alfajores que caen al hacer click
(() => {
  const btn = document.getElementById("heroDrop");
  const layer = document.getElementById("heroDropLayer");
  if (!btn || !layer) return;
  const text = btn.querySelector(".drop-link__text");
  text.innerHTML = [...text.textContent].map((c, i) => '<span class="ch" style="--i:' + i + '">' + (c === " " ? "&nbsp;" : c) + "</span>").join("");

  const mobile = matchMedia("(max-width: 900px)").matches;
  const { spawn } = createDropper(layer, { floorOffset: mobile ? 84 : 60, max: 26, size: mobile ? 30 : 38, ttl: 6500 });
  btn.addEventListener("click", () => { for (let i = 0; i < (mobile ? 10 : 14); i++) setTimeout(spawn, i * 85); });

  // al hacer scroll hacia abajo sobre el header, caen alfajores
  const hero = btn.closest(".hero");
  if (hero) {
    let lastY = scrollY, acc = 0;
    addEventListener("scroll", () => {
      const y = scrollY, dy = y - lastY;
      lastY = y;
      if (dy <= 0 || y > hero.offsetHeight * 0.9) { if (dy < 0) acc = 0; return; }
      acc += dy;
      while (acc >= 60) { acc -= 60; spawn(); }
    }, { passive: true });
  }
})();

/* =====================================================
   ANIMACIONES
   ===================================================== */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---- Fondo degradado animado (rojo → naranja → lila) ---- */
  (() => {
    const els = $('[data-background="gradient"]');
    if (!els.length) return;
    const colors = [[44, 56, 34], [90, 106, 64], [140, 154, 108]];
    let idx = [0, 1, 2, 0];
    let step = 0;
    let last = performance.now();
    let visible = new Set();
    const mix = (a, b, t) => "rgb(" + [0, 1, 2].map((k) => Math.round((1 - t) * a[k] + t * b[k])).join(",") + ")";

    const mobileMQ = matchMedia("(max-width: 900px)");
    let lastPaint = 0;
    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (mobileMQ.matches && now - lastPaint < 100) { step += dt * 0.12; requestAnimationFrame(frame); return; }
      lastPaint = now;
      if (visible.size) {
        const g = "linear-gradient(to bottom," + mix(colors[idx[0]], colors[idx[1]], step) + "," + mix(colors[idx[2]], colors[idx[3]], step) + ")";
        visible.forEach((el) => (el.style.background = g));
        step += dt * 0.12;
        if (step >= 1) {
          step %= 1;
          idx[0] = idx[1];
          idx[2] = idx[3];
          idx[1] = (idx[1] + 1 + Math.floor(Math.random() * (colors.length - 1))) % colors.length;
          idx[3] = (idx[3] + 1 + Math.floor(Math.random() * (colors.length - 1))) % colors.length;
        }
      }
      requestAnimationFrame(frame);
    };

    els.forEach((el) => {
      new IntersectionObserver(([e]) => (e.isIntersecting ? visible.add(el) : visible.delete(el))).observe(el);
    });
    if (!reduce) requestAnimationFrame(frame);
  })();

  /* ---- Hero text reveal: cada línea sube desde una máscara ---- */
  $(".hero__title > span").forEach((line, n) => {
    line.style.setProperty("--n", n);
    line.innerHTML = "<i style=\"--n:" + n + "\">" + line.textContent + "</i>";
  });
  $(".topbar > *").forEach((el, n) => el.style.setProperty("--n", n));

  /* ---- Scroll-based content reveal ---- */
  const revealSel = [".showcase__script", ".strip__text", ".info-card", ".footer__bottom"];
  revealSel.forEach((sel) => $(sel).forEach((el, i) => { el.setAttribute("data-reveal", ""); el.style.setProperty("--rd", (i % 3) * 0.12 + "s"); }));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { threshold: 0.2 });
  $("[data-reveal]").forEach((el) => io.observe(el));

  /* ---- Footer: letras del título una a una ---- */
  const fb = document.querySelector(".footer__brand");
  if (fb) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { fb.classList.add("is-in"); o.disconnect(); } }, { threshold: 0.3 }).observe(fb);

  /* ---- Ingredient typography: la taza se achica hasta quedar en la palabra ---- */
  const more = document.querySelector(".more");
  const title = document.querySelector(".more__title");
  if (more && title) {
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { more.classList.add("cup-in"); o.disconnect(); } },
      { rootMargin: "-45% 0px -45% 0px" }).observe(title);
  }

  /* ---- Galerías de comida / café / almuerzo: crossfade entre fotos ---- */
  $(".card__photo").forEach((photo, k) => {
    let i = 0;
    const live = () => $("img", photo);
    const show = () => live().forEach((im, n) => im.classList.toggle("is-on", n === i % Math.max(live().length, 1)));
    setTimeout(show, 400);
    setInterval(() => {
      if (live().length < 2) return;
      i = (i + 1) % live().length;
      show();
    }, 3400 + k * 500);
  });

  /* ---- Image stagger (galería) + grilla asimétrica (instagram) ---- */
  const stagger = (items, container, gap) => {
    if (!container || reduce) return;
    items.forEach((el, i) => { el.classList.add("is-pending"); el.style.setProperty("--sd", i * gap + "s"); });
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return;
      items.forEach((el) => el.classList.remove("is-pending"));
      setTimeout(() => items.forEach((el) => el.style.removeProperty("--sd")), 2500);
      o.disconnect();
    }, { threshold: 0.25 }).observe(container);
  };
  stagger($(".gallery__row:first-child .tile"), document.querySelector(".gallery"), 0.09);
  const snaps = $(".snap");
  const order = snaps.map((_, i) => i).sort(() => Math.random() - 0.5);
  stagger(order.map((n) => snaps[n]), document.querySelector(".social__stage"), 0.1);

  /* ---- Image hover effect: imagen flotante que sigue al cursor ---- */
  $(".strip").forEach((strip) => {
    const icon = strip.querySelector(".strip__icon svg");
    if (!icon) return;
    const pic = document.createElement("div");
    pic.className = "float-pic";
    pic.setAttribute("aria-hidden", "true");
    pic.appendChild(icon.cloneNode(true));
    strip.appendChild(pic);
    let rot = 0, tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    const loop = () => {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      pic.style.transform = "translate(" + cx + "px," + cy + "px) rotate(" + rot + "deg)";
      raf = strip.classList.contains("is-hovering") || Math.abs(tx - cx) > 0.5 ? requestAnimationFrame(loop) : null;
    };
    strip.addEventListener("mouseenter", (e) => {
      const r = strip.getBoundingClientRect();
      tx = cx = e.clientX - r.left; ty = cy = e.clientY - r.top;
      rot = Math.random() * 24 - 12;
      strip.classList.add("is-hovering");
      if (!raf) raf = requestAnimationFrame(loop);
    });
    strip.addEventListener("mousemove", (e) => { const r = strip.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; });
    strip.addEventListener("mouseleave", () => strip.classList.remove("is-hovering"));
  });

  /* ---- Sticker interactivo: apretón + confeti al hacer click ---- */
  const sticker = document.getElementById("dropBtn");
  const footer = document.querySelector(".footer");
  if (sticker && footer && !reduce) {
    sticker.addEventListener("click", () => {
      sticker.classList.remove("is-popping");
      void sticker.offsetWidth;
      sticker.classList.add("is-popping");
      const f = footer.getBoundingClientRect();
      const s = sticker.getBoundingClientRect();
      const ox = s.left - f.left + s.width / 2, oy = s.top - f.top + s.height / 2;
      const palette = ["#fff4e4", "#c8d0ad", "#9aa878", "#6f7f4f", "#f6efe0"];
      for (let i = 0; i < 18; i++) {
        const dot = document.createElement("span");
        dot.className = "confetti";
        dot.style.cssText = "left:" + ox + "px;top:" + oy + "px;background:" + palette[i % palette.length];
        footer.appendChild(dot);
        const a = (Math.PI * 2 * i) / 18 + Math.random() * 0.4;
        const d = 70 + Math.random() * 90;
        dot.animate([
          { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
          { transform: "translate(" + Math.cos(a) * d + "px," + (Math.sin(a) * d - 30) + "px) scale(.4)", opacity: 0 },
        ], { duration: 700 + Math.random() * 400, easing: "cubic-bezier(.2,.8,.3,1)" }).onfinish = () => dot.remove();
      }
    });
  }

  /* ---- Animated image sequence: taza que sigue al cursor sobre el botón principal ---- */
  const seq = document.getElementById("cursorSeq");
  const heroBtn = document.querySelector(".btn-order");
  if (seq && heroBtn) {
    let tx = 0, ty = 0, cx = 0, cy = 0, run = false;
    const loop = () => {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      seq.style.transform = "translate(" + cx + "px," + cy + "px)";
      run = seq.classList.contains("is-on") || Math.abs(tx - cx) > 0.5;
      if (run) requestAnimationFrame(loop);
    };
    heroBtn.addEventListener("mouseenter", (e) => { tx = cx = e.clientX + 30; ty = cy = e.clientY - 30; seq.classList.add("is-on"); if (!run) { run = true; requestAnimationFrame(loop); } });
    heroBtn.addEventListener("mousemove", (e) => { tx = e.clientX + 30; ty = e.clientY - 30; });
    heroBtn.addEventListener("mouseleave", () => seq.classList.remove("is-on"));
  }
})();

// Carta: modal con pestañas
(() => {
  const dlg = document.getElementById("carta");
  if (!dlg || typeof dlg.showModal !== "function") return;
  const tabs = [...dlg.querySelectorAll(".menu__tab")];
  const panels = [...dlg.querySelectorAll(".menu__panel")];

  const select = (i) => {
    tabs.forEach((t, n) => { t.classList.toggle("is-active", n === i); t.setAttribute("aria-selected", n === i); });
    panels.forEach((p, n) => { p.hidden = n !== i; p.classList.toggle("is-active", n === i); });
    dlg.querySelector(".menu__body").scrollTop = 0;
  };
  tabs.forEach((t, i) => t.addEventListener("click", () => select(i)));

  document.querySelectorAll("[data-open-menu]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    dlg.showModal();
    document.body.classList.add("menu-open");
  }));
  dlg.querySelector(".menu__close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", () => document.body.classList.remove("menu-open"));
})();

// Videos del collage: solo se reproducen cuando están a la vista
(() => {
  const vids = [...document.querySelectorAll(".snap--video video")];
  if (!vids.length) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) {
        v.play().then(() => v.parentElement.classList.add("is-playing")).catch(() => {});
      } else {
        v.pause();
        v.parentElement.classList.remove("is-playing");
      }
    });
  }, { threshold: 0.25 });
  vids.forEach((v) => io.observe(v));
})();

// Efecto 3D: la pieza activa se inclina siguiendo al cursor
(() => {
  const section = document.querySelector(".showcase");
  const wheel = document.querySelector(".wheel");
  if (!section || !wheel || matchMedia("(hover: none), (prefers-reduced-motion: reduce)").matches) return;
  section.addEventListener("mousemove", (e) => {
    const r = section.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    wheel.querySelectorAll(".item").forEach((it) => {
      it.style.setProperty("--ry", (x * 18).toFixed(2) + "deg");
      it.style.setProperty("--rx", (-y * 14).toFixed(2) + "deg");
    });
  });
  section.addEventListener("mouseleave", () => {
    wheel.querySelectorAll(".item").forEach((it) => { it.style.setProperty("--ry", "0deg"); it.style.setProperty("--rx", "0deg"); });
  });
})();

// Video del header: se reproduce solo mientras se ve
(() => {
  const v = document.querySelector(".hero__video");
  if (!v) return;
  v.muted = true;
  const play = () => v.play().catch(() => {});
  play();
  new IntersectionObserver(([e]) => (e.isIntersecting ? play() : v.pause()), { threshold: 0.05 }).observe(v);
  document.addEventListener("visibilitychange", () => (document.hidden ? v.pause() : play()));
})();

// Reseñas: se duplica el contenido de cada columna para que el desplazamiento sea infinito
(() => {
  document.querySelectorAll(".rv-track").forEach((t) => {
    [...t.children].forEach((n) => { const c = n.cloneNode(true); c.setAttribute("aria-hidden", "true"); t.appendChild(c); });
  });
  const head = document.querySelector(".reviews__head");
  const wall = document.querySelector(".reviews__wall");
  [head, wall].forEach((el, i) => {
    if (!el) return;
    el.setAttribute("data-reveal", "");
    el.style.setProperty("--rd", i * 0.15 + "s");
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { el.classList.add("is-in"); o.disconnect(); } }, { threshold: 0.15 }).observe(el);
  });
})();

// Menú de celular: pantalla completa con degradado verde
(() => {
  const toggle = document.querySelector(".dock__toggle");
  const menu = document.getElementById("mobileMenu");
  if (!toggle || !menu) return;
  const label = toggle.querySelector(".dock__label");
  let timer = null;

  const open = () => {
    clearTimeout(timer);
    menu.classList.add("is-shown");
    menu.setAttribute("aria-hidden", "false");
    document.body.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add("is-open")));
  };
  const close = () => {
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    timer = setTimeout(() => menu.classList.remove("is-shown"), 550);
  };

  toggle.addEventListener("click", () => (menu.classList.contains("is-open") ? close() : open()));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => close()));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("is-open")) close(); });
  matchMedia("(min-width: 901px)").addEventListener("change", (e) => { if (e.matches) close(); });

})();

// Táctil: lo que en la PC reacciona al mouse, en el celular reacciona al toque
(() => {
  if (!matchMedia("(hover: none)").matches) return;

  // inclinación 3D de la pieza al arrastrar el dedo sobre la sección
  const section = document.querySelector(".showcase");
  const wheel = document.querySelector(".wheel");
  if (section && wheel) {
    const tilt = (t) => {
      const r = section.getBoundingClientRect();
      const x = (t.clientX - r.left) / r.width - 0.5;
      const y = (t.clientY - r.top) / r.height - 0.5;
      wheel.querySelectorAll(".item").forEach((it) => { it.style.setProperty("--ry", (x * 22).toFixed(1) + "deg"); it.style.setProperty("--rx", (-y * 16).toFixed(1) + "deg"); });
    };
    section.addEventListener("touchmove", (e) => tilt(e.touches[0]), { passive: true });
    section.addEventListener("touchend", () => wheel.querySelectorAll(".item").forEach((it) => { it.style.setProperty("--ry", "0deg"); it.style.setProperty("--rx", "0deg"); }), { passive: true });
  }

  // imagen flotante de las filas de acciones: aparece donde tocás
  document.querySelectorAll(".strip").forEach((strip) => {
    const pic = strip.querySelector(".float-pic");
    if (!pic) return;
    let t;
    strip.addEventListener("touchstart", (e) => {
      const r = strip.getBoundingClientRect(); const p = e.touches[0];
      pic.style.transform = "translate(" + (p.clientX - r.left) + "px," + (p.clientY - r.top) + "px) rotate(" + (Math.random() * 24 - 12) + "deg)";
      strip.classList.add("is-hovering"); clearTimeout(t);
      t = setTimeout(() => strip.classList.remove("is-hovering"), 1400);
    }, { passive: true });
  });
})();

// Taza del título: se activa al pasar de la mitad de la pantalla (también si se salta rápido con el dedo)
(() => {
  const more = document.querySelector(".more");
  const title = document.querySelector(".more__title");
  if (!more || !title) return;
  const check = () => {
    if (more.classList.contains("cup-in")) return;
    if (title.getBoundingClientRect().top < innerHeight * 0.62) more.classList.add("cup-in");
  };
  addEventListener("scroll", check, { passive: true });
  check();
})();

// Conexión lenta o ahorro de datos: el header usa la foto en lugar del video
(() => {
  const c = navigator.connection;
  const v = document.querySelector(".hero__video");
  if (v && c && (c.saveData || /2g/.test(c.effectiveType || ""))) { v.remove(); }
})();
