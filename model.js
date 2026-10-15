/* =====================================================================
   MODEL — the data and state of the app. Never touches the DOM.
   ===================================================================== */

const Model = {

  githubUser: "Wozieee",
  contactEmail: "flowerssasa12@gmail.com",

  // ---- BGM Music Tracks ----
  currentTrackIndex: 0,
  musicTracks: [
    { title: "Last Surprise", src: "assets/sound/track1.mp3", img: "assets/track1.jpg" },
    { title: "Life Will Change", src: "assets/sound/track2.mp3", img: "assets/track2.jpg" },
    { title: "Beneath the Mask", src: "assets/sound/track3.mp3", img: "assets/track3.jpg" }
  ],

  // App state
  state: {
    screen: "home",
    menuIndex: 0,
    reposLoaded: false,
    skillsBuilt: false,
  },

  // ---- Featured projects (Kotak Murni Tanpa Link GitHub & Undefined) ----
  featured: [
    {
      title: "Smart RFID Attendance System",
      tag: "Very Hot", 
      color: "#e60012", 
      live: true,
      img: "assets/RFID.mp4",
      desc: "Built for a school assignment at SMAN 67 Jakarta. Uses RFID cards to automate attendance tracking, housed inside a simple cardboard prototype mockup.",
    },
    {
      title: "Dual-OLED Animated Confession Display",
      tag: "Hot", 
      color: "#f40277",
      live: true,
      img: "assets/Confes.mp4",
      desc: "ESP32 project using dual independent I2C buses to drive two OLED screens. It syncs dynamic facial animations with a real-time text narrative—smooth, expressive, and non-blocking.",
    },
    {
      title: "IoT Smart Car",
      tag: "ASLI CUY", 
      color: "#e60012",
      img: "assets/Car.jpg",
      desc: "Co-developed with the school IT club team for SMAN 67's Extracurricular Demo. Controlled remotely via local WiFi to showcase interactive hardware logic.",
    },
    {
      title: "Small Project Knitting",
      tag: "Love", 
      color: "#f40277",
      img: "assets/Rajut.jpg",
      desc: "A creative offline project exploring the art of knitting. Stitching benang demi benang cuz i funny at that",
    },
  ],

  featuredRepoNames: [
    "BritishFingerSpellingAI",
    "Granular-Sentiment-Pipeline-Class-Weighted-Transformers-for-Steam-Reviews",
    "DownloadGuard",
    "organsmnist-cnn-classification",
  ],

  fallbackRepos: [],

  projectImages: {},

  langColors: {
    JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
    PHP: "#4F5D95", CSS: "#663399", HTML: "#e34c26",
    "Jupyter Notebook": "#DA5B0B", MATLAB: "#e16737", Java: "#b07219", C: "#555", "C++": "#f34b7d",
  },

  // ---- Skills screen ----
  skills: [
    { group: "AI · ML · Data Science", items: [
      ["Python", 22],
    ]},
    { group: "Web & Full-Stack", items: [
      ["JavaScript / TypeScript", 21], ["Node.js · REST APIs", 1],
      ["UX Design · Figma · Adobe XD", 10],
    ]},
    { group: "Cloud & Engineering", items: [
      ["Git & GitHub", 1], ["C/C++", 14],
      ["Firebase", 11], ["Lua", 5], ["Arduino IDE", 11],
    ]},
    { group: "Spoken Languages", items: [
      ["English", 100], ["Japanese", 9], ["Korean", 100],
    ]},
  ],

  async fetchRepos() {
    const skip = new Set(this.featuredRepoNames);
    try {
      const res = await fetch(
        `https://api.github.com/users/${this.githubUser}/repos?per_page=100&sort=updated`
      );
      if (!res.ok) throw new Error(res.status);
      const repos = (await res.json()).filter(r => !r.fork && !skip.has(r.name));
      return { repos, live: true };
    } catch {
      return { repos: this.fallbackRepos.filter(r => !skip.has(r.name)), live: false };
    }
  },
};