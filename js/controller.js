/* =====================================================================
   CONTROLLER — listens to the user, updates the Model, tells the View.
   ===================================================================== */

const Controller = {

  transitioning: false,
  audioUnlocked: false,

  init() {
    View.init();
    this.bindMenu();
    this.bindKeyboard();
    this.bindAudioUnlock();
    this.bindContactForm();
    this.bindMusicPlayer();
  },

  bindMusicPlayer() {
    const toggleBtn = document.getElementById("music-toggle-btn");
    const bgm = document.getElementById("bgm-player");

    if (toggleBtn && bgm) {
      toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.audioUnlocked = true;
        if (bgm.paused) {
          bgm.play().then(() => View.updateMusicUI(Model.currentTrackIndex, true)).catch(() => {});
        } else {
          bgm.pause();
          View.updateMusicUI(Model.currentTrackIndex, false);
        }
      });

      // Otomatis lanjut ke lagu berikutnya saat lagu selesai (loop 1 -> 2 -> 3 -> 1)
      bgm.addEventListener("ended", () => {
        const nextIndex = (Model.currentTrackIndex + 1) % Model.musicTracks.length;
        Model.currentTrackIndex = nextIndex;
        View.setBGMTrack(nextIndex, Model);
        bgm.play().then(() => View.updateMusicUI(nextIndex, true)).catch(() => {});
      });
    }

    document.querySelectorAll(".music-track").forEach((trackEl) => {
      trackEl.addEventListener("click", (e) => {
        e.stopPropagation();
        this.audioUnlocked = true;
        const index = parseInt(trackEl.dataset.index, 10);
        Model.currentTrackIndex = index;
        View.setBGMTrack(index, Model);
        bgm.play().then(() => View.updateMusicUI(index, true)).catch(() => {});
      });
    });
  },

  /* ---------- Navigation (dengan Jeda Musik) ---------- */
  goTo(screen) {
    if (this.transitioning || screen === Model.state.screen) return;
    this.transitioning = true;
    this.play();

    const wasMusicPlaying = View.pauseBGMForTransition();

    View.wipe(
      () => {
        Model.state.screen = screen;
        View.showScreen(screen);
        if (screen === "projects") this.loadProjects();
        if (screen === "skills") this.loadSkills();
      },
      () => {
        this.transitioning = false;
        View.resumeBGMFromTransition(wasMusicPlaying);
      }
    );
  },

  select(index) {
    const items = View.els.menuItems;
    if (!items || items.length === 0) return;
    const n = items.length;
    // Presisi perputaran indeks 0..3 (4 item menu)
    const next = ((index % n) + n) % n;
    if (next !== Model.state.menuIndex) this.play();
    Model.state.menuIndex = next;
    View.setMenuSelection(next);
  },

  /* ---------- Screen data loading ---------- */
  async loadProjects() {
    View.renderFeatured(Model.featured);
    if (Model.state.reposLoaded) return;
    const { repos, live } = await Model.fetchRepos();
    const status = live
      ? `${repos.length} repositories · live from GitHub`
      : "Showing pinned work · GitHub API unavailable right now";
    View.renderRepos(repos, status, Model);
    Model.state.reposLoaded = true;
  },

  loadSkills() {
    if (!Model.state.skillsBuilt) {
      View.renderSkills(Model.skills);
      Model.state.skillsBuilt = true;
    }
    View.animateSkillBars();
  },

  /* ---------- Sound ---------- */
  play() {
    if (this.audioUnlocked) View.playSelect();
  },

  bindAudioUnlock() {
    const overlay = document.getElementById("start-overlay");

    const unlock = () => {
      if (!this.audioUnlocked) {
        this.audioUnlocked = true;

        // Sembunyikan overlay "Touch to Start"
        if (overlay) {
          overlay.classList.add("hidden");
        }

        // Putar audio BGM
        const bgm = document.getElementById("bgm-player");
        if (bgm && bgm.paused && bgm.src) {
          bgm.play().then(() => View.updateMusicUI(Model.currentTrackIndex, true)).catch(() => {});
        }
      }
    };

    addEventListener("pointerdown", unlock, { once: true, capture: true });
    addEventListener("keydown", unlock, { once: true, capture: true });
  },

  /* ---------- Contact form ---------- */
  bindContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;
    const status = document.getElementById("form-status");
    const btn = form.querySelector(".form-send");

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if (data._honey) return;
      if (!data.name.trim() || !data.email.trim() || !data.message.trim()) {
        status.textContent = "Fill in all three fields first.";
        return;
      }
      btn.disabled = true;
      status.textContent = "Sending…";
      try {
        const res = await fetch(`https://formsubmit.co/ajax/${Model.contactEmail}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            message: data.message,
            _subject: `Portfolio message from ${data.name}`,
          }),
        });
        if (!res.ok) throw new Error(res.status);
        status.textContent = "Sent! I'll get back to you soon.";
        form.reset();
        this.play();
      } catch {
        status.textContent = "Couldn't reach the relay, opening your email app instead…";
        const subject = encodeURIComponent(`Portfolio message from ${data.name}`);
        const body = encodeURIComponent(`${data.message}\n\nReply to: ${data.email}`);
        location.href = `mailto:${Model.contactEmail}?subject=${subject}&body=${body}`;
      } finally {
        btn.disabled = false;
      }
    });
  },

  /* ---------- Input bindings ---------- */
  bindMenu() {
    View.els.menuItems.forEach((item, i) => {
      item.addEventListener("mouseenter", () => this.select(i));
      item.addEventListener("click", () => this.goTo(item.dataset.target));
    });

    document.querySelectorAll("[data-back]").forEach(b =>
      b.addEventListener("click", () => this.goTo("home")));

    document.getElementById("big-name").addEventListener("click", () => {
      if (Model.state.screen !== "home") this.goTo("home");
      else this.play();
    });
  },

  bindKeyboard() {
    addEventListener("keydown", e => {
      if (Model.state.screen === "home") {
        if (e.key === "ArrowDown") { this.select(Model.state.menuIndex + 1); e.preventDefault(); }
        else if (e.key === "ArrowUp") { this.select(Model.state.menuIndex - 1); e.preventDefault(); }
        else if (e.key === "Enter") {
          const item = View.els.menuItems[Model.state.menuIndex];
          if (item) this.goTo(item.dataset.target);
        }
      } else if (e.key === "Escape") {
        this.goTo("home");
      }
    });
  },
};

Controller.init();