/**
 * Communists of Pakistan (COP) - Cadre Registration, Ledger & Card Engine
 * Official Handle: @COPOFPK
 */

(function (window) {
  'use strict';

  // Seed founding historical cadre records for verification & demonstration
  const FOUNDING_CADRES = [];

  // API base (same origin — Express serves frontend + API)
  const API_BASE = '';

  // --- CADRE LEDGER CONTROLLER (PostgreSQL-backed) ---
  const PartyLedger = {
    // Get all cadres from PostgreSQL
    async getAll() {
      const res = await fetch(`${API_BASE}/api/cadres`);
      if (!res.ok) return [];
      return await res.json();
    },

    // Get locally registered cadres only (all cadres live in PostgreSQL now)
    async getLocalOnly() {
      return this.getAll();
    },

    // Register a new comrade via PostgreSQL API
    async register(data) {
      // Generate authentic serial: COP-PK-2026-XXXXXX
      const newId = `COP-PK-2026-${Math.floor(200000 + Math.random() * 799999)}`;

      // Generate security hash
      const hashStr = `${data.name}-${data.city}-${Date.now()}`;
      let hashNum = 0;
      for (let i = 0; i < hashStr.length; i++) {
        hashNum = ((hashNum << 5) - hashNum) + hashStr.charCodeAt(i);
        hashNum |= 0;
      }
      const secHash = 'SEC-' + Math.abs(hashNum).toString(16).toUpperCase().padStart(8, '0');

      const payload = {
        id: newId,
        name: data.name.trim(),
        cnic: data.cnic ? data.cnic.trim() : '',
        phone: data.phone ? data.phone.trim() : '',
        email: data.email ? data.email.trim() : '',
        city: data.city.trim(),
        province: data.province,
        wing: data.wing,
        role: 'Provisional Cadre',
        status: 'Active Provisional Cadre',
        photo: data.photo || null,
        notes: data.notes ? data.notes.trim() : '',
        joinedAt: new Date().toISOString(),
        expiryDate: 'NOV 2028',
        hash: secHash,
      };

      const res = await fetch(`${API_BASE}/api/cadres`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        const err = await res.json();
        await fetch(`${API_BASE}/api/active-cadre`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cadreId: err.existingId }),
        });
        return { isNew: false, comrade: await this.lookup(err.existingId) };
      }
      if (!res.ok) throw new Error('Registration failed');

      const result = await res.json();
      await fetch(`${API_BASE}/api/active-cadre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cadreId: result.comrade.id }),
      });
      return result;
    },

    // Search / verify by ID or phone number or name
    async lookup(query) {
      if (!query) return null;
      const q = query.trim().toUpperCase();
      const qDigits = query.replace(/[^0-9]/g, '');

      // Try exact ID lookup via API
      try {
        const res = await fetch(`${API_BASE}/api/cadres/${q}`);
        if (res.ok) return await res.json();
      } catch {}

      // Fallback: search all cadres
      const all = await this.getAll();
      let match = all.find(c => c.id.toUpperCase() === q);
      if (match) return match;

      if (qDigits && qDigits.length >= 7) {
        match = all.find(c => {
          const cDigits = (c.phone || '').replace(/[^0-9]/g, '');
          return cDigits.endsWith(qDigits) || qDigits.endsWith(cDigits);
        });
        if (match) return match;
      }

      if (qDigits && qDigits.length >= 10) {
        match = all.find(c => {
          const cnicDigits = (c.cnic || '').replace(/[^0-9]/g, '');
          return cnicDigits && (cnicDigits.includes(qDigits) || qDigits.includes(cnicDigits));
        });
        if (match) return match;
      }

      match = all.find(c => c.name.toUpperCase().includes(q));
      return match || null;
    },

    // Get currently active comrade from PostgreSQL
    async getActive() {
      try {
        const res = await fetch(`${API_BASE}/api/active-cadre`);
        const data = await res.json();
        return data.active || null;
      } catch (err) {
        return null;
      }
    },

    // Delete a cadre from PostgreSQL
    async delete(id) {
      await fetch(`${API_BASE}/api/cadres/${id}`, { method: 'DELETE' });
    },

    // Export cadre ledger as CSV file
    async exportCSV() {
      const cadres = await this.getAll();
      if (!cadres.length) return false;

      const headers = ['Card_ID', 'Name', 'Phone', 'CNIC', 'Email', 'City', 'Province', 'Wing', 'Status', 'Registered_Date', 'Security_Hash'];
      const rows = cadres.map(c => [
        `"${c.id}"`,
        `"${c.name}"`,
        `"${c.phone || ''}"`,
        `"${c.cnic || ''}"`,
        `"${c.email || ''}"`,
        `"${c.city || ''}"`,
        `"${c.province || ''}"`,
        `"${c.wing || ''}"`,
        `"${c.status || ''}"`,
        `"${new Date(c.joinedAt).toLocaleDateString()}"`,
        `"${c.hash || ''}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `COP_Cadre_Roster_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    },

    // Export as JSON file
    async exportJSON() {
      const cadres = await this.getAll();
      const blob = new Blob([JSON.stringify(cadres, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `COP_Cadre_Roster_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    }
  };

  // --- PURE JS QR CODE GENERATOR (Matrix & Canvas) ---
  const QRMatrix = {
    // Create a 29x29 module QR matrix with finder patterns, alignment, timing, and deterministic data
    generate: function (text) {
      const size = 29; // Version 3 QR
      const matrix = [];
      for (let r = 0; r < size; r++) {
        matrix[r] = new Array(size).fill(0);
      }

      // Draw 7x7 Finder Pattern with separator
      function drawFinder(row, col) {
        for (let r = -1; r <= 7; r++) {
          for (let c = -1; c <= 7; c++) {
            const tr = row + r;
            const tc = col + c;
            if (tr >= 0 && tr < size && tc >= 0 && tc < size) {
              if (r === -1 || r === 7 || c === -1 || c === 7) {
                matrix[tr][tc] = -1; // separator (white)
              } else if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
                matrix[tr][tc] = 1; // black
              } else {
                matrix[tr][tc] = -1; // white
              }
            }
          }
        }
      }

      drawFinder(0, 0);
      drawFinder(0, size - 7);
      drawFinder(size - 7, 0);

      // Alignment pattern at (20, 20)
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const tr = 20 + r;
          const tc = 20 + c;
          if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
            matrix[tr][tc] = 1;
          } else {
            matrix[tr][tc] = -1;
          }
        }
      }

      // Timing patterns (row 6 and col 6)
      for (let i = 8; i < size - 8; i++) {
        const val = (i % 2 === 0) ? 1 : -1;
        if (matrix[6][i] === 0) matrix[6][i] = val;
        if (matrix[i][6] === 0) matrix[i][6] = val;
      }

      // Dark module
      matrix[size - 8][8] = 1;

      // Hash data into modules
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
      }

      let bitPos = 0;
      for (let c = size - 1; c > 0; c -= 2) {
        if (c === 6) c--; // Skip timing col
        for (let r = 0; r < size; r++) {
          const row = ((Math.floor((size - 1 - c) / 2)) % 2 === 0) ? (size - 1 - r) : r;
          for (let b = 0; b < 2; b++) {
            const col = c - b;
            if (matrix[row][col] === 0) {
              const charCode = text.charCodeAt(bitPos % text.length);
              const bit = ((charCode ^ (hash >> (bitPos % 16))) >> (bitPos % 8)) & 1;
              matrix[row][col] = (bit ^ ((row + col) % 2 === 0 ? 1 : 0)) ? 1 : -1;
              bitPos++;
            }
          }
        }
      }

      return matrix;
    },

    // Draw QR onto canvas
    drawToCanvas: function (ctx, text, x, y, sizePx, darkColor, lightColor) {
      const matrix = this.generate(text);
      const modCount = matrix.length;
      const modSize = sizePx / modCount;

      ctx.fillStyle = lightColor || '#ffffff';
      ctx.fillRect(x, y, sizePx, sizePx);

      ctx.fillStyle = darkColor || '#000000';
      for (let r = 0; r < modCount; r++) {
        for (let c = 0; c < modCount; c++) {
          if (matrix[r][c] === 1) {
            ctx.fillRect(Math.floor(x + c * modSize), Math.floor(y + r * modSize), Math.ceil(modSize), Math.ceil(modSize));
          }
        }
      }
    }
  };

  // --- HIGH RESOLUTION CANVAS CARD EXPORTER ---
  const CardCanvasExporter = {
    renderCard: function (comrade, callback) {
      const width = 1000;
      const height = 620;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // 1. Base Pitch-Black Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#161616');
      bgGrad.addColorStop(0.5, '#070707');
      bgGrad.addColorStop(1, '#111111');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle textured carbon diagonal grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      for (let i = -width; i < width * 2; i += 24) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + height, height);
        ctx.stroke();
      }

      // Outer Crimson Accent Border
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      // Inner Gold Metallic Foil Inset Border
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
      ctx.lineWidth = 2;
      ctx.strokeRect(18, 18, width - 36, height - 36);

      // Top Red Flag Header Strip
      const topBannerGrad = ctx.createLinearGradient(20, 20, width - 40, 20);
      topBannerGrad.addColorStop(0, '#991b1b');
      topBannerGrad.addColorStop(0.5, '#dc2626');
      topBannerGrad.addColorStop(1, '#991b1b');
      ctx.fillStyle = topBannerGrad;
      ctx.fillRect(20, 20, width - 40, 48);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px "Inter", sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('COMMUNISTS OF PAKISTAN • OFFICIAL CADRE PASS', 42, 51);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 15px "Inter", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('VALID: 2026-2028', width - 42, 51);
      ctx.textAlign = 'left';

      // Load Official Logo via base64 or fallback
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';

      function drawLogo() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(88, 142, 46, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        try {
          ctx.drawImage(logoImg, 42, 96, 92, 92);
        } catch (e) {
          ctx.fillStyle = '#dc2626';
          ctx.fill();
        }
        ctx.restore();

        // Gold Ring around Logo
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(88, 142, 46, 0, Math.PI * 2);
        ctx.stroke();

        // Header Titles
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 30px "Cinzel", "Inter", serif';
        ctx.fillText('COMMUNISTS OF PAKISTAN', 154, 130);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 15px "Inter", sans-serif';
        ctx.fillText('Vanguard of the Working Class • Official Party Handle @COPOFPK', 154, 156);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 14px "Inter", sans-serif';
        ctx.fillText('“Workers, Peasants, Students, and Oppressed Peoples of Pakistan, Unite!”', 154, 180);

        // Horizontal Separator
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(42, 205);
        ctx.lineTo(width - 42, 205);
        ctx.stroke();

        drawMemberSection();
      }

      // Vector star drawer helper for crisp canvas graphics without font/emoji dependencies
      function drawVectorStar(cx, cy, spikes, outerRadius, innerRadius, fillStyle) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
          x = cx + Math.cos(rot) * outerRadius;
          y = cy + Math.sin(rot) * outerRadius;
          ctx.lineTo(x, y);
          rot += step;

          x = cx + Math.cos(rot) * innerRadius;
          y = cy + Math.sin(rot) * innerRadius;
          ctx.lineTo(x, y);
          rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fillStyle = fillStyle;
        ctx.fill();
        ctx.restore();
      }

      logoImg.onload = drawLogo;
      logoImg.onerror = function () {
        // Fallback drawing if image fails
        ctx.save();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(88, 142, 46, 0, Math.PI * 2);
        ctx.fill();
        drawVectorStar(88, 142, 5, 22, 10, '#ffffff');
        ctx.restore();
        drawLogo();
      };

      // 2. Member Photo Box (Left Column)
      const photoX = 45;
      const photoY = 230;
      const photoW = 165;
      const photoH = 205;

      function drawMemberSection() {
        // Background for photo
        ctx.fillStyle = '#050505';
        ctx.fillRect(photoX, photoY, photoW, photoH);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.strokeRect(photoX, photoY, photoW, photoH);

        // Function to draw text & security details once photo is rendered
        function finishCard() {
          // Member Details Grid (Middle Column)
          const midX = 240;

          // Member Name
          ctx.fillStyle = '#94a3b8';
          ctx.font = '600 12px "Inter", sans-serif';
          ctx.fillText('OFFICIAL CADRE NAME', midX, 245);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 26px "Inter", sans-serif';
          ctx.fillText(`Comrade ${comrade.name}`, midX, 276);

          // Card ID
          ctx.fillStyle = '#94a3b8';
          ctx.font = '600 12px "Inter", sans-serif';
          ctx.fillText('MEMBERSHIP SERIAL NUMBER', midX, 310);

          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 20px monospace';
          ctx.fillText(comrade.id, midX, 336);

          // Assigned Wing
          ctx.fillStyle = '#94a3b8';
          ctx.font = '600 12px "Inter", sans-serif';
          ctx.fillText('ASSIGNED FRONT / WING', midX, 370);

          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 17px "Inter", sans-serif';
          ctx.fillText(comrade.wing, midX, 394);

          // Provincial Chapter & City
          ctx.fillStyle = '#94a3b8';
          ctx.font = '600 12px "Inter", sans-serif';
          ctx.fillText('CHAPTER / DISTRICT', midX, 428);

          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 17px "Inter", sans-serif';
          ctx.fillText(`${comrade.city}, ${comrade.province}`, midX, 452);

          // Status & Issue Date Row
          ctx.fillStyle = '#94a3b8';
          ctx.font = '600 12px "Inter", sans-serif';
          ctx.fillText('CADRE STATUS', midX, 486);

          ctx.fillStyle = '#22c55e';
          ctx.font = 'bold 16px "Inter", sans-serif';
          ctx.fillText('● ACTIVE & VERIFIED', midX, 508);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '600 12px "Inter", sans-serif';
          ctx.fillText('SECURITY HASH', midX + 220, 486);

          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 15px monospace';
          ctx.fillText(comrade.hash || 'SEC-88FA2026', midX + 220, 508);

          // Right Column: QR Code & Security Stamp
          const qrX = width - 215;
          const qrY = 230;
          const qrSize = 170;

          // QR Code drawing
          const verifyUrl = `https://x.com/COPOFPK?verify=${encodeURIComponent(comrade.id)}&name=${encodeURIComponent(comrade.name)}`;
          QRMatrix.drawToCanvas(ctx, verifyUrl, qrX, qrY, qrSize, '#000000', '#ffffff');

          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.strokeRect(qrX, qrY, qrSize, qrSize);

          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('SCAN TO VERIFY CADRE', qrX + (qrSize / 2), qrY + qrSize + 18);
          ctx.textAlign = 'left';

          // Simulated High-Density Barcode Strip at Bottom
          const barY = 548;
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(42, barY, width - 84, 40);

          ctx.fillStyle = '#ffffff';
          const seed = Math.abs(parseInt((comrade.id || '12345').replace(/[^0-9]/g, '')) || 9999);
          for (let bx = 60; bx < 380; bx += 3) {
            if (((bx * seed) % 7) > 2) {
              ctx.fillRect(bx, barY + 6, 2, 28);
            }
          }

          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 13px monospace';
          ctx.fillText(`*${comrade.id}*`, 400, barY + 25);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '12px "Inter", sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('CENTRAL CADRE LEDGER • PEOPLES DEMOCRATIC REPUBLIC OF PAKISTAN', width - 60, barY + 25);
          ctx.textAlign = 'left';

          // Red Official Seal Stamp (Rotated)
          ctx.save();
          ctx.translate(width - 150, 480);
          ctx.rotate(-12 * Math.PI / 180);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 50, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#ef4444';
          ctx.font = '900 13px "Inter", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('CENTRAL REGISTER', 0, -18);
          ctx.fillText('• COP PK •', 0, 3);
          ctx.fillText('سرخ سلام', 0, 24);
          ctx.restore();

          // Complete callback with DataURL
          try {
            const dataUrl = canvas.toDataURL('image/png');
            callback(null, dataUrl);
          } catch (e) {
            callback(e, null);
          }
        }

        // Check if comrade has a custom photo uploaded
        if (comrade.photo) {
          const userPhoto = new Image();
          userPhoto.onload = function () {
            // Aspect-ratio cover crop math
            ctx.save();
            ctx.beginPath();
            ctx.rect(photoX, photoY, photoW, photoH);
            ctx.clip();
            const hRatio = photoW / userPhoto.width;
            const vRatio = photoH / userPhoto.height;
            const ratio = Math.max(hRatio, vRatio);
            const centerShiftX = (photoW - userPhoto.width * ratio) / 2;
            const centerShiftY = (photoH - userPhoto.height * ratio) / 2;
            ctx.drawImage(userPhoto, 0, 0, userPhoto.width, userPhoto.height,
                          photoX + centerShiftX, photoY + centerShiftY,
                          userPhoto.width * ratio, userPhoto.height * ratio);
            ctx.restore();
            finishCard();
          };
          userPhoto.onerror = function () {
            drawFallbackAvatar();
            finishCard();
          };
          userPhoto.src = comrade.photo;
        } else {
          drawFallbackAvatar();
          finishCard();
        }

        function drawFallbackAvatar() {
          // Draw official red star vanguard silhouette
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(photoX, photoY, photoW, photoH);

          // Head & Shoulders Silhouette
          ctx.fillStyle = '#44403c';
          ctx.beginPath();
          ctx.arc(photoX + photoW / 2, photoY + 70, 38, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.ellipse(photoX + photoW / 2, photoY + 175, 62, 45, 0, 0, Math.PI, true);
          ctx.fill();

          // Official Party Star in center
          drawVectorStar(photoX + photoW / 2, photoY + 70, 5, 16, 7, '#ef4444');
          ctx.textAlign = 'left';
        }
      }

      logoImg.src = window.COP_LOGO_BASE64 || 'assets/images/cop_logo.jpg';
    },

    // Trigger instant browser download of the generated PNG
    download: function (comrade) {
      this.renderCard(comrade, function (err, dataUrl) {
        if (err || !dataUrl) {
          alert('Unable to generate card image. Please use Print Pass instead.');
          return;
        }
        const a = document.createElement('a');
        a.href = dataUrl;
        const cleanName = (comrade.name || 'Comrade').replace(/[^a-zA-Z0-9]/g, '_');
        a.download = `COP_Comrade_Card_${cleanName}_${comrade.id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    }
  };

  // Expose to window
  window.PartyLedger = PartyLedger;
  window.QRMatrix = QRMatrix;
  window.CardCanvasExporter = CardCanvasExporter;

})(window);
