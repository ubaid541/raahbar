/**
 * pdfRoadbook.js — RaahBar Tactical Rally Roadbook PDF Generator (Option B)
 *
 * Generates a high-contrast, sunlight-readable, print-ready Tactical Rally Roadbook
 * containing:
 *  1. Branded Mission Brief & Rider Profile Header
 *  2. Mountain Pass & Corridor Status Matrix (OPEN / CLOSED / CAUTION)
 *  3. Day-by-Day 4-Pillar Tactical Cards (Highways, Ordered Checkpoints & Viewpoints,
 *     Surface & Bike Handling, Fuel/Mechanic/SCOM Signal Logistics)
 *  4. Pre-Ride Gear, Permit & Emergency Contact Checklists
 */

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function downloadTacticalRoadbookPDF(itinerary) {
  if (!itinerary) return;

  const title = escapeHtml(itinerary.tripTitle || 'RaahBar Expedition Roadbook');
  const start = escapeHtml(itinerary.startPoint || 'Start');
  const end = escapeHtml(itinerary.endPoint || 'Destination');
  const totalDist = itinerary.totalDistanceKm != null ? `${itinerary.totalDistanceKm} km` : 'N/A';
  const totalDur = itinerary.totalDurationHrs != null ? `${itinerary.totalDurationHrs} hrs` : 'N/A';
  const totalDays = itinerary.totalDays || itinerary.days?.length || 1;
  const corridor = escapeHtml(itinerary.primaryCorridor || 'National Highway Corridor');
  const weather = escapeHtml(itinerary.weatherSummary || 'Standard seasonal mountain conditions');
  const bestMonths = escapeHtml(itinerary.bestMonths || 'May – October');

  const riderBike = escapeHtml(itinerary.riderProfile?.bikeType || 'Motorcycle');
  const riderExp = escapeHtml(itinerary.riderProfile?.expLevel || 'Intermediate');
  const travelMonth = escapeHtml(itinerary.riderProfile?.month || 'Seasonal');

  const passesHtml =
    Array.isArray(itinerary.passStatuses) && itinerary.passStatuses.length > 0
      ? `
      <div class="section-box">
        <div class="section-header">
          <span class="section-tag">CORRIDOR INTEL</span>
          <h2>MOUNTAIN PASS &amp; CORRIDOR STATUS (${travelMonth.toUpperCase()})</h2>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Pass / Corridor</th>
              <th>Altitude</th>
              <th>Status</th>
              <th>Condition &amp; Active Bypass Route</th>
            </tr>
          </thead>
          <tbody>
            ${itinerary.passStatuses
              .map((p) => {
                const statusUpper = String(p.status || 'OPEN').toUpperCase();
                const badgeClass =
                  statusUpper === 'CLOSED'
                    ? 'badge-closed'
                    : statusUpper === 'CAUTION'
                    ? 'badge-caution'
                    : 'badge-open';
                return `
                <tr>
                  <td class="bold">${escapeHtml(p.name)}</td>
                  <td class="mono">${p.altitudeM ? `${escapeHtml(p.altitudeM)}m` : '—'}</td>
                  <td><span class="badge ${badgeClass}">${escapeHtml(statusUpper)}</span></td>
                  <td>
                    ${escapeHtml(p.reason || '')}
                    ${
                      p.alternativeCorridor
                        ? `<div class="bypass-note"><strong>Active Route:</strong> ${escapeHtml(
                            p.alternativeCorridor
                          )}</div>`
                        : ''
                    }
                  </td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>`
      : '';

  const warningsHtml =
    Array.isArray(itinerary.warnings) && itinerary.warnings.length > 0
      ? `
      <div class="alert-box">
        <div class="alert-title">⚠ CRITICAL EXPEDITION &amp; PACING ADVISORIES</div>
        ${
          itinerary.pacingAdvisory
            ? `<p class="pacing-text"><strong>Pacing Note:</strong> ${escapeHtml(
                itinerary.pacingAdvisory
              )}</p>`
            : ''
        }
        <ul>
          ${itinerary.warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join('')}
        </ul>
      </div>`
      : itinerary.pacingAdvisory
      ? `
      <div class="alert-box">
        <div class="alert-title">ℹ EXPEDITION PACING NOTE</div>
        <p class="pacing-text">${escapeHtml(itinerary.pacingAdvisory)}</p>
      </div>`
      : '';

  const daysHtml = (itinerary.days || [])
    .map((day) => {
      const dNum = String(day.day).padStart(2, '0');
      const dDist = day.distanceKm != null ? `${day.distanceKm} km` : 'N/A';
      const dDur = day.durationHrs != null ? `${day.durationHrs} hrs` : 'N/A';
      const dAlt = day.altitudeM != null ? `${day.altitudeM}m (${day.altitudeLevel || 'MID'})` : 'N/A';
      const dCorridor = escapeHtml(day.highwayCorridor || corridor);
      const dSurface = escapeHtml(day.roadSurface || 'Paved Highway & Mountain Switchbacks');
      const dBikeNote = escapeHtml(day.bikeAdvisory || '');

      const checkpointsRows =
        Array.isArray(day.checkpoints) && day.checkpoints.length > 0
          ? day.checkpoints
              .map(
                (cp) => `
              <tr>
                <td class="mono center">${cp.kmFromStart != null ? `${escapeHtml(cp.kmFromStart)} km` : '•'}</td>
                <td><span class="cp-type">${escapeHtml((cp.type || 'stop').toUpperCase())}</span></td>
                <td class="bold">${escapeHtml(cp.name)}</td>
                <td>${escapeHtml(cp.note || '')}</td>
              </tr>`
              )
              .join('')
          : (day.highlights || [])
              .map(
                (h, idx) => `
              <tr>
                <td class="mono center">#${idx + 1}</td>
                <td><span class="cp-type">VIEWPOINT</span></td>
                <td class="bold" colspan="2">${escapeHtml(h)}</td>
              </tr>`
              )
              .join('');

      const fuelStops = Array.isArray(day.fuelStops) && day.fuelStops.length > 0
        ? escapeHtml(day.fuelStops.join(' · '))
        : 'Top up at departure town';

      return `
      <div class="day-card">
        <div class="day-header">
          <div class="day-title-group">
            <span class="day-num">DAY ${dNum}</span>
            <div>
              <h3>${escapeHtml(day.title)}</h3>
              <div class="day-route">${escapeHtml(day.startLocation)} &rarr; ${escapeHtml(day.endLocation)} &nbsp;|&nbsp; <strong>Corridor:</strong> ${dCorridor}</div>
            </div>
          </div>
          <div class="day-metrics">
            <span class="metric-pill">${dDist}</span>
            <span class="metric-pill">${dDur}</span>
            <span class="metric-pill alt-pill">Peak: ${dAlt}</span>
          </div>
        </div>

        <div class="day-body">
          <!-- Pillar 1 & 2: Ordered En-Route Checkpoints, Viewpoints & Lakes -->
          <div class="sub-label">EN-ROUTE CHECKPOINTS, VIEWPOINTS &amp; LAKES</div>
          <table class="cp-table">
            <thead>
              <tr>
                <th style="width: 75px;">KM</th>
                <th style="width: 90px;">Type</th>
                <th style="width: 210px;">Location / Viewpoint</th>
                <th>Rider Notes &amp; What to See</th>
              </tr>
            </thead>
            <tbody>
              ${checkpointsRows}
            </tbody>
          </table>

          <!-- Pillar 3 & 4: 4-Column Tactical Grid -->
          <div class="pillars-grid">
            <div class="pillar-box">
              <div class="pillar-label">PILLAR 3 · SURFACE &amp; TERRAIN</div>
              <div class="pillar-val">${dSurface}</div>
              ${dBikeNote ? `<div class="pillar-sub">${dBikeNote}</div>` : ''}
            </div>
            <div class="pillar-box">
              <div class="pillar-label">PILLAR 4A · FUEL LOGISTICS</div>
              <div class="pillar-val">${fuelStops}</div>
              ${
                day.fuelWarning
                  ? `<div class="pillar-warn">⚠ ${escapeHtml(day.fuelWarning)}</div>`
                  : ''
              }
            </div>
            <div class="pillar-box">
              <div class="pillar-label">PILLAR 4B · SIGNAL &amp; MECHANIC</div>
              <div class="pillar-val"><strong>Signal:</strong> ${escapeHtml(day.mobileSignal || '4G in towns / SCOM in upper valleys')}</div>
              <div class="pillar-sub"><strong>Mechanic:</strong> ${escapeHtml(day.mechanicHub || 'Main Town Bazaar')}</div>
            </div>
            <div class="pillar-box">
              <div class="pillar-label">NIGHT BASECAMP &amp; PRO TIP</div>
              <div class="pillar-val">${escapeHtml(day.sleepLocation || day.endLocation)}</div>
              ${day.tips ? `<div class="pillar-sub"><strong>Tip:</strong> ${escapeHtml(day.tips)}</div>` : ''}
            </div>
          </div>
        </div>
      </div>`;
    })
    .join('');

  const gearListHtml = (itinerary.gearChecklist || [])
    .map((item) => `<div class="check-item"><span class="box">&#9744;</span> ${escapeHtml(item)}</div>`)
    .join('');

  const permitsHtml = (itinerary.permits || [])
    .map((p) => `<div class="check-item"><span class="box">&#9744;</span> ${escapeHtml(p)}</div>`)
    .join('');

  const contactsHtml = (itinerary.emergencyContacts || [])
    .map((c) => `<div class="contact-item">&bull; ${escapeHtml(c)}</div>`)
    .join('');

  const htmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title} — RaahBar Tactical Roadbook</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Manrope:wght@400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #141210;
      background: #ffffff;
      padding: 24px 32px;
      font-size: 11.5px;
      line-height: 1.45;
    }
    .roadbook-header {
      border: 2px solid #141210;
      border-top: 8px solid #fe932c;
      border-radius: 10px;
      padding: 18px 22px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: #faf8f5;
    }
    .brand-tag {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #d97008;
      margin-bottom: 4px;
    }
    h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: #141210;
      margin-bottom: 4px;
    }
    .corridor-line {
      font-size: 11px;
      color: #4a4540;
      font-weight: 600;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(3, auto);
      gap: 8px 16px;
      text-align: right;
      border-left: 1px solid #d6d1cb;
      padding-left: 16px;
    }
    .meta-item .label {
      font-size: 9px;
      text-transform: uppercase;
      color: #6e675f;
      font-weight: 700;
      letter-spacing: 0.08em;
      display: block;
    }
    .meta-item .val {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: #141210;
    }
    .section-box {
      border: 1.5px solid #2b251f;
      border-radius: 8px;
      margin-bottom: 16px;
      overflow: hidden;
    }
    .section-header {
      background: #1e1914;
      color: #fcf2eb;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-tag {
      background: #fe932c;
      color: #110d0a;
      font-weight: 800;
      font-size: 9px;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.08em;
    }
    .section-header h2 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 12px;
      letter-spacing: 0.05em;
    }
    .data-table, .cp-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .data-table th, .data-table td,
    .cp-table th, .cp-table td {
      border-bottom: 1px solid #e6e1dc;
      padding: 6px 10px;
      text-align: left;
      vertical-align: top;
    }
    .data-table th, .cp-table th {
      background: #f3efe9;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #4d4742;
      font-weight: 800;
    }
    .bold { font-weight: 700; }
    .mono { font-family: monospace; font-weight: 700; }
    .center { text-align: center; }
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.05em;
    }
    .badge-open { background: #d1fae5; color: #065f46; border: 1px solid #34d399; }
    .badge-closed { background: #fee2e2; color: #991b1b; border: 1px solid #f87171; }
    .badge-caution { background: #fef3c7; color: #92400e; border: 1px solid #fbbf24; }
    .bypass-note {
      margin-top: 3px;
      font-size: 10.5px;
      color: #991b1b;
    }
    .alert-box {
      border: 1.5px solid #d97706;
      background: #fffbeb;
      border-left: 6px solid #d97706;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
    }
    .alert-title {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 11px;
      color: #92400e;
      margin-bottom: 4px;
    }
    .pacing-text { margin-bottom: 4px; color: #451a03; }
    .alert-box ul { padding-left: 18px; color: #451a03; }
    .day-card {
      border: 1.5px solid #2b251f;
      border-radius: 8px;
      margin-bottom: 14px;
      page-break-inside: avoid;
      background: #ffffff;
    }
    .day-header {
      background: #1e1914;
      color: #fcf2eb;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .day-title-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .day-num {
      background: #fe932c;
      color: #110d0a;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 5px;
      white-space: nowrap;
    }
    .day-header h3 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
    }
    .day-route {
      font-size: 10.5px;
      color: #d6cfc9;
      margin-top: 2px;
    }
    .day-metrics {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .metric-pill {
      background: #2b251f;
      border: 1px solid #4d4742;
      color: #fcf2eb;
      font-family: monospace;
      font-size: 10.5px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      white-space: nowrap;
    }
    .alt-pill {
      background: #0b513d;
      border-color: #b0f0d6;
      color: #b0f0d6;
    }
    .day-body { padding: 10px 14px; }
    .sub-label {
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #6e675f;
      margin-bottom: 4px;
    }
    .cp-type {
      font-size: 8.5px;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 3px;
      background: #e6e1dc;
      color: #1e1914;
    }
    .pillars-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-top: 10px;
    }
    .pillar-box {
      background: #faf8f5;
      border: 1px solid #e0dad3;
      border-radius: 6px;
      padding: 7px 10px;
    }
    .pillar-label {
      font-size: 8.5px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #d97008;
      margin-bottom: 2px;
    }
    .pillar-val {
      font-size: 11px;
      font-weight: 700;
      color: #141210;
    }
    .pillar-sub {
      font-size: 10px;
      color: #4d4742;
      margin-top: 2px;
    }
    .pillar-warn {
      font-size: 10px;
      color: #991b1b;
      font-weight: 700;
      margin-top: 3px;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 16px;
      page-break-inside: avoid;
    }
    .footer-card {
      border: 1.5px solid #2b251f;
      border-radius: 8px;
      padding: 10px 12px;
      background: #faf8f5;
    }
    .footer-card h4 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 11.5px;
      text-transform: uppercase;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 2px solid #fe932c;
    }
    .check-item, .contact-item {
      font-size: 10.5px;
      margin-bottom: 4px;
      display: flex;
      align-items: flex-start;
      gap: 6px;
    }
    .box { font-size: 12px; line-height: 1; }
    @media print {
      body { padding: 10px; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
  <div class="roadbook-header">
    <div>
      <div class="brand-tag">RAAHBAR · OFFLINE TACTICAL RALLY ROADBOOK</div>
      <h1>${title}</h1>
      <div class="corridor-line">${start} &rarr; ${end} &nbsp;&bull;&nbsp; Primary Corridor: ${corridor}</div>
      <div class="corridor-line" style="margin-top:3px;">Weather: ${weather} &nbsp;&bull;&nbsp; Ideal Window: ${bestMonths}</div>
    </div>
    <div class="meta-grid">
      <div class="meta-item"><span class="label">Total Distance</span><span class="val">${totalDist}</span></div>
      <div class="meta-item"><span class="label">Duration</span><span class="val">${totalDays} Days (${totalDur})</span></div>
      <div class="meta-item"><span class="label">Bike &amp; Month</span><span class="val">${riderBike} · ${travelMonth}</span></div>
      <div class="meta-item"><span class="label">Rider Tier</span><span class="val">${riderExp}</span></div>
      <div class="meta-item"><span class="label">Mode</span><span class="val">One-Way + Explorer</span></div>
      <div class="meta-item"><span class="label">Signal Rule</span><span class="val">SCOM SIM for GB/North</span></div>
    </div>
  </div>

  ${passesHtml}
  ${warningsHtml}
  ${daysHtml}

  <div class="footer-grid">
    <div class="footer-card">
      <h4>Pre-Ride Gear Checklist</h4>
      ${gearListHtml || '<div class="check-item">Standard armored riding gear</div>'}
    </div>
    <div class="footer-card">
      <h4>Permits &amp; Documents</h4>
      ${permitsHtml || '<div class="check-item">Original CNIC &amp; Bike Registration</div>'}
    </div>
    <div class="footer-card">
      <h4>Regional Emergency &amp; Rescue</h4>
      ${contactsHtml || '<div class="contact-item">Rescue 1122 &amp; District HQ Hospital</div>'}
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;

  const printWin = window.open('', '_blank', 'width=1024,height=800');
  if (!printWin) {
    alert('Please allow pop-ups in your browser to download/print the Tactical PDF Roadbook.');
    return;
  }
  printWin.document.open();
  printWin.document.write(htmlDoc);
  printWin.document.close();
}

