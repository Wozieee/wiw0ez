/* =====================================================================
   VIEW — everything that draws to the screen.
   ===================================================================== */

const View = {

  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,

  els: {
    screens:    {},
    menuItems:  [],
    wipe:       document.getElementById("wipe"),
    featGrid:   document.getElementById("feat-grid"),
    repoGrid:   document.getElementById("repo-grid"),
    repoStatus: document.getElementById("repo-status"),
    skillsBody: document.getElementById("skills-body"),
    sfx:        document.getElementById("sfx-select"),
    cursor:     document.getElementById("cursor"),
    clock:      document.getElementById("clock"),
  },

  init() {
    document.querySelectorAll(".screen").forEach(s => {
      this.els.screens[s.id.replace("screen-", "")] = s;
    });
    this.els.menuItems = [...document.querySelectorAll("#menu .menu-item")];
    document.querySelectorAll("[data-ransom]").forEach(el => this.ransomize(el));
    this.els.sfx.volume = 0.45;
    this.initBGM(Model);
    this.startClock();
    this.startParallax();
    this.startCursor();
    document.body.classList.add("loaded");
  },

  /* ---------- BGM Player Controls ---------- */
  initBGM(model) {
    this.els.bgm = document.getElementById("bgm-player");
    this.els.musicToggleBtn = document.getElementById("music-toggle-btn");
    if (!this.els.bgm) return;
    this.els.bgm.volume = 0.35;
    this.setBGMTrack(model.currentTrackIndex, model);
  },

  setBGMTrack(index, model) {
    const track = model.musicTracks[index];
    if (!track || !this.els.bgm) return;
    this.els.bgm.src = track.src;
    this.updateMusicUI(index, !this.els.bgm.paused);
  },

  updateMusicUI(activeIndex, isPlaying) {
    const trackEls = document.querySelectorAll(".music-track");
    trackEls.forEach((el, idx) => {
      const isCurrent = idx === activeIndex;
      el.classList.toggle("active", isCurrent);
      const statusEl = el.querySelector(".track-status");
      if (statusEl) {
        statusEl.textContent = isCurrent ? (isPlaying ? "PLAYING" : "PAUSED") : "PAUSED";
      }
    });
    const toggleBtn = document.getElementById("music-toggle-btn");
    if (toggleBtn) {
      toggleBtn.textContent = isPlaying ? "PAUSE" : "PLAY";
    }
  },

  pauseBGMForTransition() {
    if (!this.els.bgm) return false;
    const wasPlaying = !this.els.bgm.paused;
    if (wasPlaying) {
      this.els.bgm.pause();
      this.updateMusicUI(Model.currentTrackIndex, false);
    }
    return wasPlaying;
  },

  resumeBGMFromTransition(wasPlaying) {
    if (!this.els.bgm || !wasPlaying) return;
    this.els.bgm.play().then(() => {
      this.updateMusicUI(Model.currentTrackIndex, true);
    }).catch(() => {});
  },

  hash(str) {
    let h = 9;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 387420489);
    return (h ^ h >>> 9) >>> 0;
  },

  /* ---------- Ransom-note lettering ---------- */
  ransomize(el) {
    const text = el.dataset.ransom || el.textContent;
    el.textContent = "";
    [...text].forEach((c, i) => {
      const span = document.createElement("span");
      span.className = "ch display";
      span.textContent = c;
      const h = this.hash(text + i);
      const rot = (h % 17) - 8;
      const scale = 0.86 + ((h >> 3) % 30) / 100;
      const dy = ((h >> 5) % 9) - 4;
      const t = `rotate(${rot}deg) scale(${scale}) translateY(${dy}px)`;
      span.style.setProperty("--t", t);
      span.style.transform = t;
      const variant = (h >> 7) % 10;
      if (variant === 0) span.classList.add("box");
      else if (variant === 1) span.classList.add("boxw");
      else if (variant === 2) span.classList.add("red");
      el.appendChild(span);
    });
  },

  /* ---------- Screens & menu ---------- */
  showScreen(name) {
    const s = this.els.screens;
    Object.values(s).forEach(sc => sc.classList.remove("active"));
    if (s[name]) {
      s[name].classList.add("active");
      s[name].scrollTop = 0;
    }
    document.body.dataset.screen = name;
  },

  setMenuSelection(index) {
    this.els.menuItems.forEach((m, j) => m.classList.toggle("sel", j === index));
  },

  wipe(swap, done) {
    if (this.reducedMotion) { swap(); done(); return; }
    const w = this.els.wipe;
    w.classList.remove("go"); void w.offsetWidth;
    w.classList.add("go");
    setTimeout(swap, 340);
    setTimeout(done, 720);
  },

  playSelect() {
    try {
      this.els.sfx.currentTime = 0;
      const p = this.els.sfx.play();
      if (p && p.catch) p.catch(() => {});
    } catch {}
  },

  /* ---------- Project cards ---------- */
  cardThumb(src) {
    if (!src || typeof src !== "string") return "";

    // Jika file berakhiran .mp4, gunakan tag <video> TANPA autoplay
    if (src.toLowerCase().endsWith('.mp4') || src.toLowerCase().endsWith('.webm')) {
      return `<div class="thumb">
        <video muted playsinline preload="metadata" class="thumb-video" onerror="this.closest('.thumb').remove()">
          <source src="${src}" type="video/mp4">
        </video>
      </div>`;
    }

    // Jika gambar biasa (.png / .jpg)
    return `<div class="thumb"><img src="${src}" alt="" loading="lazy" onerror="this.closest('.thumb').remove()"></div>`;
  },

  splitTitle(title) {
    const first = title.split(" ")[0];
    return `<em>${first}</em>${title.slice(first.length)}`;
  },

  /* RENDER FEATURED CARDS (Play on Hover & Pause on Leave) */
  renderFeatured(list) {
    if (this.els.featGrid.childElementCount) return;
    list.forEach((f, i) => {
      const div = document.createElement("div");
      div.className = "card feat";
      div.style.setProperty("--tilt", ((this.hash(f.title) % 5) - 2) * 0.8 + "deg");
      div.style.setProperty("--d", i * 70 + "ms");
      div.innerHTML = `
        ${this.cardThumb(f.img)}
        <span class="lang" style="--lc:${f.color}">${f.tag}</span>
        <h3>${f.live ? '<span class="live-dot"></span>' : ""}${this.splitTitle(f.title)}</h3>
        <p>${f.desc}</p>
        <div class="meta"><span>${f.live ? "EMOH" : "YAHAY"}</span></div>`;

      // Logika Putar Video saat Kursor Masuk & Reset saat Kursor Keluar
      const video = div.querySelector("video");
      if (video) {
        div.addEventListener("mouseenter", () => {
          video.currentTime = 0; // Mulai dari detik awal
          video.play().catch(() => {});
        });
        div.addEventListener("mouseleave", () => {
          video.pause();         // Berhenti
          video.currentTime = 0; // Reset ke detik awal
        });
      }

      this.els.featGrid.appendChild(div);
    });
  },

  renderRepos(repos, statusText, model) {
    this.els.repoStatus.textContent = statusText;
    this.els.repoGrid.innerHTML = "";
    repos.forEach((r, i) => {
      const a = document.createElement("a");
      a.className = "card";
      a.href = r.html_url; a.target = "_blank"; a.rel = "noopener";
      a.style.setProperty("--tilt", ((this.hash(r.name) % 5) - 2) * 0.8 + "deg");
      a.style.setProperty("--d", i * 70 + "ms");
      a.style.setProperty("--lc", model.langColors[r.language] || "#e60012");
      const pretty = r.name.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const img = model.projectImages[r.name] || `assets/projects/${r.name}.png`;
      a.innerHTML = `
        ${this.cardThumb(img)}
        <span class="lang">${r.language || "Repo"}</span>
        <h3>${this.splitTitle(pretty)}</h3>
        <p>${r.description || "No description yet, but the code speaks for itself."}</p>
        <div class="meta">
          <span>★ ${r.stargazers_count || 0}</span>
          <span class="go">View on GitHub →</span>
        </div>`;
      this.els.repoGrid.appendChild(a);
    });
  },

  /* ---------- Skills ---------- */
  renderSkills(groups) {
    groups.forEach(g => {
      const div = document.createElement("div");
      div.className = "skill-group";
      div.innerHTML = `<h3>${g.group}</h3>`;
      g.items.forEach(([name, value]) => {
        const row = document.createElement("div");
        row.className = "skill-row";
        row.innerHTML = `
          <span class="name">${name}</span>
          <div class="skill-bar"><div class="fill" data-v="${value}"></div></div>
          <span class="lv">${value}</span>`;
        div.appendChild(row);
      });
      this.els.skillsBody.appendChild(div);
    });
  },

  animateSkillBars() {
    const fills = this.els.skillsBody.querySelectorAll(".fill");
    fills.forEach(f => { f.style.width = "0"; });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fills.forEach((f, i) => setTimeout(() => { f.style.width = f.dataset.v + "%"; }, i * 60));
    }));
  },

  /* ---------- Ambient ---------- */
  startClock() {
    setInterval(() => {
      this.els.clock.textContent =
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " · JKT";
    }, 1000);
  },

  startParallax() {
    if (this.reducedMotion) return;
    const stripes = document.getElementById("bg-stripes");
    const halftone = document.getElementById("bg-halftone");
    const arts = [...document.querySelectorAll(".menu-art")];
    let tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener("mousemove", e => {
      tx = e.clientX / innerWidth - 0.5;
      ty = e.clientY / innerHeight - 0.5;
    }, { passive: true });
    const loop = () => {
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      stripes.style.transform = `translate(${cx * 22}px, ${cy * 14}px)`;
      halftone.style.transform = `translate(${cx * -34}px, ${cy * -22}px)`;
      arts.forEach(a => {
        if (a.isConnected)
          a.style.transform = `translate(${cx * 14}px, ${cy * 9}px) scale(1.04)`;
      });
      requestAnimationFrame(loop);
    };
    loop();
  },

  startCursor() {
    if (!matchMedia("(pointer:fine)").matches || this.reducedMotion) return;
    const cur = this.els.cursor;
    document.body.classList.add("cursor-on");
    let x = -100, y = -100, frame = 0, last = 0, visible = false;

    addEventListener("mousemove", e => {
      x = e.clientX; y = e.clientY;
      if (!visible) { cur.style.display = "block"; visible = true; }
      const t = e.target;
      const overLink = t.closest &&
        t.closest("a,button,.card,.menu-item,.back-hint,.contact-chip,#big-name");
      cur.classList.toggle("link", !!overLink);
    }, { passive: true });

    document.documentElement.addEventListener("mouseleave", () => {
      cur.style.display = "none"; visible = false;
    });

    const tick = ts => {
      if (ts - last >= 50) {
        frame = (frame + 1) % 30; last = ts;
        cur.style.backgroundPosition = -frame * 48 + "px 0";
      }
      cur.style.transform = `translate(${x}px, ${y}px)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },
};