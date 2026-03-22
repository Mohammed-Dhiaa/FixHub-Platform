/**
 * ============================================================================
 * FixHub – Main JavaScript (app.js)
 * ============================================================================
 * Handles five concerns:
 *   1. Mobile navigation toggle (all pages)
 *   2. Category filter chips (Home / Marketplace)
 *   3. Worker CRUD operations (Dashboard – Add / Edit / Delete)
 *   4. Scroll-reveal animations (IntersectionObserver)
 *   5. Counter count-up animation (Dashboard stats)
 *
 * Author : Mohammed Dhiaa  |  Milestone 2
 * ============================================================================
 */

// ============================================================================
// 1. MOBILE NAVIGATION TOGGLE
// ============================================================================
/**
 * Toggles the mobile hamburger menu open/closed.
 * Applies the "open" class to the main-nav element.
 */
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menu-toggle');
  const mainNav    = document.getElementById('main-nav');

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      mainNav.classList.toggle('open');
    });
  }

  // ===== Initialise page-specific features =====
  initCategoryFilters();
  initDashboard();
  initScrollReveal();
  initCounterAnimation();
});


// ============================================================================
// 2. CATEGORY FILTER CHIPS  (Home / Marketplace)
// ============================================================================
/**
 * Adds click listeners to every .category-chip button.
 * When a chip is clicked:
 *   - It becomes the "active" chip.
 *   - Company cards are shown/hidden based on their data-category attribute.
 *   - A short CSS transition keeps things smooth.
 */
function initCategoryFilters() {
  const chips = document.querySelectorAll('.category-chip');
  const cards = document.querySelectorAll('.company-card');

  // Exit early if elements are not on this page
  if (chips.length === 0 || cards.length === 0) return;

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      // Update active state
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const selectedCategory = chip.dataset.category;  // e.g. "plumbing"

      cards.forEach(card => {
        if (selectedCategory === 'all' || card.dataset.category === selectedCategory) {
          card.style.display = '';            // Show card
        } else {
          card.style.display = 'none';        // Hide card
        }
      });
    });
  });

  // ---- Live search filtering ----
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();

      cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? '' : 'none';
      });

      // Reset category chips when searching
      if (query.length > 0) {
        chips.forEach(c => c.classList.remove('active'));
      } else {
        // Restore "All" chip when search is cleared
        chips.forEach(c => c.classList.remove('active'));
        const allChip = document.querySelector('[data-category="all"]');
        if (allChip) allChip.classList.add('active');
      }
    });
  }
}


// ============================================================================
// 3. DASHBOARD – WORKER CRUD OPERATIONS
// ============================================================================

/**
 * In-memory workers data store.
 * In production this would come from the database (API calls).
 * Each worker object has: id, name, email, phone, role, status.
 */
let workers = [
  { id: 1, name: 'Ahmed Khalid',   email: 'ahmed@aquaflow.com',  phone: '+1 (555) 111-2233', role: 'Senior Plumber',       status: 'Active'   },
  { id: 2, name: 'Sara Nasser',     email: 'sara@aquaflow.com',   phone: '+1 (555) 222-3344', role: 'Plumber',              status: 'Active'   },
  { id: 3, name: 'Omar Mansour',    email: 'omar@aquaflow.com',   phone: '+1 (555) 333-4455', role: 'Pipe Fitter',          status: 'Active'   },
  { id: 4, name: 'Lina Hassan',     email: 'lina@aquaflow.com',   phone: '+1 (555) 444-5566', role: 'Apprentice Plumber',   status: 'On Leave' },
  { id: 5, name: 'Yusuf Ali',       email: 'yusuf@aquaflow.com',  phone: '+1 (555) 555-6677', role: 'Emergency Technician', status: 'Active'   },
];

/** Auto-incrementing ID counter for new workers */
let nextId = 6;

/** Tracks the ID of the worker being deleted (for the confirmation modal) */
let deleteTargetId = null;


/**
 * Initialises the Dashboard page.
 * Renders the workers table and updates stat cards.
 */
function initDashboard() {
  const tableBody = document.getElementById('workers-table-body');
  if (!tableBody) return; // Not on the dashboard page

  renderWorkers();
}


/**
 * Renders all worker rows into the table and refreshes stat cards.
 */
function renderWorkers() {
  const tableBody = document.getElementById('workers-table-body');
  if (!tableBody) return;

  // Build table rows from workers array
  tableBody.innerHTML = workers.map(w => {
    // Create initials from the worker's name (e.g. "Ahmed Khalid" → "AK")
    const initials = w.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const badgeClass = w.status === 'Active' ? 'badge-active' : 'badge-on-leave';

    return `
      <tr id="row-${w.id}">
        <td>
          <div class="table-worker">
            <div class="table-worker-avatar">${initials}</div>
            <div>
              <div class="table-worker-name">${w.name}</div>
              <div class="table-worker-email">${w.email}</div>
            </div>
          </div>
        </td>
        <td>${w.role}</td>
        <td>${w.phone}</td>
        <td><span class="badge ${badgeClass}">${w.status}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn btn-outline btn-icon" title="Edit"
                    onclick="openEditModal(${w.id})" id="edit-${w.id}">✏️</button>
            <button class="btn btn-outline btn-icon" title="Delete"
                    onclick="openDeleteModal(${w.id})" id="delete-${w.id}"
                    style="color: var(--color-danger);">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Update stat cards
  updateStats();
}


/**
 * Recalculates and updates the dashboard stat cards.
 */
function updateStats() {
  const totalEl  = document.getElementById('stat-total-count');
  const activeEl = document.getElementById('stat-active-count');
  const leaveEl  = document.getElementById('stat-leave-count');

  const totalVal  = workers.length;
  const activeVal = workers.filter(w => w.status === 'Active').length;
  const leaveVal  = workers.filter(w => w.status === 'On Leave').length;

  if (totalEl)  totalEl.textContent  = totalVal;
  if (activeEl) activeEl.textContent = activeVal;
  if (leaveEl)  leaveEl.textContent  = leaveVal;
}


// ---------- Modal Helpers ----------

/**
 * Opens the Add Worker modal (blank form).
 */
function openAddModal() {
  document.getElementById('modal-title').textContent = 'Add Worker';
  document.getElementById('worker-edit-id').value    = '';
  document.getElementById('worker-form').reset();
  document.getElementById('worker-modal-overlay').classList.add('active');
}


/**
 * Opens the Edit Worker modal pre-populated with the given worker's data.
 * @param {number} id – Worker ID to edit.
 */
function openEditModal(id) {
  const worker = workers.find(w => w.id === id);
  if (!worker) return;

  document.getElementById('modal-title').textContent   = 'Edit Worker';
  document.getElementById('worker-edit-id').value       = id;
  document.getElementById('worker-name').value          = worker.name;
  document.getElementById('worker-email').value         = worker.email;
  document.getElementById('worker-phone').value         = worker.phone;
  document.getElementById('worker-role').value          = worker.role;
  document.getElementById('worker-status').value        = worker.status;

  document.getElementById('worker-modal-overlay').classList.add('active');
}


/**
 * Closes the Add/Edit Worker modal.
 */
function closeModal() {
  document.getElementById('worker-modal-overlay').classList.remove('active');
}


/**
 * Saves a worker (create or update) based on the form data.
 * Validates required fields before saving.
 */
function saveWorker() {
  // Gather form values
  const name   = document.getElementById('worker-name').value.trim();
  const email  = document.getElementById('worker-email').value.trim();
  const phone  = document.getElementById('worker-phone').value.trim();
  const role   = document.getElementById('worker-role').value.trim();
  const status = document.getElementById('worker-status').value;
  const editId = document.getElementById('worker-edit-id').value;

  // Basic validation
  if (!name || !email || !role) {
    alert('Please fill in all required fields (Name, Email, Role).');
    return;
  }

  if (editId) {
    // ---- UPDATE existing worker ----
    const idx = workers.findIndex(w => w.id === Number(editId));
    if (idx !== -1) {
      workers[idx] = { ...workers[idx], name, email, phone, role, status };
    }
  } else {
    // ---- CREATE new worker ----
    workers.push({ id: nextId++, name, email, phone, role, status });
  }

  closeModal();
  renderWorkers();
}


// ---------- Delete Confirmation ----------

/**
 * Opens the delete-confirmation modal for the specified worker.
 * @param {number} id – Worker ID to delete.
 */
function openDeleteModal(id) {
  const worker = workers.find(w => w.id === id);
  if (!worker) return;

  deleteTargetId = id;
  document.getElementById('delete-worker-name').textContent = worker.name;
  document.getElementById('delete-modal-overlay').classList.add('active');
}


/**
 * Closes the delete-confirmation modal without deleting.
 */
function closeDeleteModal() {
  document.getElementById('delete-modal-overlay').classList.remove('active');
  deleteTargetId = null;
}


/**
 * Confirms the deletion: removes the worker from the array and re-renders.
 */
function confirmDelete() {
  if (deleteTargetId !== null) {
    workers = workers.filter(w => w.id !== deleteTargetId);
    renderWorkers();
  }
  closeDeleteModal();
}


// ============================================================================
// 4. SCROLL-REVEAL ANIMATIONS  (IntersectionObserver)
// ============================================================================
/**
 * Initialises scroll-reveal animations using IntersectionObserver.
 * Elements with the `.reveal` class start invisible and animate in
 * when they enter the viewport (threshold: 15%).
 */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Animate once only
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealElements.forEach(el => observer.observe(el));
}


// ============================================================================
// 5. COUNTER COUNT-UP ANIMATION
// ============================================================================
/**
 * Animates `.counter` elements from 0 to their `data-target` value.
 * Uses IntersectionObserver so counters animate when scrolled into view.
 */
function initCounterAnimation() {
  const counters = document.querySelectorAll('.counter');
  if (counters.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(counter => observer.observe(counter));
}

/**
 * Animates a single counter element from 0 to its target value.
 * @param {HTMLElement} el – Counter element with data-target attribute.
 */
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'), 10);
  const duration = 1200; // ms
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic for smooth deceleration
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(eased * target);

    el.textContent = currentValue;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target; // Ensure exact final value
    }
  }

  requestAnimationFrame(update);
}
