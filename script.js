// ═══════════════════════════════
// FIREBASE SETUP
// ═══════════════════════════════
const firebaseConfig = {
  apiKey:  "AIzaSyBb1BAW7lQ5kCGL38FYKlPc8e7d1X9i5jE",
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
let currentTab = 'apps';
let currentModalTab = 'apps';

// ═══════════════════════════════
// TAB SWITCHING (event delegation)
// ═══════════════════════════════
document.getElementById('tabsNav').addEventListener('click', function(e) {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  const tab = btn.dataset.tab;
  if (!tab) { console.error('Tab button missing data-tab'); return; }

  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.projects-grid').forEach(g => g.style.display = 'none');
  document.querySelectorAll('.section-header').forEach(h => h.style.display = 'none');
  const grid = document.getElementById(`projectsGrid-${tab}`);
  const header = document.getElementById(`header-${tab}`);
  if (grid) grid.style.display = 'grid';
  if (header) header.style.display = 'flex';
  renderProjects(tab);
});

// ═══════════════════════════════
// AUTH
// ═══════════════════════════════
auth.onAuthStateChanged(user => {
  isAdmin = user && user.email === ADMIN_EMAIL;
  const btn = document.getElementById("authBtn");
  if (user) {
    btn.textContent = isAdmin ? "🚪 Logout (Admin)" : "🚪 Logout";
    btn.onclick = () => auth.signOut().catch(err => alert(err.message));
  } else {
    btn.textContent = "🔐 Login";
    btn.onclick = () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider).catch(err => alert(err.message));
    };
  }
  applyAccessControl();
});

function applyAccessControl() {
  document.querySelectorAll('.btn-add-project').forEach(b => b.style.display = isAdmin ? 'inline-flex' : 'none');
  document.querySelectorAll('.btn-delete-project').forEach(b => b.style.display = isAdmin ? 'inline-flex' : 'none');
}

// ═══════════════════════════════
// FIRESTORE
// ═══════════════════════════════
function listenProjects() {
  db.collection("projects").orderBy("createdAt", "desc").onSnapshot(
    snapshot => {
      allProjects = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
      renderProjects(currentTab);
      updateCounts();
    },
    error => { console.error("Firestore listener error:", error); }
  );
}

function updateCounts() {
  ['scratch','ai','apps'].forEach(m => {
    const c = allProjects.filter(p => p.module === m).length;
    const el = document.getElementById(`count-${m}`);
    if (el) el.textContent = c + ' project' + (c !== 1 ? 's' : '');
  });
}

// ═══════════════════════════════
// EMOJI PICKER
// ═══════════════════════════════
const EMOJIS = ["💧","🎮","🐱","🚀","🎨","🎵","🌟","🏆","🌈","🦋","⚡","🐉","🌊","🔥","🎭","🤖","🏃","🎯","🧩","🔬","📖","🧠","✨","🌍","🌻"];
let selectedEmoji = "🎮";

function initEmojiPicker() {
  const grid = document.getElementById("emojiGrid");
  grid.innerHTML = "";
  EMOJIS.forEach(e => {
    const btn = document.createElement("button");
    btn.className = "emoji-btn"; btn.textContent = e; btn.type = "button";
    btn.addEventListener('click', () => {
      selectedEmoji = e;
      document.querySelectorAll(".emoji-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
    grid.appendChild(btn);
  });
}

// ═══════════════════════════════
// RENDER
// ═══════════════════════════════
function renderProjects(module) {
  const grid = document.getElementById(`projectsGrid-${module}`);
  if (!grid) return;
  const filtered = allProjects.filter(p => p.module === module);
  grid.innerHTML = '';
  if (filtered.length === 0) {
    const emoji = module === 'scratch' ? '🐱' : module === 'ai' ? '🤖' : '📱';
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">${emoji}</div><p> 🚀 Launching soon</p><span></span></div>`;
    return;
  }
  filtered.forEach(p => grid.appendChild(createProjectCard(p, module)));
}

function createProjectCard(p, module) {
  const card = document.createElement('div');
  card.className = 'project-card';
  let projectURL='', editorURL='', thumbURL='', actionHTML='';
  if (module === 'scratch') {
    projectURL = `https://scratch.mit.edu/projects/${p.scratchId}`;
    editorURL = `${projectURL}/editor`;
    thumbURL = `https://uploads.scratch.mit.edu/projects/thumbnails/${p.scratchId}.png`;
    actionHTML = `<a class="btn-play" href="${projectURL}" target="_blank">▶ Play</a><a class="btn-see" href="${editorURL}" target="_blank">See</a>`;
  } else if (module === 'ai') {
    projectURL = p.projectURL || '#'; thumbURL = p.thumbnailURL || '';
    actionHTML = `<a class="btn-play" href="${projectURL}" target="_blank">🚀 Open</a>`;
  } else {
    projectURL = p.projectURL || '#'; thumbURL = p.thumbnailURL || '';
    actionHTML = `<a class="btn-play" href="${projectURL}" target="_blank">🌐 Visit</a>`;
  }
  const bc = module === 'ai' ? 'ai' : module === 'apps' ? 'apps' : '';
  card.innerHTML = `
    <a class="card-thumb" href="${projectURL}" target="_blank">
      ${thumbURL ? `<img src="${thumbURL}" alt="${p.title}" loading="lazy" onload="this.classList.add('loaded')" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />` : ''}
      <div class="thumb-fallback" style="display:${!thumbURL?'flex':'none'};">${p.emoji||'🎮'}</div>
      <div class="overlay"><div class="overlay-play">${module==='scratch'?'▶ Play':module==='ai'?'🚀 Open':'🌐 Visit'}</div></div>
    </a>
    <div class="card-body">
      <span class="card-badge ${bc}">${p.tag||""}</span>
      <div class="card-title">${p.title}</div>
      ${p.description?`<div class="card-desc">${p.description}</div>`:''}
      <div class="card-actions">${actionHTML}</div>
    </div>`;
  return card;
}

// ═══════════════════════════════
// ADD MODAL
// ═══════════════════════════════
function openModal(tab) {
  currentModalTab = tab;
  document.getElementById("modalOverlay").classList.add("open");
}
function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
  document.getElementById('inputId').value = '';
  document.getElementById('inputTitle').value = '';
  document.getElementById('inputDesc').value = '';
  selectedEmoji = "🎮"; initEmojiPicker();
}
function extractId(input) {
  input = input.trim();
  const m = input.match(/projects\/(\d+)/);
  if (m) return m[1];
  return /^\d+$/.test(input) ? input : null;
}
async function addProject() {
  if (!isAdmin) return alert("Only admin can add projects");
  const rawId = document.getElementById('inputId').value;
  const title = document.getElementById('inputTitle').value.trim();
  const description = document.getElementById('inputDesc').value.trim();
  const tag = document.getElementById('inputTag').value;
  let id = null;
  if (currentModalTab === 'scratch') { id = extractId(rawId); if (!id) return alert("Invalid Scratch project ID"); }
  else { if (!rawId.trim()) return alert("Please enter a project URL"); }
  if (!title) return alert("Please enter a title");
  const data = { module: currentModalTab, title, description, emoji: selectedEmoji, tag, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
  if (currentModalTab === 'scratch') data.scratchId = id; else data.projectURL = rawId.trim();
  try { await db.collection("projects").add(data); closeModal(); }
  catch(err) { console.error("Add project error:", err); alert("Error adding project: " + err.message); }
}

// ═══════════════════════════════
// DELETE MODAL
// ═══════════════════════════════
function openDeleteModal(tab) {
  currentModalTab = tab;
  const overlay = document.getElementById("deleteModalOverlay");
  const list = document.getElementById("deleteCheckboxList");
  const filtered = allProjects.filter(p => p.module === tab);
  overlay.classList.add("open"); list.innerHTML = "";
  if (filtered.length === 0) { list.innerHTML = `<div class="no-projects-msg">No projects to delete</div>`; return; }
  filtered.forEach(p => {
    const item = document.createElement("label");
    item.className = "project-checkbox-item";
    item.innerHTML = `<input type="checkbox" value="${p.docId}"><div class="item-emoji">${p.emoji||"🎮"}</div><div class="item-info"><div class="item-title">${p.title}</div><div class="item-id">ID: ${p.scratchId||p.projectURL}</div></div>`;
    list.appendChild(item);
  });
  list.querySelectorAll('input').forEach(cb => cb.addEventListener('change', updateDeleteButton));
}
function updateDeleteButton() {
  document.querySelectorAll('#deleteCheckboxList .project-checkbox-item').forEach(item => {
    item.classList.toggle('checked', item.querySelector('input').checked);
  });
  document.getElementById('deleteSelectedBtn').disabled = !document.querySelector('#deleteCheckboxList input:checked');
}
function deleteSelected() {
  if (!isAdmin) return alert("Only admin can delete");
  document.querySelectorAll('#deleteCheckboxList input:checked').forEach(c => db.collection("projects").doc(c.value).delete());
  closeDeleteModal();
}
function closeDeleteModal() { document.getElementById("deleteModalOverlay").classList.remove("open"); }

// ═══════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initEmojiPicker();
  listenProjects();

  // Add/Delete buttons
  document.getElementById('add-scratch').addEventListener('click', () => openModal('scratch'));
  document.getElementById('add-ai').addEventListener('click', () => openModal('ai'));
  document.getElementById('add-apps').addEventListener('click', () => openModal('apps'));
  document.getElementById('del-scratch').addEventListener('click', () => openDeleteModal('scratch'));
  document.getElementById('del-ai').addEventListener('click', () => openDeleteModal('ai'));
  document.getElementById('del-apps').addEventListener('click', () => openDeleteModal('apps'));

  // Modal close
  document.getElementById('closeAddModal').addEventListener('click', closeModal);
  document.getElementById('cancelAdd').addEventListener('click', closeModal);
  document.getElementById('closeDeleteModal').addEventListener('click', closeDeleteModal);
  document.getElementById('cancelDelete').addEventListener('click', closeDeleteModal);
  document.getElementById('submitProject').addEventListener('click', addProject);
  document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelected);

  // Overlay click to close
  document.getElementById('modalOverlay').addEventListener('click', e => { if (e.target.id === 'modalOverlay') closeModal(); });
  document.getElementById('deleteModalOverlay').addEventListener('click', e => { if (e.target.id === 'deleteModalOverlay') closeDeleteModal(); });
});
