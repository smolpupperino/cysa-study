/* CySA+ Study OS - vanilla, static, offline-friendly app shell. */
(function () {
  "use strict";

  const CORE = window.CORE || { domains: [], chapters: [], lessons: [], audio: {} };
  const app = document.getElementById("app");
  const audio = document.getElementById("audio");
  const audioDock = document.getElementById("audioDock");
  const toastEl = document.getElementById("toast");
  const dataConfig = {
    lessons: { src: "data/lessons.js", global: "LESSONS", label: "lesson content" },
    book: { src: "data/book.js", global: "BOOK", label: "study guide" },
    questions: { src: "data/questions.js", global: "QUESTIONS", label: "question bank" },
    glossary: { src: "data/glossary.js", global: "GLOSSARY", label: "glossary" },
    reference: { src: "data/reference.js", global: "REFERENCE", label: "reference sheets" },
    objectives: { src: "data/objectives.js", global: "OBJECTIVES", label: "official objectives" },
    videos: { src: "data/videos.js", global: "VIDEOS", label: "Hank Hackerson videos" }
  };
  const dataPromises = {};
  let routeVersion = 0;
  let activeRoute = null;
  let toastTimer = null;
  let readingLessonId = null;
  let bookChapterNumber = null;
  let bookScrollTimer = null;
  let readingScrollTimer = null;
  let miniDeck = null;
  let cardSession = null;
  let quizSession = null;
  let quizResult = null;
  let singleQuestion = null;
  let quizTimer = null;
  let audioCurrentId = null;
  let audioMediaSectionIndex = -2;
  let audioSleepUntil = 0;
  let audioSaveTimer = null;
  let touchStartX = null;
  let audioTouchStartY = null;
  let audioDockDismissed = false;
  let audioExpanded = false;
  let audioSpeedOpen = false;
  let audioEndedPrompt = false;
  let menuOpen = false;
  let videoOpenKey = null;

  const ICON_PATHS = {
    search: '<circle cx="11" cy="11" r="6.8"></circle><path d="m16 16 4.5 4.5"></path>',
    theme: '<path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z"></path><path d="M16.4 4.4v3.2M14.8 6h3.2"></path>',
    home: '<path d="m3.5 10.8 8.5-7 8.5 7"></path><path d="M5.5 9.5v9h13v-9M9.5 18.5v-5h5v5"></path>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"></path>',
    "book-open": '<path d="M3.5 5.2a2 2 0 0 1 2-1.2h4.2a2.8 2.8 0 0 1 2.3 1.2 2.8 2.8 0 0 1 2.3-1.2h4.2a2 2 0 0 1 2 1.2v12.1a1 1 0 0 1-1.3.9c-2.8-.8-5.1-.8-7.2.5-2.1-1.3-4.4-1.3-7.2-.5a1 1 0 0 1-1.3-.9Z"></path><path d="M12 5.3v13.4"></path>',
    headphones: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"></path><path d="M4 14h3v5H5a1 1 0 0 1-1-1ZM20 14h-3v5h2a1 1 0 0 0 1-1Z"></path>',
    cards: '<rect x="4" y="5" width="13" height="15" rx="2"></rect><path d="M7 3.5h10a2 2 0 0 1 2 2v11M7.5 9h6M7.5 12h4"></path>',
    target: '<circle cx="12" cy="12" r="8.5"></circle><circle cx="12" cy="12" r="4.5"></circle><circle cx="12" cy="12" r="1"></circle>',
    library: '<path d="M4 4.5h11a2 2 0 0 1 2 2v13H6a2 2 0 0 1-2-2Z"></path><path d="M17 19.5h2a1 1 0 0 0 1-1v-13a2 2 0 0 0-2-2H7"></path><path d="M7.5 8h6M7.5 11h5"></path>',
    grid: '<rect x="4" y="4" width="6" height="6" rx="1"></rect><rect x="14" y="4" width="6" height="6" rx="1"></rect><rect x="4" y="14" width="6" height="6" rx="1"></rect><rect x="14" y="14" width="6" height="6" rx="1"></rect>',
    chart: '<path d="M4 19.5V11M10 19.5V5M16 19.5v-8M22 19.5H2"></path>',
    settings: '<path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"></path><path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3.1 1.3v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3.1-1.3l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-1.3-3.1h-.2a1.8 1.8 0 0 1 0-3.6h.2A1.8 1.8 0 0 0 4.6 5l-.1-.1A1.8 1.8 0 0 1 7 2.4l.1.1a1.8 1.8 0 0 0 3.1-1.3V1a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3.1 1.3l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 1.3 3.1h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-1.3 3.1Z"></path>',
    more: '<circle cx="5" cy="12" r="1.2"></circle><circle cx="12" cy="12" r="1.2"></circle><circle cx="19" cy="12" r="1.2"></circle>',
    arrow: '<path d="M4 12h15M13 6l6 6-6 6"></path>',
    back: '<path d="M19 12H5M11 18l-6-6 6-6"></path>',
    skipPrev: '<path d="M6 5v14M19 6 9 12l10 6Z"></path>',
    skipNext: '<path d="M18 5v14M5 6l10 6-10 6Z"></path>',
    chevron: '<path d="m9 18 6-6-6-6"></path>',
    check: '<path d="m5 12 4.2 4.2L19 6.5"></path>',
    play: '<path d="m8 5 11 7-11 7Z" fill="currentColor" stroke="none"></path>',
    pause: '<rect x="6.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"></rect><rect x="13.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"></rect>',
    repeat: '<path d="M17 3.8 20.5 7 17 10.2"></path><path d="M4 8.2V7a3 3 0 0 1 3-3h13.5M7 20.2 3.5 17 7 13.8"></path><path d="M20 15.8V17a3 3 0 0 1-3 3H3.5"></path>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"></path>',
    flag: '<path d="M5 21V4.2M5 5c4-2.5 6 .9 10-1.5v9c-4 2.4-6-1-10 1.5"></path>',
    download: '<path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M4 20h16"></path>',
    upload: '<path d="M12 15V3M7.5 7.5 12 3l4.5 4.5M4 20h16"></path>',
    filter: '<path d="M4 5h16M7 12h10M10 19h4"></path>',
    clock: '<circle cx="12" cy="12" r="8.5"></circle><path d="M12 7v5l3.5 2"></path>',
    spark: '<path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7Z"></path><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7Z"></path>',
    close: '<path d="m6 6 12 12M18 6 6 18"></path>',
    info: '<circle cx="12" cy="12" r="9"></circle><path d="M12 10v6M12 7.2v.1"></path>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path>',
    bulb: '<path d="M8.4 15.5h7.2M9 18h6M10 21h4"></path><path d="M7.3 12.8a6 6 0 1 1 9.4 0c-1 1.1-1.4 1.7-1.4 2.7H8.7c0-1-.4-1.6-1.4-2.7Z"></path>',
    book: '<path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2Z"></path><path d="M5 18.5a2 2 0 0 1 2-2h12M8.5 8h6M8.5 11h5"></path>',
    lightning: '<path d="m13 2-8 11h6l-1 9 8-12h-6Z"></path>'
  };

  function icon(name, cls) {
    return '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON_PATHS[name] || ICON_PATHS.info) + "</svg>";
  }

  /* Back/forward-10 glyph: open circle with an arrowhead at the top and a bold "10" centred inside. */
  function jumpIconSVG(direction) {
    const forward = direction > 0;
    const arc = forward ? "M16 6.2A10.8 10.8 0 1 0 25.35 11.6" : "M16 6.2A10.8 10.8 0 1 1 6.65 11.6";
    const head = forward ? "M12.6 2.7 16.1 6.2 12.6 9.7" : "M19.4 2.7 15.9 6.2 19.4 9.7";
    return '<svg class="audio-jump-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + arc + '"></path><path d="' + head + '"></path><text x="16" y="21.1" text-anchor="middle" fill="currentColor" stroke="none" font-size="11.5" font-weight="800" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif" letter-spacing="-.3">10</text></svg>';
  }

  document.querySelectorAll("[data-icon]").forEach(function (node) {
    node.innerHTML = icon(node.getAttribute("data-icon"));
  });

  function blankState() {
    return {
      version: 1,
      theme: "dark",
      fontSize: 17,
      bookFont: 16,
      examDate: "",
      audioSpeed: 1,
      newCardsPerDay: 20,
      completed: {},
      opened: {},
      confident: {},
      scroll: {},
      bookScroll: {},
      reading: {},
      lessonQuizBest: {},
      lastLesson: "",
      lastActivity: { type: "lesson", lessonId: "" },
      resumeQuiz: null,
      activity: {},
      daily: {},
      cards: {},
      srs: { day: "", newIntroduced: 0 },
      questions: {},
      exams: [],
      lastMockQuestionIds: [],
      audio: { positions: {}, listened: {}, progress: {}, playAll: false, includeDetails: false },
      videos: { watched: {} }
    };
  }

  function normalizeState(value) {
    const base = blankState();
    if (!value || typeof value !== "object") return base;
    const result = Object.assign(base, value);
    ["completed", "opened", "confident", "scroll", "bookScroll", "reading", "lessonQuizBest", "activity", "daily", "cards", "questions"].forEach(function (key) {
      if (!result[key] || typeof result[key] !== "object" || Array.isArray(result[key])) result[key] = {};
    });
    if (!Array.isArray(result.exams)) result.exams = [];
    if (!Array.isArray(result.lastMockQuestionIds)) result.lastMockQuestionIds = [];
    if (!result.audio || typeof result.audio !== "object") result.audio = {};
    if (!result.audio.positions || typeof result.audio.positions !== "object") result.audio.positions = {};
    if (!result.audio.listened || typeof result.audio.listened !== "object") result.audio.listened = {};
    if (!result.audio.progress || typeof result.audio.progress !== "object") result.audio.progress = {};
    if (typeof result.audio.playAll !== "boolean") result.audio.playAll = false;
    if (typeof result.audio.includeDetails !== "boolean") result.audio.includeDetails = false;
    if (!result.lastActivity || typeof result.lastActivity !== "object") result.lastActivity = { type: "lesson", lessonId: result.lastLesson || "" };
    if (result.resumeQuiz != null && typeof result.resumeQuiz !== "object") result.resumeQuiz = null;
    if (!result.srs || typeof result.srs !== "object") result.srs = { day: "", newIntroduced: 0 };
    if (typeof result.srs.day !== "string") result.srs.day = "";
    if (!Number.isFinite(Number(result.srs.newIntroduced))) result.srs.newIntroduced = 0;
    if (!result.videos || typeof result.videos !== "object") result.videos = { watched: {} };
    if (!result.videos.watched || typeof result.videos.watched !== "object") result.videos.watched = {};
    if (!Number.isFinite(Number(result.newCardsPerDay))) result.newCardsPerDay = 20;
    result.newCardsPerDay = Math.min(100, Math.max(0, Math.round(Number(result.newCardsPerDay))));
    if (!["light", "dark"].includes(result.theme)) result.theme = "dark";
    if (!Number.isFinite(Number(result.fontSize))) result.fontSize = 17;
    if (!Number.isFinite(Number(result.bookFont))) result.bookFont = 16;
    if (!Number.isFinite(Number(result.audioSpeed))) result.audioSpeed = 1;
    return result;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem("cysa.v1");
      return normalizeState(raw ? JSON.parse(raw) : null);
    } catch (error) {
      return blankState();
    }
  }

  let state = loadState();

  function saveState() {
    try { localStorage.setItem("cysa.v1", JSON.stringify(state)); } catch (error) { /* private mode / quota */ }
    updateDueBadges();
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme === "light" ? "light" : "dark");
    const background = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (meta) { if (background) meta.setAttribute("content", background); });
  }

  function applyPreferences() {
    setTheme(state.theme);
    document.documentElement.style.setProperty("--base-size", Math.min(20, Math.max(16, Number(state.fontSize) || 17)) + "px");
    const themeButton = document.getElementById("headerTheme");
    if (themeButton) themeButton.title = state.theme === "system" ? "Theme: dark" : "Theme: " + state.theme;
  }
  applyPreferences();

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function decodeText(value) {
    const area = document.createElement("textarea");
    area.innerHTML = String(value == null ? "" : value);
    return area.value;
  }

  function stripHTML(value) {
    const div = document.createElement("div");
    div.innerHTML = String(value || "");
    return (div.textContent || "").replace(/\s+/g, " ").trim();
  }

  function contentHTML(value) {
    if (!value) return "";
    let html = String(value);
    html = html.replace(/<table\b/gi, '<div class="table-wrap"><table').replace(/<\/table>/gi, "</table></div>");
    return html;
  }

  function examInfo() {
    return Object.assign({ questions: 85, minutes: 165, passing: 750, scale: "100-900" }, CORE.exam || {});
  }

  function examMinutes() { return Number(examInfo().minutes) || 165; }
  function examPassing() { return Number(examInfo().passing) || 750; }
  function scaledEstimate(percent) {
    const scale = String(examInfo().scale || "100-900").match(/(\d+)\s*[-–]\s*(\d+)/);
    const low = scale ? Number(scale[1]) : 100;
    const high = scale ? Number(scale[2]) : 900;
    return low + Math.round((Math.max(0, Math.min(100, Number(percent) || 0)) / 100) * (high - low));
  }

  function formatDuration(seconds) {
    const n = Math.max(0, Math.round(Number(seconds) || 0));
    return Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0");
  }

  function formatDate(value, options) {
    if (!value) return "Not set";
    try { return new Intl.DateTimeFormat(undefined, options || { month: "short", day: "numeric", year: "numeric" }).format(new Date(value + "T12:00:00")); } catch (error) { return value; }
  }

  function todayKey(date) {
    const d = date || new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function touchActivity(kind) {
    const day = todayKey();
    state.activity[day] = true;
    if (!state.daily[day]) state.daily[day] = { questions: 0, cards: 0, lessons: 0 };
    if (kind === "question") state.daily[day].questions = (state.daily[day].questions || 0) + 1;
    if (kind === "card") state.daily[day].cards = (state.daily[day].cards || 0) + 1;
    if (kind === "lesson") state.daily[day].lessons = (state.daily[day].lessons || 0) + 1;
  }

  function streakCount() {
    let count = 0;
    const date = new Date();
    while (true) {
      const key = todayKey(date);
      if (!state.activity[key]) break;
      count += 1;
      date.setDate(date.getDate() - 1);
    }
    return count;
  }

  function getLesson(id) { return CORE.lessons.find(function (lesson) { return lesson.id === id; }); }
  function getChapter(n) { return CORE.chapters.find(function (chapter) { return Number(chapter.n) === Number(n); }); }
  function getDomain(n) { return CORE.domains.find(function (domain) { return Number(domain.n) === Number(n); }); }
  function chapterLessons(n) { return CORE.lessons.filter(function (lesson) { return Number(lesson.ch) === Number(n); }); }
  function domainLessons(n) { return CORE.lessons.filter(function (lesson) { return Number(lesson.domain) === Number(n); }); }
  function domainName(n) { return (getDomain(n) || {}).title || "Domain " + n; }
  function lessonTitle(id) { return decodeText((getLesson(id) || {}).title || id); }

  function hasData(name) { return typeof window[dataConfig[name].global] !== "undefined"; }

  function loadData(name) {
    if (!dataConfig[name]) return Promise.reject(new Error("Unknown data file"));
    if (hasData(name)) return Promise.resolve(window[dataConfig[name].global]);
    if (dataPromises[name]) return dataPromises[name];
    dataPromises[name] = new Promise(function (resolve, reject) {
      const script = document.createElement("script");
      script.src = dataConfig[name].src;
      script.async = true;
      script.onload = function () {
        if (hasData(name)) resolve(window[dataConfig[name].global]);
        else reject(new Error("Missing " + dataConfig[name].global));
      };
      script.onerror = function () { reject(new Error("Could not load " + dataConfig[name].label)); };
      document.head.appendChild(script);
    });
    return dataPromises[name];
  }

  function showLoading(label) {
    app.innerHTML = '<div class="loading-page" aria-busy="true"><div class="skeleton" style="width:110px;height:13px"></div><div class="skeleton" style="width:68%;height:38px"></div><div class="skeleton" style="width:48%;height:18px"></div><div class="skeleton large"></div><div class="skeleton" style="height:110px"></div><p class="muted" style="margin-top:4px">Loading ' + escapeHTML(label || "your workspace") + '…</p></div>';
  }

  function showError(error) {
    app.innerHTML = '<section class="surface empty-state"><div class="empty-icon">' + icon("info") + '</div><h2>That section is taking a break</h2><p>' + escapeHTML(error && error.message ? error.message : "The data could not be loaded.") + '</p><a class="button primary" href="#/home">Back to Today</a></section>';
  }

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }

  function routeFromHash() {
    let raw = location.hash.replace(/^#/, "") || "/home";
    if (raw.charAt(0) !== "/") raw = "/" + raw;
    const pieces = raw.split("?");
    let path = pieces.shift() || "/home";
    const anchorParts = path.split("#");
    path = anchorParts.shift() || "/home";
    return { path: path, anchor: anchorParts.join("#"), parts: path.split("/").filter(Boolean).map(function (part) { try { return decodeURIComponent(part); } catch (error) { return part; } }), params: new URLSearchParams(pieces.join("?")) };
  }

  function go(path) {
    const hash = path.charAt(0) === "#" ? path : "#/" + path.replace(/^\//, "");
    if (location.hash === hash) renderRoute();
    else location.hash = hash;
  }

  function setLastActivity(activity) {
    state.lastActivity = Object.assign({ at: Date.now() }, activity || {});
    saveState();
  }

  function replaceHash(path) {
    const hash = path.charAt(0) === "#" ? path : "#/" + path.replace(/^\//, "");
    history.replaceState(null, "", hash);
    activeRoute = routeFromHash();
  }

  function openMenu() {
    const sheet = document.getElementById("menuSheet");
    if (!sheet) return;
    menuOpen = true;
    sheet.hidden = false;
    document.body.classList.add("modal-open");
    const button = document.getElementById("headerMenu");
    if (button) button.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    const sheet = document.getElementById("menuSheet");
    menuOpen = false;
    if (sheet) sheet.hidden = true;
    document.body.classList.remove("modal-open");
    const button = document.getElementById("headerMenu");
    if (button) button.setAttribute("aria-expanded", "false");
  }

  function setRouteNav(route) {
    const primary = route.parts[0] || "home";
    let active = primary;
    if (primary === "lesson") active = "learn";
    if (primary === "quiz" || primary === "exam") active = "practice";
    if (primary === "search") active = "";
    if (primary === "question") active = "practice";
    if (primary === "audio" || primary === "videos" || primary === "listen") active = "listen";
    if (primary === "objectives") active = "objectives";
    document.querySelectorAll("[data-nav]").forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("data-nav") === active || (active === "more" && link.getAttribute("data-nav") === "more"));
    });
    const context = document.getElementById("topbarContext");
    if (context) {
      const labels = { home: "Today", learn: "Learn", lesson: "Lesson", audio: "Listen", videos: "Listen", listen: "Listen", objectives: "Objectives", cards: "Cards", practice: "Practice", quiz: "Practice", exam: "Practice", book: "Study guide", reference: "Reference", stats: "Stats", settings: "Settings", search: "Search", question: "Question", more: "More" };
      context.textContent = labels[primary] || "CySA+";
    }
  }

  /* In-page jumps always move the window itself, instantly, and honour the target's scroll-margin-top.
     Element.scrollIntoView() combined with the global `scroll-behavior: smooth` animated ~10k px over
     1.5s+ on phones, and screenshots/frames taken during that animation showed the sticky header pushed
     down with a blank band above it. An instant window scroll keeps the sticky header flush at top:0. */
  function scrollToElement(target) {
    if (!target) return;
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const top = Math.max(0, Math.round(target.getBoundingClientRect().top + window.scrollY - margin));
    window.scrollTo({ left: 0, top: top, behavior: "instant" });
  }

  function scrollAfterRender(route) {
    const isLesson = route.parts[0] === "lesson";
    const isBookChapter = route.parts[0] === "book" && route.parts[1];
    requestAnimationFrame(function () {
      if (isLesson && readingLessonId) {
        const saved = Number(state.scroll[readingLessonId] || 0);
        window.scrollTo({ left: 0, top: saved, behavior: "instant" });
        updateReadingProgress();
        const focus = route.params.get("focus");
        if (focus) setTimeout(function () { const target = document.getElementById("lesson-section-" + focus); if (target) scrollToElement(target); }, 40);
      } else if (isBookChapter && bookChapterNumber) {
        const savedBook = Number(state.bookScroll[bookChapterNumber] || 0);
        window.scrollTo({ left: 0, top: savedBook, behavior: "instant" });
        const section = route.params.get("section");
        if (section) {
          const target = document.getElementById("book-section-" + section);
          if (target) setTimeout(function () { scrollToElement(target); }, 30);
        }
      } else if (route.anchor) {
        const target = document.getElementById(route.anchor) || document.getElementById("obj-" + route.anchor.replace(/^obj-/, ""));
        if (target) setTimeout(function () { scrollToElement(target); }, 30);
      } else {
        window.scrollTo({ left: 0, top: 0, behavior: "instant" });
      }
    });
  }

  function compactPageHeader() {
    const head = app.querySelector(".page-head");
    const title = head && head.querySelector("h1");
    if (!title) return;
    const copy = {
      "Press play, keep moving.": ["Audio", "Narrated lessons with resume positions and playlist playback."],
      "Listen when your hands are busy.": ["Audio", "Narrated lessons with resume positions and playlist playback."],
      "Glossary for quick recall.": ["Glossary", "Search terms and jump back to lessons."],
      "Keep the useful edges close.": ["Cheat sheets", "Compact lookup tables for ports, tools, and commands."],
      "Make confidence visible.": ["Chapter checklist", "Tick a chapter line when you can explain it without looking."],
      "Study guide, without the weight.": ["Study guide", "12 chapters of reference text, labs, and essentials."],
      "Settings that stay yours.": ["Settings", "Local preferences and progress backup."],
      "Find the thread.": ["Search", "Find lessons, terms, book sections, and questions."]
    }[title.textContent.trim()];
    if (!copy) return;
    title.textContent = copy[0];
    const lead = head.querySelector(".lead");
    if (lead) lead.textContent = copy[1];
  }

  async function renderRoute() {
    const route = routeFromHash();
    const version = ++routeVersion;
    activeRoute = route;
    setRouteNav(route);
    closeMenu();
    readingLessonId = null;
    bookChapterNumber = null;
    try {
      switch (route.parts[0] || "home") {
        case "home": await renderHomeV2(); break;
        case "learn": await renderLearn(route); break;
        case "lesson": await renderLessonHub(route.parts[1]); break;
        case "audio": await renderAudioPage(); break;
        case "videos": await renderVideos(route); break;
        case "listen": if (route.parts[1] === "videos") await renderVideos(route, true); else await renderAudioPage(true); break;
        case "objectives": await renderOfficialObjectives(route); break;
        case "cards": await renderCards(route); break;
        case "practice": await renderPractice(route); break;
        case "quiz": await renderQuizRoute(route); break;
        case "exam": await renderExamRoute(route); break;
        case "question": await renderQuestionPage(route.parts[1]); break;
        case "book": await renderBook(route); break;
        case "reference": await renderReference(route); break;
        case "stats": await renderStats(); break;
        case "settings": renderSettings(); break;
        case "search": await renderSearch(route); break;
        case "more": renderMore(); break;
        default: go("home"); return;
      }
      compactPageHeader();
      syncInlinePlayerObserver();
      if (version === routeVersion) scrollAfterRender(route);
    } catch (error) {
      if (version === routeVersion) showError(error);
    }
    updateDueBadges();
  }

  function dueDate(value) { return value ? new Date(value).getTime() : 0; }
  function cardState(key) {
    if (!state.cards[key] || typeof state.cards[key] !== "object") state.cards[key] = { box: 0, due: 0, seen: 0, introduced: false, starred: false, streak: 0 };
    if (typeof state.cards[key].introduced !== "boolean") state.cards[key].introduced = Number(state.cards[key].seen || 0) > 0;
    return state.cards[key];
  }

  function allCards() {
    const lessons = window.LESSONS || {};
    const cards = [];
    CORE.lessons.forEach(function (meta) {
      const lesson = lessons[meta.id];
      if (!lesson || !Array.isArray(lesson.cards)) return;
      lesson.cards.forEach(function (pair, index) {
        if (!Array.isArray(pair)) return;
        cards.push({ key: meta.id + ":" + index, lessonId: meta.id, chapter: meta.ch, domain: meta.domain, title: decodeText(meta.title), front: pair[0] || "", back: pair[1] || "", type: "lesson" });
      });
    });
    (window.GLOSSARY || []).forEach(function (entry, index) {
      cards.push({ key: "glossary:" + index, lessonId: (entry.l || [])[0] || "", chapter: getLesson((entry.l || [])[0] || "")?.ch || "", domain: getLesson((entry.l || [])[0] || "")?.domain || "", title: "Glossary", front: entry.t || "", back: entry.d || "", type: "glossary" });
    });
    return cards;
  }

  function ensureSrsDay() {
    const day = todayKey();
    if (state.srs.day !== day) { state.srs.day = day; state.srs.newIntroduced = 0; }
    return state.srs;
  }

  function newCardsPerDay() {
    const value = Number(state.newCardsPerDay);
    return Math.min(100, Math.max(0, Number.isFinite(value) ? Math.round(value) : 20));
  }

  function cardIsEligibleForIntro(card) {
    return !!card.lessonId && (!!state.opened[card.lessonId] || !!state.completed[card.lessonId]);
  }

  function isCardIntroduced(card) {
    const saved = cardState(card.key);
    return !!saved.introduced || Number(saved.seen || 0) > 0;
  }

  function isReviewDue(card) {
    if (!isCardIntroduced(card)) return false;
    const saved = cardState(card.key);
    return !saved.due || dueDate(saved.due) <= Date.now();
  }

  function eligibleNewCards(source) {
    const srs = ensureSrsDay();
    const remaining = Math.max(0, newCardsPerDay() - Number(srs.newIntroduced || 0));
    if (!remaining) return [];
    return source.filter(function (card) { return !isCardIntroduced(card) && cardIsEligibleForIntro(card); }).slice(0, remaining);
  }

  function dueCardsForSource(source) {
    const reviews = source.filter(isReviewDue);
    const fresh = eligibleNewCards(source.filter(function (card) { return !isReviewDue(card); }));
    return reviews.concat(fresh);
  }

  function introduceCards(cards) {
    const srs = ensureSrsDay();
    let added = 0;
    cards.forEach(function (card) {
      const saved = cardState(card.key);
      if (isCardIntroduced(card) || !cardIsEligibleForIntro(card) || Number(srs.newIntroduced || 0) >= newCardsPerDay()) return;
      saved.introduced = true;
      saved.introducedAt = Date.now();
      saved.due = Date.now();
      srs.newIntroduced = Number(srs.newIntroduced || 0) + 1;
      added += 1;
    });
    return added;
  }

  function isCardDue(card) { return isReviewDue(card); }

  function isCardMastered(card) { return Number(cardState(card.key).box || 0) >= 4; }

  function dueCardsCount() { return dueCardsForSource(allCards()).length; }

  function updateDueBadges() {
    if (!hasData("lessons")) return;
    const count = dueCardsCount();
    [document.getElementById("navDue"), document.getElementById("mobileDue")].forEach(function (node) {
      if (!node) return;
      node.hidden = count < 1;
      node.textContent = count > 99 ? "99+" : String(count);
    });
  }

  function completedCount() { return CORE.lessons.filter(function (lesson) { return state.completed[lesson.id]; }).length; }
  function lessonQuizBestPercent(id) {
    const saved = Number(state.lessonQuizBest[id]);
    if (Object.prototype.hasOwnProperty.call(state.lessonQuizBest, id) && Number.isFinite(saved)) return saved;
    const tagged = (window.QUESTIONS || []).filter(function (question) { return question.l === id || question.l2 === id; });
    let attempts = 0; let correct = 0;
    tagged.forEach(function (question) { const record = state.questions[question.id]; if (!record) return; attempts += Number(record.attempts || 0); correct += Number(record.correct || 0); });
    return attempts ? Math.round((correct / attempts) * 100) : null;
  }
  function lessonStepState(id) {
    const cards = allCards().filter(function (card) { return card.lessonId === id; });
    const hasWatched = videoSegmentsForLesson(id).some(function (segment) { return !!state.videos.watched[segmentKey(segment)]; });
    return {
      read: !!state.reading[id] || !!state.completed[id],
      listen: Number(state.audio.progress[id] || 0) >= 90 || !!state.audio.listened[id],
      cards: cards.some(function (card) { return Number(cardState(card.key).seen || 0) > 0; }),
      quiz: lessonQuizBestPercent(id),
      watch: hasWatched,
      complete: !!state.completed[id]
    };
  }
  function lessonStepDotsHTML(id) {
    const steps = lessonStepState(id);
    return '<span class="lesson-step-dots" aria-label="Lesson study steps"><i class="' + (steps.read ? "done" : "") + '" title="Read"></i><i class="' + (steps.listen ? "done" : "") + '" title="Listened"></i><i class="' + (steps.cards ? "done" : "") + '" title="Cards reviewed"></i><i class="' + (steps.quiz != null ? "done" : "") + '" title="Quiz' + (steps.quiz != null ? " · " + steps.quiz + "%" : "") + '"></i><i class="' + (steps.watch ? "done" : "") + '" title="Watched"></i></span>';
  }
  function lessonStepLabel(value) { return value == null ? "Not started" : value + "% best"; }
  function answeredQuestionCount() { return Object.values(state.questions).filter(function (item) { return item && Number(item.attempts) > 0; }).length; }
  function questionAccuracy() {
    let correct = 0; let total = 0;
    Object.values(state.questions).forEach(function (item) { if (!item) return; correct += Number(item.correct || 0); total += Number(item.attempts || 0); });
    return total ? Math.round((correct / total) * 100) : null;
  }
  function missedQuestionCount() { return Object.values(state.questions).filter(function (item) { return item && item.missed; }).length; }
  function questionRecord(id) {
    if (!state.questions[id] || typeof state.questions[id] !== "object") state.questions[id] = { attempts: 0, correct: 0, streak: 0, missed: false, flagged: false, history: [] };
    const record = state.questions[id];
    if (!Array.isArray(record.history)) record.history = [];
    return record;
  }
  function isQuestionMissed(id) { const q = state.questions[id]; return !!(q && q.missed); }
  function isQuestionFlagged(id) { const q = state.questions[id]; return !!(q && q.flagged); }

  function recordQuestionAnswer(question, correct, choice) {
    const record = questionRecord(question.id);
    record.attempts = Number(record.attempts || 0) + 1;
    record.correct = Number(record.correct || 0) + (correct ? 1 : 0);
    record.streak = correct ? Number(record.streak || 0) + 1 : 0;
    record.missed = correct ? record.streak < 2 && !!record.missed : true;
    record.last = Date.now();
    record.history.push({ correct: !!correct, choice: choice, at: Date.now() });
    if (record.history.length > 30) record.history = record.history.slice(-30);
    const day = todayKey();
    touchActivity("question");
    if (!state.daily[day]) state.daily[day] = { questions: 0, cards: 0, lessons: 0 };
    saveState();
  }

  function rateCard(card, rating) {
    introduceCards([card]);
    const saved = cardState(card.key);
    const intervals = [0, 1, 3, 7, 14, 30, 60];
    let box = Number(saved.box || 0);
    if (rating === "again") { box = Math.max(0, box - 2); saved.streak = 0; saved.due = Date.now(); }
    if (rating === "hard") { box = Math.max(1, box); saved.streak = 0; saved.due = Date.now() + 86400000; }
    if (rating === "good") { box = Math.min(6, box + 1); saved.streak = Number(saved.streak || 0) + 1; saved.due = Date.now() + intervals[Math.min(6, box)] * 86400000; }
    if (rating === "easy") { box = Math.min(6, box + 2); saved.streak = Number(saved.streak || 0) + 1; saved.due = Date.now() + intervals[Math.min(6, box)] * 86400000; }
    saved.box = box;
    saved.seen = Number(saved.seen || 0) + 1;
    saved.last = Date.now();
    touchActivity("card");
    saveState();
  }

  function cardFilter(deck) {
    const cards = allCards();
    if (!deck || deck === "all") return cards;
    if (deck === "due") return dueCardsForSource(cards);
    if (deck === "starred") return cards.filter(function (card) { return !!cardState(card.key).starred; });
    if (deck === "glossary") return cards.filter(function (card) { return card.type === "glossary"; });
    if (deck.indexOf("domain:") === 0) return cards.filter(function (card) { return Number(card.domain) === Number(deck.split(":")[1]); });
    if (deck.indexOf("chapter:") === 0) return cards.filter(function (card) { return Number(card.chapter) === Number(deck.split(":")[1]); });
    if (deck.indexOf("lesson:") === 0) return cards.filter(function (card) { return card.lessonId === deck.slice(7); });
    return cards;
  }

  function deckName(deck) {
    if (deck === "all") return "All lesson cards";
    if (deck === "due") return "Due today";
    if (deck === "starred") return "My starred cards";
    if (deck === "glossary") return "Glossary cards";
    if (deck && deck.indexOf("domain:") === 0) return domainName(deck.split(":")[1]);
    if (deck && deck.indexOf("chapter:") === 0) return "Chapter " + deck.split(":")[1] + " · " + decodeText((getChapter(deck.split(":")[1]) || {}).title || "");
    if (deck && deck.indexOf("lesson:") === 0) return lessonTitle(deck.slice(7));
    return "Flashcards";
  }

  function progressBar(percent, domain) { return '<div class="progress-track"><div class="progress-fill' + (domain ? " domain-" + domain : "") + '" style="width:' + Math.max(0, Math.min(100, percent || 0)) + '%"></div></div>'; }

  function nextLesson() {
    const last = getLesson(state.lastLesson);
    if (last && !state.completed[last.id]) return last;
    return CORE.lessons.find(function (lesson) { return !state.completed[lesson.id] && lesson.ready; }) || CORE.lessons.find(function (lesson) { return !state.completed[lesson.id]; }) || CORE.lessons[0];
  }

  function continueTarget() {
    const activity = state.lastActivity || {};
    const activityLesson = getLesson(activity.lessonId || audioLessonId(activity.audioId));
    if (activity.type === "quiz" && state.resumeQuiz) return { href: "#/quiz/run?mode=" + encodeURIComponent(state.resumeQuiz.mode || "tutor"), label: "Resume " + (state.resumeQuiz.name || "quiz"), detail: "Unfinished quiz · question " + (Number(state.resumeQuiz.index || 0) + 1) + " of " + ((state.resumeQuiz.questions || []).length || "?") };
    if (activity.type === "audio" && activityLesson) return { href: "#/lesson/" + encodeURIComponent(activityLesson.id) + "?focus=listen", label: lessonTitle(activityLesson.id), detail: (isDetailsTrack(activity.audioId) && CORE.audio && CORE.audio[activity.audioId] ? "Resume details track at " + formatDuration(state.audio.positions[activity.audioId] || 0) : "Resume audio at " + formatDuration(state.audio.positions[activityLesson.id] || 0)) };
    if (activity.type === "lesson" && activityLesson) return { href: "#/lesson/" + encodeURIComponent(activityLesson.id), label: lessonTitle(activityLesson.id), detail: "Pick up where you left off." };
    const lesson = nextLesson();
    return lesson ? { href: "#/lesson/" + encodeURIComponent(lesson.id), label: lessonTitle(lesson.id), detail: lesson.ready ? "Your next lesson in study order." : "The next lesson is being prepared." } : { href: "#/learn", label: "Choose a lesson", detail: "Open the study path to begin." };
  }

  function greeting() {
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning, analyst." : hour < 18 ? "Good afternoon, analyst." : "Good evening, analyst.";
  }

  function examCountdown() {
    if (!state.examDate) return { number: "—", label: "Set your exam date", date: "Your countdown will live here." };
    const exam = new Date(state.examDate + "T23:59:59");
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = Math.ceil((exam.getTime() - today.getTime()) / 86400000);
    return { number: days < 0 ? "✓" : String(days), label: days < 0 ? "Exam date passed" : days === 0 ? "Exam day" : days === 1 ? "day to go" : "days to go", date: formatDate(state.examDate) };
  }

  async function renderHome() {
    showLoading("your progress");
    await Promise.all([loadData("lessons"), loadData("glossary")]);
    const countdown = examCountdown();
    const next = nextLesson();
    const complete = completedCount();
    const total = CORE.lessons.length || 0;
    const accuracy = questionAccuracy();
    const due = dueCardsCount();
    const mastered = allCards().filter(isCardMastered).length;
    const cardTotal = allCards().length;
    app.innerHTML = '<div class="home-intro"><p class="eyebrow">' + todayKey() + ' · YOUR STUDY DESK</p><h1>' + greeting() + '</h1><p class="lead">A focused place to build the analyst instincts that make the CySA+ exam feel familiar.</p></div>' +
      '<div class="home-grid"><section class="surface countdown-card"><p class="eyebrow">EXAM COUNTDOWN</p><h2>Keep the finish line in view.</h2><div class="countdown-number"><b>' + escapeHTML(countdown.number) + '</b><span>' + escapeHTML(countdown.label) + '</span></div><p class="countdown-date">' + escapeHTML(countdown.date) + ' · <a style="color:inherit;text-decoration:underline" href="#/settings">Edit in Settings</a></p></section>' +
      '<section class="surface resume-card"><div class="resume-heading"><div><p class="eyebrow">CONTINUE WHERE YOU LEFT OFF</p><h2>Keep the thread.</h2></div><span class="resume-glyph">' + icon("arrow") + '</span></div><div><p class="lesson-name">' + escapeHTML(next ? lessonTitle(next.id) : "Choose your first lesson") + '</p><a class="button primary" href="#/lesson/' + (next ? encodeURIComponent(next.id) : "") + '">' + icon("play") + ' Continue learning</a></div></section></div>' +
      '<div class="metric-grid section-block"><section class="surface metric-card"><span class="metric-icon">' + icon("book-open") + '</span><div class="metric-label">Lessons complete</div><div class="metric-value">' + complete + '<span class="muted" style="font-size:16px;font-weight:600"> / ' + total + '</span></div><div class="metric-detail">' + Math.round((complete / Math.max(total, 1)) * 100) + '% of the path</div></section>' +
      '<section class="surface metric-card"><span class="metric-icon">' + icon("target") + '</span><div class="metric-label">Questions answered</div><div class="metric-value">' + answeredQuestionCount() + '</div><div class="metric-detail">' + (accuracy == null ? "No answers yet" : accuracy + "% accuracy") + '</div></section>' +
      '<section class="surface metric-card"><span class="metric-icon">' + icon("cards") + '</span><div class="metric-label">Cards mastered</div><div class="metric-value">' + mastered + '</div><div class="metric-detail">' + due + ' due · ' + cardTotal + ' total</div></section>' +
      '<section class="surface metric-card"><span class="metric-icon">' + icon("lightning") + '</span><div class="metric-label">Study streak</div><div class="metric-value">' + streakCount() + '<span class="muted" style="font-size:16px;font-weight:600"> days</span></div><div class="metric-detail">Small sessions compound.</div></section></div>' +
      '<div class="card-grid section-block"><section class="surface plan-card span-7"><div class="plan-top"><div><p class="eyebrow">TODAY\'S PLAN</p><h2>Three useful reps.</h2></div><span class="status-chip">' + (due + missedQuestionCount() + (next ? 1 : 0)) + ' actions</span></div><ul class="plan-list">' +
      '<li><a class="plan-item" href="#/cards?deck=due"><span class="plan-icon">' + icon("cards") + '</span><span class="plan-copy"><b>' + due + ' flashcards due</b><small>' + (due ? "Review the cards ready for another pass." : "Your queue is clear. Cram any deck when you like.") + '</small></span><span class="plan-arrow">' + icon("chevron") + '</span></a></li>' +
      '<li><a class="plan-item" href="#/practice?filter=missed"><span class="plan-icon">' + icon("target") + '</span><span class="plan-copy"><b>' + missedQuestionCount() + ' misses to review</b><small>' + (missedQuestionCount() ? "Turn the ones that caught you into points." : "Missed questions will collect here automatically.") + '</small></span><span class="plan-arrow">' + icon("chevron") + '</span></a></li>' +
      '<li><a class="plan-item" href="#/lesson/' + (next ? encodeURIComponent(next.id) : "") + '"><span class="plan-icon">' + icon("book-open") + '</span><span class="plan-copy"><b>Next: ' + escapeHTML(next ? lessonTitle(next.id) : "You are all caught up") + '</b><small>' + (next && next.ready ? "A short lesson is a good next move." : "More lesson bodies are being prepared.") + '</small></span><span class="plan-arrow">' + icon("chevron") + '</span></a></li>' +
      '</ul></section><section class="surface plan-card span-5"><div class="plan-top"><div><p class="eyebrow">YOUR RHYTHM</p><h2>Keep it light.</h2></div><span class="resume-glyph">' + icon("spark") + '</span></div><p class="muted">Study a lesson, say the idea back in your own words, then test it. The app remembers the gaps.</p><div style="margin-top:20px">' + progressBar((complete / Math.max(total, 1)) * 100) + '<div class="progress-meta"><span>Study path</span><b>' + Math.round((complete / Math.max(total, 1)) * 100) + '%</b></div></div><div class="row" style="margin-top:21px"><a class="button small" href="#/practice">Build a quiz</a><a class="button small" href="#/stats">See stats</a></div></section></div>' +
      '<section class="section-block"><div class="section-title"><h2>Domains</h2><a href="#/learn" class="subtle">View study path ' + icon("arrow") + '</a></div><div class="domain-grid">' + CORE.domains.map(function (domain) { const lessons = domainLessons(domain.n); const done = lessons.filter(function (lesson) { return state.completed[lesson.id]; }).length; return '<a class="surface domain-card domain-' + domain.n + '" style="--domain-color:var(--domain-' + domain.n + ')" href="#/learn?domain=' + domain.n + '"><div class="domain-index">0' + domain.n + '</div><h3>' + escapeHTML(domain.title) + '</h3>' + progressBar((done / Math.max(lessons.length, 1)) * 100, domain.n) + '<div class="domain-meta"><span>' + done + ' of ' + lessons.length + ' lessons</span><span>' + Math.round((done / Math.max(lessons.length, 1)) * 100) + '%</span></div></a>'; }).join("") + '</div></section>';
    updateDueBadges();
  }

  function examFactsHTML() {
    const exam = CORE.exam || { questions: 85, minutes: 165, passing: 750, scale: "100-900" };
    return '<span class="status-chip">' + escapeHTML(String(exam.questions || 85)) + ' questions</span><span class="status-chip">' + escapeHTML(String(exam.minutes || 165)) + ' min</span><span class="status-chip">Pass ' + escapeHTML(String(exam.passing || 750)) + '/' + escapeHTML(String(exam.scale || "100-900")) + '</span>';
  }

  function segmentKey(segment) { return String(segment.vid || "video") + ":" + String(segment.start || 0) + ":" + String(segment.end || 0); }
  function videoSegmentsForLesson(id) { return (window.VIDEOS && Array.isArray(window.VIDEOS.segments) ? window.VIDEOS.segments : []).filter(function (segment) { return (segment.lessons || []).includes(id); }); }
  function videoSegmentsForVideo(id) { return (window.VIDEOS && Array.isArray(window.VIDEOS.segments) ? window.VIDEOS.segments : []).filter(function (segment) { return segment.vid === id; }); }
  function findVideoSegment(key) { return (window.VIDEOS && Array.isArray(window.VIDEOS.segments) ? window.VIDEOS.segments : []).find(function (segment) { return segmentKey(segment) === key; }); }
  function suggestedSegment(id) {
    const exact = videoSegmentsForLesson(id)[0];
    if (exact) return exact;
    const meta = getLesson(id);
    if (meta) {
      const chapterIds = new Set(chapterLessons(meta.ch).map(function (lesson) { return lesson.id; }));
      const chapterMatch = (window.VIDEOS && window.VIDEOS.segments || []).find(function (segment) { return (segment.lessons || []).some(function (lessonId) { return chapterIds.has(lessonId); }); });
      if (chapterMatch) return chapterMatch;
      const domainIds = new Set(domainLessons(meta.domain).map(function (lesson) { return lesson.id; }));
      const domainMatch = (window.VIDEOS && window.VIDEOS.segments || []).find(function (segment) { return (segment.lessons || []).some(function (lessonId) { return domainIds.has(lessonId); }); });
      if (domainMatch) return domainMatch;
    }
    return (window.VIDEOS && window.VIDEOS.segments || [])[0] || null;
  }
  function videoKindLabel(kind) { return ({ lesson: "Lesson", practice: "Practice", demo: "Demo", story: "Story", intro: "Intro" })[kind] || "Watch"; }
  function segmentHref(segment) { return "#/videos?segment=" + encodeURIComponent(segmentKey(segment)); }

  function videoTime(seconds) { return formatDuration(seconds); }

  function videoLessonChipsHTML(segment) {
    const lessons = Array.isArray(segment.lessons) ? segment.lessons : [];
    if (!lessons.length) return '<span class="subtle">General exam context</span>';
    return lessons.map(function (id) {
      return '<a class="status-chip" href="#/lesson/' + encodeURIComponent(id) + '">' + escapeHTML(lessonTitle(id)) + '</a>';
    }).join("");
  }

  function videoSegmentHTML(segment) {
    const key = segmentKey(segment);
    const watched = !!(state.videos && state.videos.watched && state.videos.watched[key]);
    const open = videoOpenKey === key;
    const start = Math.max(0, Math.floor(Number(segment.start) || 0));
    const end = Math.max(start + 1, Math.floor(Number(segment.end) || start + 1));
    const embed = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(segment.vid) + "?start=" + start + "&end=" + end + "&rel=0&playsinline=1";
    const youtube = "https://youtu.be/" + encodeURIComponent(segment.vid) + "?t=" + start;
    return '<article class="video-segment ' + (watched ? "watched" : "") + (open ? " is-open" : "") + '" data-video-key="' + escapeHTML(key) + '"><div class="video-segment-head"><button class="video-segment-open" data-action="open-video" data-video-key="' + escapeHTML(key) + '" type="button"><span class="video-segment-title"><b>' + escapeHTML(segment.title || "Untitled segment") + '</b><small>' + videoTime(start) + '–' + videoTime(end) + ' · ' + videoTime(end - start) + '</small></span><span class="video-kind kind-' + escapeHTML(segment.kind || "lesson") + '">' + escapeHTML(videoKindLabel(segment.kind)) + '</span></button><button class="video-watched ' + (watched ? "checked" : "") + '" data-action="toggle-video-watched" data-video-key="' + escapeHTML(key) + '" type="button" aria-pressed="' + watched + '" title="' + (watched ? "Mark unwatched" : "Mark watched") + '">' + icon("check") + '<span>' + (watched ? "Watched" : "Mark watched") + '</span></button></div>' + (segment.summary ? '<p class="video-summary">' + escapeHTML(segment.summary) + '</p>' : '') + '<div class="video-lesson-chips">' + videoLessonChipsHTML(segment) + '</div>' + (open ? '<div class="video-player"><iframe src="' + escapeHTML(embed) + '" title="' + escapeHTML(segment.title || "Hank Hackerson segment") + '" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe><div class="video-player-links"><a href="' + escapeHTML(youtube) + '" target="_blank" rel="noopener">Open in YouTube ' + icon("arrow") + '</a><button class="link-button" data-action="close-video" type="button">Close player</button></div></div>' : '') + '</article>';
  }

  function videoProgressHTML(segments) {
    const total = segments.length;
    const watched = segments.filter(function (segment) { return state.videos.watched[segmentKey(segment)]; }).length;
    return '<span class="subtle" data-video-progress="' + escapeHTML(segments[0] ? segments[0].vid : "") + '">' + watched + '/' + total + ' watched</span>';
  }

  function renderVideoCollectionHTML(video, segments) {
    if (!segments.length) {
      return '<div class="video-empty"><p>No mapped segments yet. The episode chapters are available while the lesson mapping finishes.</p><div class="video-chapter-list">' + (video.chapters || []).map(function (chapter) { return '<span><b>' + escapeHTML(chapter.title || "Chapter") + '</b><small>' + videoTime(chapter.start) + '–' + videoTime(chapter.end) + '</small></span>'; }).join("") + '</div></div>';
    }
    return '<div class="video-segment-list">' + segments.map(videoSegmentHTML).join("") + '</div>';
  }

  async function renderVideos(route, hub) {
    showLoading("Hank Hackerson videos");
    await loadData("videos");
    const data = window.VIDEOS || { videos: [], segments: [] };
    const requested = route && route.params ? route.params.get("segment") : "";
    videoOpenKey = requested && findVideoSegment(requested) ? requested : null;
    const episodes = (data.videos || []).filter(function (video) { return video.ep != null; }).sort(function (a, b) { return Number(a.ep) - Number(b.ep); });
    const compilations = (data.videos || []).filter(function (video) { return video.ep == null; });
    const allSegments = Array.isArray(data.segments) ? data.segments : [];
    const watched = allSegments.filter(function (segment) { return state.videos.watched[segmentKey(segment)]; }).length;
    app.innerHTML = '<div class="page-head compact-head"><div><p class="eyebrow">LISTEN · VIDEO LIBRARY</p><h1>Hank Hackerson</h1><p class="lead">Mapped explanations for the next lesson, one focused segment at a time.</p></div><div class="actions"><a class="button" href="' + escapeHTML(data.channelUrl || "https://www.youtube.com") + '" target="_blank" rel="noopener">' + escapeHTML(data.channel || "Hank Hackerson") + ' ' + icon("arrow") + '</a></div></div>' + listenTabsHTML("videos") + '<section class="surface video-intro"><div><p class="eyebrow">WATCH PROGRESS</p><h2>' + watched + ' of ' + allSegments.length + ' mapped segments</h2><p class="muted">Tap a segment to create its lazy embedded player. Use the manual tick to remember what you watched.</p></div>' + progressBar(allSegments.length ? (watched / allSegments.length) * 100 : 0) + '</section><section class="video-library-section"><div class="section-title"><h2>Episodes EP0–EP12</h2><span class="subtle">' + episodes.length + ' episodes</span></div><div class="video-episodes">' + (episodes.length ? episodes.map(function (video, index) { const segments = videoSegmentsForVideo(video.id); return '<details class="surface video-episode" data-video-id="' + escapeHTML(video.id) + '" ' + (videoOpenKey && segments.some(function (segment) { return segmentKey(segment) === videoOpenKey; }) ? "open" : (index === 0 && !videoOpenKey ? "open" : "")) + '><summary><span class="episode-number">EP' + video.ep + '</span><span class="episode-copy"><b>' + escapeHTML(video.title || "Episode " + video.ep) + '</b><small>' + formatDuration(video.duration) + ' · ' + (segments.length ? segments.length + ' mapped segments' : (video.chapters || []).length + ' chapters') + '</small></span><span class="episode-progress">' + (segments.length ? videoProgressHTML(segments) : "Mapping pending") + '</span></summary><div class="video-episode-body">' + renderVideoCollectionHTML(video, segments) + '</div></details>'; }).join("") : '<section class="surface empty-state"><div class="empty-icon">' + icon("play") + '</div><h2>Episodes are being indexed</h2><p>The video data slot is ready; mapped episodes will appear here as they arrive.</p></section>') + '</div></section><section class="video-library-section"><div class="section-title"><h2>Domain compilations</h2><span class="subtle">Long-form review</span></div><div class="video-episodes">' + (compilations.length ? compilations.map(function (video) { const segments = videoSegmentsForVideo(video.id); return '<details class="surface video-episode" data-video-id="' + escapeHTML(video.id) + '"><summary><span class="episode-number">D' + (String(video.title || "").match(/Domain (\\d+)/i) || ["", ""])[1] + '</span><span class="episode-copy"><b>' + escapeHTML(video.title || "Domain compilation") + '</b><small>' + formatDuration(video.duration) + ' · ' + (segments.length ? segments.length + ' mapped segments' : (video.chapters || []).length + ' chapters') + '</small></span><span class="episode-progress">' + (segments.length ? videoProgressHTML(segments) : "Mapping pending") + '</span></summary><div class="video-episode-body">' + renderVideoCollectionHTML(video, segments) + '</div></details>'; }).join("") : '<p class="muted">The four domain compilations will appear here when video data is available.</p>') + '</div></section>';
  }

  function videoPlayerHTML(segment) {
    const start = Math.max(0, Math.floor(Number(segment.start) || 0));
    const end = Math.max(start + 1, Math.floor(Number(segment.end) || start + 1));
    const embed = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(segment.vid) + "?start=" + start + "&end=" + end + "&rel=0&playsinline=1";
    const youtube = "https://youtu.be/" + encodeURIComponent(segment.vid) + "?t=" + start;
    return '<div class="video-player"><iframe src="' + escapeHTML(embed) + '" title="' + escapeHTML(segment.title || "Hank Hackerson segment") + '" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe><div class="video-player-links"><a href="' + escapeHTML(youtube) + '" target="_blank" rel="noopener">Open in YouTube ' + icon("arrow") + '</a><button class="link-button" data-action="close-video" type="button">Close player</button></div></div>';
  }

  function videoSegmentNode(key) {
    return Array.from(document.querySelectorAll(".video-segment[data-video-key]")).find(function (node) { return node.getAttribute("data-video-key") === key; }) || null;
  }

  function openVideoInPlace(key) {
    const segment = findVideoSegment(key);
    const node = segment && videoSegmentNode(key);
    if (!segment || !node) return false;
    videoOpenKey = key;
    node.classList.add("is-open");
    const old = node.querySelector(".video-player");
    if (old) old.remove();
    node.insertAdjacentHTML("beforeend", videoPlayerHTML(segment));
    const episode = node.closest("details");
    if (episode) episode.open = true;
    if (activeRoute && (activeRoute.parts[0] === "videos" || activeRoute.parts[0] === "listen")) replaceHash((activeRoute.parts[0] === "listen" ? "listen/videos" : "videos") + "?segment=" + encodeURIComponent(key));
    return true;
  }

  function closeVideoInPlace() {
    const node = videoOpenKey && videoSegmentNode(videoOpenKey);
    if (node) { node.classList.remove("is-open"); const player = node.querySelector(".video-player"); if (player) player.remove(); }
    videoOpenKey = null;
    if (activeRoute && activeRoute.parts[0] === "videos") replaceHash("videos");
    if (activeRoute && activeRoute.parts[0] === "listen") replaceHash("listen/videos");
  }

  function updateVideoWatchedDOM(key) {
    const node = videoSegmentNode(key);
    if (node) {
      const watched = !!state.videos.watched[key];
      node.classList.toggle("watched", watched);
      const button = node.querySelector('[data-action="toggle-video-watched"]');
      if (button) { button.classList.toggle("checked", watched); button.setAttribute("aria-pressed", String(watched)); button.title = watched ? "Mark unwatched" : "Mark watched"; const label = button.querySelector("span"); if (label) label.textContent = watched ? "Watched" : "Mark watched"; }
    }
    document.querySelectorAll(".video-episode[data-video-id]").forEach(function (episode) {
      const segments = videoSegmentsForVideo(episode.getAttribute("data-video-id"));
      const progress = episode.querySelector(".episode-progress");
      if (progress && segments.length) progress.textContent = segments.filter(function (segment) { return state.videos.watched[segmentKey(segment)]; }).length + "/" + segments.length + " watched";
    });
    const all = (window.VIDEOS && window.VIDEOS.segments) || [];
    const count = all.filter(function (segment) { return state.videos.watched[segmentKey(segment)]; }).length;
    const heading = document.querySelector(".video-intro h2");
    if (heading) heading.textContent = count + " of " + all.length + " mapped segments";
    const fill = document.querySelector(".video-intro .progress-fill");
    if (fill) fill.style.width = (all.length ? (count / all.length) * 100 : 0) + "%";
  }

  function lessonVideoSectionHTML(id) {
    const segments = videoSegmentsForLesson(id);
    if (!segments.length) return '<section class="surface pad lesson-videos"><div class="section-title"><div><p class="eyebrow">HANK HACKERSON</p><h2 style="font-size:20px;margin-bottom:4px">Watch Hank explain it</h2></div><a class="subtle" href="#/videos">Browse videos ' + icon("arrow") + '</a></div><p class="muted" style="margin:0">No mapped segments for this lesson yet. Browse the full video library for the course.</p></section>';
    return '<section class="surface pad lesson-videos"><div class="section-title"><div><p class="eyebrow">HANK HACKERSON</p><h2 style="font-size:20px;margin-bottom:4px">Watch Hank explain it</h2><p class="muted" style="margin:0">' + segments.length + ' mapped segment' + (segments.length === 1 ? "" : "s") + ' for this lesson.</p></div><a class="subtle" href="#/videos">All videos ' + icon("arrow") + '</a></div><div class="video-segment-list">' + segments.map(videoSegmentHTML).join("") + '</div></section>';
  }

  function lessonObjectiveChipsHTML(meta) {
    const ids = Array.isArray(meta.objectives) ? meta.objectives : [];
    if (!ids.length) return "";
    return '<div class="lesson-objectives"><span class="subtle">Official objectives</span><div class="row">' + ids.map(function (id) { return '<a class="status-chip" href="#/reference/objectives#obj-' + encodeURIComponent(id) + '">Objective ' + escapeHTML(id) + '</a>'; }).join("") + '</div></div>';
  }

  function isObjectiveConfident(key) { return !!(state.confident[key] || state.confident["official:" + key]); }
  function objectiveConfidenceKey(key) { return "official:" + key; }
  function objectiveCoverageKey(objectiveId, groupTitle, itemTitle, subTitle) { return objectiveId + "|" + groupTitle + "|" + itemTitle + (subTitle ? " > " + subTitle : ""); }
  function objectiveBulletCount(objective) {
    return (objective.groups || []).reduce(function (sum, group) { return sum + (group.items || []).reduce(function (itemSum, item) { return itemSum + 1 + (item.sub || []).length; }, 0); }, 0);
  }
  function objectiveConfidenceCount(objective) {
    let count = 0;
    (objective.groups || []).forEach(function (group) { (group.items || []).forEach(function (item) { const itemKey = objectiveCoverageKey(objective.id, group.title, item.t); if (isObjectiveConfident(itemKey)) count += 1; (item.sub || []).forEach(function (sub) { if (isObjectiveConfident(objectiveCoverageKey(objective.id, group.title, item.t, sub))) count += 1; }); }); });
    return count;
  }
  function confidencePercent(count, total) { return total ? Math.round((count / total) * 100) : 0; }

  function objectiveLessonChips(key, coverage) {
    const entry = coverage[key] || {};
    const lessons = Array.isArray(entry.lessons) ? entry.lessons : [];
    const cov = entry.cov && entry.cov !== "full" ? '<span class="coverage-chip ' + escapeHTML(entry.cov) + '">' + escapeHTML(entry.cov) + '</span>' : "";
    return '<div class="objective-coverage">' + (lessons.length ? lessons.map(function (id) { return '<a class="status-chip" href="#/lesson/' + encodeURIComponent(id) + '">' + escapeHTML(lessonTitle(id)) + '</a>'; }).join("") : '<span class="subtle">No lesson mapped</span>') + cov + (entry.note ? '<span class="objective-note">' + escapeHTML(entry.note) + '</span>' : "") + '</div>';
  }

  function officialObjectiveBulletHTML(objectiveId, groupTitle, itemTitle, subTitle, coverage) {
    const key = objectiveCoverageKey(objectiveId, groupTitle, itemTitle, subTitle);
    const checked = isObjectiveConfident(key);
    return '<div class="official-bullet ' + (checked ? "done" : "") + '"><input class="check-input" type="checkbox" data-action="objective-check" data-objective="' + escapeHTML(objectiveConfidenceKey(key)) + '" ' + (checked ? "checked" : "") + '><div class="official-bullet-copy"><b>' + escapeHTML(subTitle || itemTitle) + '</b>' + objectiveLessonChips(key, coverage) + '</div></div>';
  }

  async function renderOfficialObjectives(route) {
    showLoading("official objectives");
    await loadData("objectives");
    const data = window.OBJECTIVES || {};
    const outline = data.objectives;
    if (!outline || !Array.isArray(outline.domains)) {
      app.innerHTML = '<div class="page-head compact-head"><div><p class="eyebrow">OFFICIAL OBJECTIVES</p><h1>Objectives</h1><p class="lead">The official outline is not in the current data set yet.</p></div></div><section class="surface empty-state"><div class="empty-icon">' + icon("target") + '</div><h2>Objectives are being prepared</h2><p>The page will render the official CS0-004 outline as soon as <code>data/objectives.js</code> contains it.</p></section>';
      return;
    }
    const coverage = data.coverage || {};
    const totalBullets = outline.domains.reduce(function (sum, domain) { return sum + (domain.objectives || []).reduce(function (objSum, objective) { return objSum + objectiveBulletCount(objective); }, 0); }, 0);
    const confidentBullets = outline.domains.reduce(function (sum, domain) { return sum + (domain.objectives || []).reduce(function (objSum, objective) { return objSum + objectiveConfidenceCount(objective); }, 0); }, 0);
    const tabs = '<div class="objective-tabs"><a class="active" href="#/objectives">Official outline</a><a href="#/reference/objectives">Chapter checklist</a></div>';
    const about = Array.isArray(outline.about) && outline.about.length ? '<section class="surface pad objective-about"><div class="section-title"><h2 style="font-size:20px">What this exam measures</h2><span class="status-chip">' + escapeHTML(outline.exam && outline.exam.code || "CS0-004") + '</span></div><ul>' + outline.about.map(function (item) { return '<li>' + escapeHTML(item) + '</li>'; }).join("") + '</ul></section>' : "";
    const domains = outline.domains.map(function (domain) {
      const objectives = domain.objectives || [];
      const domainTotal = objectives.reduce(function (sum, objective) { return sum + objectiveBulletCount(objective); }, 0);
      const domainDone = objectives.reduce(function (sum, objective) { return sum + objectiveConfidenceCount(objective); }, 0);
      return '<section class="surface pad official-domain" id="domain-' + escapeHTML(domain.n) + '"><div class="official-domain-head"><div><span class="domain-chip domain-' + escapeHTML(domain.n) + '">DOMAIN ' + escapeHTML(domain.n) + '</span><h2>' + escapeHTML(domain.title) + '</h2><span class="subtle">Official weight ' + escapeHTML(domain.weight) + '% · ' + domainDone + '/' + domainTotal + ' bullets confident</span></div><div class="official-domain-score"><b>' + confidencePercent(domainDone, domainTotal) + '%</b><span>confidence</span></div></div>' + progressBar(confidencePercent(domainDone, domainTotal), domain.n) + '<div class="official-objectives">' + objectives.map(function (objective) {
        const objectiveTotal = objectiveBulletCount(objective); const objectiveDone = objectiveConfidenceCount(objective);
        return '<section class="official-objective" id="obj-' + escapeHTML(objective.id) + '"><div class="official-objective-head"><div><span class="objective-id">' + escapeHTML(objective.id) + '</span><h3>' + escapeHTML(objective.title) + '</h3></div><span class="status-chip">' + confidencePercent(objectiveDone, objectiveTotal) + '% confident</span></div><div class="official-groups">' + (objective.groups || []).map(function (group) { return '<div class="official-group"><h4>' + escapeHTML(group.title) + '</h4><div class="official-bullets">' + (group.items || []).map(function (item) { const itemKey = objectiveCoverageKey(objective.id, group.title, item.t); return officialObjectiveBulletHTML(objective.id, group.title, item.t, "", coverage) + (item.sub || []).map(function (sub) { return '<div class="official-sub-bullet">' + officialObjectiveBulletHTML(objective.id, group.title, item.t, sub, coverage) + '</div>'; }).join(""); }).join("") + '</div></div>'; }).join("") + '</div></section>';
      }).join("") + '</div></section>';
    }).join("");
    const officialExam = outline.exam || examInfo();
    app.innerHTML = '<div class="page-head compact-head"><div><p class="eyebrow">OFFICIAL CS0-004 OUTLINE</p><h1>Exam objectives</h1><p class="lead">Track confidence against the CompTIA objectives, with every bullet tied back to the lessons that cover it.</p></div><div class="actions"><span class="status-chip">' + confidentBullets + '/' + totalBullets + ' bullets</span></div></div>' + tabs + '<section class="surface pad objective-exam-facts"><div><b>' + escapeHTML(officialExam.code || "CS0-004") + '</b><span>' + escapeHTML(officialExam.types || "Multiple-choice and performance-based") + '</span></div><div><b>' + escapeHTML(officialExam.minutes || examMinutes()) + ' min</b><span>' + escapeHTML(officialExam.questions || "Maximum of 85") + '</span></div><div><b>' + escapeHTML(officialExam.passing || examPassing()) + '</b><span>passing score</span></div></section>' + about + '<div class="official-domain-list">' + domains + '</div>';
  }

  async function renderHomeV2() {
    showLoading("your progress");
    await Promise.all([loadData("lessons"), loadData("glossary"), loadData("videos")]);
    const countdown = examCountdown();
    const continueInfo = continueTarget();
    const continueLesson = nextLesson();
    const next = CORE.lessons.find(function (lesson) { return !state.completed[lesson.id]; }) || continueLesson;
    const complete = completedCount();
    const total = CORE.lessons.length || 0;
    const due = dueCardsCount();
    const mastered = allCards().filter(isCardMastered).length;
    const cardTotal = allCards().length;
    const misses = missedQuestionCount();
    const segment = suggestedSegment(next && next.id);
    const segmentIndex = segment ? (window.VIDEOS.segments || []).indexOf(segment) : -1;
    const segmentLink = segment ? segmentHref(segment, segmentIndex) : "#/videos";
    const segmentTitle = segment ? segment.title : "Browse Hank’s mapped segments";
    const segmentDetail = segment ? formatDuration(Math.max(0, Number(segment.end || 0) - Number(segment.start || 0))) + " · " + videoKindLabel(segment.kind) : "Videos are ready when you need another explanation.";
    const domainCards = CORE.domains.map(function (domain) {
      const lessons = domainLessons(domain.n);
      const done = lessons.filter(function (lesson) { return state.completed[lesson.id]; }).length;
      return '<a class="surface domain-card domain-' + domain.n + '" style="--domain-color:var(--domain-' + domain.n + ')" href="#/learn?domain=' + domain.n + '"><div class="domain-index">0' + domain.n + ' · ' + domain.weight + '%</div><h3>' + escapeHTML(domain.title) + '</h3>' + progressBar((done / Math.max(lessons.length, 1)) * 100, domain.n) + '<div class="domain-meta"><span>' + done + ' of ' + lessons.length + ' lessons</span><span>' + Math.round((done / Math.max(lessons.length, 1)) * 100) + '%</span></div></a>';
    }).join("");
    app.innerHTML = '<div class="home-intro compact-head"><p class="eyebrow">' + todayKey() + ' · TODAY</p><div class="home-title-row"><div><h1>' + greeting() + '</h1><div class="home-facts">' + examFactsHTML() + '</div><a class="subtle home-objectives-link" href="#/objectives">Official objectives ' + icon("arrow") + '</a></div><a class="home-countdown" href="#/settings" title="Edit exam date"><b>' + escapeHTML(countdown.number) + '</b><span>' + escapeHTML(countdown.label) + '</span></a></div></div>' +
      '<section class="surface home-continue"><div><p class="eyebrow">CONTINUE</p><h2>' + escapeHTML(continueInfo.label) + '</h2><p class="muted">' + escapeHTML(continueInfo.detail) + '</p></div><a class="button primary" href="' + continueInfo.href + '">' + icon("play") + ' Continue</a></section>' +
      '<section class="surface home-up-next"><div><p class="eyebrow">UP NEXT</p><h2>' + escapeHTML(next ? lessonTitle(next.id) : "You are all caught up") + '</h2><p class="muted">' + (next && next.ready ? "One focused lesson, then test the signal." : "More lesson bodies are being prepared.") + '</p></div><div class="home-up-next-meta">' + (next ? lessonStepDotsHTML(next.id) : "") + '<a class="button small" href="' + (next ? "#/lesson/" + encodeURIComponent(next.id) : "#/learn") + '">Open lesson ' + icon("arrow") + '</a></div></section>' +
      '<section class="surface plan-card home-plan"><div class="plan-top"><div><p class="eyebrow">TODAY\'S PLAN</p><h2>Four useful reps.</h2></div><span class="status-chip">' + (due + misses + (next ? 1 : 0) + (segment ? 1 : 0)) + ' actions</span></div><ul class="plan-list">' +
      '<li><a class="plan-item" href="#/cards?deck=due"><span class="plan-icon">' + icon("cards") + '</span><span class="plan-copy"><b>' + due + ' flashcards due</b><small>' + (due ? "Reviews plus today’s new-card allowance." : "Open a lesson to introduce new cards.") + '</small></span><span class="plan-arrow">' + icon("chevron") + '</span></a></li>' +
      '<li><a class="plan-item" href="#/lesson/' + (next ? encodeURIComponent(next.id) : "") + '"><span class="plan-icon">' + icon("book-open") + '</span><span class="plan-copy"><b>Next: ' + escapeHTML(next ? lessonTitle(next.id) : "You are all caught up") + '</b><small>' + (next && next.ready ? "First unfinished lesson in study order." : "More lesson bodies are being prepared.") + '</small></span><span class="plan-arrow">' + icon("chevron") + '</span></a></li>' +
      '<li><a class="plan-item" href="#/practice?filter=missed"><span class="plan-icon">' + icon("target") + '</span><span class="plan-copy"><b>' + misses + ' misses to review</b><small>' + (misses ? "Turn weak spots into points." : "Missed questions collect here automatically.") + '</small></span><span class="plan-arrow">' + icon("chevron") + '</span></a></li>' +
      '<li><a class="plan-item" href="' + segmentLink + '"><span class="plan-icon">' + icon("play") + '</span><span class="plan-copy"><b>Hank: ' + escapeHTML(segmentTitle) + '</b><small>' + escapeHTML(segmentDetail) + '</small></span><span class="plan-arrow">' + icon("chevron") + '</span></a></li>' +
      '</ul></section>' +
      '<section class="surface home-progress"><div class="section-title"><div><p class="eyebrow">PROGRESS</p><h2>Keep the signal visible.</h2></div><a class="subtle" href="#/stats">Stats ' + icon("arrow") + '</a></div><div class="home-metrics"><div><b>' + complete + '<small>/' + total + '</small></b><span>lessons</span></div><div><b>' + answeredQuestionCount() + '</b><span>questions</span></div><div><b>' + mastered + '<small>/' + cardTotal + '</small></b><span>cards mastered</span></div><div><b>' + streakCount() + '</b><span>day streak</span></div></div>' + progressBar((complete / Math.max(total, 1)) * 100) + '<div class="progress-meta"><span>Study path</span><b>' + Math.round((complete / Math.max(total, 1)) * 100) + '%</b></div></section>' +
      '<section class="section-block"><div class="section-title"><h2>Domains</h2><a href="#/learn" class="subtle">Study path ' + icon("arrow") + '</a></div><div class="domain-grid">' + domainCards + '</div></section>';
    updateDueBadges();
  }

  function lessonRowHTML(lesson) {
    const meta = getLesson(lesson.id) || lesson;
    const cardCount = Number(meta.cards || 0);
    const audioMeta = CORE.audio && CORE.audio[lesson.id];
    const completed = !!state.completed[meta.id];
    const focus = nextLesson();
    const isNext = !!(focus && focus.id === meta.id && !completed);
    const detail = completed ? "Complete" : [meta.ready ? "Mini-lesson" : "Coming soon", cardCount ? cardCount + " cards" : "", audioMeta ? formatDuration(audioMeta.secs) + " audio" : ""].filter(Boolean).join(" · ");
    return '<a class="lesson-row learn-item ' + (completed ? "is-complete" : "") + ' ' + (isNext ? "is-next" : "") + '" data-search="' + escapeHTML((meta.title + " " + detail).toLowerCase()) + '" href="#/lesson/' + encodeURIComponent(meta.id) + '"><span class="lesson-check ' + (completed ? "done" : "") + '">' + (completed ? icon("check") : "") + '</span><span class="lesson-row-copy"><b>' + escapeHTML(decodeText(meta.title)) + '</b><small>' + escapeHTML(detail || "Lesson") + '</small></span>' + lessonStepDotsHTML(meta.id) + (audioMeta ? '<span class="audio-dot" title="Audio available"></span>' : "") + '<span class="lesson-status ' + (meta.ready ? "ready" : "soon") + '">' + (isNext ? "Next" : meta.ready ? "Ready" : "Soon") + '</span><span class="chevron">' + icon("chevron") + '</span></a>';
  }

  async function renderLearn(route) {
    await Promise.all([loadData("lessons"), loadData("videos")]);
    const initialDomain = route.params.get("domain");
    const focusLesson = nextLesson();
    app.innerHTML = '<div class="page-head compact-head"><div><p class="eyebrow">THE STUDY PATH</p><h1>Learn</h1><p class="lead">Domains, chapters, and focused lessons in study order.</p></div><div class="actions"><a class="button" href="#/objectives">' + icon("target") + ' Objectives</a><a class="button" href="#/listen/videos">' + icon("play") + ' Videos</a><a class="button" href="#/book">' + icon("library") + ' Study guide</a></div></div><div class="search-field"><span>' + icon("search") + '</span><input id="learnSearch" type="search" autocomplete="off" placeholder="Search lessons, topics, or chapters" aria-label="Search lessons"></div><div id="learnSearchNotice"></div><div class="stack" id="learnDomains" style="margin-top:18px">' + CORE.domains.map(function (domain) { const lessons = domainLessons(domain.n); const done = lessons.filter(function (lesson) { return state.completed[lesson.id]; }).length; const chapters = CORE.chapters.filter(function (chapter) { return Number(chapter.domain) === Number(domain.n); }); return '<section class="surface pad domain-section" data-domain="' + domain.n + '"><div class="domain-strip"><span class="domain-chip domain-' + domain.n + '">DOMAIN 0' + domain.n + '</span><span class="status-chip">' + domain.weight + '% exam</span><span class="subtle">' + done + '/' + lessons.length + ' complete</span></div><div class="row-between" style="margin-bottom:15px"><h2 style="font-size:21px;margin:0">' + escapeHTML(domain.title) + '</h2><span style="width:130px">' + progressBar((done / Math.max(lessons.length, 1)) * 100, domain.n) + '</span></div>' + chapters.map(function (chapter) { const chapterLessonsList = chapterLessons(chapter.n); const chDone = chapterLessonsList.filter(function (item) { return state.completed[item.id]; }).length; const open = initialDomain ? Number(initialDomain) === Number(domain.n) : !!(focusLesson && Number(focusLesson.ch) === Number(chapter.n)); return '<details class="chapter-details" ' + (open ? "open" : "") + '><summary class="chapter-summary"><span class="chapter-number">' + String(chapter.n).padStart(2, "0") + '</span><span class="chapter-summary-copy"><b>' + escapeHTML(decodeText(chapter.title)) + '</b><small>' + chDone + '/' + chapterLessonsList.length + ' lessons complete · ' + (chapterLessonsList.filter(function (item) { return item.ready; }).length) + ' ready</small></span></summary><div class="chapter-lessons">' + chapterLessonsList.map(lessonRowHTML).join("") + '</div></details>'; }).join("") + '</section>'; }).join("") + '</div>';
    applyLearnSearch(route.params.get("q") || "");
  }

  function applyLearnSearch(query) {
    const input = document.getElementById("learnSearch");
    const value = String(query || (input && input.value) || "").trim().toLowerCase();
    if (input && input.value !== value) input.value = query || "";
    const rows = document.querySelectorAll(".learn-item");
    let visible = 0;
    rows.forEach(function (row) { const match = !value || row.getAttribute("data-search").includes(value); row.hidden = !match; if (match) visible += 1; });
    document.querySelectorAll(".domain-section").forEach(function (section) { const count = section.querySelectorAll(".learn-item:not([hidden])").length; section.hidden = !!value && !count; });
    const notice = document.getElementById("learnSearchNotice");
    if (notice) notice.innerHTML = value ? '<p class="subtle" style="margin:13px 0 0">' + visible + ' lesson' + (visible === 1 ? "" : "s") + ' match “' + escapeHTML(query || value) + '”.</p>' : "";
  }

  function lessonAsideHTML(meta) {
    const list = chapterLessons(meta.ch).slice(0, 7);
    return '<section class="surface"><h3>In this chapter</h3><div>' + list.map(function (lesson) { return '<a class="' + (lesson.id === meta.id ? "" : "muted") + '" href="#/lesson/' + encodeURIComponent(lesson.id) + '">' + escapeHTML(decodeText(lesson.title)) + '</a>'; }).join("") + '</div>' + (chapterLessons(meta.ch).length > 7 ? '<a class="subtle" href="#/learn?domain=' + meta.domain + '">See all lessons →</a>' : "") + '</section>';
  }

  function miniDeckHTML(meta, body) {
    if (!body || !Array.isArray(body.cards) || !body.cards.length) return "";
    miniDeck = { id: meta.id, index: 0, flipped: false };
    const card = body.cards[0] || ["", ""];
    const key = meta.id + ":0";
    return '<section class="mini-deck"><div class="section-title"><h2>Lesson flashcards</h2><span class="subtle">' + body.cards.length + ' cards</span></div><div class="mini-card" id="miniCard" data-action="mini-flip"><div class="mini-card-inner"><div class="mini-face front"><p>' + contentHTML(card[0]) + '</p></div><div class="mini-face back"><p>' + contentHTML(card[1]) + '</p></div></div></div><div class="mini-deck-controls"><button class="button small" data-action="mini-prev">' + icon("back") + ' Previous</button><span class="subtle" id="miniCounter">1 / ' + body.cards.length + '</span><div class="row" style="gap:5px"><button class="button small" data-action="mini-star" data-card-key="' + escapeHTML(key) + '" aria-label="Star this card">' + icon("star") + '</button><button class="button small" data-action="mini-next">Next ' + icon("arrow") + '</button></div></div><div class="row" style="justify-content:center;margin-top:10px"><button class="button small" data-action="mini-rate" data-rating="again">Again</button><button class="button small" data-action="mini-rate" data-rating="good">Got it</button></div></section>';
  }

  function lessonBreadcrumbHTML(meta) {
    const domain = getDomain(meta.domain) || {};
    const chapter = getChapter(meta.ch) || {};
    return '<nav class="lesson-breadcrumb" aria-label="Breadcrumb"><a href="#/learn?domain=' + encodeURIComponent(meta.domain) + '">Domain ' + escapeHTML(String(meta.domain)) + '</a><span>›</span><a href="#/book/' + encodeURIComponent(meta.ch) + '">Chapter ' + escapeHTML(String(meta.ch)) + '</a><span>›</span><a href="#/lesson/' + encodeURIComponent(meta.id) + '"><b>' + escapeHTML(decodeText(meta.title)) + '</b></a></nav><span class="lesson-breadcrumb-context">' + escapeHTML(decodeText(domain.title || "")) + ' · ' + escapeHTML(decodeText(chapter.title || "")) + '</span>';
  }

  function lessonStudyTabsHTML(id) {
    const tabs = [{ key: "read", label: "Read" }, { key: "listen", label: "Listen" }, { key: "cards", label: "Cards" }, { key: "quiz", label: "Quiz" }, { key: "watch", label: "Watch" }, { key: "book", label: "Book" }];
    return '<nav class="lesson-study-tabs" aria-label="Lesson study sections">' + tabs.map(function (tab, index) { return '<button type="button" class="' + (!index ? "active" : "") + '" data-action="lesson-tab" data-target="lesson-section-' + tab.key + '">' + tab.label + '</button>'; }).join("") + '</nav>';
  }

  function lessonStudyStepsHTML(meta, related) {
    const steps = lessonStepState(meta.id);
    const segment = videoSegmentsForLesson(meta.id)[0];
    return '<section class="surface study-steps" id="lesson-study-steps"><div class="study-steps-head"><div><p class="eyebrow">STUDY STEPS</p><h2>Build the loop</h2><p class="muted">Small reps make this lesson stick.</p></div><span class="status-chip ' + (steps.complete ? "success" : "") + '">' + (steps.complete ? "Lesson complete" : "In progress") + '</span></div><div class="study-step-grid"><label class="study-step ' + (steps.read ? "done" : "") + '"><input type="checkbox" data-action="complete-reading" data-id="' + escapeHTML(meta.id) + '" ' + (steps.read ? "checked" : "") + '><span><b>Read</b><small>' + (steps.read ? "Complete" : "Scroll to the end or mark it") + '</small></span></label><button type="button" class="study-step ' + (steps.listen ? "done" : "") + '" data-action="lesson-tab" data-target="lesson-section-listen"><span class="study-step-mark">' + icon("headphones") + '</span><span><b>Listened</b><small>' + (steps.listen ? "90% reached" : "Listen to 90%") + '</small></span></button><button type="button" class="study-step ' + (steps.cards ? "done" : "") + '" data-action="lesson-tab" data-target="lesson-section-cards"><span class="study-step-mark">' + icon("cards") + '</span><span><b>Cards</b><small>' + (steps.cards ? "Reviewed once" : "Review the deck") + '</small></span></button><a class="study-step ' + (steps.quiz != null ? "done" : "") + '" href="#/practice?lesson=' + encodeURIComponent(meta.id) + '"><span class="study-step-mark">' + icon("target") + '</span><span><b>Quiz</b><small>' + escapeHTML(lessonStepLabel(steps.quiz)) + '</small></span></a><a class="study-step ' + (steps.watch ? "done" : "") + '" href="' + (segment ? segmentHref(segment) : "#/listen/videos") + '"><span class="study-step-mark">' + icon("play") + '</span><span><b>Watched</b><small>' + (steps.watch ? "Hank watched" : segment ? "Watch Hank" : "No segment yet") + '</small></span></a></div></section>';
  }

  async function renderLesson(id) {
    const meta = getLesson(id);
    if (!meta) { go("learn"); return; }
    readingLessonId = id;
    state.lastLesson = id;
    state.opened[id] = true;
    saveState();
    showLoading("lesson content");
    await Promise.all([loadData("lessons"), loadData("questions"), loadData("videos")]);
    const body = (window.LESSONS || {})[id];
    const related = (window.QUESTIONS || []).filter(function (question) { return question.l === id || question.l2 === id; });
    const listIndex = CORE.lessons.findIndex(function (lesson) { return lesson.id === id; });
    const previous = CORE.lessons[listIndex - 1];
    const next = CORE.lessons[listIndex + 1];
    const domain = getDomain(meta.domain) || {};
    const lessonVideos = lessonVideoSectionHTML(id);
    const content = meta.ready && body ? '<div class="lesson-prose content">' + contentHTML(body.html) + '</div>' : '<section class="surface empty-state"><div class="empty-icon">' + icon("spark") + '</div><h2>This lesson is coming soon</h2><p>The study path already knows where it belongs. Its mini-lesson, memory tricks, and cards will appear here as the data is produced.</p><a class="button" href="#/book/' + meta.ch + '">' + icon("library") + ' Read Chapter ' + meta.ch + ' in the book</a></section>';
    const memory = meta.ready && body && body.trick ? '<section class="memory-box"><h3>' + icon("bulb") + ' Memory tricks</h3>' + contentHTML(body.trick) + '</section>' : "";
    const traps = meta.ready && body && Array.isArray(body.traps) && body.traps.length ? '<section class="surface pad" style="margin-top:22px"><h3 style="margin-top:0">Exam traps</h3><ul class="trap-list">' + body.traps.map(function (trap) { return '<li>' + contentHTML(trap) + '</li>'; }).join("") + '</ul></section>' : "";
    const terms = meta.ready && body && Array.isArray(body.terms) && body.terms.length ? '<details class="terms-details"><summary>Key terms <span class="subtle">' + body.terms.length + ' definitions</span></summary><div class="term-list">' + body.terms.map(function (term) { return '<div class="term-row"><b>' + contentHTML(term[0]) + '</b><span>' + contentHTML(term[1]) + '</span></div>'; }).join("") + '</div></details>' : "";
    app.innerHTML = '<div class="lesson-progress"><span id="readingProgress"></span></div><div class="lesson-head"><div class="domain-strip"><span class="domain-chip domain-' + meta.domain + '">DOMAIN ' + meta.domain + '</span><span class="subtle">Chapter ' + meta.ch + ' · ' + escapeHTML(decodeText(domain.title || "")) + '</span></div><h1>' + escapeHTML(decodeText(meta.title)) + '</h1><div class="lesson-meta"><span>' + (meta.ready ? Math.max(1, Math.ceil((meta.words || 0) / 180)) + ' min read' : "Not written yet") + '</span><span>·</span><span>' + (meta.cards || 0) + ' flashcards</span><span>·</span><span>' + related.length + ' lesson questions</span></div>' + lessonObjectiveChipsHTML(meta) + '</div><div class="lesson-layout"><div class="lesson-main">' + (meta.tldr ? '<div class="tldr-box"><p class="eyebrow">TL;DR</p><p>' + contentHTML(meta.tldr) + '</p></div>' : "") + (CORE.audio && CORE.audio[id] ? '<div style="margin-top:17px">' + audioButtonHTML(id) + '</div>' : "") + '<div style="margin-top:28px">' + content + '</div>' + lessonVideos + memory + traps + terms + miniDeckHTML(meta, body) + '<section class="surface pad" style="margin-top:26px"><div class="section-title"><div><p class="eyebrow">REINFORCE IT</p><h2 style="font-size:20px;margin-bottom:4px">Ready to test this?</h2><p class="muted" style="margin:0">' + (related.length ? related.length + ' tagged questions are waiting.' : "No questions are tagged to this lesson yet; use the chapter or domain drills instead.") + '</p></div><a class="button ' + (related.length ? "primary" : "") + '" href="#/practice' + (related.length ? '?lesson=' + encodeURIComponent(id) : '?chapter=' + meta.ch) + '">' + icon("target") + (related.length ? "Quiz this lesson" : "Practice this chapter") + '</a></div></section><div class="lesson-actions"><a class="button" href="#/book/' + meta.ch + '">' + icon("library") + ' Read the book section</a><label class="complete-toggle"><input class="check-input" data-action="complete-lesson" data-id="' + escapeHTML(id) + '" type="checkbox" ' + (state.completed[id] ? "checked" : "") + '> ' + (state.completed[id] ? "Completed" : "Mark complete") + '</label></div><div class="lesson-nav">' + (previous ? '<a class="button" href="#/lesson/' + encodeURIComponent(previous.id) + '">' + icon("back") + '<span>Previous<br><b>' + escapeHTML(decodeText(previous.title)) + '</b></span></a>' : '<span></span>') + (next ? '<a class="button" href="#/lesson/' + encodeURIComponent(next.id) + '"><span>Next<br><b>' + escapeHTML(decodeText(next.title)) + '</b></span>' + icon("arrow") + '</a>' : '<span></span>') + '</div></div><aside class="lesson-aside">' + lessonAsideHTML(meta) + (related.length ? '<section class="surface"><h3>Lesson quiz</h3><p class="subtle">' + related.length + ' questions tagged here.</p><a class="button small primary" href="#/practice?lesson=' + encodeURIComponent(id) + '">Start quiz ' + icon("arrow") + '</a></section>' : '') + '</aside></div>';
    updateReadingProgress();
  }

  async function renderLessonHub(id) {
    const meta = getLesson(id);
    if (!meta) { go("learn"); return; }
    readingLessonId = id;
    state.lastLesson = id;
    state.opened[id] = true;
    if (!state.lastActivity || state.lastActivity.type !== "audio" || state.lastActivity.lessonId !== id) setLastActivity({ type: "lesson", lessonId: id }); else saveState();
    showLoading("lesson content");
    await Promise.all([loadData("lessons"), loadData("questions"), loadData("videos")]);
    const body = (window.LESSONS || {})[id];
    const related = (window.QUESTIONS || []).filter(function (question) { return question.l === id || question.l2 === id; });
    const listIndex = CORE.lessons.findIndex(function (lesson) { return lesson.id === id; });
    const previous = CORE.lessons[listIndex - 1];
    const next = CORE.lessons[listIndex + 1];
    const lessonVideos = lessonVideoSectionHTML(id);
    miniDeck = null;
    const content = meta.ready && body ? '<div class="lesson-prose content">' + contentHTML(body.html) + '</div>' : '<section class="surface empty-state"><div class="empty-icon">' + icon("spark") + '</div><h2>This lesson is coming soon</h2><p>The study path already knows where it belongs. Its mini-lesson, memory tricks, and cards will appear here as the data is produced.</p><a class="button" href="#/book/' + meta.ch + '">' + icon("library") + ' Read Chapter ' + meta.ch + ' in the book</a></section>';
    const memory = meta.ready && body && body.trick ? '<section class="memory-box"><h3>' + icon("bulb") + ' Memory tricks</h3>' + contentHTML(body.trick) + '</section>' : "";
    const traps = meta.ready && body && Array.isArray(body.traps) && body.traps.length ? '<section class="surface pad" style="margin-top:22px"><h3 style="margin-top:0">Exam traps</h3><ul class="trap-list">' + body.traps.map(function (trap) { return '<li>' + contentHTML(trap) + '</li>'; }).join("") + '</ul></section>' : "";
    const terms = meta.ready && body && Array.isArray(body.terms) && body.terms.length ? '<details class="terms-details"><summary>Key terms <span class="subtle">' + body.terms.length + ' definitions</span></summary><div class="term-list">' + body.terms.map(function (term) { return '<div class="term-row"><b>' + contentHTML(term[0]) + '</b><span>' + contentHTML(term[1]) + '</span></div>'; }).join("") + '</div></details>' : "";
    const audioSection = CORE.audio && CORE.audio[id] ? '<section id="lesson-section-listen" class="lesson-study-section"><div class="study-section-heading"><div><p class="eyebrow">LISTEN</p><h2>Hear the lesson</h2><p class="muted">Resume from your saved position whenever you are ready.</p></div><span class="status-chip">' + formatDuration(CORE.audio[id].secs) + '</span></div>' + audioButtonHTML(id) + audioDetailsRowHTML(id) + '</section>' : '<section id="lesson-section-listen" class="lesson-study-section"><div class="study-section-heading"><div><p class="eyebrow">LISTEN</p><h2>No narration yet</h2><p class="muted">Audio will appear here as soon as this lesson is recorded.</p></div></div><a class="button" href="#/listen">Browse audio</a></section>';
    const cardsSection = '<section id="lesson-section-cards" class="lesson-study-section"><div class="study-section-heading"><div><p class="eyebrow">CARDS</p><h2>Recall the edges</h2><p class="muted">Review this lesson’s cards once, then keep the due queue moving.</p></div><span class="status-chip">' + (body && Array.isArray(body.cards) ? body.cards.length : 0) + ' cards</span></div>' + (body && Array.isArray(body.cards) && body.cards.length ? miniDeckHTML(meta, body) : '<div class="surface empty-state lesson-empty"><div class="empty-icon">' + icon("cards") + '</div><h2>Cards are still being written</h2><p>Open the flashcard hub for the rest of your queue.</p><a class="button" href="#/cards">Open cards</a></div>') + '</section>';
    const best = lessonQuizBestPercent(id);
    const quizSection = '<section id="lesson-section-quiz" class="lesson-study-section"><div class="study-section-heading"><div><p class="eyebrow">QUIZ</p><h2>Test this lesson</h2><p class="muted">' + (related.length ? related.length + ' tagged question' + (related.length === 1 ? "" : "s") + ' waiting.' : "No questions are tagged here yet; use chapter practice instead.") + '</p></div>' + (best != null ? '<span class="status-chip success">Best ' + best + '%</span>' : '') + '</div><div class="row"><a class="button ' + (related.length ? "primary" : "") + '" href="#/practice' + (related.length ? '?lesson=' + encodeURIComponent(id) : '?chapter=' + meta.ch) + '">' + icon("target") + (related.length ? "Quiz this lesson" : "Practice this chapter") + '</a><a class="button" href="#/practice?filter=missed">Review misses</a></div></section>';
    const bookSection = '<section id="lesson-section-book" class="lesson-study-section"><div class="study-section-heading"><div><p class="eyebrow">BOOK</p><h2>Read the chapter context</h2><p class="muted">Use the study guide when you want the wider reference layer.</p></div><span class="status-chip">Chapter ' + meta.ch + '</span></div><a class="book-next-link" href="#/book/' + meta.ch + '"><span class="book-next-icon">' + icon("library") + '</span><span><b>' + escapeHTML(decodeText((getChapter(meta.ch) || {}).title || "Study guide")) + '</b><small>Open the chapter and jump back to this lesson.</small></span>' + icon("arrow") + '</a></section>';
    const nextCard = next ? '<section class="surface lesson-next-card"><div><p class="eyebrow">NEXT LESSON</p><h2>' + escapeHTML(decodeText(next.title)) + '</h2><p class="muted">Keep the thread moving with the next focused lesson.</p></div><div class="row"><a class="button primary" href="#/lesson/' + encodeURIComponent(next.id) + '">Open next ' + icon("arrow") + '</a><a class="button" href="#/practice?lesson=' + encodeURIComponent(id) + '">Quiz this lesson</a></div></section>' : '<section class="surface lesson-next-card"><div><p class="eyebrow">STUDY PATH COMPLETE</p><h2>You reached the end of the path.</h2><p class="muted">Review your misses or return to Today for a fresh plan.</p></div><div class="row"><a class="button primary" href="#/practice?filter=missed">Review misses</a><a class="button" href="#/home">Back to Today</a></div></section>';
    app.innerHTML = '<div class="lesson-progress"><span id="readingProgress"></span></div><div class="lesson-head"><div class="lesson-head-top"><button class="back-affordance" type="button" data-action="go-back" data-fallback="learn" aria-label="Back to Learn">' + icon("back") + '<span>Back</span></button><div>' + lessonBreadcrumbHTML(meta) + '</div></div><h1>' + escapeHTML(decodeText(meta.title)) + '</h1><div class="lesson-meta"><span>' + (meta.ready ? Math.max(1, Math.ceil((meta.words || 0) / 180)) + ' min read' : "Not written yet") + '</span><span>·</span><span>' + (meta.cards || 0) + ' flashcards</span><span>·</span><span>' + related.length + ' lesson questions</span></div>' + lessonObjectiveChipsHTML(meta) + '</div>' + lessonStudyTabsHTML(id) + lessonStudyStepsHTML(meta, related) + '<div class="lesson-layout"><div class="lesson-main">' + (meta.tldr ? '<div class="tldr-box"><p class="eyebrow">TL;DR</p><p>' + contentHTML(meta.tldr) + '</p></div>' : "") + '<section id="lesson-section-read" class="lesson-study-section lesson-read-section"><div class="study-section-heading"><div><p class="eyebrow">READ</p><h2>Understand the idea</h2><p class="muted">Scroll to the end or mark this step complete above.</p></div><span class="status-chip">' + (meta.ready ? Math.max(1, Math.ceil((meta.words || 0) / 180)) + ' min' : "Coming soon") + '</span></div>' + content + memory + traps + terms + '</section>' + audioSection + cardsSection + quizSection + '<section id="lesson-section-watch" class="lesson-study-section">' + lessonVideos + '</section>' + bookSection + nextCard + '<div class="lesson-actions"><a class="button" href="#/book/' + meta.ch + '">' + icon("library") + ' Read the book section</a><label class="complete-toggle"><input class="check-input" data-action="complete-lesson" data-id="' + escapeHTML(id) + '" type="checkbox" ' + (state.completed[id] ? "checked" : "") + '> ' + (state.completed[id] ? "Completed" : "Mark complete") + '</label></div><div class="lesson-nav">' + (previous ? '<a class="button" href="#/lesson/' + encodeURIComponent(previous.id) + '">' + icon("back") + '<span>Previous<br><b>' + escapeHTML(decodeText(previous.title)) + '</b></span></a>' : '<span></span>') + (next ? '<a class="button" href="#/lesson/' + encodeURIComponent(next.id) + '"><span>Next<br><b>' + escapeHTML(decodeText(next.title)) + '</b></span>' + icon("arrow") + '</a>' : '<span></span>') + '</div></div><aside class="lesson-aside">' + lessonAsideHTML(meta) + (related.length ? '<section class="surface"><h3>Lesson quiz</h3><p class="subtle">' + related.length + ' questions tagged here.</p><a class="button small primary" href="#/practice?lesson=' + encodeURIComponent(id) + '">Start quiz ' + icon("arrow") + '</a></section>' : '') + '</aside></div>';
    updateReadingProgress();
    updateLessonStudyTabs();
  }

  function audioSections(id) {
    const sections = CORE.audio && CORE.audio[id] && Array.isArray(CORE.audio[id].sections) ? CORE.audio[id].sections : [];
    return sections.slice().sort(function (a, b) { return Number(a.t || 0) - Number(b.t || 0); });
  }

  function currentAudioSectionIndex(id, time) {
    const sections = audioSections(id);
    if (!sections.length) return -1;
    let current = 0;
    sections.forEach(function (section, index) { if (Number(section.t || 0) <= (Number(time) || 0) + 0.1) current = index; });
    return current;
  }

  function currentAudioSectionTitle(id, time) {
    const sections = audioSections(id);
    const index = currentAudioSectionIndex(id, time == null ? (audioCurrentId === id ? audio.currentTime : 0) : time);
    return index >= 0 && sections[index] ? sections[index].title || "Lesson audio" : "Lesson audio";
  }

  /* Track ids: "<lessonId>" is the main narration, "<lessonId>--details" the optional bonus track.
     Lesson lists/counts only ever use main tracks (iterate CORE.lessons, never Object.keys(CORE.audio)). */
  const DETAILS_SUFFIX = "--details";
  function isDetailsTrack(id) { return typeof id === "string" && id.slice(-DETAILS_SUFFIX.length) === DETAILS_SUFFIX; }
  function audioLessonId(id) { return isDetailsTrack(id) ? id.slice(0, -DETAILS_SUFFIX.length) : id; }
  function detailsTrackId(lessonId) { const id = audioLessonId(lessonId) + DETAILS_SUFFIX; return CORE.audio && CORE.audio[id] ? id : null; }
  function audioTrackTitle(id) { return lessonTitle(audioLessonId(id)) + (isDetailsTrack(id) ? " · Details" : ""); }
  function audioPlaylist() { return CORE.lessons.filter(function (lesson) { return CORE.audio && CORE.audio[lesson.id]; }); }
  /* Playback order for Play all / next / previous: main tracks, plus each lesson's details track when enabled. */
  function audioQueue() {
    const ids = [];
    audioPlaylist().forEach(function (lesson) { ids.push(lesson.id); const details = state.audio.includeDetails ? detailsTrackId(lesson.id) : null; if (details) ids.push(details); });
    return ids;
  }
  function adjacentAudioTrack(id, direction) {
    const list = audioQueue();
    const step = Number(direction || 0) < 0 ? -1 : 1;
    let index = list.indexOf(id);
    if (index < 0 && isDetailsTrack(id)) { index = list.indexOf(audioLessonId(id)); if (step < 0) return index >= 0 ? list[index] : null; }
    return index >= 0 ? list[index + step] || null : null;
  }
  function audioPartLabel(id, time) {
    const sections = audioSections(id);
    const list = audioPlaylist();
    const lessonNumber = Math.max(1, list.findIndex(function (lesson) { return lesson.id === audioLessonId(id); }) + 1);
    if (!sections.length) return (isDetailsTrack(id) ? "Details · " : "") + "Lesson " + lessonNumber + " of " + Math.max(1, list.length);
    const index = currentAudioSectionIndex(id, time == null ? (audioCurrentId === id ? audio.currentTime : Number(state.audio.positions[id] || 0)) : time);
    return (isDetailsTrack(id) ? "Details · " : "") + (sections[index] && sections[index].title ? sections[index].title : "Lesson audio") + " · Part " + (index + 1) + " of " + sections.length;
  }
  function audioPosition(id) { return audioCurrentId === id ? Number(audio.currentTime || 0) : Number(state.audio.positions[id] || 0); }
  function audioProgressPercent(id) {
    const info = CORE.audio && CORE.audio[id];
    const duration = Number(info && info.secs || 0);
    return duration ? Math.min(100, Math.max(0, (audioPosition(id) / duration) * 100)) : 0;
  }
  function audioTickHTML(id) {
    const info = CORE.audio && CORE.audio[id];
    const duration = Number(info && info.secs || 0);
    return audioSections(id).map(function (section) { return '<i style="left:' + (duration ? Math.min(100, (Number(section.t || 0) / duration) * 100) : 0) + '%" aria-hidden="true"></i>'; }).join("");
  }

  function updateAudioSectionUI() {
    if (!audioCurrentId) return;
    const index = currentAudioSectionIndex(audioCurrentId, audio.currentTime);
    document.querySelectorAll(".audio-chapter[data-audio-id]").forEach(function (node) {
      if (node.getAttribute("data-audio-id") !== audioCurrentId) return;
      node.classList.toggle("current", Number(node.getAttribute("data-section-index")) === index);
    });
    document.querySelectorAll("[data-audio-section-title]").forEach(function (node) { const player = node.closest("[data-audio-player-id]"); if (player && player.getAttribute("data-audio-player-id") === audioCurrentId) node.textContent = audioPartLabel(audioCurrentId, audio.currentTime); });
    document.querySelectorAll("[data-audio-current-time]").forEach(function (node) { const player = node.closest("[data-audio-player-id]"); if (!player || player.getAttribute("data-audio-player-id") === audioCurrentId) node.textContent = formatDuration(audio.currentTime); });
    document.querySelectorAll("[data-audio-seek]").forEach(function (node) { if (node.getAttribute("data-audio-id") === audioCurrentId && audio.duration) node.value = String((audio.currentTime / audio.duration) * 100); });
    document.querySelectorAll("[data-audio-progress]").forEach(function (node) { if (node.getAttribute("data-audio-id") === audioCurrentId) node.style.width = audioProgressPercent(audioCurrentId) + "%"; });
    refreshInlineAudioUI();
  }

  function audioSectionRelative(step) {
    if (!audioCurrentId) return;
    const sections = audioSections(audioCurrentId);
    const direction = Number(step || 0) < 0 ? -1 : 1;
    let index = currentAudioSectionIndex(audioCurrentId, audio.currentTime);
    if (direction < 0 && sections.length) {
      const start = Number(sections[index] && sections[index].t || 0);
      if (audio.currentTime - start > 3) { audio.currentTime = start; updateAudioSectionUI(); return; }
      if (index > 0) { audio.currentTime = Number(sections[index - 1].t || 0); updateAudioSectionUI(); updateMediaSession(); return; }
    }
    if (direction > 0 && sections.length && index < sections.length - 1) {
      audio.currentTime = Number(sections[index + 1].t || 0); updateAudioSectionUI(); updateMediaSession(); return;
    }
    const adjacent = adjacentAudioTrack(audioCurrentId, direction);
    if (adjacent) playAudio(adjacent, true);
    else if (direction < 0) { audio.currentTime = 0; updateAudioSectionUI(); }
  }

  function audioChaptersHTML(id, info, open) {
    const sections = audioSections(id);
    if (!sections.length) return "";
    const current = currentAudioSectionIndex(id, audioCurrentId === id ? audio.currentTime : 0);
    return '<div class="audio-parts ' + (open ? "is-open" : "") + '"><button class="audio-parts-toggle" type="button" data-action="audio-parts-toggle" aria-expanded="' + !!open + '">Parts <span>' + sections.length + '</span><i>' + icon("chevron") + '</i></button><div class="audio-chapters"><div class="audio-chapters-label">Parts</div>' + sections.map(function (section, index) { return '<button class="audio-chapter ' + (index === current ? "current" : "") + '" type="button" data-action="audio-section" data-audio-id="' + escapeHTML(id) + '" data-section-index="' + index + '" data-seconds="' + Number(section.t || 0) + '"><span>' + escapeHTML(section.title || "Part " + (index + 1)) + '</span><time>' + formatDuration(section.t) + '</time></button>'; }).join("") + '</div></div>';
  }

  function adjacentAudioLesson(id, direction) {
    const list = audioPlaylist();
    const index = list.findIndex(function (lesson) { return lesson.id === audioLessonId(id); });
    return index >= 0 ? list[index + Number(direction || 0)] : null;
  }

  function audioSpeedMenuHTML() {
    const speeds = [0.75, 1, 1.25, 1.5, 1.75, 2];
    return '<div class="audio-speed-wrap"><button class="audio-speed-pill" type="button" data-action="audio-speed-menu" aria-expanded="' + audioSpeedOpen + '"><span>' + String(state.audioSpeed || 1).replace(".0", "") + 'x</span><span class="audio-speed-caret">⌄</span></button><div class="audio-speed-menu ' + (audioSpeedOpen ? "is-open" : "") + '"><span class="audio-speed-label">Playback speed</span>' + speeds.map(function (speed) { return '<button type="button" data-action="audio-speed" data-speed="' + speed + '" class="' + (Number(state.audioSpeed) === speed ? "active" : "") + '">' + String(speed).replace(".0", "") + 'x</button>'; }).join("") + '<span class="audio-speed-label audio-sleep-label">Sleep timer</span><div class="audio-sleep-row"><button type="button" data-action="audio-sleep" data-minutes="0">Off</button><button type="button" data-action="audio-sleep" data-minutes="15">15m</button><button type="button" data-action="audio-sleep" data-minutes="30">30m</button><button type="button" data-action="audio-sleep" data-minutes="60">60m</button></div></div></div>';
  }

  function audioNextPromptHTML(id) {
    if (!audioEndedPrompt || audioCurrentId !== id || !audio.paused) return "";
    const lessonId = audioLessonId(id);
    const next = adjacentAudioLesson(lessonId, 1);
    const details = !isDetailsTrack(id) ? detailsTrackId(lessonId) : null;
    const lessonQuestions = (window.QUESTIONS || []).some(function (question) { return question.l === lessonId || question.l2 === lessonId; });
    return '<div class="audio-next-prompt"><div><b>' + (isDetailsTrack(id) ? "Finished the details?" : "Finished this lesson?") + '</b><small>Keep the study loop moving.</small></div><div class="audio-next-actions">' + (lessonQuestions ? '<a class="button small primary" href="#/practice?lesson=' + encodeURIComponent(lessonId) + '">Quiz this lesson</a>' : '') + (details ? '<button class="button small" data-action="audio-prompt-next" data-audio-id="' + escapeHTML(details) + '">Details track</button>' : '') + (next ? '<button class="button small" data-action="audio-prompt-next" data-audio-id="' + escapeHTML(next.id) + '">Next lesson audio</button>' : '') + '<a class="button small ghost" href="#/lesson/' + encodeURIComponent(lessonId) + '">Open lesson</a></div></div>';
  }

  function audioPlayerHTML(id, options) {
    const info = CORE.audio && CORE.audio[id];
    if (!info) return "";
    const config = options || {};
    const inline = !!config.inline;
    const playing = audioCurrentId === id && !audio.paused;
    const time = audioPosition(id);
    const duration = Number(info.secs || 0);
    const seekValue = duration ? Math.min(100, Math.max(0, (time / duration) * 100)) : 0;
    const playAction = audioCurrentId === id ? "toggle-audio" : "play-audio";
    const parts = inline ? audioChaptersHTML(id, info, false) : "";
    return '<section class="audio-player ' + (inline ? "audio-player-inline" : "") + (isDetailsTrack(id) ? " is-details" : "") + '" data-audio-player-id="' + escapeHTML(id) + '"><div class="audio-player-head"><a class="audio-player-art" href="#/lesson/' + encodeURIComponent(audioLessonId(id)) + '" aria-label="Open ' + escapeHTML(lessonTitle(audioLessonId(id))) + '">' + icon("headphones") + '</a><div class="audio-player-copy"><a class="audio-player-title" href="#/lesson/' + encodeURIComponent(audioLessonId(id)) + '">' + escapeHTML(audioTrackTitle(id)) + '</a><span class="audio-player-subtitle" data-audio-section-title>' + escapeHTML(audioPartLabel(id, time)) + '</span></div><div class="audio-player-actions">' + audioSpeedMenuHTML() + '<button class="audio-close" type="button" data-action="audio-close" aria-label="Close audio player">' + icon("close") + '</button></div></div><div class="audio-player-controls"><button class="audio-control audio-control-skip" type="button" data-action="audio-section" data-step="-1" aria-label="Previous section">' + icon("skipPrev") + '</button><button class="audio-control audio-control-jump" type="button" data-action="audio-skip" data-seconds="-10" aria-label="Back 10 seconds">' + jumpIconSVG(-1) + '</button><button class="audio-control audio-control-play" type="button" data-action="' + playAction + '" data-audio-id="' + escapeHTML(id) + '" aria-label="' + (playing ? "Pause" : "Play") + '">' + icon(playing ? "pause" : "play") + '</button><button class="audio-control audio-control-jump" type="button" data-action="audio-skip" data-seconds="10" aria-label="Forward 10 seconds">' + jumpIconSVG(1) + '</button><button class="audio-control audio-control-skip" type="button" data-action="audio-section" data-step="1" aria-label="Next section">' + icon("skipNext") + '</button></div><div class="audio-scrub"><div class="audio-scrub-ticks">' + audioTickHTML(id) + '</div><input class="audio-range" id="audioSeek-' + (inline ? "inline" : "dock") + '" data-audio-seek data-audio-id="' + escapeHTML(id) + '" type="range" min="0" max="100" value="' + seekValue + '" step="0.1" aria-label="Audio position"><div class="audio-time-row"><time data-audio-current-time>' + formatDuration(time) + '</time><time>' + formatDuration(duration) + '</time></div></div>' + audioNextPromptHTML(id) + parts + '</section>';
  }

  function audioButtonHTML(id) {
    const info = CORE.audio && CORE.audio[id];
    if (!info) return "";
    return audioPlayerHTML(id, { inline: true });
  }

  /* Compact "Details track" row under the lesson's inline player; plays through the shared player/dock. */
  function audioDetailsRowHTML(lessonId) {
    const id = detailsTrackId(lessonId);
    if (!id) return "";
    const playing = audioCurrentId === id && !audio.paused;
    const position = Number(state.audio.positions[id] || 0);
    const status = state.audio.listened[id] ? " · listened" : position > 5 ? " · resume at " + formatDuration(position) : "";
    return '<div class="audio-details-row" data-audio-details-id="' + escapeHTML(id) + '"><span class="audio-details-icon">' + icon("lightning") + '</span><span class="audio-details-copy"><b>Details track</b><small>Tools, commands &amp; specifics · ' + formatDuration(CORE.audio[id].secs) + '<span data-audio-details-status>' + escapeHTML(status) + '</span></small></span><button class="audio-details-play" type="button" data-action="' + (audioCurrentId === id ? "toggle-audio" : "play-audio") + '" data-audio-id="' + escapeHTML(id) + '" aria-label="' + (playing ? "Pause details track" : "Play details track") + '">' + icon(playing ? "pause" : "play") + '</button></div>';
  }

  function updateReadingProgress() {
    const bar = document.getElementById("readingProgress");
    if (!bar) return;
    const section = document.getElementById("lesson-section-read");
    const topbar = document.getElementById("topbar");
    const offset = (topbar ? topbar.offsetHeight : 62) + 50;
    let progress;
    let atEnd;
    if (section) {
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, rect.height - (window.innerHeight - offset));
      progress = (offset - rect.top) / travel;
      atEnd = rect.bottom <= window.innerHeight + 56;
    } else {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progress = window.scrollY / max;
      atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 56;
    }
    bar.style.width = Math.min(100, Math.max(0, progress * 100)) + "%";
    if (readingLessonId && atEnd && !state.reading[readingLessonId]) {
      state.reading[readingLessonId] = true;
      saveState();
      updateLessonStepUI();
    }
  }

  function updateLessonStepUI() {
    if (!readingLessonId) return;
    const steps = lessonStepState(readingLessonId);
    const root = document.getElementById("lesson-study-steps");
    if (!root) return;
    const nodes = root.querySelectorAll(".study-step");
    [steps.read, steps.listen, steps.cards, steps.quiz != null, steps.watch].forEach(function (done, index) {
      if (nodes[index]) nodes[index].classList.toggle("done", !!done);
    });
    const read = root.querySelector('[data-action="complete-reading"]');
    if (read) read.checked = steps.read;
  }

  function updateLessonStudyTabs() {
    const tabs = document.querySelectorAll(".lesson-study-tabs [data-target]");
    const sections = Array.from(document.querySelectorAll(".lesson-study-section"));
    if (!tabs.length || !sections.length) return;
    const offset = (document.getElementById("topbar")?.offsetHeight || 62) + 70;
    let current = sections[0].id;
    sections.forEach(function (section) { if (section.getBoundingClientRect().top - offset <= 0) current = section.id; });
    tabs.forEach(function (tab) { tab.classList.toggle("active", tab.getAttribute("data-target") === current); });
    /* Keep the active tab visible inside the horizontally scrolling strip (scrollLeft only, never scrollIntoView). */
    const strip = document.querySelector(".lesson-study-tabs");
    const active = strip && strip.querySelector("button.active");
    if (strip && active && strip.scrollWidth > strip.clientWidth + 1) {
      const left = active.offsetLeft - strip.offsetLeft;
      if (left < strip.scrollLeft + 4) strip.scrollLeft = Math.max(0, left - 8);
      else if (left + active.offsetWidth > strip.scrollLeft + strip.clientWidth - 4) strip.scrollLeft = left + active.offsetWidth - strip.clientWidth + 8;
    }
  }

  function listenTabsHTML(active) {
    return '<nav class="listen-tabs" aria-label="Listen"><a class="' + (active === "audio" ? "active" : "") + '" href="#/listen/audio">' + icon("headphones") + ' Audio</a><a class="' + (active === "videos" ? "active" : "") + '" href="#/listen/videos">' + icon("play") + ' Videos</a></nav>';
  }

  async function renderAudioPage(hub) {
    await Promise.all([loadData("lessons"), loadData("videos")]);
    const items = CORE.lessons.filter(function (lesson) { return CORE.audio && CORE.audio[lesson.id]; });
    const totalSeconds = items.reduce(function (sum, lesson) { return sum + Number(CORE.audio[lesson.id].secs || 0); }, 0);
    if (!items.length) {
      app.innerHTML = '<div class="page-head"><div><p class="eyebrow">LISTEN</p><h1>Audio</h1><p class="lead">Narrated tracks with resume positions and playlist playback.</p></div></div>' + listenTabsHTML("audio") + '<section class="surface empty-state"><div class="empty-icon">' + icon("headphones") + '</div><h2>Your playlist is being recorded</h2><p>There are no audio tracks in the current data set yet. Once a track is added, it will show up here automatically and stay docked while you move around the app.</p><a class="button" href="#/learn">Browse lessons</a></section>';
      return;
    }
    const detailsCount = items.filter(function (lesson) { return detailsTrackId(lesson.id); }).length;
    const detailsToggle = detailsCount ? '<label class="audio-details-toggle"><input class="check-input" type="checkbox" data-action="audio-include-details" ' + (state.audio.includeDetails ? "checked" : "") + '><span><b>Include details tracks in Play all</b><small>' + detailsCount + ' lesson' + (detailsCount === 1 ? " has" : "s have") + ' a bonus track on tools, commands &amp; specifics.</small></span></label>' : "";
    const rowHTML = function (lesson, index) {
      const info = CORE.audio[lesson.id];
      const details = detailsTrackId(lesson.id);
      const detailsPosition = details ? Number(state.audio.positions[details] || 0) : 0;
      const detailsRow = details ? '<div class="audio-details-subrow"><span class="audio-details-subrow-copy">' + icon("lightning") + '<b>Details</b><small>' + formatDuration(CORE.audio[details].secs) + (state.audio.listened[details] ? " · listened" : detailsPosition > 5 ? " · resume at " + formatDuration(detailsPosition) : "") + '</small></span><button class="button small" data-action="play-audio" data-audio-id="' + escapeHTML(details) + '" aria-label="Play details track for ' + escapeHTML(decodeText(lesson.title)) + '">' + icon(audioCurrentId === details && !audio.paused ? "pause" : "play") + '</button></div>' : "";
      return '<div class="audio-playlist-item"><div class="lesson-row"><span class="lesson-check ' + (state.audio.listened[lesson.id] ? "done" : "") + '">' + (state.audio.listened[lesson.id] ? icon("check") : String(index + 1)) + '</span><span class="lesson-row-copy"><b>' + escapeHTML(decodeText(lesson.title)) + '</b><small>' + formatDuration(info.secs) + (state.audio.positions[lesson.id] > 5 ? " · resume at " + formatDuration(state.audio.positions[lesson.id]) : "") + '</small></span>' + lessonStepDotsHTML(lesson.id) + '<button class="button small" data-action="play-audio" data-audio-id="' + escapeHTML(lesson.id) + '" aria-label="Play ' + escapeHTML(decodeText(lesson.title)) + '">' + icon(audioCurrentId === lesson.id && !audio.paused ? "pause" : "play") + '</button></div>' + detailsRow + '</div>';
    };
    app.innerHTML = '<div class="page-head"><div><p class="eyebrow">LISTEN</p><h1>Audio</h1><p class="lead">' + items.length + ' narrated lessons · ' + Math.round(totalSeconds / 60) + ' minutes.</p></div><div class="actions"><button class="button primary" data-action="play-all">' + icon("play") + ' Play all</button></div></div>' + listenTabsHTML("audio") + '<section class="surface pad"><div class="row-between"><div><h2 style="font-size:20px;margin:0">The playlist</h2><p class="subtle" style="margin:4px 0 0">Play all auto-advances to the next narrated lesson.</p></div><span class="status-chip">' + items.filter(function (lesson) { return state.audio.listened[lesson.id]; }).length + '/' + items.length + ' listened</span></div>' + detailsToggle + '<div class="stack" style="margin-top:16px">' + items.map(rowHTML).join("") + '</div></section>';
  }

  /* Hide the dock (mobile mini-bar / desktop card) while the lesson page's inline player for the
     current track is on screen, so the same player is never shown twice. */
  let inlineObserver = null;
  let inlineObserved = null;
  let inlinePlayerVisible = false;
  function inlinePlayerForCurrent() {
    if (!audioCurrentId) return null;
    const node = Array.from(app.querySelectorAll(".audio-player-inline")).find(function (player) { return player.getAttribute("data-audio-player-id") === audioCurrentId; });
    return node && !node.hidden ? node : null;
  }
  function setInlinePlayerVisible(visible) {
    inlinePlayerVisible = !!visible;
    audioDock.classList.toggle("is-inline-visible", inlinePlayerVisible);
    if (inlinePlayerVisible && (audioExpanded || audioSpeedOpen) && !audioDock.contains(document.activeElement)) { audioExpanded = false; audioSpeedOpen = false; renderAudioDock(); }
  }
  function syncInlinePlayerObserver() {
    const target = inlinePlayerForCurrent();
    if (target === inlineObserved) return;
    if (inlineObserver) inlineObserver.disconnect();
    inlineObserved = target;
    setInlinePlayerVisible(false);
    if (!target || typeof IntersectionObserver === "undefined") return;
    inlineObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.target !== inlineObserved) return;
        setInlinePlayerVisible(entry.isIntersecting && (entry.intersectionRatio >= 0.3 || entry.intersectionRect.height >= 140));
      });
    }, { rootMargin: "-62px 0px -80px 0px", threshold: [0, 0.15, 0.3, 0.5, 0.75, 1] });
    inlineObserver.observe(target);
  }

  function renderAudioDock() {
    if (!audioCurrentId || !CORE.audio || !CORE.audio[audioCurrentId] || audioDockDismissed) { audioDock.hidden = true; syncInlinePlayerObserver(); return; }
    const lessonId = audioLessonId(audioCurrentId);
    const playing = !audio.paused;
    const position = audioPosition(audioCurrentId);
    const title = escapeHTML(audioTrackTitle(audioCurrentId));
    audioDock.hidden = false;
    audioDock.classList.toggle("is-expanded", audioExpanded);
    audioDock.innerHTML = '<div class="audio-dock-mini"><div class="audio-dock-mini-main" data-action="audio-expand"><a class="audio-dock-mini-art" href="#/lesson/' + encodeURIComponent(lessonId) + '" aria-label="Open ' + title + '">' + icon("headphones") + '</a><span class="audio-dock-mini-copy"><a href="#/lesson/' + encodeURIComponent(lessonId) + '">' + title + '</a><small>' + escapeHTML(audioPartLabel(audioCurrentId, position)) + '</small></span></div><button class="audio-mini-play" type="button" data-action="toggle-audio" aria-label="' + (playing ? "Pause" : "Play") + '">' + icon(playing ? "pause" : "play") + '</button><button class="audio-mini-close" type="button" data-action="audio-close" aria-label="Close audio player">' + icon("close") + '</button><div class="audio-mini-progress"><span data-audio-progress data-audio-id="' + escapeHTML(audioCurrentId) + '" style="width:' + audioProgressPercent(audioCurrentId) + '%"></span></div></div><div class="audio-dock-full"><button class="audio-minimize" type="button" data-action="audio-minimize" aria-label="Minimize audio player">' + icon("chevron") + '<span>Minimize</span></button>' + audioPlayerHTML(audioCurrentId, { inline: false }) + '</div>';
    const full = audioDock.querySelector(".audio-dock-full");
    if (full) {
      full.addEventListener("touchstart", function (event) { audioTouchStartY = event.changedTouches[0].screenY; }, { passive: true });
      full.addEventListener("touchend", function (event) { if (audioTouchStartY == null) return; const delta = event.changedTouches[0].screenY - audioTouchStartY; audioTouchStartY = null; if (audioExpanded && delta > 48) { audioExpanded = false; audioSpeedOpen = false; renderAudioDock(); } }, { passive: true });
    }
    updateAudioSectionUI();
    syncInlinePlayerObserver();
  }

  function refreshInlineAudioUI() {
    document.querySelectorAll(".audio-player-inline").forEach(function (player) {
      const id = player.getAttribute("data-audio-player-id");
      const play = player.querySelector(".audio-control-play");
      if (play && id === audioCurrentId) {
        const playing = !audio.paused;
        play.innerHTML = icon(playing ? "pause" : "play");
        play.setAttribute("data-action", "toggle-audio");
        play.setAttribute("aria-label", playing ? "Pause" : "Play");
      } else if (play && play.getAttribute("data-action") !== "play-audio") {
        play.innerHTML = icon("play");
        play.setAttribute("data-action", "play-audio");
        play.setAttribute("aria-label", "Play");
      }
      const existing = player.querySelector(".audio-next-prompt");
      const prompt = audioNextPromptHTML(id);
      if (prompt && !existing) player.insertAdjacentHTML("beforeend", prompt);
      if (!prompt && existing) existing.remove();
    });
    document.querySelectorAll("[data-audio-details-id]").forEach(function (row) {
      const id = row.getAttribute("data-audio-details-id");
      const button = row.querySelector(".audio-details-play");
      const current = id === audioCurrentId;
      const playing = current && !audio.paused;
      row.classList.toggle("is-current", current);
      if (button && button.getAttribute("data-playing") !== String(playing)) {
        button.setAttribute("data-playing", String(playing));
        button.innerHTML = icon(playing ? "pause" : "play");
        button.setAttribute("aria-label", playing ? "Pause details track" : "Play details track");
      }
      if (button) button.setAttribute("data-action", current ? "toggle-audio" : "play-audio");
    });
  }

  function refreshAudioSpeedUI() {
    document.querySelectorAll(".audio-speed-pill span:first-child").forEach(function (node) { node.textContent = String(state.audioSpeed || 1).replace(".0", "") + "x"; });
    document.querySelectorAll(".audio-speed-menu").forEach(function (menu) {
      menu.classList.toggle("is-open", audioSpeedOpen);
      menu.querySelectorAll("[data-action=audio-speed]").forEach(function (button) { button.classList.toggle("active", Number(button.dataset.speed) === Number(state.audioSpeed)); });
    });
    document.querySelectorAll(".audio-speed-pill").forEach(function (button) { button.setAttribute("aria-expanded", String(audioSpeedOpen)); });
  }

  function updateMediaSession() {
    if (!audioCurrentId || !("mediaSession" in navigator) || typeof window.MediaMetadata === "undefined") return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: audioTrackTitle(audioCurrentId), artist: "CySA+ Study OS", album: currentAudioSectionTitle(audioCurrentId) });
      [["play", function () { audio.play(); }], ["pause", function () { audio.pause(); }], ["seekbackward", function () { audio.currentTime = Math.max(0, audio.currentTime - 10); }], ["seekforward", function () { audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + 10); }], ["previoustrack", function () { audioSectionRelative(-1); }], ["nexttrack", function () { audioSectionRelative(1); }]].forEach(function (entry) { try { navigator.mediaSession.setActionHandler(entry[0], entry[1]); } catch (error) {} });
    } catch (error) {}
  }

  function seekAudioSection(index, requestedId) {
    const id = requestedId || audioCurrentId;
    if (!id) return;
    if (id !== audioCurrentId) {
      playAudio(id, true);
      const seekAfterLoad = function () { if (audioCurrentId === id) seekAudioSection(index, id); audio.removeEventListener("loadedmetadata", seekAfterLoad); };
      audio.addEventListener("loadedmetadata", seekAfterLoad);
      return;
    }
    const sections = audioSections(id);
    if (!sections[index]) return;
    audio.currentTime = Number(sections[index].t || 0);
    updateAudioSectionUI();
    updateMediaSession();
  }

  function playAudio(id, fromStart) {
    if (!id || !CORE.audio || !CORE.audio[id]) return;
    audioDockDismissed = false;
    audioEndedPrompt = false;
    state.audio.playAll = state.audio.playAll || false;
    if (audioCurrentId !== id) {
      audioCurrentId = id;
      audio.src = "audio/" + encodeURIComponent(id) + ".mp3?v=" + encodeURIComponent(CORE.audio[id].secs || "");
      audio.load();
      const position = fromStart ? 0 : Number(state.audio.positions[id] || 0);
      const setPosition = function () { try { audio.currentTime = Math.min(position, Math.max(0, audio.duration - 0.5)); } catch (error) {} audio.removeEventListener("loadedmetadata", setPosition); };
      audio.addEventListener("loadedmetadata", setPosition);
    } else if (fromStart) audio.currentTime = 0;
    audio.playbackRate = Number(state.audioSpeed) || 1;
    setLastActivity({ type: "audio", audioId: id, lessonId: audioLessonId(id) });
    updateMediaSession();
    renderAudioDock();
    audio.play().then(function () { renderAudioDock(); }).catch(function () { showToast("This audio file is not available yet."); renderAudioDock(); });
  }

  function audioRelative(step) {
    const adjacent = adjacentAudioTrack(audioCurrentId, step);
    if (adjacent) playAudio(adjacent, true);
  }

  function toggleAudio() { if (!audioCurrentId) return; audioDockDismissed = false; audioEndedPrompt = false; if (audio.paused) { setLastActivity({ type: "audio", audioId: audioCurrentId, lessonId: audioLessonId(audioCurrentId) }); audio.play().catch(function () {}); } else audio.pause(); renderAudioDock(); }
  function closeAudioPlayer(source) {
    saveAudioPosition();
    audio.pause();
    audioDockDismissed = true;
    audioExpanded = false;
    audioSpeedOpen = false;
    const inline = source && source.closest ? source.closest(".audio-player-inline") : null;
    if (inline) {
      const id = inline.getAttribute("data-audio-player-id");
      inline.hidden = true;
      if (!inline.previousElementSibling || !inline.previousElementSibling.matches(".audio-inline-restore")) inline.insertAdjacentHTML("beforebegin", '<button class="button small audio-inline-restore" type="button" data-action="show-inline-audio" data-audio-id="' + escapeHTML(id) + '">' + icon("play") + ' Show audio player</button>');
    }
    renderAudioDock();
  }
  function startAudioPlaylist() { state.audio.playAll = true; saveState(); const first = audioQueue()[0]; if (first) playAudio(first, true); else showToast("No audio tracks are available yet."); }

  function openCardSession(deck, mode) {
    const source = deck === "due" ? allCards() : cardFilter(deck || "all");
    let cards = mode === "spaced" ? dueCardsForSource(source) : source.slice();
    if (!cards.length && mode === "spaced") { showToast("Nothing is due. Use Cram for the full deck."); return; }
    if (!cards.length) { showToast("This deck is empty in the current data set."); return; }
    cards = shuffle(cards);
    if (mode === "spaced") introduceCards(cards);
    saveState();
    cardSession = { deck: deck || "all", name: deckName(deck || "all"), mode: mode || "spaced", cards: cards, index: 0, flipped: false, reverse: false, ratings: {} };
    state.lastActivity = { type: "cards", lessonId: deck && deck.indexOf("lesson:") === 0 ? deck.slice(7) : "", at: Date.now() };
    saveState();
    go("cards/session");
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) { const swap = Math.floor(Math.random() * (index + 1)); const temp = copy[index]; copy[index] = copy[swap]; copy[swap] = temp; }
    return copy;
  }

  function renderCards(route) {
    if (route.parts[1] === "session") { renderCardSession(); return; }
    return renderCardsView(route);
    return loadData("lessons").then(function () { return loadData("glossary"); }).then(function () {
      const selected = route.params.get("deck") || "";
      const cards = allCards();
      const deckDefinitions = [
        { id: "due", title: "Due today", description: "Reviews plus today’s new-card allowance.", count: dueCardsForSource(cards).length, symbol: "clock" },
        { id: "all", title: "All lesson cards", description: "Every card from the mini-lessons.", count: cards.filter(function (c) { return c.type === "lesson"; }).length, symbol: "cards" },
        { id: "starred", title: "My starred", description: "Your personal high-signal pile.", count: cards.filter(function (c) { return cardState(c.key).starred; }).length, symbol: "star" },
        { id: "glossary", title: "Glossary", description: "Term → definition recall reps.", count: cards.filter(function (c) { return c.type === "glossary"; }).length, symbol: "book" }
      ];
      app.innerHTML = '<div class="page-head compact-head"><div><p class="eyebrow">SPACED REPETITION</p><h1>Flashcards</h1><p class="lead">Reviews return when they are due; new cards arrive from lessons you have opened.</p></div><div class="actions"><span class="status-chip">' + dueCardsForSource(cards).length + ' due now</span></div></div><div class="deck-mode"><span class="field-label">Session mode</span><div class="segmented"><button class="active" type="button">Spaced</button><button type="button">Cram</button></div><button class="button small" data-action="start-cards" data-deck="all" data-mode="cram">Start cram</button><span class="subtle">' + newCardsPerDay() + ' new cards/day · Again · Hard · Good · Easy</span></div><div class="deck-list">' + deckDefinitions.map(function (deck) { return '<section class="surface deck-card"><div><span class="deck-symbol">' + icon(deck.symbol) + '</span><h3>' + deck.title + '</h3><p>' + deck.description + '</p></div><div class="row-between"><span class="deck-count">' + deck.count + ' cards</span><button class="button small primary" data-action="start-cards" data-deck="' + deck.id + '" data-mode="spaced">Study ' + icon("arrow") + '</button></div></section>'; }).join("") + '</div><section class="section-block"><div class="section-title"><h2>By domain</h2><span class="subtle">Focus your weak area</span></div><div class="deck-list">' + CORE.domains.map(function (domain) { const set = cards.filter(function (card) { return Number(card.domain) === Number(domain.n) && card.type === "lesson"; }); return '<section class="surface deck-card"><div><span class="domain-chip domain-' + domain.n + '">DOMAIN 0' + domain.n + '</span><h3 style="margin-top:12px">' + escapeHTML(domain.title) + '</h3><p>' + domain.weight + '% exam weight · lessons and cards.</p></div><div class="row-between"><span class="deck-count">' + set.length + ' cards</span><button class="button small" data-action="start-cards" data-deck="domain:' + domain.n + '" data-mode="spaced">Study ' + icon("arrow") + '</button></div></section>'; }).join("") + '</div></section><section class="section-block"><div class="section-title"><h2>By chapter</h2><span class="subtle">' + CORE.chapters.length + ' chapters</span></div><div class="deck-list">' + CORE.chapters.map(function (chapter) { const set = cards.filter(function (card) { return Number(card.chapter) === Number(chapter.n) && card.type === "lesson"; }); return '<section class="surface deck-card"><div><span class="chapter-number">' + String(chapter.n).padStart(2, "0") + '</span><h3 style="margin-top:12px">' + escapeHTML(decodeText(chapter.title)) + '</h3><p>' + domainName(chapter.domain) + '</p></div><div class="row-between"><span class="deck-count">' + set.length + ' cards</span><button class="button small" data-action="start-cards" data-deck="chapter:' + chapter.n + '" data-mode="spaced">Study ' + icon("arrow") + '</button></div></section>'; }).join("") + '</div></section><section class="section-block"><div class="section-title"><h2>By lesson</h2><span class="subtle">' + lessonDecks.length + ' lessons with cards</span></div><div class="deck-list">' + (lessonDecks.length ? lessonDecks.map(function (lesson) { const set = cards.filter(function (card) { return card.type === "lesson" && card.lessonId === lesson.id; }); return '<section class="surface deck-card"><div><span class="deck-symbol">' + icon("book-open") + '</span><h3>' + escapeHTML(decodeText(lesson.title)) + '</h3><p>Chapter ' + lesson.ch + ' · ' + domainName(lesson.domain) + '</p></div><div class="row-between"><span class="deck-count">' + set.length + ' cards</span><button class="button small" data-action="start-cards" data-deck="lesson:' + escapeHTML(lesson.id) + '" data-mode="spaced">Study ' + icon("arrow") + '</button></div></section>'; }).join("") : '<section class="surface empty-state"><div class="empty-icon">' + icon("cards") + '</div><h2>Lesson cards are still being written</h2><p>As lesson data arrives, its deck will appear here automatically.</p></section>') + '</div></section>' + (selected ? '<section class="surface pad section-block"><div class="row-between"><div><p class="eyebrow">SELECTED DECK</p><h2 style="font-size:21px;margin-bottom:3px">' + escapeHTML(deckName(selected)) + '</h2><p class="muted" style="margin:0">' + cardFilter(selected).length + ' cards in this deck.</p></div><div class="row"><button class="button" data-action="start-cards" data-deck="' + escapeHTML(selected) + '" data-mode="cram">Cram</button><button class="button primary" data-action="start-cards" data-deck="' + escapeHTML(selected) + '" data-mode="spaced">Study due</button></div></div></section>' : "");
      if (selected) scrollToElement(document.querySelector(".deck-mode"));
    });
  }

  function renderCardsView(route) {
    return Promise.all([loadData("lessons"), loadData("glossary")]).then(function () {
      const selected = route.params.get("deck") || "";
      const cards = allCards();
      const lessonDecks = CORE.lessons.filter(function (lesson) { return cards.some(function (card) { return card.type === "lesson" && card.lessonId === lesson.id; }); });
      const deckDefinitions = [
        { id: "due", title: "Due today", description: "Reviews plus today’s new-card allowance.", count: dueCardsForSource(cards).length, symbol: "clock" },
        { id: "all", title: "All lesson cards", description: "Every card from the mini-lessons.", count: cards.filter(function (card) { return card.type === "lesson"; }).length, symbol: "cards" },
        { id: "starred", title: "My starred", description: "Your personal high-signal pile.", count: cards.filter(function (card) { return cardState(card.key).starred; }).length, symbol: "star" },
        { id: "glossary", title: "Glossary", description: "Term → definition recall reps.", count: cards.filter(function (card) { return card.type === "glossary"; }).length, symbol: "book" }
      ];
      function deckCardHTML(title, description, count, deck, symbol, domain) {
        return '<section class="surface deck-card">' + (domain ? '<span class="domain-chip domain-' + domain + '">DOMAIN 0' + domain + '</span>' : '<span class="deck-symbol">' + icon(symbol || "cards") + '</span>') + '<div><h3 style="margin-top:12px">' + title + '</h3><p>' + description + '</p></div><div class="row-between"><span class="deck-count">' + count + ' cards</span><span class="row" style="gap:5px"><button class="button small" data-action="start-cards" data-deck="' + escapeHTML(deck) + '" data-mode="cram"' + (count ? '' : ' disabled aria-disabled="true"') + '>Cram</button><button class="button small primary" data-action="start-cards" data-deck="' + escapeHTML(deck) + '" data-mode="spaced"' + (count ? '' : ' disabled aria-disabled="true"') + '>Study ' + icon("arrow") + '</button></span></div></section>';
      }
      let html = '<div class="page-head compact-head"><div><p class="eyebrow">SPACED REPETITION</p><h1>Flashcards</h1><p class="lead">Reviews return when they are due; new cards arrive from lessons you have opened.</p></div><div class="actions"><span class="status-chip">' + dueCardsForSource(cards).length + ' due now</span></div></div><div class="deck-mode"><span class="field-label">Session mode</span><div class="segmented"><button class="active" type="button">Spaced</button><button type="button">Cram</button></div><button class="button small" data-action="start-cards" data-deck="all" data-mode="cram">Start cram</button><span class="subtle">' + newCardsPerDay() + ' new cards/day · Again · Hard · Good · Easy</span></div><div class="deck-list">' + deckDefinitions.map(function (deck) { return deckCardHTML('<span>' + deck.title + '</span>', deck.description, deck.count, deck.id, deck.symbol); }).join("") + '</div>';
      html += '<section class="section-block"><div class="section-title"><h2>By domain</h2><span class="subtle">Focus your weak area</span></div><div class="deck-list">' + CORE.domains.map(function (domain) { const set = cards.filter(function (card) { return Number(card.domain) === Number(domain.n) && card.type === "lesson"; }); return deckCardHTML(escapeHTML(domain.title), "Lessons and cards in this domain.", set.length, "domain:" + domain.n, "", domain.n); }).join("") + '</div></section>';
      html += '<section class="section-block"><div class="section-title"><h2>By chapter</h2><span class="subtle">' + CORE.chapters.length + ' chapters</span></div><div class="deck-list">' + CORE.chapters.map(function (chapter) { const set = cards.filter(function (card) { return Number(card.chapter) === Number(chapter.n) && card.type === "lesson"; }); return deckCardHTML(escapeHTML(decodeText(chapter.title)), domainName(chapter.domain), set.length, "chapter:" + chapter.n, "book"); }).join("") + '</div></section>';
      html += '<section class="section-block"><div class="section-title"><h2>By lesson</h2><span class="subtle">' + lessonDecks.length + ' lessons with cards</span></div><div class="deck-list">' + (lessonDecks.length ? lessonDecks.map(function (lesson) { const set = cards.filter(function (card) { return card.type === "lesson" && card.lessonId === lesson.id; }); return deckCardHTML(escapeHTML(decodeText(lesson.title)), "Chapter " + lesson.ch + " · " + domainName(lesson.domain), set.length, "lesson:" + lesson.id, "book-open"); }).join("") : '<section class="surface empty-state"><div class="empty-icon">' + icon("cards") + '</div><h2>Lesson cards are still being written</h2><p>As lesson data arrives, its deck will appear here automatically.</p></section>') + '</div></section>';
      if (selected) html += '<section class="surface pad section-block"><div class="row-between"><div><p class="eyebrow">SELECTED DECK</p><h2 style="font-size:21px;margin-bottom:3px">' + escapeHTML(deckName(selected)) + '</h2><p class="muted" style="margin:0">' + cardFilter(selected).length + ' cards in this deck.</p></div><div class="row"><button class="button" data-action="start-cards" data-deck="' + escapeHTML(selected) + '" data-mode="cram">Cram</button><button class="button primary" data-action="start-cards" data-deck="' + escapeHTML(selected) + '" data-mode="spaced">Study due</button></div></div></section>';
      app.innerHTML = html;
      if (selected) scrollToElement(document.querySelector(".deck-mode"));
    });
  }

  function cardDisplay(card) {
    if (!cardSession.reverse) return { front: card.front, back: card.back };
    return { front: card.back, back: card.front };
  }

  function renderCardSession() {
    if (!cardSession) { go("cards"); return; }
    if (cardSession.index >= cardSession.cards.length) { renderCardSummary(); return; }
    const card = cardSession.cards[cardSession.index];
    const display = cardDisplay(card);
    const saved = cardState(card.key);
    const pct = (cardSession.index / cardSession.cards.length) * 100;
    app.innerHTML = '<div class="flashcard-page"><div class="session-toolbar"><div class="session-toolbar-main"><button class="back-affordance" type="button" data-action="go-back" data-fallback="cards" aria-label="Back to Cards">' + icon("back") + '<span>Back</span></button><div><p class="eyebrow">' + (cardSession.mode === "cram" ? "CRAM MODE" : "SPACED SESSION") + '</p><div class="session-counter">' + escapeHTML(cardSession.name) + ' · ' + (cardSession.index + 1) + ' / ' + cardSession.cards.length + '</div></div></div><div class="row"><button class="button small" data-action="toggle-reverse">' + icon("repeat") + ' ' + (cardSession.reverse ? "Back → front" : "Front → back") + '</button><a class="button small" href="#/cards">Exit</a></div></div><div class="progress-track" style="margin-bottom:18px"><div class="progress-fill" style="width:' + pct + '%"></div></div><div class="flashcard-stage"><div class="flashcard ' + (cardSession.flipped ? "is-flipped" : "") + '" id="flashcard" data-action="flip-card"><button class="star-button ' + (saved.starred ? "starred" : "") + '" data-action="star-card" data-card-key="' + escapeHTML(card.key) + '" aria-label="' + (saved.starred ? "Unstar" : "Star") + ' card">' + icon("star") + '</button><div class="flashcard-inner"><div class="flashcard-face front"><span class="face-label">Prompt · tap to flip</span><div class="face-content">' + contentHTML(display.front) + '</div></div><div class="flashcard-face back"><span class="face-label">Answer</span><div class="face-content">' + contentHTML(display.back) + '</div></div></div></div></div><p class="flashcard-hint">Space to flip · 1 Again · 2 Hard · 3 Good · 4 Easy · swipe left/right</p><div class="rating-row"><button class="rating-button again" data-action="rate-session-card" data-rating="again">Again<small>now</small></button><button class="rating-button hard" data-action="rate-session-card" data-rating="hard">Hard<small>tomorrow</small></button><button class="rating-button good" data-action="rate-session-card" data-rating="good">Good<small>next interval</small></button><button class="rating-button easy" data-action="rate-session-card" data-rating="easy">Easy<small>longer interval</small></button></div><div class="center subtle" style="margin-top:16px">' + (saved.seen ? "Seen " + saved.seen + "×" : "New card") + '</div></div>';
    const flashcard = document.getElementById("flashcard");
    if (flashcard) {
      flashcard.addEventListener("touchstart", function (event) { touchStartX = event.changedTouches[0].screenX; }, { passive: true });
      flashcard.addEventListener("touchend", function (event) { if (touchStartX == null) return; const delta = event.changedTouches[0].screenX - touchStartX; touchStartX = null; if (Math.abs(delta) > 55) { rateSessionCard(delta < 0 ? "again" : "good"); } }, { passive: true });
    }
  }

  function rateSessionCard(rating) {
    if (!cardSession || cardSession.index >= cardSession.cards.length) return;
    const card = cardSession.cards[cardSession.index];
    if (cardSession.mode === "spaced") rateCard(card, rating);
    else { touchActivity("card"); saveState(); }
    cardSession.ratings[rating] = (cardSession.ratings[rating] || 0) + 1;
    if (rating === "again" && cardSession.mode === "spaced") { const insertion = Math.min(cardSession.cards.length, cardSession.index + 3); cardSession.cards.splice(insertion, 0, card); }
    cardSession.index += 1;
    cardSession.flipped = false;
    renderCardSession();
  }

  function renderCardSummary() {
    const ratings = cardSession.ratings || {};
    const total = Object.values(ratings).reduce(function (sum, value) { return sum + value; }, 0);
    const lessonId = cardSession.deck.indexOf("lesson:") === 0 ? cardSession.deck.slice(7) : "";
    const next = lessonId ? nextLessonAfter(lessonId) : null;
    const nextDeck = next && allCards().some(function (card) { return card.lessonId === next.id; }) ? "lesson:" + next.id : "all";
    app.innerHTML = '<div class="flashcard-page"><div class="result-head"><button class="back-affordance" type="button" data-action="go-back" data-fallback="cards" aria-label="Back to Cards">' + icon("back") + '<span>Back</span></button><p class="eyebrow">SESSION COMPLETE</p></div><h1>Nice work. The queue moved.</h1><section class="surface pad-lg"><div class="result-score"><div class="score-ring"><b>' + total + '</b><small>cards</small></div><div class="result-details"><h2>' + escapeHTML(cardSession.name) + '</h2><p>' + (ratings.again ? ratings.again + ' marked Again. They will come back soon.' : "No cards were sent back to the front of the queue.") + '</p></div></div><div class="row" style="margin-top:23px">' + ["again", "hard", "good", "easy"].map(function (rating) { return '<span class="status-chip">' + rating[0].toUpperCase() + rating.slice(1) + ': ' + (ratings[rating] || 0) + '</span>'; }).join("") + '</div></section><section class="surface card-next-prompts"><p class="eyebrow">WHAT NEXT?</p><div class="row">' + (lessonId ? '<a class="button primary" href="#/practice?lesson=' + encodeURIComponent(lessonId) + '">Quiz this lesson</a>' : '') + '<button class="button" data-action="start-cards" data-deck="' + escapeHTML(nextDeck) + '" data-mode="cram">Next deck ' + icon("arrow") + '</button><a class="button" href="#/cards">Back to Cards</a></div></section><div class="row" style="margin-top:17px"><button class="button" data-action="restart-cards">Study again</button><a class="button" href="#/stats">See forecast</a></div></div>';
  }

  function sourceLabel(set) { return ({ sg: "Chapter review", lq: "Lesson quiz", d1: "Domain 1 drill", d2: "Domain 2 drill", d3: "Domain 3 drill", d4: "Domain 4 drill", pt1: "Practice Test 1", pt2: "Practice Test 2" })[set] || "Question bank"; }

  function questionDomain(question) {
    if (question.d) return Number(question.d);
    if (question.l && getLesson(question.l)) return Number(getLesson(question.l).domain);
    if (question.l2 && getLesson(question.l2)) return Number(getLesson(question.l2).domain);
    if (question.ch && getChapter(question.ch)) return Number(getChapter(question.ch).domain);
    if (/^d[1-4]$/.test(question.set || "")) return Number(question.set.charAt(1));
    return null;
  }

  function practiceFilterFromRoute(route) {
    return { source: route.params.get("source") || "any", domains: route.params.get("domain") ? [route.params.get("domain")] : [], chapters: route.params.get("chapter") ? [route.params.get("chapter")] : [], lessons: route.params.get("lesson") ? [route.params.get("lesson")] : [], filters: route.params.get("filter") ? [route.params.get("filter")] : [] };
  }

  function focusedQuizConfig(route) {
    const focus = practiceFilterFromRoute(route);
    if (!focus.lessons.length && !focus.chapters.length && !focus.filters.length) return null;
    let list = (window.QUESTIONS || []).slice();
    let name = "Focused practice";
    if (focus.lessons.length) {
      const id = focus.lessons[0];
      list = list.filter(function (question) { return question.l === id || question.l2 === id; });
      name = "Lesson quiz · " + lessonTitle(id);
    } else if (focus.chapters.length) {
      const chapter = focus.chapters[0];
      list = list.filter(function (question) { return String(question.ch) === String(chapter); });
      name = "Chapter " + chapter + " quiz";
    } else if (focus.filters.includes("missed")) {
      list = list.filter(function (question) { return isQuestionMissed(question.id); });
      name = "My misses";
    }
    list.sort(function (a, b) { return (a.set === "lq" ? 0 : 1) - (b.set === "lq" ? 0 : 1); });
    return { list: list, name: name, kind: focus.lessons.length ? "lesson" : focus.chapters.length ? "chapter" : "missed" };
  }

  function focusedQuizChoicesHTML(focus) {
    if (!focus || !focus.list) return "";
    const total = focus.list.length;
    return '<div class="focused-quiz-choices"><span class="subtle">Quiz length</span><div class="row">' + [10, 25, total].filter(function (value, index, values) { return value > 0 && values.indexOf(value) === index; }).map(function (count) { return '<button class="button small ' + (count === Math.min(10, total) ? "primary" : "") + '" data-action="focused-length" data-count="' + count + '">' + (count === total ? "All" : count) + '</button>'; }).join("") + '</div><span class="subtle">' + total + ' matching question' + (total === 1 ? "" : "s") + ' · tutor mode</span></div>';
  }

  function renderPractice(route) {
    return loadData("questions").then(function () {
      const filters = practiceFilterFromRoute(route);
      const focused = focusedQuizConfig(route);
      if (focused) {
        if (focused.list.length) {
          launchQuiz(focused.list.slice(0, Math.min(10, focused.list.length)), focused.name, "tutor", false, "focused", { list: focused.list, name: focused.name, kind: focused.kind, ordered: true });
        } else {
          app.innerHTML = '<div class="page-head compact-head"><div><p class="eyebrow">FOCUSED PRACTICE</p><h1>' + escapeHTML(focused.name) + '</h1><p class="lead">There are no questions in this queue yet.</p></div></div><section class="surface empty-state"><div class="empty-icon">' + icon("target") + '</div><h2>Nothing to review</h2><p>Answer a few questions incorrectly and they will collect here, or choose another slice from the builder.</p><a class="button primary" href="#/practice">Open quiz builder</a></section>';
        }
        return;
      }
      const missed = missedQuestionCount();
      const flagged = Object.values(state.questions).filter(function (record) { return record && record.flagged; }).length;
      app.innerHTML = '<div class="page-head compact-head"><div><p class="eyebrow">ACTIVE RECALL</p><h1>Practice</h1><p class="lead">Short tutor drills, full exams, and a queue for the questions that keep slipping.</p></div><div class="actions"><span class="status-chip">' + (window.QUESTIONS || []).length.toLocaleString() + ' questions loaded</span></div></div><section class="surface practice-hero"><p class="eyebrow">FAST START</p><h2>Choose a useful rep.</h2><p>Quick sets explain each answer. Full exams use the official timing and weighted mock mix.</p><div class="row"><button class="button primary" data-action="quick-quiz" data-count="10">' + icon("lightning") + ' 10 random</button><button class="button" data-action="weakest-quiz">' + icon("target") + ' Weakest lesson</button><button class="button" data-action="start-misses">My misses (' + missed + ')</button><button class="button" data-action="start-flagged">Flagged (' + flagged + ')</button></div></section><div class="section-block"><div class="section-title"><h2>Full practice exams</h2><span class="subtle">' + examInfo().questions + ' questions · ' + examMinutes() + ' minutes</span></div><div class="practice-cards"><section class="surface practice-card"><span class="practice-icon">01</span><h3>Practice Test 1</h3><p>Use the first full test as a baseline. Feedback arrives after submission.</p><button class="button small" data-action="full-exam" data-set="pt1">Start test ' + icon("arrow") + '</button></section><section class="surface practice-card"><span class="practice-icon">02</span><h3>Practice Test 2</h3><p>A second complete pass with the same timed exam experience.</p><button class="button small" data-action="full-exam" data-set="pt2">Start test ' + icon("arrow") + '</button></section><section class="surface practice-card"><span class="practice-icon">' + icon("spark") + '</span><h3>Random mock exam</h3><p>' + examInfo().questions + ' questions sampled across the official domain weights.</p><button class="button small" data-action="full-exam" data-set="random">Build mock ' + icon("arrow") + '</button></section></div></div><section class="surface pad section-block"><div class="section-title"><div><p class="eyebrow">QUIZ BUILDER</p><h2 style="font-size:21px;margin-bottom:3px">Choose your slice.</h2><p class="muted" style="margin:0">Tutor mode explains each answer. Exam mode waits until the end.</p></div><span class="status-chip">' + missed + ' misses waiting</span></div><form id="quizBuilder"><div class="form-grid"><div class="form-field"><label for="quizSource">Source</label><select id="quizSource" name="source"><option value="any">Any question</option><option value="lq">Lesson quizzes</option><option value="sg">Chapter review</option><option value="d1">Domain 1 drill</option><option value="d2">Domain 2 drill</option><option value="d3">Domain 3 drill</option><option value="d4">Domain 4 drill</option><option value="pt1">Practice Test 1</option><option value="pt2">Practice Test 2</option></select></div><div class="form-field"><label for="quizNumber">Number of questions</label><select id="quizNumber" name="number"><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="all">All that match</option></select></div><div class="form-field"><label for="quizDomains">Domains <span class="subtle">(optional)</span></label><select id="quizDomains" name="domains" multiple>' + CORE.domains.map(function (domain) { return '<option value="' + domain.n + '">Domain ' + domain.n + ' · ' + escapeHTML(domain.title) + '</option>'; }).join("") + '</select></div><div class="form-field"><label for="quizChapters">Chapters <span class="subtle">(optional)</span></label><select id="quizChapters" name="chapters" multiple>' + CORE.chapters.map(function (chapter) { return '<option value="' + chapter.n + '">Chapter ' + chapter.n + ' · ' + escapeHTML(decodeText(chapter.title)) + '</option>'; }).join("") + '</select></div><div class="form-field full"><label for="quizLessons">Lessons <span class="subtle">(optional)</span></label><select id="quizLessons" name="lessons" multiple>' + CORE.lessons.map(function (lesson) { return '<option value="' + escapeHTML(lesson.id) + '">' + escapeHTML(decodeText(lesson.title)) + '</option>'; }).join("") + '</select></div><div class="form-field full"><span class="field-label">Filters</span><div class="check-row"><label class="check-label"><input type="checkbox" name="unseen"> Unseen only</label><label class="check-label"><input type="checkbox" name="missed"> Missed only</label><label class="check-label"><input type="checkbox" name="flagged"> Flagged only</label></div></div><div class="form-field full"><span class="field-label">Feedback</span><div class="check-row"><label class="check-label"><input type="radio" name="mode" value="tutor" checked> Tutor mode · explain as you go</label><label class="check-label"><input type="radio" name="mode" value="exam"> Exam mode · score at the end</label></div></div></div><div class="row" style="justify-content:flex-end;margin-top:19px"><button class="button primary" type="submit">Build my quiz ' + icon("arrow") + '</button></div></form></section>';
      const source = document.getElementById("quizSource"); if (source) source.value = filters.source;
      setMultiple("quizDomains", filters.domains); setMultiple("quizChapters", filters.chapters); setMultiple("quizLessons", filters.lessons);
      if (filters.filters.includes("missed")) document.querySelector('[name="missed"]').checked = true;
    });
  }

  function setMultiple(id, values) { const select = document.getElementById(id); if (!select) return; Array.from(select.options).forEach(function (option) { option.selected = values.includes(option.value); }); }
  function selectedValues(select) { return select ? Array.from(select.selectedOptions).map(function (option) { return option.value; }) : []; }

  function filterQuestions(criteria) {
    let questions = (window.QUESTIONS || []).slice();
    if (criteria.source && criteria.source !== "any") questions = questions.filter(function (question) { return question.set === criteria.source; });
    if (criteria.domains && criteria.domains.length) questions = questions.filter(function (question) { return criteria.domains.includes(String(questionDomain(question))); });
    if (criteria.chapters && criteria.chapters.length) questions = questions.filter(function (question) { return criteria.chapters.includes(String(question.ch)); });
    if (criteria.lessons && criteria.lessons.length) questions = questions.filter(function (question) { return criteria.lessons.includes(question.l) || criteria.lessons.includes(question.l2); });
    if (criteria.unseen) questions = questions.filter(function (question) { return !(state.questions[question.id] && state.questions[question.id].attempts); });
    if (criteria.missed) questions = questions.filter(function (question) { return isQuestionMissed(question.id); });
    if (criteria.flagged) questions = questions.filter(function (question) { return isQuestionFlagged(question.id); });
    return questions;
  }

  function prepareQuiz(list, preserveQuestionOrder) {
    const ordered = preserveQuestionOrder ? list.slice() : shuffle(list);
    return ordered.map(function (question) {
      const order = shuffle(question.o.map(function (_, index) { return index; }));
      return Object.assign({}, question, { options: order.map(function (index) { return question.o[index]; }), answer: order.indexOf(question.a), selected: null, correct: null });
    });
  }

  function quizLessonIdFromQuestions(questions, focus) {
    if (focus && focus.kind === "lesson") {
      const focused = (focus.list || [])[0];
      if (focused && (focused.l || focused.l2)) return focused.l || focused.l2;
    }
    const question = (questions || []).find(function (item) { return item && (item.l || item.l2); });
    return question ? (question.l || question.l2) : "";
  }

  function nextLessonAfter(id) {
    const index = CORE.lessons.findIndex(function (lesson) { return lesson.id === id; });
    return index >= 0 ? CORE.lessons[index + 1] || null : null;
  }

  function updateLessonQuizBest(id, percent) {
    if (!id) return;
    const current = Number(state.lessonQuizBest[id]);
    state.lessonQuizBest[id] = Math.max(Number.isFinite(current) ? current : 0, Number(percent) || 0);
  }

  function quizRelatedLinks(question) {
    const lessonId = question && (question.l || question.l2);
    if (!lessonId) return "";
    const segment = videoSegmentsForLesson(lessonId)[0];
    return '<div class="quiz-related-links"><a href="#/lesson/' + encodeURIComponent(lessonId) + '">Open ' + escapeHTML(lessonTitle(lessonId)) + ' ' + icon("arrow") + '</a>' + (segment ? '<a href="' + segmentHref(segment) + '">Watch Hank on this ' + icon("arrow") + '</a>' : '') + '</div>';
  }

  function quizResumeSnapshot() {
    if (!quizSession || !Array.isArray(quizSession.questions) || !quizSession.questions.length) return null;
    const focus = quizSession.focus ? { name: quizSession.focus.name, kind: quizSession.focus.kind, ordered: !!quizSession.focus.ordered, listIds: (quizSession.focus.list || []).map(function (question) { return question.id; }) } : null;
    return { name: quizSession.name, mode: quizSession.mode, exam: !!quizSession.exam, set: quizSession.set, focus: focus, questions: quizSession.questions, index: quizSession.index, score: quizSession.score, startedAt: quizSession.startedAt, endsAt: quizSession.endsAt };
  }

  function persistQuizSession() {
    const snapshot = quizResumeSnapshot();
    if (!snapshot) return;
    state.resumeQuiz = snapshot;
    state.lastActivity = { type: "quiz", lessonId: quizLessonIdFromQuestions(quizSession.questions, quizSession.focus), at: Date.now() };
    saveState();
  }

  function restoreQuizSession() {
    const saved = state.resumeQuiz;
    if (!saved || !Array.isArray(saved.questions) || !saved.questions.length) return false;
    const savedFocus = saved.focus && typeof saved.focus === "object" ? saved.focus : null;
    const focus = savedFocus ? { name: savedFocus.name, kind: savedFocus.kind, ordered: !!savedFocus.ordered, list: (savedFocus.listIds || []).map(function (id) { return (window.QUESTIONS || []).find(function (question) { return question.id === id; }); }).filter(Boolean) } : null;
    quizSession = { name: saved.name || "Practice set", mode: saved.mode || (saved.exam ? "exam" : "tutor"), exam: !!saved.exam, set: saved.set || "custom", focus: focus, questions: saved.questions, index: Math.max(0, Math.min(Number(saved.index || 0), saved.questions.length - 1)), score: Number(saved.score || 0), startedAt: Number(saved.startedAt || Date.now()), endsAt: Number(saved.endsAt || 0), submitted: false };
    if (quizSession.exam && quizSession.endsAt && quizSession.endsAt <= Date.now()) { submitExam(true); return "expired"; }
    return true;
  }

  function launchQuiz(list, name, mode, exam, set, focus) {
    if (!list || !list.length) { showToast("No questions match those filters yet."); return; }
    const prepared = prepareQuiz(list, !!(focus && focus.ordered));
    quizSession = { name: name || "Practice set", mode: mode || "tutor", exam: !!exam, set: set || "custom", focus: focus || null, questions: prepared, index: 0, score: 0, startedAt: Date.now(), endsAt: exam ? Date.now() + examMinutes() * 60 * 1000 : 0, submitted: false };
    if (set === "random") state.lastMockQuestionIds = prepared.map(function (question) { return question.id; });
    persistQuizSession();
    go("quiz/run?mode=" + (mode || "tutor"));
  }

  function startBuiltQuiz(criteria) {
    const all = filterQuestions(criteria);
    let count = criteria.number === "all" ? all.length : Number(criteria.number || 10);
    launchQuiz(shuffle(all).slice(0, Math.max(1, count)), criteria.name || sourceLabel(criteria.source), criteria.mode, false, "custom");
  }

  function mockQuestions() {
    const bank = (window.QUESTIONS || []).slice();
    const previous = new Set(state.lastMockQuestionIds || []);
    const fresh = bank.filter(function (question) { return !previous.has(question.id); });
    const target = Number(examInfo().questions) || 85;
    const source = fresh.length >= target ? fresh : bank;
    const domains = (CORE.domains || []).map(function (domain) { return { n: Number(domain.n), weight: Number(domain.weight) || 0 }; });
    const weightTotal = domains.reduce(function (sum, domain) { return sum + domain.weight; }, 0) || 100;
    const rawWanted = domains.map(function (domain) { return target * domain.weight / weightTotal; });
    const wanted = rawWanted.map(function (value) { return Math.floor(value); });
    let remainder = target - wanted.reduce(function (sum, count) { return sum + count; }, 0);
    domains.map(function (domain, index) { return { domain: domain, index: index, remainder: rawWanted[index] - wanted[index] }; }).sort(function (a, b) { return b.remainder - a.remainder; }).forEach(function (item) { if (remainder > 0) { wanted[item.index] += 1; remainder -= 1; } });
    const chosen = [];
    wanted.forEach(function (count, index) {
      const domainQuestions = shuffle(source.filter(function (question) { return questionDomain(question) === domains[index].n; }));
      chosen.push.apply(chosen, domainQuestions.slice(0, count));
    });
    const chosenIds = new Set(chosen.map(function (question) { return question.id; }));
    const fill = shuffle(source.filter(function (question) { return !chosenIds.has(question.id); }));
    return chosen.concat(fill).slice(0, target);
  }

  function finishTutorQuiz() {
    const percent = Math.round((quizSession.score / Math.max(quizSession.questions.length, 1)) * 100);
    const lessonId = quizLessonIdFromQuestions(quizSession.questions, quizSession.focus);
    updateLessonQuizBest(lessonId, percent);
    quizResult = { name: quizSession.name, questions: quizSession.questions.slice(), score: quizSession.score, total: quizSession.questions.length, exam: false, pct: percent, lessonId: lessonId };
    state.resumeQuiz = null;
    clearInterval(quizTimer); quizTimer = null; saveState(); go("quiz/result");
  }

  async function renderQuizRoute(route) {
    await loadData("questions");
    await loadData("videos");
    if (route.parts[1] === "run") {
      if (!quizSession) {
        const restored = restoreQuizSession();
        if (!restored) { go("practice"); return; }
        if (restored === "expired") return;
      }
      renderQuizRun(); return;
    }
    if (route.parts[1] === "result") { renderQuizResult(); return; }
    await renderPractice(route);
  }

  async function renderExamRoute(route) {
    if (route.parts[1] === "pt1" || route.parts[1] === "pt2" || route.parts[1] === "random") {
      await loadData("questions");
      const set = route.parts[1];
      const list = set === "random" ? mockQuestions() : (window.QUESTIONS || []).filter(function (question) { return question.set === set; });
      launchQuiz(list.slice(0, Number(examInfo().questions) || 85), set === "random" ? "Random mock exam" : sourceLabel(set), "exam", true, set);
      return;
    }
    await renderPractice(route);
  }

  function selectedQuestionAnswer(question) { return question.selected == null ? null : question.selected; }

  function renderQuizRun() {
    if (!quizSession) { go("practice"); return; }
    if (quizSession.index >= quizSession.questions.length && !quizSession.exam) { finishTutorQuiz(); return; }
    const question = quizSession.questions[quizSession.index];
    const exam = quizSession.exam;
    const selected = selectedQuestionAnswer(question);
    const answered = selected != null;
    const correct = answered ? selected === question.answer : null;
    const relatedLesson = question.l ? question.l : question.l2;
    const feedback = !exam && answered ? '<div class="quiz-feedback ' + (correct ? "correct" : "incorrect") + '"><div class="feedback-title">' + (correct ? "Correct. Keep that distinction." : "Not quite. The best answer is " + escapeHTML(String.fromCharCode(65 + question.answer)) + ".") + '</div>' + (question.e ? '<div class="feedback-explanation">' + contentHTML(question.e) + '</div>' : "") + quizRelatedLinks(question) + '</div>' : "";
    const progress = (quizSession.index / quizSession.questions.length) * 100;
    const flag = isQuestionFlagged(question.id);
    app.innerHTML = '<div class="quiz-run ' + (exam ? "" : "") + '"><div class="quiz-run-head"><div class="quiz-head-main"><button class="back-affordance" type="button" data-action="go-back" data-fallback="practice" aria-label="Back to Practice">' + icon("back") + '<span>Back</span></button><div><p class="eyebrow">' + (exam ? "EXAM MODE" : "TUTOR MODE") + '</p><h1>' + escapeHTML(quizSession.name) + '</h1><div class="quiz-meta"><span>Question ' + (quizSession.index + 1) + ' of ' + quizSession.questions.length + '</span>' + (exam ? '' : '<span>·</span><span>' + quizSession.score + ' correct so far</span>') + '</div>' + (quizSession.focus ? focusedQuizChoicesHTML(quizSession.focus) : '') + '</div></div>' + (exam ? '<div class="quiz-timer" id="quizTimer">' + examMinutes() + ':00</div>' : '') + '</div><div class="progress-track" style="margin-bottom:14px"><div class="progress-fill" style="width:' + progress + '%"></div></div>' + (exam ? '<div class="exam-layout">' : '') + '<section class="surface quiz-question-card"><div class="question-meta row-between"><span class="quiz-question-number">' + escapeHTML(sourceLabel(question.set)) + (question.k && answered && !exam ? ' · <span class="concept-chip">' + escapeHTML(question.k) + '</span>' : '') + '</span><button class="flag-button ' + (flag ? "flagged" : "") + '" data-action="quiz-flag">' + icon("flag") + (flag ? "Flagged" : "Flag for review") + '</button></div><div class="question-copy content">' + contentHTML(question.q) + '</div><div class="option-list">' + question.options.map(function (option, index) { const stateClass = !exam && answered ? (index === question.answer ? "correct" : index === selected ? "incorrect" : "") : exam && selected === index ? "selected" : ""; return '<button class="quiz-option ' + stateClass + '" data-action="quiz-answer" data-index="' + index + '" ' + (!exam && answered ? "disabled" : "") + '><span class="option-letter">' + String.fromCharCode(65 + index) + '</span><span>' + contentHTML(option) + '</span></button>'; }).join("") + '</div>' + feedback + '<div class="quiz-footer"><span class="subtle">' + (exam ? "Choose an answer, then use the navigator." : answered ? "Explanation shown · press next when ready." : "Pick the best answer.") + '</span><div class="quiz-footer-right">' + (exam && quizSession.index > 0 ? '<button class="button small" data-action="quiz-prev">' + icon("back") + ' Back</button>' : '') + (exam ? '<button class="button small primary" data-action="quiz-next">' + (quizSession.index === quizSession.questions.length - 1 ? "Review & submit" : "Next") + ' ' + icon("arrow") + '</button>' : answered ? '<button class="button small primary" data-action="quiz-next">Next ' + icon("arrow") + '</button>' : '') + '</div></div></section>' + (exam ? '<aside class="surface question-navigator"><h3>Question navigator</h3><div class="navigator-grid">' + quizSession.questions.map(function (item, index) { return '<button data-action="quiz-nav" data-index="' + index + '" class="' + (index === quizSession.index ? "current " : "") + (item.selected != null ? "answered " : "") + (isQuestionFlagged(item.id) ? "flagged" : "") + '">' + (index + 1) + '</button>'; }).join("") + '</div><div class="navigator-legend"><span class="legend-current">Current</span><span class="legend-answered">Answered</span><span class="legend-flagged">Flagged</span></div><button class="button primary" style="width:100%;margin-top:16px" data-action="quiz-submit">Submit exam</button></aside>' : '') + (exam ? '</div>' : '') + '</div>';
    if (exam) startQuizTimer();
  }

  function startQuizTimer() {
    clearInterval(quizTimer);
    const timer = document.getElementById("quizTimer");
    if (!timer || !quizSession) return;
    const update = function () { const remaining = Math.max(0, (quizSession.endsAt - Date.now()) / 1000); const mins = Math.floor(remaining / 60); const secs = Math.floor(remaining % 60); timer.textContent = mins + ":" + String(secs).padStart(2, "0"); timer.classList.toggle("warning", remaining < 600); if (remaining <= 0) { clearInterval(quizTimer); submitExam(true); } };
    update(); quizTimer = setInterval(update, 1000);
  }

  function chooseQuizOption(index) {
    if (!quizSession) return;
    const question = quizSession.questions[quizSession.index];
    if (!question || (!quizSession.exam && question.selected != null)) return;
    question.selected = Number(index);
    if (!quizSession.exam) {
      question.correct = question.selected === question.answer;
      if (question.correct) quizSession.score += 1;
      recordQuestionAnswer(question, question.correct, question.selected);
    }
    persistQuizSession();
    renderQuizRun();
  }

  function moveQuiz(delta) {
    if (!quizSession) return;
    if (!quizSession.exam && quizSession.questions[quizSession.index] && quizSession.questions[quizSession.index].selected == null) return;
    if (quizSession.index + delta >= quizSession.questions.length) { if (quizSession.exam) submitExam(false); else finishTutorQuiz(); return; }
    quizSession.index = Math.max(0, quizSession.index + delta); persistQuizSession(); renderQuizRun();
  }

  function submitExam(auto) {
    if (!quizSession || !quizSession.exam) return;
    if (!auto && quizSession.questions.some(function (question) { return question.selected == null; }) && !window.confirm("Some questions are unanswered. Submit anyway?")) return;
    clearInterval(quizTimer); quizTimer = null;
    let score = 0;
    quizSession.questions.forEach(function (question) { const correct = question.selected != null && question.selected === question.answer; question.correct = correct; if (correct) score += 1; if (question.selected != null) recordQuestionAnswer(question, correct, question.selected); });
    const pct = Math.round((score / Math.max(quizSession.questions.length, 1)) * 100);
    const lessonId = quizLessonIdFromQuestions(quizSession.questions, quizSession.focus);
    updateLessonQuizBest(lessonId, pct);
    const entry = { name: quizSession.name, set: quizSession.set, score: score, total: quizSession.questions.length, pct: pct, at: Date.now() };
    state.exams.unshift(entry); state.exams = state.exams.slice(0, 20); state.resumeQuiz = null; saveState();
    quizResult = { name: quizSession.name, questions: quizSession.questions.slice(), score: score, total: quizSession.questions.length, exam: true, pct: pct, auto: !!auto, lessonId: lessonId };
    go("quiz/result");
  }

  function renderQuizResult() {
    if (!quizResult) { go("practice"); return; }
    const pct = quizResult.pct;
    const estimate = scaledEstimate(pct);
    const domains = {};
    const lessonId = quizResult.lessonId || quizLessonIdFromQuestions(quizResult.questions);
    const next = lessonId ? nextLessonAfter(lessonId) : null;
    const nextPrompts = '<section class="surface quiz-next-prompts"><p class="eyebrow">KEEP THE LOOP MOVING</p><h2>Choose your next rep.</h2><div class="row"><a class="button" href="#/practice?filter=missed">Review misses</a><button class="button primary" data-action="retake-quiz">Retry ' + icon("repeat") + '</button>' + (lessonId ? '<a class="button" href="#/lesson/' + encodeURIComponent(lessonId) + '">Back to lesson</a>' : '') + (next ? '<a class="button" href="#/lesson/' + encodeURIComponent(next.id) + '">Next lesson ' + icon("arrow") + '</a>' : '') + '</div></section>';
    quizResult.questions.forEach(function (question) { const domain = questionDomain(question) || "?"; if (!domains[domain]) domains[domain] = { correct: 0, total: 0 }; domains[domain].total += 1; if (question.correct) domains[domain].correct += 1; });
    app.innerHTML = '<div class="quiz-result"><div class="result-head"><button class="back-affordance" type="button" data-action="go-back" data-fallback="practice" aria-label="Back to Practice">' + icon("back") + '<span>Back</span></button><p class="eyebrow">' + (quizResult.exam ? "EXAM COMPLETE" : "SESSION COMPLETE") + '</p></div><h1>' + (pct >= 83 ? "You are in passing territory." : pct >= 70 ? "Good base. Close a few gaps." : "This is useful data, not a verdict.") + '</h1><section class="surface pad-lg"><div class="result-score"><div class="score-ring"><b>' + pct + '%</b><small>' + quizResult.score + '/' + quizResult.total + '</small></div><div class="result-details"><h2>' + escapeHTML(quizResult.name) + '</h2><p>' + (quizResult.exam ? 'Rough scaled estimate: <b>' + estimate + '/' + escapeHTML(String(examInfo().scale || "100-900")) + '</b> <span class="subtle">(estimate only; CompTIA passing score is ' + examPassing() + ')</span>.' : 'Every miss is now part of your review signal.') + '</p>' + (quizResult.auto ? '<span class="status-chip warning">Time expired</span>' : '') + '</div></div><div class="row" style="margin-top:23px">' + Object.keys(domains).sort().map(function (domain) { const item = domains[domain]; return '<div class="breakdown-item" style="flex:1"><b>' + item.correct + '/' + item.total + '</b><span>' + (domain === "?" ? "Unmapped" : "Domain " + domain) + '</span></div>'; }).join("") + '</div></section>' + nextPrompts + '<div class="row" style="margin-top:17px"><a class="button" href="#/practice">Practice home</a><a class="button" href="#/stats">Stats</a></div><section class="surface pad section-block"><div class="section-title"><h2>Review every question</h2><span class="subtle">Explanations stay here</span></div><div class="review-list">' + quizResult.questions.map(function (question, index) { return '<details class="review-item ' + (question.correct ? "was-right" : "was-wrong") + '"><summary><b>' + (index + 1) + '. ' + (question.correct ? "Correct" : "Review") + '</b> · ' + escapeHTML(stripHTML(question.q).slice(0, 120)) + '</summary><div class="review-q">' + contentHTML(question.q) + '</div><div class="review-answer"><b>Best answer:</b> ' + contentHTML(question.options[question.answer]) + (question.k ? ' <span class="concept-chip">' + escapeHTML(question.k) + '</span>' : '') + '</div>' + (question.e ? '<div class="muted" style="margin-top:8px">' + contentHTML(question.e) + '</div>' : '') + quizRelatedLinks(question) + '</details>'; }).join("") + '</div></section></div>';
  }

  async function renderQuestionPage(id) {
    await loadData("questions");
    await loadData("videos");
    const question = (window.QUESTIONS || []).find(function (item) { return item.id === id; });
    if (!question) { go("practice"); return; }
    if (!singleQuestion || singleQuestion.id !== id) { const order = shuffle(question.o.map(function (_, index) { return index; })); singleQuestion = { id: id, question: question, options: order.map(function (index) { return question.o[index]; }), answer: order.indexOf(question.a), selected: null }; }
    const selected = singleQuestion.selected;
    const correct = selected != null && selected === singleQuestion.answer;
    app.innerHTML = '<div class="quiz-run"><div class="page-head compact-head"><div class="quiz-head-main"><button class="back-affordance" type="button" data-action="go-back" data-fallback="practice" aria-label="Back to Practice">' + icon("back") + '<span>Back</span></button><div><p class="eyebrow">SINGLE QUESTION</p><h1>Question review</h1><p class="muted">' + escapeHTML(sourceLabel(question.set)) + (question.k && selected != null ? ' · ' + escapeHTML(question.k) : '') + '</p></div></div></div><section class="surface quiz-question-card"><div class="question-copy content">' + contentHTML(question.q) + '</div><div class="option-list">' + singleQuestion.options.map(function (option, index) { return '<button class="quiz-option ' + (selected != null ? (index === singleQuestion.answer ? "correct" : index === selected ? "incorrect" : "") : "") + '" data-action="single-answer" data-index="' + index + '" ' + (selected != null ? "disabled" : "") + '><span class="option-letter">' + String.fromCharCode(65 + index) + '</span><span>' + contentHTML(option) + '</span></button>'; }).join("") + '</div>' + (selected != null ? '<div class="quiz-feedback ' + (correct ? "correct" : "incorrect") + '"><div class="feedback-title">' + (correct ? "Correct" : "Review the distinction") + '</div>' + (question.e ? '<div class="feedback-explanation">' + contentHTML(question.e) + '</div>' + quizRelatedLinks(question) : quizRelatedLinks(question)) + '</div>' : quizRelatedLinks(question)) + '</section></div>';
  }

  function renderBook(route) {
    return loadData("book").then(function () {
      const n = route.parts[1] ? Number(route.parts[1]) : null;
      if (!n) { renderBookIndex(); return; }
      const chapter = (window.BOOK || []).find(function (item) { return Number(item.n) === n; });
      if (!chapter) { renderBookIndex(); return; }
      bookChapterNumber = n;
      const lessons = chapterLessons(n);
      app.innerHTML = '<div class="page-head"><div class="chapter-head-main"><button class="back-affordance" type="button" data-action="go-back" data-fallback="book" aria-label="Back to Study guide">' + icon("back") + '<span>Back</span></button><div><p class="eyebrow">STUDY GUIDE · CHAPTER ' + n + '</p><h1>' + escapeHTML(decodeText(chapter.title)) + '</h1><p class="lead">Chapter reference text, essentials, and labs.</p></div></div><div class="actions"><div class="font-controls" title="Book font size"><button data-action="book-font-down" aria-label="Decrease font size">A−</button><button data-action="book-font-up" aria-label="Increase font size">A+</button></div></div></div><div class="book-layout"><aside class="surface book-sidebar"><h3>Chapters</h3><nav>' + (window.BOOK || []).map(function (item) { return '<a class="' + (Number(item.n) === n ? "active" : "") + '" href="#/book/' + item.n + '">' + item.n + '. ' + escapeHTML(decodeText(item.title)) + '</a>'; }).join("") + '</nav></aside><article class="book-content"><div class="surface pad book-intro"><div class="row-between"><div><p class="eyebrow">CHAPTER MAP</p><h2 style="font-size:20px;margin-bottom:4px">Lessons for this chapter</h2></div><span class="status-chip">' + lessons.length + ' lessons</span></div><div class="row" style="margin-top:10px">' + lessons.map(function (lesson) { return '<a class="status-chip" href="#/lesson/' + encodeURIComponent(lesson.id) + '">' + escapeHTML(decodeText(lesson.title)) + '</a>'; }).join("") + '</div></div><div class="surface pad" style="margin-bottom:16px"><p class="eyebrow">IN THIS CHAPTER</p><div class="book-toc">' + chapter.sections.map(function (section, index) { return '<a data-action="book-toc" data-chapter="' + n + '" data-section="' + index + '" data-target="book-section-' + index + '" href="#/book/' + n + '?section=' + index + '"><span>' + String(index + 1).padStart(2, "0") + '</span>' + escapeHTML(stripHTML(section.title)) + '</a>'; }).join("") + '</div><details><summary class="link-button">Show exam objectives</summary><div class="content" style="margin-top:13px">' + contentHTML((getChapter(n) || {}).objectives || "No objectives loaded.") + '</div></details></div><div class="book-prose content" style="font-size:' + Number(state.bookFont || 16) + 'px"><div class="surface pad" style="margin-bottom:16px">' + contentHTML(chapter.intro) + '</div>' + chapter.sections.map(function (section, index) { return '<section id="book-section-' + index + '" class="surface pad" style="margin-bottom:16px"><p class="eyebrow">SECTION ' + String(index + 1).padStart(2, "0") + '</p><h2 style="font-size:22px">' + escapeHTML(stripHTML(section.title)) + '</h2>' + contentHTML(section.html) + '<div class="row" style="margin-top:17px"><span class="subtle">Practice this chapter in shorter form:</span>' + lessons.slice(0, 3).map(function (lesson) { return '<a class="button small" href="#/lesson/' + encodeURIComponent(lesson.id) + '">' + escapeHTML(decodeText(lesson.title).slice(0, 28)) + (decodeText(lesson.title).length > 28 ? "…" : "") + '</a>'; }).join("") + '</div></section>'; }).join("") + '<section class="surface pad essentials"><p class="eyebrow">EXAM ESSENTIALS</p><h2 style="font-size:22px">What to carry forward</h2>' + contentHTML(chapter.essentials) + '</section>' + (chapter.labs ? '<details class="surface pad lab-block" style="margin-top:16px"><summary>Lab exercises</summary><div class="content" style="margin-top:15px">' + contentHTML(chapter.labs) + '</div>' + (chapter.labAnswers ? '<details style="margin-top:16px"><summary>Reveal lab answers</summary><div class="content" style="margin-top:12px">' + contentHTML(chapter.labAnswers) + '</div></details>' : '') + '</details>' : '') + '</div></article></div>';
    });
  }

  function renderBookIndex() {
    app.innerHTML = '<div class="page-head"><div><p class="eyebrow">THE REFERENCE LAYER</p><h1>Study guide</h1><p class="lead">12 chapters of reference text, labs, and essentials.</p></div><div class="actions"><a class="button primary" href="#/learn">' + icon("book-open") + ' Start with lessons</a></div></div><div class="book-layout"><aside class="surface book-sidebar"><h3>Chapters</h3><nav>' + (window.BOOK || []).map(function (chapter) { return '<a href="#/book/' + chapter.n + '">' + chapter.n + '. ' + escapeHTML(decodeText(chapter.title)) + '</a>'; }).join("") + '</nav></aside><div class="stack">' + (window.BOOK || []).map(function (chapter) { return '<a class="surface pad" href="#/book/' + chapter.n + '" style="display:block;color:inherit"><div class="row-between"><span class="chapter-number">' + String(chapter.n).padStart(2, "0") + '</span><span class="subtle">' + chapter.sections.length + ' sections</span></div><h2 style="font-size:21px;margin:18px 0 5px">' + escapeHTML(decodeText(chapter.title)) + '</h2><p class="muted" style="margin:0">' + stripHTML(chapter.intro).slice(0, 190) + (stripHTML(chapter.intro).length > 190 ? "…" : "") + '</p></a>'; }).join("") + '</div></div>';
  }

  function renderReference(route) {
    return Promise.all([loadData("glossary"), loadData("reference")]).then(async function () {
      const tab = route.parts[1] || "glossary";
      const tabs = '<div class="reference-tabs"><a class="' + (tab === "glossary" ? "active" : "") + '" href="#/reference/glossary">Glossary</a><a class="' + (tab === "sheets" ? "active" : "") + '" href="#/reference/sheets">Cheat sheets</a><a href="#/objectives">Official outline</a><a class="' + (tab === "objectives" ? "active" : "") + '" href="#/reference/objectives">Chapter checklist</a></div>';
      if (tab === "objectives" && route.anchor && /^obj-/.test(route.anchor)) await renderOfficialObjectives(route); else if (tab === "sheets") renderReferenceSheets(tabs); else if (tab === "objectives") renderObjectives(tabs); else renderGlossary(tabs, route.params.get("q") || "");
    });
  }

  function renderGlossary(tabs, query) {
    const glossary = window.GLOSSARY || [];
    app.innerHTML = '<div class="page-head"><div><p class="eyebrow">REFERENCE · TERMS</p><h1>Glossary</h1><p class="lead">Search terms and jump back to lessons.</p></div><div class="actions"><span class="status-chip">' + glossary.length + ' terms</span></div></div>' + tabs + '<div class="search-field" style="margin-top:18px"><span>' + icon("search") + '</span><input id="glossarySearch" type="search" value="' + escapeHTML(query) + '" placeholder="Search terms and definitions" aria-label="Search glossary"></div><div class="az-row">' + "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(function (letter) { return '<a href="#letter-' + letter + '">' + letter + '</a>'; }).join("") + '</div><div class="surface pad"><dl class="glossary-list" id="glossaryEntries">' + glossaryEntriesHTML(glossary, query) + '</dl></div>';
  }

  function glossaryEntriesHTML(list, query) {
    const needle = String(query || "").trim().toLowerCase();
    const filtered = needle ? list.filter(function (entry) { return (entry.t + " " + entry.d).toLowerCase().includes(needle); }) : list;
    if (!filtered.length) return '<div class="empty-state"><div class="empty-icon">' + icon("search") + '</div><h2>No glossary matches</h2><p>Try a shorter term or search the full workspace.</p></div>';
    let previous = "";
    return filtered.map(function (entry) { const first = String(entry.t || "").charAt(0).toUpperCase(); const anchor = first !== previous ? '<span id="letter-' + escapeHTML(first) + '"></span>' : ""; previous = first; return anchor + '<div class="glossary-entry"><dt>' + escapeHTML(entry.t) + '<div class="glossary-links">' + (entry.l || []).map(function (id) { return '<a href="#/lesson/' + encodeURIComponent(id) + '">' + escapeHTML(lessonTitle(id)) + ' →</a>'; }).join("") + '</div></dt><dd>' + contentHTML(entry.d) + '</dd></div>'; }).join("");
  }

  function renderReferenceSheets(tabs) {
    const reference = window.REFERENCE || {};
    const ids = Object.keys(reference);
    app.innerHTML = '<div class="page-head"><div><p class="eyebrow">REFERENCE · CHEAT SHEETS</p><h1>Cheat sheets</h1><p class="lead">Compact lookup tables for ports, tools, and commands.</p></div><div class="actions"><span class="status-chip">' + ids.length + ' sheets</span></div></div>' + tabs + (ids.length ? ids.map(function (id) { const sheet = reference[id] || {}; return '<section class="surface pad section-block"><p class="eyebrow">' + escapeHTML(id) + '</p><h2 style="font-size:21px;margin-bottom:5px">' + escapeHTML(sheet.title || id) + '</h2>' + (sheet.intro ? '<p class="muted">' + contentHTML(sheet.intro) + '</p>' : '') + '<div class="table-wrap sheet-table"><table><thead><tr>' + (sheet.columns || []).map(function (column) { return '<th>' + contentHTML(column) + '</th>'; }).join("") + '</tr></thead><tbody>' + (sheet.rows || []).map(function (row) { return '<tr>' + row.map(function (cell) { return '<td>' + contentHTML(cell) + '</td>'; }).join("") + '</tr>'; }).join("") + '</tbody></table></div><div class="sheet-mobile">' + (sheet.rows || []).map(function (row) { return '<div class="sheet-row">' + row.map(function (cell, index) { return '<div><b>' + escapeHTML((sheet.columns || [])[index] || "Value") + '</b><div>' + contentHTML(cell) + '</div></div>'; }).join("") + '</div>'; }).join("") + '</div></section>'; }).join("") : '<section class="surface empty-state section-block"><div class="empty-icon">' + icon("grid") + '</div><h2>Reference sheets are on the way</h2><p>The data slot is ready for ports, tools, commands, and other high-value lookup tables. The app will render any sheets added to <code>data/reference.js</code> automatically.</p><a class="button" href="#/reference/glossary">Use the glossary</a></section>');
    const searchWrap = document.createElement("div");
    searchWrap.className = "search-field";
    searchWrap.style.marginTop = "18px";
    searchWrap.innerHTML = '<span>' + icon("search") + '</span><input id="sheetSearch" type="search" placeholder="Search across all cheat sheets" aria-label="Search cheat sheets">';
    const firstSheet = app.querySelector(".section-block");
    if (firstSheet) firstSheet.before(searchWrap);
  }

  function objectiveRows(chapter) {
    const wrapper = document.createElement("ul"); wrapper.innerHTML = (chapter.objectives || "");
    const items = Array.from(wrapper.children).filter(function (node) { return node.tagName === "LI"; });
    if (!items.length) return '<div class="objective-copy">No objective text loaded.</div>';
    return items.map(function (item, index) { const key = "ch" + chapter.n + "-obj" + index; return '<label class="objective-row ' + (state.confident[key] ? "done" : "") + '"><input type="checkbox" data-action="objective-check" data-objective="' + key + '" ' + (state.confident[key] ? "checked" : "") + '><span class="objective-copy">' + item.innerHTML + '<span class="row" style="margin-top:8px">' + chapterLessons(chapter.n).slice(0, 4).map(function (lesson) { return '<a class="status-chip" onclick="event.stopPropagation()" href="#/lesson/' + encodeURIComponent(lesson.id) + '">' + escapeHTML(decodeText(lesson.title).slice(0, 22)) + (decodeText(lesson.title).length > 22 ? "…" : "") + '</a>'; }).join("") + '</span></span></label>'; }).join("");
  }

  function renderObjectives(tabs) {
    app.innerHTML = '<div class="page-head"><div><p class="eyebrow">REFERENCE · OBJECTIVES</p><h1>Chapter checklist</h1><p class="lead">Tick a chapter line when you can explain it without looking.</p></div><div class="actions"><span class="status-chip">' + Object.keys(state.confident).filter(function (key) { return state.confident[key]; }).length + ' confident</span></div></div>' + tabs + '<div class="stack" style="margin-top:18px">' + CORE.chapters.map(function (chapter) { return '<section class="surface pad"><div class="domain-strip"><span class="domain-chip domain-' + chapter.domain + '">DOMAIN ' + chapter.domain + '</span><span class="subtle">Chapter ' + chapter.n + '</span></div><h2 style="font-size:21px">' + escapeHTML(decodeText(chapter.title)) + '</h2><div class="objective-list">' + objectiveRows(chapter) + '</div></section>'; }).join("") + '</div>';
  }

  function groupStats(questions, keyFunction) {
    const map = {};
    questions.forEach(function (question) { const key = keyFunction(question); if (key == null || key === "") return; if (!map[key]) map[key] = { key: key, attempts: 0, correct: 0, questions: 0 }; map[key].questions += 1; const record = state.questions[question.id]; if (record) { map[key].attempts += Number(record.attempts || 0); map[key].correct += Number(record.correct || 0); } });
    return Object.values(map).map(function (item) { return Object.assign(item, { accuracy: item.attempts ? Math.round((item.correct / item.attempts) * 100) : null }); }).sort(function (a, b) { if (a.accuracy == null && b.accuracy != null) return 1; if (b.accuracy == null && a.accuracy != null) return -1; return (a.accuracy == null ? 101 : a.accuracy) - (b.accuracy == null ? 101 : b.accuracy); });
  }

  function statsRowsHTML(rows, labelFunction, drillFunction) {
    if (!rows.length) return '<p class="muted">There is no tagged question history here yet.</p>';
    return '<div class="weak-list">' + rows.slice(0, 12).map(function (row) { const label = labelFunction(row); return '<div class="weak-row"><div class="weak-copy"><b>' + escapeHTML(label) + '</b><small>' + (row.attempts ? row.correct + '/' + row.attempts + ' correct · ' + row.questions + ' questions' : row.questions + ' questions · not attempted') + '</small></div><span class="weak-score" style="color:' + (row.accuracy == null ? 'var(--muted)' : row.accuracy >= 80 ? 'var(--success)' : 'var(--danger)') + '">' + (row.accuracy == null ? "—" : row.accuracy + "%") + '</span>' + (drillFunction ? '<button class="button small" data-action="stats-drill" data-drill="' + escapeHTML(drillFunction(row)) + '">Drill</button>' : '') + '</div>'; }).join("") + '</div>';
  }

  async function renderStats() {
    showLoading("your stats");
    await Promise.all([loadData("questions"), loadData("lessons"), loadData("glossary")]);
    const questions = window.QUESTIONS || [];
    const domains = groupStats(questions, questionDomain);
    const chapters = groupStats(questions, function (question) { return question.ch; });
    const lessons = groupStats(questions.filter(function (question) { return question.l || question.l2; }), function (question) { return question.l || question.l2; });
    const dayValues = []; const date = new Date(); for (let index = 13; index >= 0; index -= 1) { const d = new Date(date); d.setDate(date.getDate() - index); const key = todayKey(d); dayValues.push({ key: key, count: state.daily[key] ? Number(state.daily[key].questions || 0) : 0, label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2) }); }
    const maxDay = Math.max.apply(null, dayValues.map(function (item) { return item.count; }).concat([1]));
    const forecast = []; const start = new Date(); for (let index = 0; index < 7; index += 1) { const d = new Date(start); d.setHours(0, 0, 0, 0); d.setDate(start.getDate() + index); const end = d.getTime() + 86400000; const count = allCards().filter(function (card) { const saved = cardState(card.key); return saved.seen && saved.due && dueDate(saved.due) >= d.getTime() && dueDate(saved.due) < end; }).length; forecast.push({ label: index === 0 ? "Today" : d.toLocaleDateString(undefined, { weekday: "short" }), count: count }); }
    app.innerHTML = '<div class="page-head compact-head"><div><p class="eyebrow">FEEDBACK LOOP</p><h1>Stats</h1><p class="lead">Accuracy, gaps, and card forecast.</p></div><div class="actions"><span class="status-chip">' + examInfo().questions + ' questions · ' + examMinutes() + ' min</span><a class="button" href="#/practice">Build a drill ' + icon("arrow") + '</a></div></div><div class="metric-grid"><section class="surface metric-card"><span class="metric-icon">' + icon("target") + '</span><div class="metric-label">Overall accuracy</div><div class="metric-value">' + (questionAccuracy() == null ? "—" : questionAccuracy() + "%") + '</div><div class="metric-detail">Across answered questions</div></section><section class="surface metric-card"><span class="metric-icon">' + icon("chart") + '</span><div class="metric-label">Questions answered</div><div class="metric-value">' + answeredQuestionCount() + '</div><div class="metric-detail">' + streakCount() + ' day streak</div></section><section class="surface metric-card"><span class="metric-icon">' + icon("cards") + '</span><div class="metric-label">Cards due</div><div class="metric-value">' + dueCardsCount() + '</div><div class="metric-detail">' + allCards().filter(isCardMastered).length + ' mastered</div></section><section class="surface metric-card"><span class="metric-icon">' + icon("spark") + '</span><div class="metric-label">Exam attempts</div><div class="metric-value">' + state.exams.length + '</div><div class="metric-detail">Full timed exams</div></section></div><div class="stats-grid section-block"><section class="surface pad"><div class="section-title"><h2 style="font-size:20px">Questions per day</h2><span class="subtle">last 14 days</span></div><div class="bar-chart">' + dayValues.map(function (item) { return '<div class="chart-column"><span class="chart-bar" style="height:' + Math.max(3, (item.count / maxDay) * 105) + 'px" title="' + item.count + ' questions"></span><b>' + item.count + '</b><small>' + item.label + '</small></div>'; }).join("") + '</div></section><section class="surface pad"><div class="section-title"><h2 style="font-size:20px">Cards due forecast</h2><span class="subtle">next 7 days</span></div><div class="forecast">' + forecast.map(function (item) { return '<div class="forecast-day"><span class="forecast-bar" style="height:' + Math.max(3, Math.min(42, item.count * 5)) + 'px"></span><b>' + item.count + '</b><small>' + escapeHTML(item.label) + '</small></div>'; }).join("") + '</div></section></div><div class="stats-grid section-block"><section class="surface pad"><div class="section-title"><h2 style="font-size:20px">Accuracy by domain</h2><span class="subtle">weakest first</span></div>' + statsRowsHTML(domains, function (row) { return row.key === "?" ? "Unmapped / practice tests" : "Domain " + row.key + " · " + domainName(row.key); }, function (row) { return "domain=" + row.key; }) + '</section><section class="surface pad"><div class="section-title"><h2 style="font-size:20px">Accuracy by chapter</h2><span class="subtle">review the source</span></div>' + statsRowsHTML(chapters, function (row) { const chapter = getChapter(row.key); return "Chapter " + row.key + " · " + decodeText((chapter || {}).title || ""); }, function (row) { return "chapter=" + row.key; }) + '</section></div><section class="surface pad section-block"><div class="section-title"><h2 style="font-size:20px">Lesson accuracy</h2><span class="subtle">only tagged questions</span></div>' + statsRowsHTML(lessons, function (row) { return lessonTitle(row.key); }, function (row) { return "lesson=" + row.key; }) + (lessons.length ? "" : '<p class="subtle">Lesson tagging is still being filled in. Chapter and domain drills are ready now.</p>') + '</section><section class="surface pad section-block"><div class="section-title"><h2 style="font-size:20px">Practice exam history</h2><span class="subtle">most recent first</span></div>' + (state.exams.length ? '<div class="table-wrap"><table class="history-table"><thead><tr><th>Exam</th><th>Date</th><th>Score</th><th>Estimate</th></tr></thead><tbody>' + state.exams.map(function (exam) { return '<tr><td>' + escapeHTML(exam.name) + '</td><td>' + escapeHTML(new Date(exam.at).toLocaleDateString()) + '</td><td><b>' + exam.pct + '%</b> · ' + exam.score + '/' + exam.total + '</td><td>' + scaledEstimate(exam.pct) + '/' + escapeHTML(String(examInfo().scale || "100-900")) + '</td></tr>'; }).join("") + '</tbody></table></div>' : '<p class="muted">Your first timed exam will show here after you submit it.</p>') + '</section>';
    const statsMetricGrid = app.querySelector(".metric-grid");
    if (statsMetricGrid) statsMetricGrid.insertAdjacentHTML("beforebegin", '<section class="surface pad domain-weight-summary"><div class="section-title"><h2 style="font-size:20px">Official exam weights</h2><a class="subtle" href="#/objectives">Objectives ' + icon("arrow") + '</a></div><div class="domain-weight-grid">' + CORE.domains.map(function (domain) { return '<div class="domain-weight domain-' + domain.n + '"><b>' + domain.weight + '%</b><span>Domain ' + domain.n + '</span><small>' + escapeHTML(domain.title) + '</small></div>'; }).join("") + '</div></section>');
  }

  function renderSettings() {
    app.innerHTML = '<div class="page-head"><div><p class="eyebrow">YOUR WORKSPACE</p><h1>Settings that stay yours.</h1><p class="lead">Everything is stored locally under one namespaced progress key. Export it when you want to move devices.</p></div></div><section class="surface pad settings-section"><h2>Study preferences</h2><p class="muted">Small changes make daily use feel better.</p><div class="settings-list"><div class="setting-row"><div class="setting-copy"><b>Theme</b><p>Follow the device, or choose a fixed theme.</p></div><div class="setting-control"><select id="settingTheme" data-setting="theme"><option value="light">Light</option><option value="dark">Dark</option></select></div></div><div class="setting-row"><div class="setting-copy"><b>Reading size</b><p>Comfortable type for lesson and book text.</p></div><div class="setting-control"><select id="settingFont" data-setting="fontSize"><option value="16">Compact</option><option value="17">Comfortable</option><option value="18">Large</option><option value="19">Extra large</option></select></div></div><div class="setting-row"><div class="setting-copy"><b>Exam date</b><p>Used for the countdown on Today.</p></div><div class="setting-control"><input class="form-control" style="max-width:190px" id="settingExamDate" data-setting="examDate" type="date" value="' + escapeHTML(state.examDate || "") + '"></div></div><div class="setting-row"><div class="setting-copy"><b>Default audio speed</b><p>Applied whenever a new lesson starts.</p></div><div class="setting-control"><select id="settingAudioSpeed" data-setting="audioSpeed"><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="1.75">1.75×</option><option value="2">2×</option></select></div></div></div></section><section class="surface pad settings-section"><h2>Move progress between devices</h2><p class="muted">Exports include completion, card scheduling, question history, flags, settings, and exam history. No content is included.</p><div class="import-export"><div class="export-box"><h3>Export a backup</h3><p>Download a JSON file you can keep or import later.</p><button class="button primary" data-action="export-progress">' + icon("download") + ' Download progress</button></div><div class="export-box"><h3>Import a backup</h3><p>Paste a JSON export below, or choose a file.</p><input id="importFile" type="file" accept="application/json,.json" style="max-width:100%;font-size:12px"><textarea id="importText" placeholder="Paste your cysa.v1 JSON here"></textarea><button class="button" data-action="import-progress">' + icon("upload") + ' Import pasted JSON</button></div></div></section><section class="surface pad settings-section"><h2>Reset this device</h2><p class="muted">This removes your local progress only. Generated study content stays untouched.</p><button class="button danger" data-action="reset-progress">Reset all progress</button></section>';
    const settingsList = app.querySelector(".settings-list");
    if (settingsList) settingsList.insertAdjacentHTML("beforeend", '<div class="setting-row"><div class="setting-copy"><b>New cards per day</b><p>Daily allowance for cards introduced from opened lessons.</p></div><div class="setting-control"><select id="settingNewCards" data-setting="newCardsPerDay"><option value="0">0</option><option value="10">10</option><option value="20">20</option><option value="30">30</option><option value="50">50</option><option value="100">100</option></select></div></div>');
    document.getElementById("settingTheme").value = state.theme; document.getElementById("settingFont").value = String(state.fontSize); document.getElementById("settingAudioSpeed").value = String(state.audioSpeed); if (document.getElementById("settingNewCards")) document.getElementById("settingNewCards").value = String(newCardsPerDay());
  }

  function renderMore() {
    app.innerHTML = '<div class="page-head compact-head"><div><p class="eyebrow">MORE</p><h1>More</h1><p class="lead">Reference, objectives, videos, stats, and settings.</p></div></div><div class="deck-list"><a class="surface deck-card" href="#/objectives"><div><span class="deck-symbol">' + icon("target") + '</span><h3>Objectives</h3><p>Track the official CS0-004 outline.</p></div><span class="deck-count">Official map ' + icon("arrow") + '</span></a><a class="surface deck-card" href="#/videos"><div><span class="deck-symbol">' + icon("play") + '</span><h3>Hank videos</h3><p>Mapped explanations and progress.</p></div><span class="deck-count">Watch ' + icon("arrow") + '</span></a><a class="surface deck-card" href="#/book"><div><span class="deck-symbol">' + icon("library") + '</span><h3>Study guide</h3><p>Read the complete chapter text.</p></div><span class="deck-count">12 chapters ' + icon("arrow") + '</span></a><a class="surface deck-card" href="#/reference"><div><span class="deck-symbol">' + icon("grid") + '</span><h3>Reference</h3><p>Glossary and cheat sheets.</p></div><span class="deck-count">Quick lookup ' + icon("arrow") + '</span></a><a class="surface deck-card" href="#/stats"><div><span class="deck-symbol">' + icon("chart") + '</span><h3>Stats</h3><p>See the signal behind your study.</p></div><span class="deck-count">Progress ' + icon("arrow") + '</span></a><a class="surface deck-card" href="#/settings"><div><span class="deck-symbol">' + icon("settings") + '</span><h3>Settings</h3><p>Theme, date, export, and reset.</p></div><span class="deck-count">Local only ' + icon("arrow") + '</span></a></div>';
  }

  function searchResults(query) {
    const needle = String(query || "").trim().toLowerCase();
    if (needle.length < 2) return {};
    const results = { Lessons: [], Glossary: [], "Study guide": [], Questions: [] };
    (CORE.lessons || []).forEach(function (lesson) { const body = (window.LESSONS || {})[lesson.id] || {}; const haystack = (lesson.title + " " + lesson.tldr + " " + stripHTML(body.html)).toLowerCase(); if (haystack.includes(needle)) results.Lessons.push({ title: decodeText(lesson.title), snippet: stripHTML(lesson.tldr || body.html).slice(0, 175), href: "#/lesson/" + encodeURIComponent(lesson.id), icon: "book-open" }); });
    (window.GLOSSARY || []).forEach(function (entry) { if ((entry.t + " " + entry.d).toLowerCase().includes(needle)) results.Glossary.push({ title: entry.t, snippet: entry.d, href: "#/reference/glossary?q=" + encodeURIComponent(entry.t), icon: "bulb" }); });
    (window.BOOK || []).forEach(function (chapter) { (chapter.sections || []).forEach(function (section, index) { const haystack = (chapter.title + " " + section.title + " " + stripHTML(section.html)).toLowerCase(); if (haystack.includes(needle)) results["Study guide"].push({ title: decodeText(chapter.title) + " · " + stripHTML(section.title), snippet: stripHTML(section.html).slice(0, 175), href: "#/book/" + chapter.n + "?section=" + index, icon: "library" }); }); });
    (window.QUESTIONS || []).forEach(function (question) { if ((question.q + " " + question.k + " " + question.e).toLowerCase().includes(needle)) results.Questions.push({ title: stripHTML(question.q).slice(0, 150), snippet: question.k || sourceLabel(question.set), href: "#/question/" + encodeURIComponent(question.id), icon: "target" }); });
    return results;
  }

  async function renderSearch(route) {
    showLoading("your search");
    await Promise.all([loadData("lessons"), loadData("book"), loadData("questions"), loadData("glossary")]);
    const query = route.params.get("q") || "";
    app.innerHTML = '<div class="page-head"><div><p class="eyebrow">SEARCH THE WORKSPACE</p><h1>Find the thread.</h1><p class="lead">Lessons, glossary terms, book sections, and questions are all searchable from one place.</p></div></div><div class="search-field"><span>' + icon("search") + '</span><input id="globalSearch" type="search" value="' + escapeHTML(query) + '" placeholder="Try: zero trust, CVSS, packet capture…" autocomplete="off" aria-label="Search all content"></div><div id="searchResults" style="margin-top:22px">' + renderSearchResultsHTML(query) + '</div>';
    const input = document.getElementById("globalSearch"); if (input) { input.focus({ preventScroll: true }); input.setSelectionRange(input.value.length, input.value.length); }
  }

  function renderSearchResultsHTML(query) {
    if (String(query || "").trim().length < 2) return '<section class="surface empty-state"><div class="empty-icon">' + icon("search") + '</div><h2>Start with a concept</h2><p>Search for a protocol, framework, metric, or a phrase from a question.</p></section>';
    const groups = searchResults(query); const nonEmpty = Object.keys(groups).filter(function (key) { return groups[key].length; }); if (!nonEmpty.length) return '<section class="surface empty-state"><div class="empty-icon">' + icon("search") + '</div><h2>No matches for “' + escapeHTML(query) + '”</h2><p>Try a shorter phrase or browse the study path.</p></section>';
    return '<div class="search-results">' + nonEmpty.map(function (group) { return '<section class="surface pad result-group"><h2>' + group + ' <small>' + groups[group].length + '</small></h2>' + groups[group].slice(0, 20).map(function (item) { return '<div class="result-item"><span class="result-kind">' + icon(item.icon) + '</span><span class="result-copy"><a href="' + item.href + '">' + escapeHTML(item.title) + '</a><p>' + escapeHTML(stripHTML(item.snippet)) + '</p></span></div>'; }).join("") + (groups[group].length > 20 ? '<p class="subtle">Showing the first 20 matches.</p>' : '') + '</section>'; }).join("") + '</div>';
  }

  function exportProgress() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "cysa-progress-" + todayKey() + ".json"; link.click(); URL.revokeObjectURL(url); showToast("Progress exported.");
  }

  function importProgress(raw) {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || (!parsed.completed && !parsed.cards && !parsed.questions)) throw new Error("That does not look like a CySA+ progress export.");
      state = normalizeState(parsed); saveState(); applyPreferences(); renderRoute(); showToast("Progress imported.");
    } catch (error) { showToast(error.message || "Could not import that JSON."); }
  }

  function cycleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyPreferences(); saveState(); showToast("Theme: " + state.theme);
  }

  function retakeQuiz() { if (!quizResult) return; launchQuiz(quizResult.questions.map(function (question) { return (window.QUESTIONS || []).find(function (item) { return item.id === question.id; }) || question; }), quizResult.name, quizResult.exam ? "exam" : "tutor", quizResult.exam, quizResult.exam ? quizSession?.set : "custom"); }

  function handleClick(event) {
    if (event.target.closest(".audio-dock-mini a")) return;
    const actionNode = event.target.closest("[data-action]");
    if (!actionNode) return;
    const action = actionNode.getAttribute("data-action");
    if (action === "start-cards") openCardSession(actionNode.dataset.deck, actionNode.dataset.mode);
    else if (action === "flip-card") cardSession && (cardSession.flipped = !cardSession.flipped, renderCardSession());
    else if (action === "toggle-reverse") { if (cardSession) { cardSession.reverse = !cardSession.reverse; cardSession.flipped = false; renderCardSession(); } }
    else if (action === "star-card") { const saved = cardState(actionNode.dataset.cardKey); saved.starred = !saved.starred; saveState(); if (cardSession) renderCardSession(); }
    else if (action === "rate-session-card") rateSessionCard(actionNode.dataset.rating);
    else if (action === "restart-cards") { if (cardSession) openCardSession(cardSession.deck, cardSession.mode); }
    else if (action === "play-audio") { state.audio.playAll = false; saveState(); playAudio(actionNode.dataset.audioId, false); }
    else if (action === "toggle-audio") toggleAudio();
    else if (action === "audio-expand") { const inline = inlinePlayerForCurrent(); if (inline) { audioExpanded = false; audioSpeedOpen = false; scrollToElement(inline.closest(".lesson-study-section") || inline); updateLessonStudyTabs(); } else { audioExpanded = true; audioSpeedOpen = false; renderAudioDock(); } }
    else if (action === "audio-minimize") { audioExpanded = false; audioSpeedOpen = false; renderAudioDock(); }
    else if (action === "audio-close") closeAudioPlayer(actionNode);
    else if (action === "show-inline-audio") { const player = document.querySelector('.audio-player-inline[data-audio-player-id="' + actionNode.dataset.audioId + '"]'); const restore = actionNode.closest(".audio-inline-restore"); if (player) player.hidden = false; if (restore) restore.remove(); playAudio(actionNode.dataset.audioId, false); }
    else if (action === "audio-speed-menu") { audioSpeedOpen = !audioSpeedOpen; const inline = actionNode.closest(".audio-player-inline"); if (inline) { const menu = inline.querySelector(".audio-speed-menu"); if (menu) menu.classList.toggle("is-open", audioSpeedOpen); actionNode.setAttribute("aria-expanded", String(audioSpeedOpen)); } else renderAudioDock(); refreshAudioSpeedUI(); }
    else if (action === "audio-speed") { state.audioSpeed = Number(actionNode.dataset.speed || 1); audio.playbackRate = state.audioSpeed; audioSpeedOpen = false; saveState(); renderAudioDock(); refreshAudioSpeedUI(); }
    else if (action === "audio-sleep") { const minutes = Number(actionNode.dataset.minutes || 0); audioSleepUntil = minutes ? Date.now() + minutes * 60000 : 0; audioSpeedOpen = false; showToast(minutes ? "Sleep timer set for " + minutes + " minutes." : "Sleep timer off."); renderAudioDock(); refreshAudioSpeedUI(); }
    else if (action === "audio-parts-toggle") { const parts = actionNode.closest(".audio-parts"); if (parts) { const open = !parts.classList.contains("is-open"); parts.classList.toggle("is-open", open); actionNode.setAttribute("aria-expanded", String(open)); } }
    else if (action === "audio-skip") { audio.currentTime = Math.max(0, Math.min(audio.duration || Infinity, audio.currentTime + Number(actionNode.dataset.seconds || 0))); renderAudioDock(); }
    else if (action === "audio-section") { if (actionNode.dataset.sectionIndex != null) seekAudioSection(Number(actionNode.dataset.sectionIndex), actionNode.dataset.audioId); else audioSectionRelative(Number(actionNode.dataset.step || 0)); }
    else if (action === "audio-prompt-next") playAudio(actionNode.dataset.audioId, true);
    else if (action === "play-all") startAudioPlaylist();
    else if (action === "open-video") { if (audioCurrentId && !audio.paused) audio.pause(); openVideoInPlace(actionNode.dataset.videoKey); }
    else if (action === "close-video") closeVideoInPlace();
    else if (action === "toggle-video-watched") { const key = actionNode.dataset.videoKey; state.videos.watched[key] = !state.videos.watched[key]; saveState(); updateVideoWatchedDOM(key); updateLessonStepUI(); }
    else if (action === "lesson-tab") { const target = document.getElementById(actionNode.dataset.target); if (target) scrollToElement(target); updateLessonStudyTabs(); }
    else if (action === "book-toc") { event.preventDefault(); const target = document.getElementById(actionNode.dataset.target); if (target) { replaceHash("book/" + actionNode.dataset.chapter + "?section=" + actionNode.dataset.section); scrollToElement(target); } }
    else if (action === "go-back") { const fallback = actionNode.dataset.fallback || "home"; if (history.length > 1) history.back(); else go(fallback); }
    else if (action === "open-menu") openMenu();
    else if (action === "close-menu") closeMenu();
    else if (action === "focused-length") { if (quizSession && quizSession.focus) { const total = quizSession.focus.list.length; const count = actionNode.dataset.count === String(total) ? total : Number(actionNode.dataset.count || 10); launchQuiz(quizSession.focus.list.slice(0, count), quizSession.focus.name, "tutor", false, "focused", quizSession.focus); } }
    else if (action === "mini-flip") { if (miniDeck) { miniDeck.flipped = !miniDeck.flipped; refreshMiniDeck(); } }
    else if (action === "mini-next" || action === "mini-prev") { if (miniDeck) { const length = (window.LESSONS[miniDeck.id].cards || []).length; miniDeck.index = (miniDeck.index + (action === "mini-next" ? 1 : -1) + length) % length; miniDeck.flipped = false; refreshMiniDeck(); } }
    else if (action === "mini-star") { const saved = cardState(actionNode.dataset.cardKey); saved.starred = !saved.starred; saveState(); refreshMiniDeck(); }
    else if (action === "mini-rate") { if (miniDeck) { const card = (window.LESSONS[miniDeck.id].cards || [])[miniDeck.index]; rateCard({ key: miniDeck.id + ":" + miniDeck.index }, actionNode.dataset.rating); miniDeck.index = (miniDeck.index + 1) % (window.LESSONS[miniDeck.id].cards || []).length; miniDeck.flipped = false; refreshMiniDeck(); } }
    else if (action === "quick-quiz") { loadData("questions").then(function () { launchQuiz(shuffle(window.QUESTIONS || []).slice(0, Number(actionNode.dataset.count || 10)), "Quick " + actionNode.dataset.count, "tutor", false, "custom"); }); }
    else if (action === "start-misses") { loadData("questions").then(function () { launchQuiz((window.QUESTIONS || []).filter(function (question) { return isQuestionMissed(question.id); }), "My misses", "tutor", false, "misses"); }); }
    else if (action === "start-flagged") { loadData("questions").then(function () { launchQuiz((window.QUESTIONS || []).filter(function (question) { return isQuestionFlagged(question.id); }), "Flagged questions", "tutor", false, "flagged"); }); }
    else if (action === "weakest-quiz") { loadData("questions").then(function () { const rows = groupStats(window.QUESTIONS || [], function (question) { return question.l || question.l2; }).filter(function (row) { return row.attempts; }); const weakest = rows[0]; if (weakest) launchQuiz((window.QUESTIONS || []).filter(function (question) { return question.l === weakest.key || question.l2 === weakest.key; }), "Weakest lesson", "tutor", false, "custom"); else showToast("Answer a few tagged questions first to find a weakest lesson."); }); }
    else if (action === "full-exam") { loadData("questions").then(function () { const set = actionNode.dataset.set; const list = set === "random" ? mockQuestions() : (window.QUESTIONS || []).filter(function (question) { return question.set === set; }); launchQuiz(list.slice(0, Number(examInfo().questions) || 85), set === "random" ? "Random mock exam" : sourceLabel(set), "exam", true, set); }); }
    else if (action === "quiz-answer") chooseQuizOption(Number(actionNode.dataset.index));
    else if (action === "quiz-next") moveQuiz(1);
    else if (action === "quiz-prev") moveQuiz(-1);
    else if (action === "quiz-submit") submitExam(false);
    else if (action === "quiz-nav") { if (quizSession) { quizSession.index = Number(actionNode.dataset.index); persistQuizSession(); renderQuizRun(); } }
    else if (action === "quiz-flag") { if (quizSession && quizSession.questions[quizSession.index]) { const id = quizSession.questions[quizSession.index].id; const record = questionRecord(id); record.flagged = !record.flagged; persistQuizSession(); renderQuizRun(); } }
    else if (action === "single-answer") { if (singleQuestion && singleQuestion.selected == null) { singleQuestion.selected = Number(actionNode.dataset.index); const q = singleQuestion.question; recordQuestionAnswer(q, singleQuestion.selected === singleQuestion.answer, singleQuestion.selected); renderQuestionPage(q.id); } }
    else if (action === "retake-quiz") retakeQuiz();
    else if (action === "book-font-up" || action === "book-font-down") { state.bookFont = Math.min(21, Math.max(14, Number(state.bookFont || 16) + (action === "book-font-up" ? 1 : -1))); saveState(); renderRoute(); }
    else if (action === "export-progress") exportProgress();
    else if (action === "import-progress") { const input = document.getElementById("importText"); if (input && input.value.trim()) importProgress(input.value.trim()); else showToast("Paste a JSON export first."); }
    else if (action === "reset-progress") { if (window.confirm("Reset all CySA+ progress on this device?")) { state = blankState(); saveState(); applyPreferences(); renderRoute(); showToast("Progress reset."); } }
    else if (action === "stats-drill") { go("practice?" + actionNode.dataset.drill); }
  }

  function refreshMiniDeck() {
    if (!miniDeck || !window.LESSONS || !window.LESSONS[miniDeck.id]) return;
    const cards = window.LESSONS[miniDeck.id].cards || []; const card = cards[miniDeck.index]; const node = document.getElementById("miniCard"); if (!node || !card) return;
    node.classList.toggle("flipped", !!miniDeck.flipped); node.querySelector(".front p").innerHTML = contentHTML(card[0]); node.querySelector(".back p").innerHTML = contentHTML(card[1]);
    const counter = document.getElementById("miniCounter"); if (counter) counter.textContent = (miniDeck.index + 1) + " / " + cards.length;
    const star = document.querySelector('[data-action="mini-star"]'); if (star) star.classList.toggle("starred", !!cardState(miniDeck.id + ":" + miniDeck.index).starred);
  }

  function handleChange(event) {
    const target = event.target;
    if (target.matches("[data-action=complete-lesson]")) { const id = target.dataset.id; if (target.checked) { state.completed[id] = true; touchActivity("lesson"); showToast("Lesson marked complete."); } else delete state.completed[id]; saveState(); const label = target.closest("label"); if (label) label.lastChild.textContent = target.checked ? " Completed" : " Mark complete"; updateLessonStepUI(); }
    else if (target.matches("[data-action=audio-include-details]")) { state.audio.includeDetails = !!target.checked; saveState(); showToast(target.checked ? "Play all will include details tracks." : "Play all will skip details tracks."); }
    else if (target.matches("[data-action=complete-reading]")) { state.reading[target.dataset.id] = target.checked; saveState(); updateLessonStepUI(); }
    else if (target.matches("[data-action=objective-check]")) { state.confident[target.dataset.objective] = target.checked; saveState(); const row = target.closest(".official-bullet, .objective-row"); if (row) row.classList.toggle("done", target.checked); }
    else if (target.id === "dockRate") { state.audioSpeed = Number(target.value); audio.playbackRate = state.audioSpeed; saveState(); }
    else if (target.id === "dockSleep") { const minutes = Number(target.value || 0); audioSleepUntil = minutes ? Date.now() + minutes * 60000 : 0; showToast(minutes ? "Sleep timer set for " + minutes + " minutes." : "Sleep timer off."); }
    else if (target.matches("[data-setting]")) { const setting = target.dataset.setting; state[setting] = setting === "fontSize" || setting === "audioSpeed" || setting === "newCardsPerDay" ? Number(target.value) : target.value; if (setting === "theme") applyPreferences(); saveState(); if (setting === "fontSize") applyPreferences(); }
    else if (target.id === "importFile" && target.files && target.files[0]) { const reader = new FileReader(); reader.onload = function () { importProgress(String(reader.result || "")); }; reader.readAsText(target.files[0]); }
    else if (target.matches("[data-audio-seek]")) { if (audio.duration && target.getAttribute("data-audio-id") === audioCurrentId) audio.currentTime = (Number(target.value) / 100) * audio.duration; updateAudioSectionUI(); }
  }

  function handleInput(event) {
    const target = event.target;
    if (target.matches("[data-audio-seek]")) { if (audio.duration && target.getAttribute("data-audio-id") === audioCurrentId) audio.currentTime = (Number(target.value) / 100) * audio.duration; updateAudioSectionUI(); }
    else if (target.id === "learnSearch") applyLearnSearch(target.value);
    else if (target.id === "glossarySearch") { const entries = document.getElementById("glossaryEntries"); if (entries) entries.innerHTML = glossaryEntriesHTML(window.GLOSSARY || [], target.value); }
    else if (target.id === "sheetSearch") { const needle = target.value.trim().toLowerCase(); document.querySelectorAll("#app .section-block").forEach(function (section) { section.hidden = !!needle && !section.textContent.toLowerCase().includes(needle); }); }
    else if (target.id === "globalSearch") { const results = document.getElementById("searchResults"); if (results) results.innerHTML = renderSearchResultsHTML(target.value); const nextHash = "#/search?q=" + encodeURIComponent(target.value); history.replaceState(null, "", nextHash); }
  }

  function handleSubmit(event) {
    if (event.target.id !== "quizBuilder") return;
    event.preventDefault();
    const form = new FormData(event.target);
    startBuiltQuiz({ source: form.get("source"), number: form.get("number"), domains: selectedValues(document.getElementById("quizDomains")), chapters: selectedValues(document.getElementById("quizChapters")), lessons: selectedValues(document.getElementById("quizLessons")), unseen: form.get("unseen") === "on", missed: form.get("missed") === "on", flagged: form.get("flagged") === "on", mode: form.get("mode") || "tutor", name: "Custom practice" });
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      if (menuOpen) closeMenu();
      if (audioSpeedOpen) { audioSpeedOpen = false; renderAudioDock(); }
      return;
    }
    if (event.target.matches("input, textarea, select")) return;
    if (cardSession && activeRoute && activeRoute.parts[0] === "cards" && activeRoute.parts[1] === "session") {
      if (event.key === " ") { event.preventDefault(); cardSession.flipped = !cardSession.flipped; renderCardSession(); }
      else if (["1", "2", "3", "4"].includes(event.key)) rateSessionCard(["again", "hard", "good", "easy"][Number(event.key) - 1]);
    }
    if (quizSession && activeRoute && activeRoute.parts[0] === "quiz" && activeRoute.parts[1] === "run") {
      if (!quizSession.exam && !quizSession.questions[quizSession.index]?.selected && ["1", "2", "3", "4"].includes(event.key)) chooseQuizOption(Number(event.key) - 1);
      else if (!quizSession.exam && event.key === "Enter" && quizSession.questions[quizSession.index]?.selected != null) moveQuiz(1);
    }
  }

  function saveAudioPosition() {
    if (!audioCurrentId || !Number.isFinite(audio.currentTime)) return;
    state.audio.positions[audioCurrentId] = audio.currentTime;
    saveState();
  }

  function updateAudioTime() {
    if (!audioCurrentId) return;
    const sectionIndex = currentAudioSectionIndex(audioCurrentId, audio.currentTime); updateAudioSectionUI(); if (sectionIndex !== audioMediaSectionIndex) { audioMediaSectionIndex = sectionIndex; updateMediaSession(); }
    const percent = audioProgressPercent(audioCurrentId);
    const previousProgress = Number(state.audio.progress[audioCurrentId] || 0);
    state.audio.progress[audioCurrentId] = Math.max(previousProgress, percent);
    if (percent >= 90 && !state.audio.listened[audioCurrentId]) state.audio.listened[audioCurrentId] = 1;
    updateLessonStepUI();
    if (Date.now() - audioSaveTimer > 3500 || (percent >= 90 && previousProgress < 90)) { audioSaveTimer = Date.now(); state.audio.positions[audioCurrentId] = audio.currentTime; saveState(); }
    if (audioSleepUntil && Date.now() >= audioSleepUntil) { audio.pause(); audioSleepUntil = 0; showToast("Sleep timer finished."); renderAudioDock(); }
  }

  function handleAudioEnded() {
    if (!audioCurrentId) return;
    state.audio.listened[audioCurrentId] = Math.max(1, Number(state.audio.listened[audioCurrentId] || 0)) + 1; state.audio.progress[audioCurrentId] = 100; state.audio.positions[audioCurrentId] = 0; audioEndedPrompt = true; saveState(); updateLessonStepUI();
    const next = adjacentAudioTrack(audioCurrentId, 1);
    if (state.audio.playAll && next) playAudio(next, true); else { state.audio.playAll = false; saveState(); renderAudioDock(); }
    refreshInlineAudioUI();
  }

  document.addEventListener("click", handleClick);
  document.addEventListener("change", handleChange);
  document.addEventListener("input", handleInput);
  document.addEventListener("submit", handleSubmit);
  document.addEventListener("keydown", handleKeydown);
  document.getElementById("headerTheme")?.addEventListener("click", cycleTheme);
  document.getElementById("headerSearch")?.addEventListener("click", function () { go("search"); });
  document.getElementById("headerMenu")?.addEventListener("click", openMenu);
  audio.addEventListener("timeupdate", updateAudioTime);
  audio.addEventListener("play", renderAudioDock);
  audio.addEventListener("pause", function () { saveAudioPosition(); renderAudioDock(); });
  audio.addEventListener("ended", handleAudioEnded);
  audio.addEventListener("error", function () { if (audioCurrentId) showToast("This track is not available yet."); });
  window.addEventListener("hashchange", renderRoute);
  window.addEventListener("pagehide", saveAudioPosition);
  window.addEventListener("scroll", function () {
    updateLessonStudyTabs();
    updateLessonStepUI();
    if (readingLessonId) { updateReadingProgress(); clearTimeout(readingScrollTimer); readingScrollTimer = setTimeout(function () { state.scroll[readingLessonId] = window.scrollY; saveState(); }, 450); }
    if (bookChapterNumber) { clearTimeout(bookScrollTimer); bookScrollTimer = setTimeout(function () { state.bookScroll[bookChapterNumber] = window.scrollY; saveState(); }, 450); }
  }, { passive: true });

  window.CYSA = { state: function () { return state; }, loadData: loadData, go: go };
  renderRoute();
})();
