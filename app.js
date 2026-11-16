/* ==========================================================================
   NEXOS WEB — Interactive Motion, Live BCV Rate & App Suite Simulator
   ========================================================================== */

(function () {
  'use strict';

  const WHATSAPP_NUMBER = '584129062790';
  let liveBcvRate = 896.12;
  let billingPeriod = 'monthly'; // 'monthly' | 'annual'
  let showVesInPricing = true;

  // ---------- 1. Initialize Lucide Icons ----------
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // ---------- 2. Scroll Progress & Sticky Navbar ----------
  const scrollProgressEl = document.getElementById('scroll-progress');
  const mainHeaderEl = document.getElementById('main-header');
  const floatingWaEl = document.getElementById('floating-wa');

  function handleScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const percent = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;

    if (scrollProgressEl) {
      scrollProgressEl.style.width = percent.toFixed(2) + '%';
    }
    if (mainHeaderEl) {
      mainHeaderEl.classList.toggle('scrolled', scrollTop > 24);
    }
    if (floatingWaEl) {
      if (scrollTop > 260) {
        floatingWaEl.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
      } else {
        floatingWaEl.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
      }
    }
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // ---------- 3. Mobile Menu Drawer ----------
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenuEl = document.getElementById('mobile-menu');

  if (mobileMenuBtn && mobileMenuEl) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuEl.classList.toggle('open');
    });
    mobileMenuEl.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => mobileMenuEl.classList.remove('open'));
    });
  }

  // ---------- 4. IntersectionObserver Scroll Reveals & Counters ----------
  let pricingSectionRevealed = false;

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');

          if (entry.target.id === 'pricing-cards-grid') {
            pricingSectionRevealed = true;
            entry.target.querySelectorAll('.reveal').forEach((card) => card.classList.add('active'));
          }

          if (entry.target.classList.contains('timeline-container')) {
            entry.target.classList.add('timeline-active');
          }

          // Animate numbers inside counters
          const counters = entry.target.querySelectorAll('[data-count-to]');
          counters.forEach(animateCounter);
          if (entry.target.hasAttribute('data-count-to')) {
            animateCounter(entry.target);
          }

          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.02, rootMargin: '0px 0px 60px 0px' }
  );

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .timeline-container, #pricing-cards-grid').forEach((el) => {
    revealObserver.observe(el);
  });

  function animateCounter(el) {
    if (el.dataset.animated === 'true') return;
    el.dataset.animated = 'true';
    const target = parseFloat(el.dataset.countTo || '0');
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const duration = 1100;
    const startTime = performance.now();

    function step(now) {
      const elapsed = Math.min(1, (now - startTime) / duration);
      // easeOutExpo
      const eased = elapsed === 1 ? 1 : 1 - Math.pow(2, -10 * elapsed);
      const current = target * eased;
      el.textContent = prefix + current.toFixed(decimals) + suffix;
      if (elapsed < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ---------- 5. Mouse-Tracking Spotlight Bento Cards ----------
  document.querySelectorAll('.spotlight-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // ---------- 6. 3D Perspective Tilt on Hero Hardware Stage ----------
  const tiltStage = document.getElementById('hero-tilt-stage');
  const tiltFrame = document.getElementById('hero-tilt-frame');

  if (tiltStage && tiltFrame && window.matchMedia('(pointer: fine)').matches) {
    tiltStage.addEventListener('mousemove', (e) => {
      const rect = tiltStage.getBoundingClientRect();
      const xPct = (e.clientX - rect.left) / rect.width - 0.5;
      const yPct = (e.clientY - rect.top) / rect.height - 0.5;
      const rotateY = xPct * 9;
      const rotateX = -yPct * 7;
      tiltFrame.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`;
    });

    tiltStage.addEventListener('mouseleave', () => {
      tiltFrame.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  }

  // ---------- 7. Live BCV Rate Sync (ve.dolarapi.com with smooth fallback) ----------
  async function syncLiveBcvRate() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('https://ve.dolarapi.com/v1/dolares', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeout);
      if (res.ok) {
        const list = await res.json();
        const oficial = Array.isArray(list) ? list.find((item) => item.fuente === 'oficial') : null;
        if (oficial && oficial.promedio > 10) {
          liveBcvRate = Number(oficial.promedio);
          const sourceLabel = document.getElementById('bcv-source-label');
          if (sourceLabel) sourceLabel.textContent = 'BCV Oficial en Vivo';
        }
      }
    } catch {
      // Fallback already initialized to 896.12
    } finally {
      updateAllRatesUI();
    }
  }

  function formatBs(amountBs) {
    return (
      'Bs. ' +
      amountBs.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  function updateAllRatesUI() {
    const rateFormatted = liveBcvRate.toFixed(2);
    document.querySelectorAll('[data-bcv-rate]').forEach((el) => {
      el.textContent = rateFormatted;
    });

    const rateInput = document.getElementById('sim-rate-input');
    if (rateInput && document.activeElement !== rateInput) {
      rateInput.value = rateFormatted;
    }
    const pricingRateInput = document.getElementById('pricing-rate-input');
    if (pricingRateInput && document.activeElement !== pricingRateInput) {
      pricingRateInput.value = rateFormatted;
    }

    renderPosSimulator();
    renderFiaoSimulator();
    renderPricingCards();
  }

  // Bind editable rate inputs
  const simRateInput = document.getElementById('sim-rate-input');
  if (simRateInput) {
    simRateInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val > 0) {
        liveBcvRate = val;
        updateAllRatesUI();
      }
    });
  }
  const pricingRateInput = document.getElementById('pricing-rate-input');
  if (pricingRateInput) {
    pricingRateInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val > 0) {
        liveBcvRate = val;
        updateAllRatesUI();
      }
    });
  }

  // ---------- 8. Interactive 4-Tab App Suite ----------
  const suiteTabs = document.querySelectorAll('[data-suite-tab]');
  const suitePanels = document.querySelectorAll('[data-suite-panel]');

  suiteTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.suiteTab;
      suiteTabs.forEach((b) => {
        b.classList.remove('bg-brand-600', 'text-white', 'shadow-lg', 'border-brand-400');
        b.classList.add('bg-surface-dark/70', 'text-slate-400', 'hover:text-white', 'border-surface-border');
      });
      btn.classList.remove('bg-surface-dark/70', 'text-slate-400', 'hover:text-white', 'border-surface-border');
      btn.classList.add('bg-brand-600', 'text-white', 'shadow-lg', 'border-brand-400');

      suitePanels.forEach((panel) => {
        if (panel.dataset.suitePanel === target) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      });
    });
  });

  // --- TAB 1: Interactive POS & Mixed Checkout ---
  const DEMO_PRODUCTS = [
    { id: 'p1', name: 'Harina PAN 1kg', cat: 'Abarrotes', sku: '7591001', price: 1.25 },
    { id: 'p2', name: 'Arroz Primor 1kg', cat: 'Abarrotes', sku: '7591002', price: 1.45 },
    { id: 'p3', name: 'Café Fama 250g', cat: 'Bebidas', sku: '7591003', price: 2.90 },
    { id: 'p4', name: 'Aceite Mazeite 1L', cat: 'Abarrotes', sku: '7591004', price: 3.60 },
    { id: 'p5', name: 'Refresco 2L', cat: 'Bebidas', sku: '7591005', price: 2.10 },
    { id: 'p6', name: 'Queso Duro 500g', cat: 'Lácteos', sku: '7591006', price: 3.40 },
  ];

  let activeCategory = 'Todos';
  let posSearchQuery = '';
  let cart = [
    { ...DEMO_PRODUCTS[0], qty: 2 },
    { ...DEMO_PRODUCTS[2], qty: 1 },
  ];
  let checkoutModalOpen = false;
  let lastReceiptData = null;

  function getCartTotalUSD() {
    return cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  }

  function renderPosCatalog() {
    const grid = document.getElementById('pos-catalog-grid');
    if (!grid) return;

    const filtered = DEMO_PRODUCTS.filter((p) => {
      const matchCat = activeCategory === 'Todos' || p.cat === activeCategory;
      const matchSearch =
        !posSearchQuery ||
        p.name.toLowerCase().includes(posSearchQuery.toLowerCase()) ||
        p.sku.includes(posSearchQuery);
      return matchCat && matchSearch;
    });

    grid.innerHTML = filtered
      .map(
        (p) => `
      <button type="button" onclick="window.nexosAddCart('${p.id}')"
        class="p-3 rounded-2xl border border-surface-border bg-surface-dark/80 hover:border-brand-500 hover:bg-brand-950/30 text-left transition-all active:scale-95 group flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between gap-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-brand-400">${p.cat}</span>
            <span class="text-[10px] font-mono text-slate-500">#${p.sku.slice(-4)}</span>
          </div>
          <p class="font-bold text-xs text-white mt-1 group-hover:text-brand-200 line-clamp-1">${p.name}</p>
        </div>
        <div class="mt-2.5 pt-2 border-t border-white/5 flex items-baseline justify-between font-mono">
          <span class="font-extrabold text-sm text-emerald-400">$${p.price.toFixed(2)}</span>
          <span class="text-[10px] text-slate-400">${formatBs(p.price * liveBcvRate)}</span>
        </div>
      </button>
    `
      )
      .join('');
  }

  function renderPosSimulator() {
    renderPosCatalog();
    const listEl = document.getElementById('pos-ticket-list');
    const usdEl = document.getElementById('pos-total-usd');
    const vesEl = document.getElementById('pos-total-ves');
    const countEl = document.getElementById('pos-items-count');

    if (!listEl) return;

    const totalUSD = getCartTotalUSD();
    const totalVES = totalUSD * liveBcvRate;
    const totalUnits = cart.reduce((acc, i) => acc + i.qty, 0);

    if (countEl) countEl.textContent = `${totalUnits} art.`;
    if (usdEl) usdEl.textContent = `$${totalUSD.toFixed(2)}`;
    if (vesEl) vesEl.textContent = formatBs(totalVES);

    if (cart.length === 0) {
      listEl.innerHTML =
        '<div class="py-8 text-center text-xs text-slate-500">Ticket vacío.<br>Haz clic en un producto o simula el escáner.</div>';
    } else {
      listEl.innerHTML = cart
        .map(
          (item) => `
        <div class="flex items-center justify-between gap-2 py-2 px-2.5 rounded-xl bg-surface-dark/60 border border-white/5 text-xs">
          <div class="min-w-0 flex-1">
            <p class="font-bold text-white truncate">${item.name}</p>
            <p class="text-[10px] font-mono text-slate-400">$${item.price.toFixed(2)} c/u</p>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <button type="button" onclick="window.nexosUpdateQty('${item.id}', -1)" class="h-6 w-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center">-</button>
            <span class="font-mono font-bold w-5 text-center text-white">${item.qty}</span>
            <button type="button" onclick="window.nexosUpdateQty('${item.id}', 1)" class="h-6 w-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center">+</button>
          </div>
          <span class="font-mono font-bold text-emerald-400 w-14 text-right">$${(item.price * item.qty).toFixed(2)}</span>
        </div>
      `
        )
        .join('');
    }

    updateCheckoutCalculation();
  }

  window.nexosAddCart = function (productId) {
    const prod = DEMO_PRODUCTS.find((p) => p.id === productId);
    if (!prod) return;
    const existing = cart.find((i) => i.id === productId);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...prod, qty: 1 });
    }
    renderPosSimulator();
  };

  window.nexosUpdateQty = function (productId, delta) {
    cart = cart
      .map((item) => (item.id === productId ? { ...item, qty: item.qty + delta } : item))
      .filter((item) => item.qty > 0);
    renderPosSimulator();
  };

  window.nexosClearCart = function () {
    cart = [];
    renderPosSimulator();
  };

  window.nexosScanRandom = function () {
    const randomProd = DEMO_PRODUCTS[Math.floor(Math.random() * DEMO_PRODUCTS.length)];
    window.nexosAddCart(randomProd.id);
    const toast = document.getElementById('pos-scan-feedback');
    if (toast) {
      toast.textContent = `✓ Escaneado: ${randomProd.name} ($${randomProd.price.toFixed(2)})`;
      toast.classList.remove('opacity-0');
      clearTimeout(window._scanTimer);
      window._scanTimer = setTimeout(() => toast.classList.add('opacity-0'), 1800);
    }
  };

  // POS category filter & search
  document.querySelectorAll('[data-pos-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.posCat;
      document.querySelectorAll('[data-pos-cat]').forEach((b) => {
        b.classList.remove('bg-brand-600', 'text-white');
        b.classList.add('bg-surface-dark', 'text-slate-400');
      });
      btn.classList.remove('bg-surface-dark', 'text-slate-400');
      btn.classList.add('bg-brand-600', 'text-white');
      renderPosCatalog();
    });
  });

  const posSearchInput = document.getElementById('pos-search-input');
  if (posSearchInput) {
    posSearchInput.addEventListener('input', (e) => {
      posSearchQuery = e.target.value;
      renderPosCatalog();
    });
  }

  // Mixed Payment Checkout Modal inside Simulator
  const checkoutDrawer = document.getElementById('pos-checkout-modal');
  const receiptModal = document.getElementById('pos-receipt-modal');
  const payUsdInput = document.getElementById('pay-usd-input');
  const payVesInput = document.getElementById('pay-ves-input');

  window.nexosOpenCheckout = function () {
    if (cart.length === 0) return;
    checkoutModalOpen = true;
    const totalUSD = getCartTotalUSD();
    // Pre-fill smart mixed payment example: $2 USD cash + remainder in Pago Movil Bs
    const initialCashUSD = totalUSD >= 3 ? 2 : 0;
    const remBs = Math.max(0, (totalUSD - initialCashUSD) * liveBcvRate);
    if (payUsdInput) payUsdInput.value = initialCashUSD.toFixed(2);
    if (payVesInput) payVesInput.value = remBs.toFixed(2);
    if (checkoutDrawer) checkoutDrawer.classList.remove('hidden');
    updateCheckoutCalculation();
  };

  window.nexosCloseCheckout = function () {
    checkoutModalOpen = false;
    if (checkoutDrawer) checkoutDrawer.classList.add('hidden');
  };

  function updateCheckoutCalculation() {
    if (!checkoutModalOpen) return;
    const totalUSD = getCartTotalUSD();
    const cashUSD = parseFloat(payUsdInput?.value || '0') || 0;
    const pagoMovilVES = parseFloat(payVesInput?.value || '0') || 0;
    const totalPaidUSD = cashUSD + (liveBcvRate > 0 ? pagoMovilVES / liveBcvRate : 0);
    const diffUSD = totalPaidUSD - totalUSD;

    const dueEl = document.getElementById('checkout-due-usd');
    const paidEl = document.getElementById('checkout-paid-usd');
    const changeBox = document.getElementById('checkout-change-box');
    const confirmBtn = document.getElementById('checkout-confirm-btn');

    if (dueEl) dueEl.textContent = `$${totalUSD.toFixed(2)} (${formatBs(totalUSD * liveBcvRate)})`;
    if (paidEl) paidEl.textContent = `$${totalPaidUSD.toFixed(2)}`;

    if (changeBox) {
      if (diffUSD >= -0.01) {
        const changeUsdClean = Math.max(0, diffUSD);
        changeBox.className =
          'p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs flex justify-between items-center';
        changeBox.innerHTML = `<span class="font-bold text-emerald-300">Vuelto a entregar:</span><span class="font-mono font-extrabold text-emerald-300">$${changeUsdClean.toFixed(2)} / ${formatBs(changeUsdClean * liveBcvRate)}</span>`;
        if (confirmBtn) confirmBtn.disabled = false;
      } else {
        const missing = Math.abs(diffUSD);
        changeBox.className =
          'p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs flex justify-between items-center';
        changeBox.innerHTML = `<span class="font-bold text-amber-300">Falta por pagar:</span><span class="font-mono font-extrabold text-amber-300">$${missing.toFixed(2)} / ${formatBs(missing * liveBcvRate)}</span>`;
        if (confirmBtn) confirmBtn.disabled = true;
      }
    }
  }

  if (payUsdInput) payUsdInput.addEventListener('input', updateCheckoutCalculation);
  if (payVesInput) payVesInput.addEventListener('input', updateCheckoutCalculation);

  window.nexosCompleteDemoSale = function () {
    const totalUSD = getCartTotalUSD();
    const cashUSD = parseFloat(payUsdInput?.value || '0') || 0;
    const pagoMovilVES = parseFloat(payVesInput?.value || '0') || 0;
    const totalPaidUSD = cashUSD + (liveBcvRate > 0 ? pagoMovilVES / liveBcvRate : 0);
    const changeUSD = Math.max(0, totalPaidUSD - totalUSD);

    lastReceiptData = {
      items: [...cart],
      totalUSD,
      totalVES: totalUSD * liveBcvRate,
      cashUSD,
      pagoMovilVES,
      changeUSD,
      rate: liveBcvRate,
      num: 'FAC-' + Math.floor(1000 + Math.random() * 9000),
    };

    window.nexosCloseCheckout();
    renderThermalReceipt();
    if (receiptModal) receiptModal.classList.remove('hidden');
  };

  window.nexosCloseReceipt = function () {
    if (receiptModal) receiptModal.classList.add('hidden');
  };

  function renderThermalReceipt() {
    const box = document.getElementById('thermal-receipt-body');
    if (!box || !lastReceiptData) return;
    const r = lastReceiptData;
    box.innerHTML = `
      <div class="text-center border-b border-dashed border-slate-400 pb-2 mb-2">
        <p class="font-bold text-xs">COMERCIAL DEMO C.A.</p>
        <p class="text-[10px]">RIF: J-41200918-4 · Caracas</p>
        <p class="text-[10px]">TICKET #${r.num} · TASA BCV: ${r.rate.toFixed(2)}</p>
      </div>
      <div class="space-y-1 text-[10px] border-b border-dashed border-slate-400 pb-2 mb-2">
        ${r.items
          .map(
            (it) =>
              `<div class="flex justify-between"><span>${it.qty}x ${it.name}</span><span>$${(it.price * it.qty).toFixed(2)}</span></div>`
          )
          .join('')}
      </div>
      <div class="space-y-0.5 text-[10px] font-bold">
        <div class="flex justify-between"><span>TOTAL USD:</span><span>$${r.totalUSD.toFixed(2)}</span></div>
        <div class="flex justify-between"><span>TOTAL BS:</span><span>${formatBs(r.totalVES)}</span></div>
        <div class="flex justify-between font-normal pt-1"><span>Efectivo USD:</span><span>$${r.cashUSD.toFixed(2)}</span></div>
        <div class="flex justify-between font-normal"><span>Pago Móvil:</span><span>${formatBs(r.pagoMovilVES)}</span></div>
        <div class="flex justify-between pt-1 border-t border-dashed border-slate-400"><span>VUELTO:</span><span>$${r.changeUSD.toFixed(2)}</span></div>
      </div>
      <p class="text-center text-[9px] mt-3 pt-2 border-t border-dashed border-slate-400">GRACIAS POR SU COMPRA · NEXOS POS</p>
    `;
  }

  // --- TAB 2: Interactive Offline Mode Simulator ---
  let simOffline = false;
  let offlineQueueCount = 0;

  window.nexosToggleOfflineSim = function () {
    simOffline = !simOffline;
    const statusBadge = document.getElementById('offline-sim-status');
    const toggleBtn = document.getElementById('offline-sim-toggle');
    const logBox = document.getElementById('offline-sim-log');
    const queueCountEl = document.getElementById('offline-queue-count');

    if (simOffline) {
      if (statusBadge) {
        statusBadge.className =
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold';
        statusBadge.innerHTML =
          '<span class="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span> SIN INTERNET · MODO RESGUARDO LOCAL ACTIVO';
      }
      if (toggleBtn) {
        toggleBtn.textContent = 'Restaurar Conexión a Internet';
        toggleBtn.className =
          'px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all';
      }
      if (logBox) {
        logBox.innerHTML += `<p class="text-amber-300">[${new Date().toLocaleTimeString()}] Desconexión detectada. Caja operando al 100% en caché local (IndexedDB).</p>`;
        logBox.scrollTop = logBox.scrollHeight;
      }
    } else {
      if (statusBadge) {
        statusBadge.className =
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold';
        statusBadge.innerHTML =
          '<span class="h-2 w-2 rounded-full bg-emerald-400"></span> CONECTADO · SINCRONIZACIÓN AUTOMÁTICA AL DÍA';
      }
      if (toggleBtn) {
        toggleBtn.textContent = 'Simular Caída de Internet';
        toggleBtn.className =
          'px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all';
      }
      if (offlineQueueCount > 0 && logBox) {
        logBox.innerHTML += `<p class="text-cyan-300">[${new Date().toLocaleTimeString()}] Red recuperada. Sincronizando ${offlineQueueCount} factura(s) pendientes...</p>`;
        setTimeout(() => {
          offlineQueueCount = 0;
          if (queueCountEl) queueCountEl.textContent = '0';
          logBox.innerHTML += `<p class="text-emerald-400 font-bold">✓ Sincronización completada en 0.3s sin pérdida de datos.</p>`;
          logBox.scrollTop = logBox.scrollHeight;
        }, 700);
      } else if (logBox) {
        logBox.innerHTML += `<p class="text-emerald-300">[${new Date().toLocaleTimeString()}] Conexión activa y estable.</p>`;
      }
    }
  };

  window.nexosRecordOfflineSale = function () {
    const logBox = document.getElementById('offline-sim-log');
    const queueCountEl = document.getElementById('offline-queue-count');
    const amount = (8 + Math.random() * 25).toFixed(2);
    if (simOffline) {
      offlineQueueCount += 1;
      if (queueCountEl) queueCountEl.textContent = String(offlineQueueCount);
      if (logBox) {
        logBox.innerHTML += `<p class="text-white">• Venta $${amount} guardada localmente (En cola para sincronizar: #${offlineQueueCount}).</p>`;
        logBox.scrollTop = logBox.scrollHeight;
      }
    } else if (logBox) {
      logBox.innerHTML += `<p class="text-emerald-300">• Venta $${amount} facturada y sincronizada en tiempo real.</p>`;
      logBox.scrollTop = logBox.scrollHeight;
    }
  };

  // --- TAB 3: Interactive Fiao / Customer Credit Demo ---
  const DEMO_DEBTORS = [
    { name: 'María Fernanda Pérez', phone: '+58 414-8821920', debtUSD: 24.5, note: 'Compra quincenal abarrotes' },
    { name: 'José Gregorio Mendoza', phone: '+58 412-3310492', debtUSD: 42.0, note: 'Saco cemento + herramientas' },
    { name: 'Luisana Carolina Rivas', phone: '+58 424-7712034', debtUSD: 15.8, note: 'Saldo pendiente factura #891' },
  ];

  function renderFiaoSimulator() {
    const listEl = document.getElementById('fiao-demo-list');
    if (!listEl) return;
    listEl.innerHTML = DEMO_DEBTORS.map(
      (d) => `
      <div class="p-3.5 rounded-2xl bg-surface-dark/70 border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p class="font-bold text-sm text-white">${d.name}</p>
          <p class="text-[11px] text-slate-400">${d.phone} · ${d.note}</p>
        </div>
        <div class="flex items-center justify-between sm:justify-end gap-4">
          <div class="text-right font-mono">
            <p class="text-sm font-black text-amber-400">$${d.debtUSD.toFixed(2)}</p>
            <p class="text-[11px] text-emerald-400 font-bold">Hoy: ${formatBs(d.debtUSD * liveBcvRate)}</p>
          </div>
          <button type="button" onclick="alert('Mensaje generado para ${d.name}: Hola, te recordamos tu saldo pendiente de $${d.debtUSD.toFixed(2)} (${formatBs(d.debtUSD * liveBcvRate)} a tasa BCV de hoy).')"
            class="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 text-[11px] font-bold shrink-0">
            Cobrar WhatsApp
          </button>
        </div>
      </div>
    `
    ).join('');
  }

  // ---------- 9. Interactive Pricing Cards (Mensual/Anual + Bs Calculator) ----------
  const PLANS_DATA = [
    {
      id: 'gratis',
      name: 'Plan Gratis',
      badge: 'Inicial · Sin Costo',
      badgeClass: 'bg-slate-800 text-slate-200',
      priceMonthly: 0,
      desc: 'Ideal para probar o negocios que recién abren con inventario pequeño.',
      features: [
        'Hasta <b>10 productos</b> en catálogo',
        'Punto de Venta POS ($ y Bs BCV)',
        'Cálculo automático de vuelto',
        'Directorio básico de clientes y fiao',
        '1 Caja / 1 Usuario (Dueño)',
      ],
      ctaText: 'Empezar Gratis',
      waMsg: 'Hola, quiero empezar con el Plan Gratis de 10 productos de NEXOS',
      cardClass: 'border-surface-border bg-surface-card hover:border-brand-500/50',
      btnClass: 'border border-surface-border bg-surface-dark hover:bg-surface-border text-white',
    },
    {
      id: 'basico',
      name: 'Plan Básico',
      badge: 'Esencial',
      badgeClass: 'bg-brand-950 text-brand-300 border border-brand-800',
      priceMonthly: 19,
      desc: 'Para bodegas y tiendas que necesitan recibos térmicos e inventario formal.',
      features: [
        'Hasta <b>100 productos</b> en catálogo',
        'Impresión térmica USB 58mm y 80mm',
        'Caja Registradora POS Bimoneda',
        'Control completo de Clientes y Fiao',
        '1 Caja · 2 Usuarios (Dueño + Cajero)',
      ],
      ctaText: 'Contratar Plan Básico',
      waMsg: 'Hola, me interesa activar el Plan Basico ($19/mes) de NEXOS',
      cardClass: 'border-surface-border bg-surface-card hover:border-brand-500/50',
      btnClass: 'border border-brand-500/50 bg-brand-950/40 hover:bg-brand-900/60 text-brand-200',
    },
    {
      id: 'pro',
      name: 'Plan Pro',
      badge: 'Completo',
      popular: true,
      badgeClass: 'bg-brand-500/20 text-brand-300 border border-brand-500/40',
      priceMonthly: 39,
      desc: 'Para minimarkets, ferreterías y tiendas que nunca detienen sus ventas.',
      features: [
        '<b class="text-white">Productos Ilimitados</b>',
        '<b class="text-white">Modo Offline</b> (vende sin internet)',
        'Importación masiva Excel / CSV',
        'Generador de Códigos de Barras',
        'Arqueo de caja, gastos y proveedores',
        'Hasta 3 Cajas / 5 Usuarios',
      ],
      ctaText: 'Activar Plan Pro',
      waMsg: 'Hola, me interesa activar el Plan Pro ($39/mes) de NEXOS para mi tienda',
      cardClass: 'border-2 border-brand-500 bg-gradient-to-b from-brand-950/60 via-surface-card to-surface-card glow-purple',
      btnClass: 'btn-shimmer bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-lg',
    },
    {
      id: 'ultra',
      name: 'Plan Ultra',
      badge: 'Corporativo',
      badgeClass: 'bg-amber-400/20 text-amber-300 border border-amber-400/30',
      priceMonthly: 79,
      desc: 'Para cadenas, distribuidores y comercios grandes multi-sucursal.',
      features: [
        '<b class="text-white">Todo lo del Plan Pro Ilimitado</b>',
        '<b>NEXOS Copilot IA</b> para auditorías',
        'Multi-Empresa en una misma cuenta',
        'Cajas, almacenes y cajeros sin límite',
        'Respaldo en nube y Soporte VIP',
      ],
      ctaText: 'Contratar Plan Ultra',
      waMsg: 'Hola, me interesa el Plan Ultra ($79/mes) de NEXOS para mis sucursales',
      cardClass: 'border-surface-border bg-surface-card hover:border-amber-400/50',
      btnClass: 'border border-amber-400/50 bg-amber-950/20 hover:bg-amber-900/40 text-amber-300',
    },
  ];

  function renderPricingCards() {
    const grid = document.getElementById('pricing-cards-grid');
    if (!grid) return;

    const isAnnual = billingPeriod === 'annual';

    grid.innerHTML = PLANS_DATA.map((p, idx) => {
      const effectiveMonthly = isAnnual && p.priceMonthly > 0 ? Math.round(p.priceMonthly * 0.8) : p.priceMonthly;
      const vesTotal = effectiveMonthly * liveBcvRate;
      const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        p.waMsg + (isAnnual && p.priceMonthly > 0 ? ' (Modalidad Anual con 20% dto.)' : '')
      )}`;

      return `
        <div class="spotlight-card reveal ${pricingSectionRevealed ? 'active' : ''} rounded-3xl p-6 flex flex-col justify-between relative ${p.cardClass}" style="transition-delay:${idx * 75}ms">
          ${
            p.popular
              ? '<div class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 text-white text-[10px] font-black uppercase tracking-wider shadow-lg whitespace-nowrap">MÁS ELEGIDO EN VENEZUELA</div>'
              : ''
          }
          <div>
            <span class="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${p.badgeClass} ${p.popular ? 'mt-1' : ''}">
              ${p.badge}
            </span>
            <h3 class="text-xl font-extrabold text-white mt-3">${p.name}</h3>
            <p class="text-xs text-slate-400 mt-1 min-h-[34px]">${p.desc}</p>

            <div class="my-5">
              <div class="flex items-baseline gap-1.5">
                <span class="text-4xl font-black text-white font-mono">$${effectiveMonthly}</span>
                <span class="text-xs text-slate-400 font-semibold">${effectiveMonthly === 0 ? '/ permanente' : '/ mes'}</span>
                ${
                  isAnnual && p.priceMonthly > 0
                    ? `<span class="text-xs line-through text-slate-500 font-mono ml-1">$${p.priceMonthly}</span>`
                    : ''
                }
              </div>
              ${
                showVesInPricing && effectiveMonthly > 0
                  ? `<p class="text-xs font-mono font-bold text-emerald-400 mt-1">≈ ${formatBs(vesTotal)} <span class="text-[10px] text-slate-500 font-sans font-normal">(Tasa BCV)</span></p>`
                  : `<p class="text-xs text-slate-500 mt-1">${effectiveMonthly === 0 ? 'Sin tarjeta · Para siempre' : 'Pago Móvil, Zelle o Efectivo'}</p>`
              }
            </div>

            <ul class="space-y-2.5 text-xs text-slate-300 border-t border-white/10 pt-5">
              ${p.features
                .map(
                  (f) => `
                <li class="flex items-start gap-2">
                  <svg viewBox="0 0 24 24" class="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>${f}</span>
                </li>
              `
                )
                .join('')}
            </ul>
          </div>

          <div class="pt-7">
            <a href="${waHref}" target="_blank" class="w-full py-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] ${p.btnClass}">
              <span>${p.ctaText}</span>
              <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>
          </div>
        </div>
      `;
    }).join('');

    // Re-attach spotlight listeners to newly rendered pricing cards
    grid.querySelectorAll('.spotlight-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      });
    });
  }

  window.nexosSetBilling = function (period) {
    billingPeriod = period;
    const btnM = document.getElementById('bill-monthly');
    const btnA = document.getElementById('bill-annual');
    if (btnM && btnA) {
      if (period === 'monthly') {
        btnM.className = 'px-4 py-1.5 rounded-xl text-xs font-extrabold bg-brand-600 text-white shadow-sm transition-all';
        btnA.className = 'px-4 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center gap-1.5';
      } else {
        btnA.className = 'px-4 py-1.5 rounded-xl text-xs font-extrabold bg-brand-600 text-white shadow-sm transition-all flex items-center gap-1.5';
        btnM.className = 'px-4 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all';
      }
    }
    renderPricingCards();
  };

  const toggleMatrixBtn = document.getElementById('toggle-matrix-btn');
  const matrixWrapper = document.getElementById('comparison-matrix-wrapper');
  if (toggleMatrixBtn && matrixWrapper) {
    toggleMatrixBtn.addEventListener('click', () => {
      const hidden = matrixWrapper.classList.toggle('hidden');
      toggleMatrixBtn.textContent = hidden
        ? 'Ver Tabla Comparativa Completa de Funciones ↓'
        : 'Ocultar Tabla Comparativa ↑';
    });
  }

  // ---------- 10. Smooth FAQ Accordion ----------
  document.querySelectorAll('.faq-item').forEach((item) => {
    const trigger = item.querySelector('.faq-trigger');
    if (trigger) {
      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach((other) => other.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    }
  });

  // Initial render & fetch live BCV rate
  renderPosSimulator();
  renderFiaoSimulator();
  renderPricingCards();
  syncLiveBcvRate();
})();
