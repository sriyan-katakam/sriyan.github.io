// ═══════════════════════════════
// FIREBASE SETUP
// ═══════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyBb1BAW7lQ5kCGL38FYKlPc8e7d1X9i5jE",
  authDomain: "sriyan-portfolio.firebaseapp.com",
  projectId: "sriyan-portfolio",
  appId: "1:265311303054:web:64e8eb6a7a8f8d9853a0df"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

const ADMIN_EMAIL = "sathish.katakam@gmail.com";

let isAdmin = false;
let allProjects = [];

// ✅ DEFAULT TAB
let currentTab = "apps";
let currentModalTab = "apps";

// ═══════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════
document.getElementById("tabsNav").addEventListener("click", function (e) {

  const btn = e.target.closest(".tab-btn");

  if (!btn) return;

  const tab = btn.dataset.tab;

  if (!tab) return;

  switchTab(tab);

});

function switchTab(tab) {

  currentTab = tab;

  // Remove active state
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  // Add active
  const activeBtn = document.querySelector(`[data-tab="${tab}"]`);

  if (activeBtn) {
    activeBtn.classList.add("active");
  }

  // Hide all grids
  document.querySelectorAll(".projects-grid").forEach(grid => {
    grid.style.display = "none";
  });

  // Hide all headers
  document.querySelectorAll(".section-header").forEach(header => {
    header.style.display = "none";
  });

  // Show selected tab
  const selectedGrid = document.getElementById(`projectsGrid-${tab}`);
  const selectedHeader = document.getElementById(`header-${tab}`);

  if (selectedGrid) {
    selectedGrid.style.display = "grid";
  }

  if (selectedHeader) {
    selectedHeader.style.display = "flex";
  }

  renderProjects(tab);

}

// ═══════════════════════════════
// AUTH
// ═══════════════════════════════
auth.onAuthStateChanged(user => {

  isAdmin = user && user.email === ADMIN_EMAIL;

  const btn = document.getElementById("authBtn");

  if (user) {

    btn.textContent = isAdmin
      ? "🚪 Logout (Admin)"
      : "🚪 Logout";

    btn.onclick = () => {
      auth.signOut().catch(err => alert(err.message));
    };

  } else {

    btn.textContent = "🔐 Login";

    btn.onclick = () => {

      const provider = new firebase.auth.GoogleAuthProvider();

      auth.signInWithPopup(provider)
        .catch(err => alert(err.message));

    };

  }

  applyAccessControl();

});

// ═══════════════════════════════
// ACCESS CONTROL
// ═══════════════════════════════
function applyAccessControl() {

  document.querySelectorAll(".btn-add-project").forEach(btn => {
    btn.style.display = isAdmin ? "inline-flex" : "none";
  });

  document.querySelectorAll(".btn-delete-project").forEach(btn => {
    btn.style.display = isAdmin ? "inline-flex" : "none";
  });

}

// ═══════════════════════════════
// FIRESTORE
// ═══════════════════════════════
function listenProjects() {

  db.collection("projects")
    .orderBy("createdAt", "desc")
    .onSnapshot(

      snapshot => {

        allProjects = snapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        }));

        updateCounts();

        // ✅ RENDER ALL TABS AND FORCE WEB APPS FIRST
        ["apps", "ai", "scratch"].forEach(module => {
          renderProjects(module);
        });

        // Ensure Web Apps is visible
        currentTab = "apps";
        document.querySelectorAll(".tab-btn").forEach(btn => {
          btn.classList.remove("active");
        });
        document.querySelector('[data-tab="apps"]').classList.add("active");

        document.querySelectorAll(".projects-grid").forEach(grid => {
          grid.style.display = "none";
        });
        document.querySelectorAll(".section-header").forEach(header => {
          header.style.display = "none";
        });

        document.getElementById("projectsGrid-apps").style.display = "grid";
        document.getElementById("header-apps").style.display = "flex";

      },

      error => {
        console.error("Firestore listener error:", error);
      }

    );

}

function updateCounts() {

  ["scratch", "ai", "apps"].forEach(module => {

    const count = allProjects.filter(
      p => p.module === module
    ).length;

    const el = document.getElementById(`count-${module}`);

    if (el) {
      el.textContent =
        count + " project" + (count !== 1 ? "s" : "");
    }

  });

}

// ═══════════════════════════════
// EMOJI PICKER
// ═══════════════════════════════
const EMOJIS = [
  "💧","🎮","🐱","🚀","🎨","🎵",
  "🌟","🏆","🌈","🦋","⚡","🐉",
  "🌊","🔥","🎭","🤖","🏃","🎯",
  "🧩","🔬","📖","🧠","✨","🌍","🌻"
];

let selectedEmoji = "🎮";

function initEmojiPicker() {

  const grid = document.getElementById("emojiGrid");

  grid.innerHTML = "";

  EMOJIS.forEach(emoji => {

    const btn = document.createElement("button");

    btn.className = "emoji-btn";
    btn.textContent = emoji;
    btn.type = "button";

    btn.addEventListener("click", () => {

      selectedEmoji = emoji;

      document.querySelectorAll(".emoji-btn").forEach(b => {
        b.classList.remove("selected");
      });

      btn.classList.add("selected");

    });

    grid.appendChild(btn);

  });

}

// ═══════════════════════════════
// RENDER PROJECTS
// ═══════════════════════════════
function renderProjects(module) {

  const grid = document.getElementById(`projectsGrid-${module}`);

  if (!grid) return;

  const filtered = allProjects.filter(
    p => p.module === module
  );

  grid.innerHTML = "";

  if (filtered.length === 0) {

    const emoji =
      module === "scratch"
        ? "🐱"
        : module === "ai"
        ? "🤖"
        : "📱";

    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${emoji}</div>
        <p>🚀 Launching soon</p>
      </div>
    `;

    return;
  }

  filtered.forEach(project => {
    grid.appendChild(createProjectCard(project, module));
  });

}

function createProjectCard(p, module) {

  const card = document.createElement("div");

  card.className = "project-card";

  let projectURL = "";
  let editorURL = "";
  let thumbURL = "";
  let actionHTML = "";

  if (module === "scratch") {

    projectURL =
      `https://scratch.mit.edu/projects/${p.scratchId}`;

    editorURL =
      `${projectURL}/editor`;

    thumbURL =
      `https://uploads.scratch.mit.edu/projects/thumbnails/${p.scratchId}.png`;

    actionHTML = `
      <a class="btn-play" href="${projectURL}" target="_blank">▶ Play</a>
      <a class="btn-see" href="${editorURL}" target="_blank">See</a>
    `;

  } else if (module === "ai") {

    projectURL = p.projectURL || "#";

    actionHTML = `
      <a class="btn-play" href="${projectURL}" target="_blank">🚀 Open</a>
    `;

  } else {

    projectURL = p.projectURL || "#";

    actionHTML = `
      <a class="btn-play" href="${projectURL}" target="_blank">🌐 Visit</a>
    `;

  }

  card.innerHTML = `
    <a class="card-thumb" href="${projectURL}" target="_blank">

      ${
        thumbURL
          ? `<img src="${thumbURL}" alt="${p.title}" loading="lazy">`
          : `<div class="thumb-fallback">${p.emoji || "🎮"}</div>`
      }

      <div class="overlay">
        <div class="overlay-play">
          ${
            module === "scratch"
              ? "▶ Play"
              : module === "ai"
              ? "🚀 Open"
              : "🌐 Visit"
          }
        </div>
      </div>

    </a>

    <div class="card-body">

      <span class="card-badge">${p.tag || ""}</span>

      <div class="card-title">${p.title}</div>

      ${
        p.description
          ? `<div class="card-desc">${p.description}</div>`
          : ""
      }

      <div class="card-actions">
        ${actionHTML}
      </div>

    </div>
  `;

  return card;

}

// ═══════════════════════════════
// MODALS
// ═══════════════════════════════
function openModal(tab) {

  currentModalTab = tab;

  document.getElementById("modalOverlay")
    .classList.add("open");

}

function closeModal() {

  document.getElementById("modalOverlay")
    .classList.remove("open");

  document.getElementById("inputId").value = "";
  document.getElementById("inputTitle").value = "";
  document.getElementById("inputDesc").value = "";

}

// ═══════════════════════════════
// DELETE MODAL
// ═══════════════════════════════
function openDeleteModal(tab) {

  currentModalTab = tab;

  document.getElementById("deleteModalOverlay")
    .classList.add("open");

}

function closeDeleteModal() {

  document.getElementById("deleteModalOverlay")
    .classList.remove("open");

}

// ═══════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════
document.addEventListener("DOMContentLoaded", () => {

  initEmojiPicker();

  // ✅ START FIRESTORE LISTENER (handles Web Apps default)
  listenProjects();

  // Add buttons
  document.getElementById("add-scratch")
    .addEventListener("click", () => openModal("scratch"));

  document.getElementById("add-ai")
    .addEventListener("click", () => openModal("ai"));

  document.getElementById("add-apps")
    .addEventListener("click", () => openModal("apps"));

  // Delete buttons
  document.getElementById("del-scratch")
    .addEventListener("click", () => openDeleteModal("scratch"));

  document.getElementById("del-ai")
    .addEventListener("click", () => openDeleteModal("ai"));

  document.getElementById("del-apps")
    .addEventListener("click", () => openDeleteModal("apps"));

  // Close modals
  document.getElementById("closeAddModal")
    .addEventListener("click", closeModal);

  document.getElementById("cancelAdd")
    .addEventListener("click", closeModal);

  document.getElementById("closeDeleteModal")
    .addEventListener("click", closeDeleteModal);

  document.getElementById("cancelDelete")
    .addEventListener("click", closeDeleteModal);

});
