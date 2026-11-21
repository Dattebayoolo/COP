/**
 * Communists of Pakistan (COP) - Main Application Controller
 * Official Handle: @COPOFPK
 * 
 * Integrates with:
 *   - PartyLedger  (card_engine.js) — cadre registration, lookup, export
 *   - CardCanvasExporter (card_engine.js) — high-res PNG card rendering
 *   - QRMatrix (card_engine.js) — QR code generation
 */

// Global download handler callable from any dynamic HTML button
window.downloadComradeCard = function (id) {
  const comrade = window.PartyLedger ? window.PartyLedger.lookup(id) : null;
  if (!comrade) {
    if (window.showAppToast) window.showAppToast('Comrade record not found.');
    return;
  }
  if (window.showAppToast) window.showAppToast(`Generating HD Card for Comrade ${comrade.name}...`, 2500);
  window.CardCanvasExporter.download(comrade);
};

document.addEventListener('DOMContentLoaded', () => {

  // =============================================
  // 1. MOBILE NAV TOGGLE
  // =============================================
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      mobileToggle.classList.toggle('open', isOpen);
      mobileToggle.setAttribute('aria-expanded', isOpen);
    });
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        mobileToggle.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // =============================================
  // 2. SCROLL PROGRESS & ACTIVE LINK & BACK-TO-TOP
  // =============================================
  const scrollProgressBar = document.getElementById('scrollProgressBar');
  const backToTopBtn = document.getElementById('backToTopBtn');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (scrollProgressBar && docHeight > 0) {
      scrollProgressBar.style.width = `${Math.min(100, Math.max(0, (scrollY / docHeight) * 100))}%`;
    }

    if (backToTopBtn) {
      backToTopBtn.style.display = scrollY > 350 ? 'flex' : 'none';
    }

    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 110;
      if (scrollY > sectionTop && scrollY <= sectionTop + section.offsetHeight) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // =============================================
  // 3. PROGRAM / MANIFESTO FILTER TABS
  // =============================================
  const tabBtns = document.querySelectorAll('.tab-btn');
  const programCards = document.querySelectorAll('.program-card');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');
      programCards.forEach(card => {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.style.display = 'flex';
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.transition = 'opacity 0.3s ease';
            card.style.opacity = '1';
          }, 40);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // =============================================
  // 4. STATEMENT READER MODAL
  // =============================================
  const modalOverlay = document.getElementById('statementModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMeta = document.getElementById('modalMeta');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');

  const statements = {
    statement1: {
      title: "COP Central Committee Resolution on Inflation, Utility Tariffs, and IMF Debt Trap",
      date: "November 20, 2026",
      tag: "Central Communique",
      body: `
        <p><strong>Comrades, Working People of Pakistan:</strong></p>
        <p>The Central Committee of the Communists of Pakistan (COP) notes with profound outrage the unabated attacks on the living standards of the working class and peasant masses through escalating electricity, gas, and food prices driven by conditionalities dictated by imperialist financial institutions.</p>
        <p>While the ruling capitalist-feudal nexus enjoys lavish state privileges, tax waivers, and luxury perks, millions of working families across Pakistan are being driven into malnutrition, unemployment, and debt slavery.</p>
        <h4 style="margin: 1.2rem 0 0.5rem; color:#f87171;">Our Immediate Demands:</h4>
        <ul style="margin-left: 1.5rem; margin-bottom: 1rem; line-height: 1.7;">
          <li>Immediate freezing and reduction of all household electricity and gas rates for working-class families.</li>
          <li>Universal living minimum wage benchmarked directly to realistic cost-of-living indices (Rs. 60,000 minimum).</li>
          <li>Moratorium on all foreign debt repayments and public audit into illegitimate debt accrued by the ruling elite.</li>
          <li>Re-nationalization of power generation and distribution under democratic workers' supervision.</li>
        </ul>
        <p>We call upon all trade unions, student collectives, and peasant action committees to mobilize on the streets and in workplaces!</p>
      `
    },
    statement2: {
      title: "Solidarity Declaration with the Peasant Movement & Haris in Sindh and Punjab",
      date: "November 18, 2026",
      tag: "Agrarian Front",
      body: `
        <p>The Communists of Pakistan (COP) reiterate unconditional solidarity with the haris of Sindh and tenant farmers of Punjab struggling against feudal dispossession and corporate farming initiatives.</p>
        <p>Pakistan's food sovereignty cannot be realized under the domination of absentee landlords and multinational agribusiness cartels. Land belongs to those who till it!</p>
        <h4 style="margin: 1.2rem 0 0.5rem; color:#f87171;">Core Agrarian Demands:</h4>
        <ul style="margin-left: 1.5rem; margin-bottom: 1rem; line-height: 1.7;">
          <li>Abolition of all feudal land holdings exceeding 25 acres of irrigated land.</li>
          <li>Permanent land titles and ownership certificates for peasant farmers and tenants.</li>
          <li>State-subsidized seed, fertilizer, and solar tube wells managed through agricultural cooperatives.</li>
          <li>Total abolition and strict criminalization of bonded agricultural debt labor.</li>
        </ul>
      `
    },
    statement3: {
      title: "Call for Restoration of Student Unions Across All Higher Education Institutions",
      date: "November 14, 2026",
      tag: "Youth & Students",
      body: `
        <p>Four decades of unjust bans on student unions have depoliticized our youth and commercialized education into a profit-making enterprise. The COP Red Student Federation demands immediate nationwide student union elections!</p>
        <p>Education is a fundamental human right, not a commodity for the rich.</p>
        <ul style="margin-left: 1.5rem; margin-bottom: 1rem; line-height: 1.7;">
          <li>Repeal of all statutes banning student political organization and assembly.</li>
          <li>Rollback of exorbitant university fee hikes across public universities.</li>
          <li>Safe hostels, transport subsidies, and sexual harassment inquiry committees with elected student representation.</li>
        </ul>
      `
    }
  };

  document.querySelectorAll('.open-statement-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-statement-id');
      const data = statements[id];
      if (data && modalOverlay) {
        modalTitle.textContent = data.title;
        modalMeta.innerHTML = `<span class="article-tag">${data.tag}</span> • <span>${data.date}</span>`;
        modalBody.innerHTML = data.body;
        modalOverlay.style.display = 'flex';
      }
    });
  });

  if (modalClose && modalOverlay) {
    modalClose.addEventListener('click', () => { modalOverlay.style.display = 'none'; });
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) modalOverlay.style.display = 'none';
    });
  }

  // =============================================
  // 5. TOAST NOTIFICATION SYSTEM
  // =============================================
  const toastMsg = document.getElementById('toastMsg');
  const toastText = document.getElementById('toastText');

  function showToast(text, duration = 4000) {
    if (!toastMsg) return;
    toastText.textContent = text;
    toastMsg.style.display = 'flex';
    setTimeout(() => { toastMsg.style.display = 'none'; }, duration);
  }
  window.showAppToast = showToast;

  // =============================================
  // 6. REGISTRATION PANEL TABS
  // =============================================
  const regTabs = document.querySelectorAll('.reg-tab');
  const regPanels = document.querySelectorAll('.reg-panel');

  regTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      regTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const targetId = tab.getAttribute('data-panel');
      regPanels.forEach(p => {
        p.style.display = p.id === targetId ? 'block' : 'none';
        if (p.id === targetId) p.classList.add('active');
        else p.classList.remove('active');
      });
      // If opening roster, refresh it
      if (targetId === 'rosterPanel') refreshRoster();
    });
  });

  // =============================================
  // 7. PHOTO UPLOAD & CARD PREVIEW SYNC
  // =============================================
  const photoUploadBox = document.getElementById('photoUploadBox');
  const photoInput = document.getElementById('photoInput');
  const photoPreview = document.getElementById('photoPreview');
  const liveCardPhotoImg = document.getElementById('liveCardPhotoImg');
  let uploadedPhotoBase64 = null;

  if (photoUploadBox && photoInput) {
    photoUploadBox.addEventListener('click', () => photoInput.click());

    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file (JPG, PNG, WebP).');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast('Image too large. Maximum size is 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = function (ev) {
        uploadedPhotoBase64 = ev.target.result;
        photoPreview.innerHTML = `<img src="${uploadedPhotoBase64}" alt="Your Photo" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`;
        if (liveCardPhotoImg) {
          liveCardPhotoImg.src = uploadedPhotoBase64;
        }
        showToast('Comrade photo attached!', 2200);
      };
      reader.readAsDataURL(file);
    });
  }

  // =============================================
  // 8. INPUT FORMATTERS (Pakistani Phone & CNIC)
  // =============================================
  const phoneInput = document.getElementById('phone');
  const cnicInput = document.getElementById('cnic');

  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/[^0-9+]/g, '');
      if (v.startsWith('03') && v.length > 4 && !v.includes('-')) {
        v = v.slice(0, 4) + '-' + v.slice(4, 11);
      } else if (v.startsWith('+923') && v.length > 6 && !v.includes('-')) {
        v = v.slice(0, 6) + '-' + v.slice(6, 13);
      }
      e.target.value = v;
      const phoneErr = document.getElementById('phoneErr');
      if (phoneErr) phoneErr.textContent = '';
      phoneInput.classList.remove('input-error');
    });
  }

  if (cnicInput) {
    cnicInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/[^0-9]/g, '');
      if (v.length > 5 && v.length <= 12) {
        v = v.slice(0, 5) + '-' + v.slice(5);
      } else if (v.length > 12) {
        v = v.slice(0, 5) + '-' + v.slice(5, 12) + '-' + v.slice(12, 13);
      }
      e.target.value = v;
    });
  }

  // =============================================
  // 9. LIVE COMRADE CARD PREVIEW (Real-time sync)
  // =============================================
  const fullNameInput = document.getElementById('fullName');
  const targetWingInput = document.getElementById('targetWing');
  const cityInput = document.getElementById('city');
  const provinceInput = document.getElementById('province');

  const liveCardName = document.getElementById('liveCardName');
  const liveCardWing = document.getElementById('liveCardWing');
  const liveCardChapter = document.getElementById('liveCardChapter');
  const liveCardId = document.getElementById('liveCardId');
  const liveCardDate = document.getElementById('liveCardDate');
  const liveCardStamp = document.getElementById('liveCardStamp');
  const liveCardPill = document.getElementById('liveCardPill');

  function updateLiveCard() {
    if (liveCardName && fullNameInput) {
      const nameVal = fullNameInput.value.trim();
      liveCardName.textContent = nameVal ? `Comrade ${nameVal}` : 'Comrade (Your Name)';
    }

    if (liveCardWing && targetWingInput) {
      liveCardWing.textContent = targetWingInput.value || 'All Pakistan Mazdoor Council';
    }

    if (liveCardChapter) {
      const cityVal = cityInput ? cityInput.value.trim() : '';
      const provVal = provinceInput ? provinceInput.value : '';
      if (cityVal && provVal) liveCardChapter.textContent = `${cityVal}, ${provVal}`;
      else if (provVal) liveCardChapter.textContent = `${provVal} Chapter`;
      else if (cityVal) liveCardChapter.textContent = `${cityVal} Unit`;
      else liveCardChapter.textContent = 'Central Liaison, Pakistan';
    }

    if (liveCardId && fullNameInput && fullNameInput.value.trim()) {
      const hash = Math.abs(fullNameInput.value.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)) % 899999 + 100000;
      liveCardId.textContent = `ID: COP-PK-2026-${hash}`;
    } else if (liveCardId) {
      liveCardId.textContent = 'ID: COP-PK-2026-PENDING';
    }

    if (liveCardDate) {
      const now = new Date();
      const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      liveCardDate.textContent = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    }
  }

  if (fullNameInput) {
    fullNameInput.addEventListener('input', () => {
      updateLiveCard();
      const err = document.getElementById('fullNameErr');
      if (err) err.textContent = '';
      fullNameInput.classList.remove('input-error');
    });
  }
  if (targetWingInput) targetWingInput.addEventListener('change', updateLiveCard);
  if (cityInput) {
    cityInput.addEventListener('input', () => {
      updateLiveCard();
      const err = document.getElementById('cityErr');
      if (err) err.textContent = '';
      cityInput.classList.remove('input-error');
    });
  }
  if (provinceInput) {
    provinceInput.addEventListener('change', () => {
      updateLiveCard();
      const err = document.getElementById('provinceErr');
      if (err) err.textContent = '';
      provinceInput.classList.remove('input-error');
    });
  }

  // =============================================
  // 10. REGISTRATION FORM — REAL VALIDATION & LEDGER
  // =============================================
  const joinForm = document.getElementById('joinPartyForm');
  const cardActions = document.getElementById('cardActions');
  let activeComrade = null;

  function validateField(inputEl, errorEl, validator) {
    const val = inputEl ? inputEl.value.trim() : '';
    const result = validator(val);
    if (!result.valid) {
      if (inputEl) inputEl.classList.add('input-error');
      if (errorEl) errorEl.textContent = result.msg;
      return false;
    }
    if (inputEl) inputEl.classList.remove('input-error');
    if (errorEl) errorEl.textContent = '';
    return true;
  }

  function validatePhone(val) {
    const digits = val.replace(/[^0-9]/g, '');
    if (!digits || digits.length < 7) return { valid: false, msg: 'Enter a valid Pakistan phone number (at least 7 digits)' };
    if (digits.length > 15) return { valid: false, msg: 'Phone number too long' };
    return { valid: true };
  }

  function validateName(val) {
    if (!val || val.length < 3) return { valid: false, msg: 'Comrade name must be at least 3 characters' };
    if (val.length > 80) return { valid: false, msg: 'Name too long' };
    return { valid: true };
  }

  function validateCity(val) {
    if (!val || val.length < 2) return { valid: false, msg: 'Enter your city or district' };
    return { valid: true };
  }

  function validateProvince(val) {
    if (!val) return { valid: false, msg: 'Select your province or territory' };
    return { valid: true };
  }

  if (joinForm) {
    joinForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Run all validations
      const nameOk = validateField(fullNameInput, document.getElementById('fullNameErr'), validateName);
      const phoneOk = validateField(phoneInput, document.getElementById('phoneErr'), validatePhone);
      const cityOk = validateField(cityInput, document.getElementById('cityErr'), validateCity);
      const provOk = validateField(provinceInput, document.getElementById('provinceErr'), validateProvince);

      if (!nameOk || !phoneOk || !cityOk || !provOk) {
        showToast('Please fix the highlighted errors before submitting.');
        return;
      }

      const pledgeCheck = document.getElementById('pledgeCheck');
      if (pledgeCheck && !pledgeCheck.checked) {
        showToast('You must accept the solidarity pledge to enlist.');
        return;
      }

      // Collect form data
      const data = {
        name: fullNameInput.value.trim(),
        phone: phoneInput.value.trim(),
        email: (document.getElementById('email') || {}).value || '',
        cnic: (document.getElementById('cnic') || {}).value || '',
        city: cityInput.value.trim(),
        province: provinceInput.value,
        wing: targetWingInput.value,
        notes: (document.getElementById('notes') || {}).value || '',
        photo: uploadedPhotoBase64
      };

      // Register via PartyLedger
      const result = window.PartyLedger.register(data);
      activeComrade = result.comrade;

      if (!result.isNew) {
        showToast(`Welcome back, ${result.comrade.name}! Existing card (${result.comrade.id}) loaded.`, 5000);
      } else {
        showToast(`Lal Salam! Comrade ${result.comrade.name} enlisted. Card: ${result.comrade.id}`, 6000);
      }

      // Update the live card to show confirmed state
      if (liveCardId) liveCardId.textContent = `ID: ${result.comrade.id}`;
      if (liveCardName) liveCardName.textContent = `Comrade ${result.comrade.name}`;
      if (liveCardWing) liveCardWing.textContent = result.comrade.wing;
      if (liveCardChapter) liveCardChapter.textContent = `${result.comrade.city}, ${result.comrade.province}`;
      if (liveCardPhotoImg && result.comrade.photo) {
        liveCardPhotoImg.src = result.comrade.photo;
      }
      if (liveCardStamp) {
        liveCardStamp.textContent = 'VERIFIED';
        liveCardStamp.style.borderColor = '#22c55e';
        liveCardStamp.style.color = '#22c55e';
      }
      if (liveCardPill) {
        liveCardPill.textContent = result.isNew ? 'ACTIVE PROVISIONAL CADRE' : result.comrade.status.toUpperCase();
        liveCardPill.style.background = '#22c55e';
      }

      // Show card action buttons
      if (cardActions) cardActions.style.display = 'flex';

      // Show confirmation below form
      const regConfirm = document.getElementById('regConfirmation');
      if (regConfirm) {
        regConfirm.style.display = 'block';
        regConfirm.innerHTML = `
          <div style="text-align: center; padding: 2.5rem 1.5rem;">
            <div style="width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #dc2626, #991b1b); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin: 0 auto 1.4rem; box-shadow: 0 0 25px rgba(220, 38, 38, 0.5);">✓</div>
            <h3 style="font-size: 1.9rem; margin-bottom: 0.6rem; color: #ffffff; font-weight: 800;">Lal Salam, Comrade ${result.comrade.name}!</h3>
            <p style="font-size: 1.05rem; color: #cbd5e1; max-width: 620px; margin: 0 auto 1.4rem; line-height: 1.6;">
              ${result.isNew ? 'Your application has been recorded in the central cadre register.' : 'Your existing registration has been loaded.'}
              The provincial bureau for <strong>${result.comrade.province} (${result.comrade.city})</strong> has been notified for the <strong>${result.comrade.wing}</strong>.
            </p>
            <div style="display: inline-block; background: rgba(0,0,0,0.5); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 8px; padding: 1rem 2rem; margin-bottom: 1.5rem;">
              <span style="color: #94a3b8; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Membership Card ID</span><br>
              <span style="color: #fbbf24; font-size: 1.5rem; font-weight: 800; font-family: monospace;">${result.comrade.id}</span><br>
              <span style="color: #94a3b8; font-size: 0.72rem;">Security Hash: ${result.comrade.hash}</span>
            </div>
            <div style="display: flex; gap: 0.8rem; justify-content: center; flex-wrap: wrap; margin-top: 1rem;">
              <button class="btn btn-primary btn-sm" onclick="window.downloadComradeCard('${result.comrade.id}')">📥 Download Card PNG</button>
              <button class="btn btn-secondary btn-sm" onclick="window.print()">🖨️ Print Membership Slip</button>
              <a href="https://x.com/COPOFPK" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">Connect on 𝕏 @COPOFPK</a>
            </div>
          </div>
        `;
        regConfirm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  // =============================================
  // 11. CARD ACTION BUTTONS
  // =============================================
  const downloadCardBtn = document.getElementById('downloadCardBtn');
  const printCardBtn = document.getElementById('printCardBtn');
  const newRegBtn = document.getElementById('newRegBtn');

  if (downloadCardBtn) {
    downloadCardBtn.addEventListener('click', () => {
      const comrade = activeComrade || (window.PartyLedger ? window.PartyLedger.getActive() : null);
      if (!comrade) {
        showToast('No comrade registered yet. Submit the form first.');
        return;
      }
      showToast('Generating high-resolution card image...', 2000);
      window.CardCanvasExporter.download(comrade);
    });
  }

  if (printCardBtn) {
    printCardBtn.addEventListener('click', () => window.print());
  }

  if (newRegBtn) {
    newRegBtn.addEventListener('click', () => {
      if (joinForm) joinForm.reset();
      uploadedPhotoBase64 = null;
      if (photoPreview) {
        photoPreview.innerHTML = '<span class="photo-placeholder">📷</span><span class="photo-placeholder-text">Click to Upload</span>';
      }
      if (liveCardPhotoImg) {
        liveCardPhotoImg.src = 'assets/images/cop_logo.jpg';
      }
      if (liveCardStamp) {
        liveCardStamp.textContent = 'PENDING';
        liveCardStamp.style.borderColor = '#ef4444';
        liveCardStamp.style.color = '#ef4444';
      }
      if (liveCardPill) {
        liveCardPill.textContent = 'PROVISIONAL PASS';
        liveCardPill.style.background = '';
      }
      if (cardActions) cardActions.style.display = 'none';
      const regConfirm = document.getElementById('regConfirmation');
      if (regConfirm) regConfirm.style.display = 'none';
      updateLiveCard();
      joinForm.scrollIntoView({ behavior: 'smooth' });
      showToast('Form cleared. Ready for new comrade enlistment.');
    });
  }

  // =============================================
  // 12. VERIFICATION LOOKUP PANEL & QUICK CHIPS
  // =============================================
  const verifyInput = document.getElementById('verifyInput');
  const verifyLookupBtn = document.getElementById('verifyLookupBtn');
  const verifyResult = document.getElementById('verifyResult');

  if (verifyLookupBtn) {
    verifyLookupBtn.addEventListener('click', performVerification);
  }
  if (verifyInput) {
    verifyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performVerification();
    });
  }

  // Quick-test sample chips
  document.querySelectorAll('.verify-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const id = chip.getAttribute('data-id');
      if (verifyInput && id) {
        verifyInput.value = id;
        performVerification();
      }
    });
  });

  function performVerification() {
    const query = verifyInput ? verifyInput.value.trim() : '';
    if (!query) {
      showToast('Enter a Card ID, phone number, or name to search.');
      return;
    }

    const comrade = window.PartyLedger.lookup(query);
    if (!verifyResult) return;

    verifyResult.style.display = 'block';

    if (comrade) {
      const joinDate = new Date(comrade.joinedAt);
      const dateStr = joinDate.toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });
      const photoSrc = comrade.photo || 'assets/images/cop_logo.jpg';

      verifyResult.innerHTML = `
        <div class="verify-found">
          <div class="verify-status-badge verify-status-active">✓ VERIFIED &bull; OFFICIAL COP CADRE</div>
          <div class="verify-card-row">
            <div class="comrade-id-card" style="max-width: 460px;">
              <div class="card-chip-header">
                <div class="card-party-title">COMMUNISTS OF PAKISTAN</div>
                <div class="card-provisional-pill" style="background:#22c55e;">${(comrade.status || 'Active Cadre').toUpperCase()}</div>
              </div>
              <div class="card-seal-row">
                <div class="card-photo-avatar-wrap">
                  <img src="${photoSrc}" alt="Cadre Photo">
                </div>
                <div class="card-header-meta">
                  <div class="card-org-name">COMMUNISTS OF PAKISTAN</div>
                  <div class="card-org-sub">Vanguard of the Working Class &bull; @COPOFPK</div>
                  <div class="card-id-serial">${comrade.id}</div>
                </div>
              </div>
              <div class="card-body-meta">
                <div class="card-data-field">
                  <span class="card-data-lbl">MEMBER NAME</span>
                  <span class="card-data-val">Comrade ${comrade.name}</span>
                </div>
                <div class="card-data-field">
                  <span class="card-data-lbl">ASSIGNED WING</span>
                  <span class="card-data-val">${comrade.wing}</span>
                </div>
                <div class="card-data-grid">
                  <div class="card-data-field">
                    <span class="card-data-lbl">CHAPTER</span>
                    <span class="card-data-val">${comrade.city}, ${comrade.province}</span>
                  </div>
                  <div class="card-data-field">
                    <span class="card-data-lbl">REGISTERED</span>
                    <span class="card-data-val">${dateStr}</span>
                  </div>
                </div>
              </div>
              <div class="card-barcode-strip">
                <div class="sim-barcode"></div>
                <div class="card-stamp" style="border-color: #22c55e; color: #22c55e;">VERIFIED</div>
              </div>
            </div>
            <div class="verify-details">
              <h4>Verification Credentials</h4>
              <div class="verify-detail-row"><span>Card ID:</span><strong style="color: #fbbf24; font-family: monospace;">${comrade.id}</strong></div>
              <div class="verify-detail-row"><span>Security Hash:</span><strong style="font-family: monospace; color: #94a3b8;">${comrade.hash || 'N/A'}</strong></div>
              <div class="verify-detail-row"><span>Province:</span><strong>${comrade.province}</strong></div>
              <div class="verify-detail-row"><span>Role:</span><strong>${comrade.role || 'Provisional Cadre'}</strong></div>
              <div class="verify-detail-row"><span>Validity:</span><strong>${comrade.expiryDate || 'NOV 2028'}</strong></div>
              ${comrade.cnic ? `<div class="verify-detail-row"><span>CNIC:</span><strong>${comrade.cnic}</strong></div>` : ''}
              ${comrade.notes ? `<div class="verify-detail-row"><span>Notes:</span><strong>${comrade.notes}</strong></div>` : ''}
              <div style="display: flex; gap: 0.6rem; margin-top: 1.2rem; flex-wrap: wrap;">
                <button class="btn btn-primary btn-sm" onclick="window.downloadComradeCard('${comrade.id}')">📥 Download This Card</button>
                <button class="btn btn-secondary btn-sm" onclick="window.print()">🖨️ Print Slip</button>
              </div>
            </div>
          </div>
        </div>
      `;
      activeComrade = comrade;
    } else {
      verifyResult.innerHTML = `
        <div class="verify-not-found">
          <div class="verify-status-badge verify-status-fail">✗ NOT FOUND IN CENTRAL LEDGER</div>
          <p style="color: #cbd5e1; margin-top: 1rem; font-size: 1rem;">No registered cadre found matching "<strong style="color: #f87171;">${query}</strong>".</p>
          <p style="color: #64748b; font-size: 0.88rem; margin-top: 0.5rem;">
            Please ensure you typed the full Serial (e.g. <code>COP-PK-2026-100001</code>) or the registered Pakistani phone number.
          </p>
          <button class="btn btn-secondary btn-sm" style="margin-top: 1rem;" onclick="document.querySelector('[data-panel=\\'registerPanel\\']').click()">➕ Enlist as New Cadre</button>
        </div>
      `;
    }
  }

  // =============================================
  // 13. CADRE ROSTER TABLE & EXPORTS
  // =============================================
  const rosterBody = document.getElementById('rosterBody');
  const rosterCount = document.getElementById('rosterCount');
  const rosterStats = document.getElementById('rosterStats');
  const rosterSearch = document.getElementById('rosterSearch');
  const rosterProvinceFilter = document.getElementById('rosterProvinceFilter');
  const exportCSVBtn = document.getElementById('exportCSVBtn');
  const exportJSONBtn = document.getElementById('exportJSONBtn');

  function refreshRoster() {
    if (!rosterBody) return;

    const all = window.PartyLedger.getAll();
    const searchVal = rosterSearch ? rosterSearch.value.trim().toLowerCase() : '';
    const provFilter = rosterProvinceFilter ? rosterProvinceFilter.value : '';

    // Filter
    const filtered = all.filter(c => {
      if (provFilter && c.province !== provFilter) return false;
      if (searchVal) {
        const haystack = `${c.name} ${c.city} ${c.wing} ${c.id} ${c.province}`.toLowerCase();
        return haystack.includes(searchVal);
      }
      return true;
    });

    // Stats
    if (rosterStats) {
      const provinces = {};
      all.forEach(c => { provinces[c.province] = (provinces[c.province] || 0) + 1; });
      const statCards = Object.entries(provinces).map(([prov, count]) =>
        `<div class="stat-chip"><strong>${count}</strong><span>${prov}</span></div>`
      ).join('');
      rosterStats.innerHTML = `
        <div class="stat-chip stat-chip-total"><strong>${all.length}</strong><span>Total Cadres</span></div>
        ${statCards}
      `;
    }

    // Render table
    rosterBody.innerHTML = '';
    filtered.forEach(c => {
      const joinDate = new Date(c.joinedAt);
      const dateStr = joinDate.toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' });
      const isLocal = !c.role || c.role.includes('Provisional');

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><code style="color: #fbbf24; font-size: 0.78rem;">${c.id}</code></td>
        <td><strong>${c.name}</strong></td>
        <td>${c.city || '-'}</td>
        <td>${c.province || '-'}</td>
        <td style="font-size: 0.78rem;">${c.wing || '-'}</td>
        <td><span class="roster-status-pill ${c.status.includes('Active') ? 'status-active' : 'status-honorary'}">${c.status}</span></td>
        <td style="font-size: 0.78rem;">${dateStr}</td>
        <td>
          <button class="btn-icon roster-view-btn" title="Verify this comrade" data-id="${c.id}">🔍</button>
          <button class="btn-icon roster-dl-btn" title="Download HD Card" data-id="${c.id}">📥</button>
          ${isLocal ? `<button class="btn-icon roster-delete-btn" title="Remove from local ledger" data-id="${c.id}">🗑️</button>` : ''}
        </td>
      `;
      rosterBody.appendChild(row);
    });

    // Count
    if (rosterCount) {
      rosterCount.textContent = `Showing ${filtered.length} of ${all.length} registered cadres`;
    }

    // Bind action buttons
    rosterBody.querySelectorAll('.roster-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const verifyTab = document.querySelector('[data-panel="verifyPanel"]');
        if (verifyTab) verifyTab.click();
        if (verifyInput) verifyInput.value = id;
        performVerification();
      });
    });

    rosterBody.querySelectorAll('.roster-dl-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        window.downloadComradeCard(id);
      });
    });

    rosterBody.querySelectorAll('.roster-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`Remove cadre ${id} from your local ledger?`)) {
          window.PartyLedger.delete(id);
          refreshRoster();
          showToast(`Cadre ${id} removed.`);
        }
      });
    });
  }

  if (rosterSearch) rosterSearch.addEventListener('input', refreshRoster);
  if (rosterProvinceFilter) rosterProvinceFilter.addEventListener('change', refreshRoster);

  if (exportCSVBtn) {
    exportCSVBtn.addEventListener('click', () => {
      window.PartyLedger.exportCSV();
      showToast('Cadre roster exported as CSV.');
    });
  }

  if (exportJSONBtn) {
    exportJSONBtn.addEventListener('click', () => {
      window.PartyLedger.exportJSON();
      showToast('Cadre roster exported as JSON.');
    });
  }

  // =============================================
  // 14. RED LIBRARY DOWNLOAD BUTTONS
  // =============================================
  document.querySelectorAll('.lib-download-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const docName = btn.getAttribute('data-doc');
      showToast(`Initiating download for: "${docName}" (Study Circle Syllabus)`, 3500);
      const content = `# Communists of Pakistan (COP)\n## ${docName}\n\nStudy Syllabus & Educational Reader for Grassroots Cadres.\nWorkers, Peasants, Students, and Oppressed Peoples of Pakistan, Unite!\nOfficial Handle: https://x.com/COPOFPK\n\nLal Salam!`;
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_cop.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });

  // =============================================
  // 15. LANGUAGE TOGGLE (English / Urdu)
  // =============================================
  const langToggleBtn = document.getElementById('langToggleBtn');
  const langLabel = document.getElementById('langLabel');
  let currentLang = 'en';

  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'ur' : 'en';
      if (langLabel) langLabel.textContent = currentLang === 'en' ? 'اردو' : 'English';

      document.querySelectorAll('[data-en][data-ur]').forEach(el => {
        el.textContent = el.getAttribute(`data-${currentLang}`);
      });

      document.body.classList.toggle('lang-urdu', currentLang === 'ur');
      showToast(currentLang === 'ur' ? 'زبان اردو میں تبدیل ہو گئی' : 'Language switched to English', 2500);
    });
  }

  // =============================================
  // 16. ON-LOAD: RESTORE ACTIVE CADRE IF EXISTS
  // =============================================
  const savedCadre = window.PartyLedger ? window.PartyLedger.getActive() : null;
  if (savedCadre) {
    activeComrade = savedCadre;
    if (liveCardId) liveCardId.textContent = `ID: ${savedCadre.id}`;
    if (liveCardName) liveCardName.textContent = `Comrade ${savedCadre.name}`;
    if (liveCardWing) liveCardWing.textContent = savedCadre.wing;
    if (liveCardChapter) liveCardChapter.textContent = `${savedCadre.city}, ${savedCadre.province}`;
    if (liveCardPhotoImg && savedCadre.photo) {
      liveCardPhotoImg.src = savedCadre.photo;
    }
    if (liveCardStamp) {
      liveCardStamp.textContent = 'VERIFIED';
      liveCardStamp.style.borderColor = '#22c55e';
      liveCardStamp.style.color = '#22c55e';
    }
    if (liveCardPill) {
      liveCardPill.textContent = (savedCadre.status || 'Active Cadre').toUpperCase();
      liveCardPill.style.background = '#22c55e';
    }
    if (cardActions) cardActions.style.display = 'flex';
  }

});
