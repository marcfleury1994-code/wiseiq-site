/* ── WiseIQ Compare System ── */

const CompareSystem = (() => {
  const MAX = 3;
  let selected = []; // array of product data objects

  // ── Init ──
  function init() {
    injectTray();
    injectModal();
    attachCardListeners();
  }

  // ── Inject Tray HTML ──
  function injectTray() {
    const tray = document.createElement('div');
    tray.id = 'compare-tray';
    tray.innerHTML = `
      <div class="compare-tray-inner">
        <div class="compare-tray-label">Compare:</div>
        <div class="compare-tray-slots" id="compare-slots">
          ${[0,1,2].map(i => `
            <div class="compare-slot" id="compare-slot-${i}">
              <span class="compare-slot-empty-text">Select a product</span>
            </div>
          `).join('')}
        </div>
        <div class="compare-tray-actions">
          <button class="btn-compare-now" id="btn-compare-now" disabled onclick="CompareSystem.openModal()">
            Compare Now
          </button>
          <button class="btn-compare-clear" onclick="CompareSystem.clearAll()">Clear</button>
        </div>
      </div>
    `;
    document.body.appendChild(tray);
  }

  // ── Inject Modal HTML ──
  function injectModal() {
    const modal = document.createElement('div');
    modal.id = 'compare-modal';
    modal.innerHTML = `
      <div class="compare-modal-box">
        <div class="compare-modal-header">
          <div class="compare-modal-title">Side-by-Side Comparison</div>
          <button class="compare-modal-close" onclick="CompareSystem.closeModal()">✕</button>
        </div>
        <div class="compare-table-wrap">
          <table class="compare-table" id="compare-table-body"></table>
        </div>
        <div class="compare-disclaimer">
          Rates and terms are estimates based on publicly available information and may vary. 
          WiseIQ does not guarantee approval. Always verify current terms on the provider's website before applying.
          Last updated: Feb 2026.
        </div>
      </div>
    `;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    document.body.appendChild(modal);
  }

  // ── Attach listeners to all compare checkboxes ──
  function attachCardListeners() {
    document.querySelectorAll('.compare-cb').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const card = e.target.closest('[data-compare-id]');
        if (!card) return;
        const data = extractCardData(card);
        if (e.target.checked) {
          addProduct(data, cb);
        } else {
          removeProduct(data.id);
        }
      });
    });
  }

  // ── Extract data from card's data attributes ──
  function extractCardData(card) {
    return {
      id:        card.dataset.compareId,
      name:      card.dataset.compareName     || 'Product',
      issuer:    card.dataset.compareIssuer   || '',
      logo:      card.dataset.compareLogo     || '',
      applyUrl:  card.dataset.compareApply    || '#',
      score:     card.dataset.compareScore    || '',
      // category-specific fields
      apr:       card.dataset.compareApr      || '—',
      annualFee: card.dataset.compareAnnualFee|| '—',
      bonus:     card.dataset.compareBonus    || '—',
      rewards:   card.dataset.compareRewards  || '—',
      creditReq: card.dataset.compareCreditReq|| '—',
      foreignFee:card.dataset.compareForeignFee|| '—',
      // loan fields
      minLoan:   card.dataset.compareMinLoan  || '—',
      maxLoan:   card.dataset.compareMaxLoan  || '—',
      termRange: card.dataset.compareTermRange|| '—',
      // savings/investing fields
      apy:       card.dataset.compareApy      || '—',
      minBalance:card.dataset.compareMinBalance|| '—',
      fdic:      card.dataset.compareFdic     || '—',
      // category type
      type:      card.dataset.compareType     || 'card',
    };
  }

  // ── Add product to comparison ──
  function addProduct(data, cb) {
    if (selected.length >= MAX) {
      cb.checked = false;
      showToast(`Maximum ${MAX} products can be compared at once.`);
      return;
    }
    if (selected.find(p => p.id === data.id)) return;
    selected.push(data);
    renderTray();
  }

  // ── Remove product ──
  function removeProduct(id) {
    selected = selected.filter(p => p.id !== id);
    // uncheck the corresponding checkbox
    const card = document.querySelector(`[data-compare-id="${id}"]`);
    if (card) {
      const cb = card.querySelector('.compare-cb');
      if (cb) cb.checked = false;
    }
    renderTray();
  }

  // ── Clear all ──
  function clearAll() {
    selected.forEach(p => {
      const card = document.querySelector(`[data-compare-id="${p.id}"]`);
      if (card) {
        const cb = card.querySelector('.compare-cb');
        if (cb) cb.checked = false;
      }
    });
    selected = [];
    renderTray();
  }

  // ── Render tray slots ──
  function renderTray() {
    const tray = document.getElementById('compare-tray');
    const btn  = document.getElementById('btn-compare-now');

    for (let i = 0; i < MAX; i++) {
      const slot = document.getElementById(`compare-slot-${i}`);
      if (!slot) continue;
      const prod = selected[i];
      if (prod) {
        slot.className = 'compare-slot filled';
        slot.innerHTML = `
          ${prod.logo ? `<img src="${prod.logo}" alt="${prod.name}" class="compare-slot-logo">` : ''}
          <div class="compare-slot-name">${prod.name}</div>
          <button class="compare-slot-remove" onclick="CompareSystem.removeProduct('${prod.id}')" title="Remove">✕</button>
        `;
      } else {
        slot.className = 'compare-slot';
        slot.innerHTML = `<span class="compare-slot-empty-text">Select a product</span>`;
      }
    }

    if (selected.length >= 2) {
      tray.classList.add('visible');
      btn.disabled = false;
    } else if (selected.length === 1) {
      tray.classList.add('visible');
      btn.disabled = true;
    } else {
      tray.classList.remove('visible');
      btn.disabled = true;
    }
  }

  // ── Open modal ──
  function openModal() {
    if (selected.length < 2) return;
    const modal = document.getElementById('compare-modal');
    const table = document.getElementById('compare-table-body');
    table.innerHTML = buildTable();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  // ── Close modal ──
  function closeModal() {
    const modal = document.getElementById('compare-modal');
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── Build comparison table HTML ──
  function buildTable() {
    const prods = selected;
    const type  = prods[0].type;

    // Define rows based on category type
    let rows = [];
    if (type === 'card') {
      rows = [
        { label: 'Annual Fee',          key: 'annualFee',  lowerIsBetter: true  },
        { label: 'Regular APR',         key: 'apr',        lowerIsBetter: true  },
        { label: 'Sign-Up Bonus',       key: 'bonus',      lowerIsBetter: false },
        { label: 'Rewards Rate',        key: 'rewards',    lowerIsBetter: false },
        { label: 'Credit Score Req.',   key: 'creditReq',  lowerIsBetter: false },
        { label: 'Foreign Trans. Fee',  key: 'foreignFee', lowerIsBetter: true  },
        { label: 'WiseIQ Score',        key: 'score',      lowerIsBetter: false },
      ];
    } else if (type === 'loan') {
      rows = [
        { label: 'APR Range',           key: 'apr',        lowerIsBetter: true  },
        { label: 'Loan Amount',         key: 'maxLoan',    lowerIsBetter: false },
        { label: 'Loan Terms',          key: 'termRange',  lowerIsBetter: false },
        { label: 'Min. Loan Amount',    key: 'minLoan',    lowerIsBetter: false },
        { label: 'Credit Score Req.',   key: 'creditReq',  lowerIsBetter: false },
        { label: 'WiseIQ Score',        key: 'score',      lowerIsBetter: false },
      ];
    } else if (type === 'savings' || type === 'checking') {
      rows = [
        { label: 'APY',                 key: 'apy',        lowerIsBetter: false },
        { label: 'Annual Fee',          key: 'annualFee',  lowerIsBetter: true  },
        { label: 'Min. Balance',        key: 'minBalance', lowerIsBetter: true  },
        { label: 'FDIC Insured',        key: 'fdic',       lowerIsBetter: false },
        { label: 'WiseIQ Score',        key: 'score',      lowerIsBetter: false },
      ];
    } else if (type === 'investing') {
      rows = [
        { label: 'Account Min.',        key: 'minBalance', lowerIsBetter: true  },
        { label: 'Annual Fee',          key: 'annualFee',  lowerIsBetter: true  },
        { label: 'APY / Returns',       key: 'apy',        lowerIsBetter: false },
        { label: 'Bonus',               key: 'bonus',      lowerIsBetter: false },
        { label: 'WiseIQ Score',        key: 'score',      lowerIsBetter: false },
      ];
    } else if (type === 'student') {
      rows = [
        { label: 'APR Range',           key: 'apr',        lowerIsBetter: true  },
        { label: 'Loan Amount',         key: 'maxLoan',    lowerIsBetter: false },
        { label: 'Loan Terms',          key: 'termRange',  lowerIsBetter: false },
        { label: 'Origination Fee',     key: 'annualFee',  lowerIsBetter: true  },
        { label: 'Credit Score Req.',   key: 'creditReq',  lowerIsBetter: false },
        { label: 'WiseIQ Score',        key: 'score',      lowerIsBetter: false },
      ];
    } else if (type === 'business') {
      rows = [
        { label: 'Annual Fee',          key: 'annualFee',  lowerIsBetter: true  },
        { label: 'Regular APR',         key: 'apr',        lowerIsBetter: true  },
        { label: 'Sign-Up Bonus',       key: 'bonus',      lowerIsBetter: false },
        { label: 'Rewards Rate',        key: 'rewards',    lowerIsBetter: false },
        { label: 'Foreign Trans. Fee',  key: 'foreignFee', lowerIsBetter: true  },
        { label: 'WiseIQ Score',        key: 'score',      lowerIsBetter: false },
      ];
    }

    // Header row
    let html = `<thead><tr>
      <th>Feature</th>
      ${prods.map(p => `
        <th>
          ${p.logo ? `<img src="${p.logo}" alt="${p.name}" class="compare-prod-logo">` : ''}
          <div class="compare-prod-name">${p.name}</div>
          <div class="compare-prod-issuer">${p.issuer}</div>
          ${p.score ? `<div class="compare-score-badge"><span data-icon="award" data-size="16" data-class="icon-blue"></span> ${p.score}/10 WiseIQ</div>` : ''}
        </th>
      `).join('')}
    </tr></thead>`;

    // Data rows
    html += '<tbody>';
    rows.forEach(row => {
      const vals = prods.map(p => p[row.key] || '—');
      // Determine winner (simple: find best numeric value, or highest/lowest string)
      const winners = findWinners(vals, row.lowerIsBetter);
      html += `<tr>
        <td>${row.label}</td>
        ${vals.map((v, i) => `<td class="${winners[i] ? 'winner' : ''}">${v}</td>`).join('')}
      </tr>`;
    });
    html += '</tbody>';

    // Apply row
    html += `<tfoot><tr class="compare-apply-row">
      <td style="font-weight:700;color:#0b1f3a;">Apply Now</td>
      ${prods.map(p => `
        <td>
          <a href="${p.applyUrl}" target="_blank" rel="noopener sponsored" class="btn-compare-apply">
            Apply for ${p.name.split(' ').slice(0,2).join(' ')}
          </a>
        </td>
      `).join('')}
    </tr></tfoot>`;

    return html;
  }

  // ── Find winner cells ──
  function findWinners(vals, lowerIsBetter) {
    // Extract numeric values where possible
    const nums = vals.map(v => {
      if (!v || v === '—') return null;
      // Extract first number from string like "$0", "17.99%", "4.50% APY", "$5,000"
      const m = v.replace(/,/g, '').match(/[\d.]+/);
      return m ? parseFloat(m[0]) : null;
    });

    const validNums = nums.filter(n => n !== null);
    if (validNums.length < 2) return vals.map(() => false);

    const best = lowerIsBetter ? Math.min(...validNums) : Math.max(...validNums);
    // Only mark as winner if it's uniquely best
    const bestCount = validNums.filter(n => n === best).length;
    if (bestCount >= validNums.length) return vals.map(() => false); // all tied

    return nums.map(n => n === best);
  }

  // ── Toast notification ──
  function showToast(msg) {
    let toast = document.getElementById('compare-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'compare-toast';
      toast.style.cssText = `
        position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
        background:#0b1f3a;color:white;padding:10px 20px;border-radius:10px;
        font-size:13px;font-weight:600;z-index:9998;
        box-shadow:0 4px 20px rgba(0,0,0,0.3);
        transition:opacity 0.3s;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
  }

  // Public API
  return { init, addProduct, removeProduct, clearAll, openModal, closeModal };
})();

// Auto-init when DOM ready
document.addEventListener('DOMContentLoaded', () => CompareSystem.init());
