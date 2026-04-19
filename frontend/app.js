    // Color palette
    const COLORS = [
      '#00d4ff','#ff6b35','#7c3aed','#00ff88',
      '#f59e0b','#ec4899','#06b6d4','#84cc16',
      '#f97316','#a78bfa'
    ];
    const procColors = {};
    function getColor(pid) {
      if (!procColors[pid]) {
        const idx = Object.keys(procColors).length % COLORS.length;
        procColors[pid] = COLORS[idx];
      }
      return procColors[pid];
    }

    // Table generation
    function generateTable() {
      const n = Math.min(Math.max(parseInt(document.getElementById('numProc').value)||1, 1), 10);
      const algo = document.getElementById('algo').value;

      const oldRows = [...document.querySelectorAll('#procBody .proc-row')];
      const oldVals = oldRows.map(r => ({
        at: r.querySelector('.at-inp').value,
        bt: r.querySelector('.bt-inp').value
      }));

      const body = document.getElementById('procBody');
      body.innerHTML = '';
      for (let i = 0; i < n; i++) {
        const at = oldVals[i]?.at ?? '';
        const bt = oldVals[i]?.bt ?? '';
        const tr = document.createElement('tr');
        tr.className = 'proc-row';
        tr.innerHTML = `
          <td class="proc-id" style="color:${COLORS[i % COLORS.length]}">P${i+1}</td>
          <td><input class="at-inp" type="number" min="0" value="${at}" placeholder="0"></td>
          <td><input class="bt-inp" type="number" min="1" value="${bt}" placeholder="1"></td>`;
        body.appendChild(tr);
      }
    }

    function toggleQuantum() {
      const algo = document.getElementById('algo').value;
      const note = document.getElementById('quantumUsedNote');
      const liveLabel = document.getElementById('quantumLiveLabel');
      if (algo === 'rr') {
        note.textContent = '(active ✓)';
        note.style.color = 'var(--green)';
        liveLabel.style.color = 'var(--green)';
      } else {
        note.textContent = '(used for RR)';
        note.style.color = 'var(--accent)';
        liveLabel.style.color = 'var(--muted)';
      }
      generateTable();
    }

    function updateQuantumNote() {
      const q = document.getElementById('quantum').value || '?';
      document.getElementById('qVal').textContent = q;
    }

    // Read inputs
    function getProcesses() {
      const rows = document.querySelectorAll('#procBody .proc-row');
      return [...rows].map((r, i) => ({
        id: `P${i+1}`,
        at: parseInt(r.querySelector('.at-inp').value) || 0,
        bt: parseInt(r.querySelector('.bt-inp').value) || 1
      }));
    }

    function showError(msg) {
      const el = document.getElementById('errMsg');
      el.textContent = msg;
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), 3500);
    }

    // Backend API
    const API_BASE = 'https://operatingsystem-backend.onrender.com';

    function showLoading(msg = 'Computing...') {
      document.getElementById('loadingText').textContent = msg;
      document.getElementById('loadingOverlay').classList.add('show');
    }
    function hideLoading() {
      document.getElementById('loadingOverlay').classList.remove('show');
    }
    function showBackendWarn(show) {
      document.getElementById('backendWarn').classList.toggle('show', show);
    }

    async function callSchedule(algo, procs, quantum) {
      const res = await fetch(`${API_BASE}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithm: algo, processes: procs, quantum })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    }

    async function callCompare(procs, quantum) {
      const res = await fetch(`${API_BASE}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithm: 'fcfs', processes: procs, quantum })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    }

    // Metrics
    function calcMetrics(results) {
      return results.map(r => ({
        ...r,
        tat: r.tat !== undefined ? r.tat : r.ct - r.at,
        wt:  r.wt  !== undefined ? r.wt  : (r.ct - r.at) - r.bt
      }));
    }

    // Render
    // Store last gantt/metrics globally for simulation reuse
    let _lastGantt = null;
    let _lastMetrics = null;
    let _lastSnapshots = null;
    let _currentAlgo = 'fcfs';
    let _simTimer = null;
    let _simStep = 0;
    let _simSpeeds = [700, 500, 350, 200, 80];
    let _chipDelays = [300, 220, 150, 90,  40];
    let _simRunning = false;
    let _queueGen   = 0;     // generation counter — increment to cancel all pending queue callbacks

    function renderGantt(gantt, metricsMap) {
      _lastGantt = gantt;
      const total = gantt[gantt.length-1]?.end || 0;
      const scale = Math.min(60, Math.max(30, 600 / total));
      const MIN_BLOCK_W = 40;

      const container = document.getElementById('ganttContainer');
      container.innerHTML = '';

      const blocks = document.createElement('div');
      blocks.className = 'gantt-blocks';

      gantt.forEach((b, i) => {
        const w = Math.max((b.end - b.start) * scale, MIN_BLOCK_W);
        const div = document.createElement('div');
        div.className = 'gantt-block' + (b.id === 'IDLE' ? ' gantt-idle' : '');
        div.style.width = w + 'px';

        div.style.animationDelay = (i * 0.04) + 's';
        div.dataset.step = i;

        if (b.id !== 'IDLE') {
          const c = getColor(b.id);
          div.style.background = c;
          div.style.boxShadow = `0 0 8px ${c}66`;
          div.style.setProperty('--sim-glow', c + 'cc');
        }

        // Build rich tooltip
        const m = metricsMap ? metricsMap[b.id] : null;
        let tooltipHTML = `<div class="tooltip-header">${b.id === 'IDLE' ? '⏸ IDLE' : '⚙ ' + b.id}</div>`;
        tooltipHTML += `<div class="tooltip-row"><span class="tooltip-key">Start</span><span class="tooltip-val">${b.start}</span></div>`;
        tooltipHTML += `<div class="tooltip-row"><span class="tooltip-key">End</span><span class="tooltip-val">${b.end}</span></div>`;
        tooltipHTML += `<div class="tooltip-row"><span class="tooltip-key">Duration</span><span class="tooltip-val">${b.end - b.start}</span></div>`;
        if (m && b.id !== 'IDLE') {
          const wtClass = m.wt === 0 ? 'good' : m.wt > 5 ? 'warn' : '';
          tooltipHTML += `<div class="tooltip-row"><span class="tooltip-key">Waiting&nbsp;Time</span><span class="tooltip-val ${wtClass}">${m.wt}</span></div>`;
          tooltipHTML += `<div class="tooltip-row"><span class="tooltip-key">Turnaround</span><span class="tooltip-val">${m.tat}</span></div>`;
          tooltipHTML += `<div class="tooltip-row"><span class="tooltip-key">Arrival</span><span class="tooltip-val">${m.at}</span></div>`;
        }

        div.innerHTML = `${b.id}<span class="tooltip">${tooltipHTML}</span>`;
        blocks.appendChild(div);
      });
      container.appendChild(blocks);


      const timeToPixel = {};
      let cursor = 0;
      gantt.forEach(b => {
        if (!(b.start in timeToPixel)) timeToPixel[b.start] = cursor;
        const w = Math.max((b.end - b.start) * scale, MIN_BLOCK_W);
        cursor += w;
        timeToPixel[b.end] = cursor;
      });

      const axis = document.createElement('div');
      axis.className = 'gantt-times';
      axis.style.width = cursor + 'px';

      const endTimes = new Set(gantt.map(b => b.end));

      Object.entries(timeToPixel)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .forEach(([t, px]) => {
          const tick = document.createElement('div');
          tick.className = 'gantt-tick';
          const isEnd = endTimes.has(Number(t));
          const isStart = gantt.some(b => b.start === Number(t));

          if (isEnd && !isStart) {
            // Pure end: right-align to boundary
            tick.style.right = (cursor - px) + 'px';
          } else {
            // Start (or both): left-align to boundary
            tick.style.left = px + 'px';
          }
          tick.textContent = t;
          axis.appendChild(tick);
        });
      container.appendChild(axis);
    }

    // Build ready-queue snapshots on the frontend
    // Called when the backend does not return readyQueueSnapshots.
    // Returns an array (one entry per gantt slot) where each entry is
    // the list of process IDs waiting in the ready queue at that step.
    function buildSnapshots(gantt, procs, algo, quantum) {
      const snapshots = [];
      const remaining = {};
      procs.forEach(p => remaining[p.id] = p.bt);

      for (let i = 0; i < gantt.length; i++) {
        const t = gantt[i].start;
        const running = gantt[i].id;

        // All processes that have arrived and still have burst left, excluding the one currently running
        let ready = procs
          .filter(p => p.at <= t && remaining[p.id] > 0 && p.id !== running)
          .map(p => p.id);

        // Sort by algorithm
        if (algo === 'sjf') {
          ready.sort((a, b) => remaining[a] - remaining[b]);
        } else if (algo === 'srtf') {
          ready.sort((a, b) => remaining[a] - remaining[b]);
        } else if (algo === 'fcfs') {
          ready.sort((a, b) => {
            const pa = procs.find(p => p.id === a);
            const pb = procs.find(p => p.id === b);
            return pa.at - pb.at;
          });
        }
        // RR keeps arrival order — default order is fine

        snapshots.push(ready);

        // Decrease remaining burst for whoever ran this slot
        if (running !== 'IDLE' && remaining[running] !== undefined) {
          remaining[running] -= (gantt[i].end - gantt[i].start);
          if (remaining[running] < 0) remaining[running] = 0;
        }
      }
      return snapshots;
    }

    // Simulation Engine
    async function startSimulation() {
      const procs = getProcesses();
      const algo = document.getElementById('algo').value;
      const q = parseInt(document.getElementById('quantum').value)||2;

      for (const p of procs) {
        if (isNaN(p.bt) || p.bt < 1) { showError(`${p.id}: Burst time must be ≥ 1`); return; }
        if (isNaN(p.at) || p.at < 0) { showError(`${p.id}: Arrival time must be ≥ 0`); return; }
      }
      procs.forEach(p => getColor(p.id));

      showLoading('Simulating...');
      showBackendWarn(false);
      let data;
      try {
        data = await callSchedule(algo, procs, q);
      } catch(e) {
        hideLoading();
        showBackendWarn(true);
        return;
      }
      hideLoading();

      const gantt = data.gantt;
      const metrics = data.results;
      metrics.sort((a,b) => parseInt(a.id.slice(1)) - parseInt(b.id.slice(1)));
      _lastMetrics = metrics;
      _lastSnapshots = data.readyQueueSnapshots || buildSnapshots(gantt, procs, algo, q);
      _currentAlgo = algo;

      const metricsMap = {};
      metrics.forEach(m => metricsMap[m.id] = m);

      renderGantt(gantt, metricsMap);
      const {avgTAT, avgWT} = renderTable(metrics, data);
      renderInsightPanel(algo, metrics, avgWT, avgTAT, q);

      const algoNames = {
        fcfs:'FCFS', sjf:'SJF', rr:`Round Robin (q=${q})`,
        srtf:'SRTF (Preemptive)'
      };
      document.getElementById('algoBadge').textContent = algoNames[algo];
      document.getElementById('results').classList.add('show');
      document.getElementById('results').scrollIntoView({behavior:'smooth', block:'start'});

      // Now animate
      stopSimulation();
      _simStep = 0;

      // Clean up any leftover "Simulation Complete" state from previous run
      document.getElementById('readyQueuePanel').classList.remove('rq-complete-glow');
      document.getElementById('rqDisplay').querySelectorAll('.rq-complete-label').forEach(el => el.remove());
      const rqTagEl = document.getElementById('rqAlgoTag');
      if (rqTagEl) { rqTagEl.className = 'rq-algo-tag'; rqTagEl.textContent = ''; }
      const blockEls = document.querySelectorAll('#ganttContainer .gantt-block');

      // mark all pending
      blockEls.forEach(el => el.classList.add('sim-pending'));

      // show sim bar
      const simBar = document.getElementById('simBar');
      simBar.classList.add('active');
      document.getElementById('btnStop').style.display = '';
      document.getElementById('btnSimulate').disabled = true;
      document.getElementById('btnReplay').style.display = 'none';

      const total = gantt.length;

      function step() {
        if (_simStep > 0) {
          const prev = blockEls[_simStep - 1];
          if (prev) {
            prev.classList.remove('sim-active');
            prev.classList.add('sim-done');
          }
        }
        if (_simStep >= total) {
          blockEls.forEach(el => { el.classList.remove('sim-pending', 'sim-done', 'sim-active'); });
          finishSimulation();
          return;
        }

        const el = blockEls[_simStep];
        if (el) {
          el.classList.remove('sim-pending');
          el.classList.add('sim-active');
          const scrollBox = document.getElementById('ganttScroll');
          if (scrollBox) {
            const target = el.offsetLeft - scrollBox.clientWidth / 2 + el.offsetWidth / 2;
            scrollBox.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
          }
        }

        const b = gantt[_simStep];
        document.getElementById('simPid').textContent = b.id;
        document.getElementById('simPid').style.background = b.id === 'IDLE' ? '#64748b' : getColor(b.id);
        document.getElementById('simPid').style.color = b.id === 'IDLE' ? '#fff' : '#000';
        document.getElementById('simTime').textContent = `${b.start} → ${b.end}`;
        document.getElementById('simFill').style.width = ((_simStep + 1) / total * 100) + '%';
        document.getElementById('simStepCounter').textContent = `Step ${_simStep + 1} / ${total}`;

        updateReadyQueue(_simStep, gantt, _lastSnapshots, _currentAlgo);

        _simStep++;
        const delay = _simSpeeds[parseInt(document.getElementById('simSpeed').value) - 1];
        _simTimer = setTimeout(step, delay);
      }

      _simRunning = true;
      step();
    }

    function stopSimulation() {
      if (_simTimer) { clearTimeout(_simTimer); _simTimer = null; }
      finishSimulation();
    }

    function finishSimulation() {
      _simRunning = false;
      _queueGen++;           // invalidate ALL pending chip-append callbacks immediately
      document.getElementById('btnStop').style.display = 'none';
      document.getElementById('btnSimulate').disabled = false;
      document.getElementById('btnReplay').style.display = '';
      // Remove all Gantt sim highlight classes
      document.querySelectorAll('#ganttContainer .gantt-block').forEach(el => {
        el.classList.remove('sim-active', 'sim-done', 'sim-pending');
      });
      // Clear the ready queue now …
      _clearReadyQueue();
      // … and again after 1.5 s as a safety net against any lingering callbacks
      setTimeout(_clearReadyQueue, 1500);
    }

    function _clearReadyQueue() {
      document.getElementById('rqSlots').innerHTML = '';
      document.getElementById('rqEmpty').style.display = '';
      document.getElementById('rqTime').textContent = '—';
      document.getElementById('readyQueuePanel').classList.remove('rq-complete-glow');
      document.getElementById('rqDisplay').querySelectorAll('.rq-complete-label').forEach(el => el.remove());
      const tag = document.getElementById('rqAlgoTag');
      if (tag) { tag.textContent = ''; tag.className = 'rq-algo-tag'; }
    }

    function replaySimulation() {
      document.getElementById('btnReplay').style.display = 'none';
      startSimulation();
    }

    function updateSimSpeed() {
      const v = document.getElementById('simSpeed').value;
      document.getElementById('simSpeedLabel').textContent = v + '×';
    }

    // Insight Panel
    const ALGO_INSIGHTS = {
      fcfs: {
        body: `FCFS (First Come, First Serve) executes processes strictly in arrival order, no sorting, no preemption. It's the simplest policy imaginable, which makes it easy to understand but often inefficient in practice.`,
        bullets: [
          `Processes are queued like a real-world line, whoever arrives first gets the CPU first.`,
          `Long burst-time processes can block shorter ones, causing the <span>Convoy Effect</span>.`,
          `No starvation — every process eventually runs, guaranteed.`,
          `Non-preemptive: once a process starts, it runs to completion.`,
        ],
        verdictFn: (avgWT) => avgWT > 6
          ? { text: `⚠ High average waiting time (${avgWT}) — a process with large burst time may be blocking shorter jobs.`, warn: true }
          : { text: `✓ Reasonable waiting times for this input. FCFS works well when burst times are similar.`, warn: false },
      },
      sjf: {
        body: `SJF (Shortest Job First) picks the available process with the smallest burst time, minimizing average waiting time. It's provably optimal for average WT among non-preemptive algorithms, but it requires knowing burst times upfront.`,
        bullets: [
          `Greedy selection: always picks the shortest available job.`,
          `Minimizes average waiting time, no other non-preemptive algorithm can beat it.`,
          `Can cause <span>starvation</span> for long processes if short jobs keep arriving.`,
          `Requires burst time estimation in real systems (often predicted from history).`,
        ],
        verdictFn: (avgWT) => ({ text: `✓ SJF produced avg WT = ${avgWT}. For this dataset, no other non-preemptive algorithm can achieve a lower average waiting time.`, warn: false }),
      },
      rr: {
        body: `Round Robin gives each process a fixed time slice (quantum) and cycles through them. It's the foundation of modern fair scheduling, every process gets equal CPU share, which is great for responsiveness but adds overhead.`,
        bullets: [
          `Every process runs for at most q time units before yielding, ensures fairness.`,
          `Smaller quantum → more responsive but more context-switch overhead.`,
          `Larger quantum → behaves like FCFS, reducing overhead but hurting response time.`,
          `Ideal for <span>time-sharing / interactive systems</span> where response time matters.`,
        ],
        verdictFn: (avgWT, q) => avgWT > 8
          ? { text: `⚠ High WT with q=${q}. Try a smaller quantum for better responsiveness, or compare with SJF for throughput.`, warn: true }
          : { text: `✓ With q=${q}, Round Robin distributes CPU fairly. Response times are balanced across processes.`, warn: false },
      },
      srtf: {
        body: `SRTF (Shortest Remaining Time First) is the preemptive version of SJF. At every time unit, the CPU picks the process with the least remaining burst. This achieves the globally optimal average waiting time, but at the cost of many context switches.`,
        bullets: [
          `Preemptive: a newly arrived short job immediately takes the CPU.`,
          `Produces the <span>minimum possible average waiting time</span> of any scheduling policy.`,
          `High context-switch overhead due to frequent preemption.`,
          `Long processes can suffer severe <span>starvation</span> if short jobs keep arriving.`,
        ],
        verdictFn: (avgWT) => ({ text: `✓ SRTF is theoretically optimal — avg WT = ${avgWT}. It's the benchmark no other algorithm can beat on this dataset.`, warn: false }),
      },
    };

    function renderInsightPanel(algo, metrics, avgWT, avgTAT, q) {
      const info = ALGO_INSIGHTS[algo];
      if (!info) return;

      const panel = document.getElementById('insightPanel');
      const algoNames = { fcfs:'FCFS', sjf:'SJF', rr:`Round Robin (q=${q})`, srtf:'SRTF' };

      document.getElementById('insightAlgoTag').textContent = algoNames[algo];
      document.getElementById('insightBody').textContent = info.body;

      const ul = document.getElementById('insightBullets');
      ul.innerHTML = info.bullets.map(b => `<li>${b}</li>`).join('');

      const verdict = info.verdictFn(parseFloat(avgWT), q);
      const vEl = document.getElementById('insightVerdict');
      vEl.textContent = verdict.text;
      vEl.className = 'insight-verdict' + (verdict.warn ? ' warn-verdict' : '');

      panel.classList.add('show');
    }

    function renderTable(metrics, serverData) {
      const table = document.getElementById('outTable');
      const n = metrics.length;
      // Prefer server-computed values; fall back to client calc
      const avgTAT = serverData ? serverData.avgTAT.toFixed(2)
                                : (metrics.reduce((s,m)=>s+m.tat,0)/n).toFixed(2);
      const avgWT  = serverData ? serverData.avgWT.toFixed(2)
                                : (metrics.reduce((s,m)=>s+m.wt,0)/n).toFixed(2);
      const maxWT  = serverData ? serverData.maxWT : Math.max(...metrics.map(m=>m.wt));
      const maxTAT = serverData ? serverData.maxTAT : Math.max(...metrics.map(m=>m.tat));

      let html = `<thead><tr>
        <th>Process</th><th>AT</th><th>BT</th>
        <th>CT</th><th>TAT</th><th>WT</th>
      </tr></thead><tbody>`;

      for (const m of metrics) {
        html += `<tr>
          <td style="color:${getColor(m.id)}">${m.id}</td>
          <td>${m.at}</td><td>${m.bt}</td>
          <td>${m.ct}</td><td>${m.tat}</td><td>${m.wt}</td>
        </tr>`;
      }

      html += `
        <tr class="avg-row">
          <td colspan="3" style="text-align:left;padding-left:12px">Total Processes</td>
          <td colspan="3">${n}</td>
        </tr>
        <tr class="avg-row">
          <td colspan="3" style="text-align:left;padding-left:12px">Avg Turnaround Time</td>
          <td colspan="3">${avgTAT}</td>
        </tr>
        <tr class="avg-row">
          <td colspan="3" style="text-align:left;padding-left:12px">Avg Waiting Time</td>
          <td colspan="3">${avgWT}</td>
        </tr>
        <tr class="avg-row">
          <td colspan="3" style="text-align:left;padding-left:12px">Max Waiting Time</td>
          <td colspan="3">${maxWT}</td>
        </tr>
        <tr class="avg-row">
          <td colspan="3" style="text-align:left;padding-left:12px">Max Turnaround Time</td>
          <td colspan="3">${maxTAT}</td>
        </tr>
      </tbody>`;

      table.innerHTML = html;
      return {avgTAT, avgWT};
    }

    function renderStats() {}

    // Main run
    async function run() {
      Object.keys(procColors).forEach(k => delete procColors[k]); // reset colors

      const procs = getProcesses();
      const algo = document.getElementById('algo').value;
      const q = parseInt(document.getElementById('quantum').value)||2;

      // Validate
      for (const p of procs) {
        if (isNaN(p.bt) || p.bt < 1) { showError(`${p.id}: Burst time must be ≥ 1`); return; }
        if (isNaN(p.at) || p.at < 0) { showError(`${p.id}: Arrival time must be ≥ 0`); return; }
      }
      if (algo === 'rr' && (isNaN(q)||q<1)) { showError('Time quantum must be ≥ 1'); return; }

      // Assign colors in order
      procs.forEach(p => getColor(p.id));

      showLoading('Computing...');
      showBackendWarn(false);
      let data;
      try {
        data = await callSchedule(algo, procs, q);
      } catch(e) {
        hideLoading();
        showBackendWarn(true);
        return;
      }
      hideLoading();

      const gantt = data.gantt;
      const metrics = data.results;
      metrics.sort((a,b) => parseInt(a.id.slice(1)) - parseInt(b.id.slice(1)));

      const metricsMap = {};
      metrics.forEach(m => metricsMap[m.id] = m);

      renderGantt(gantt, metricsMap);
      const {avgTAT, avgWT} = renderTable(metrics, data);
      renderInsightPanel(algo, metrics, avgWT, avgTAT, q);

      const algoNames = {
        fcfs:'FCFS', sjf:'SJF', rr:`Round Robin (q=${q})`,
        srtf:'SRTF (Preemptive)'
      };
      document.getElementById('algoBadge').textContent = algoNames[algo];

      document.getElementById('results').classList.add('show');
      document.getElementById('results').scrollIntoView({behavior:'smooth', block:'start'});
    }

    // Utilities
    function clearAll() {
      stopSimulation();
      document.getElementById('simBar').classList.remove('active');
      document.getElementById('btnReplay').style.display = 'none';
      document.getElementById('numProc').value = 3;
      document.getElementById('algo').value = 'fcfs';
      document.getElementById('quantum').value = 2;
      toggleQuantum();
      document.getElementById('results').classList.remove('show');
      document.getElementById('insightPanel').classList.remove('show');
      // clear inputs
      document.querySelectorAll('.at-inp, .bt-inp').forEach(i => i.value = '');
    }

    function loadExample() {
      document.getElementById('numProc').value = 4;
      generateTable();
      const ats = [0, 1, 2, 3], bts = [5, 3, 8, 2];
      document.querySelectorAll('.at-inp').forEach((inp,i) => inp.value = ats[i]);
      document.querySelectorAll('.bt-inp').forEach((inp,i) => inp.value = bts[i]);
      document.getElementById('quantum').value = 2;
      updateQuantumNote();
      setTimeout(() => run(), 0);
    }

    // Ready Queue
    const RQ_ALGO_LABELS = { fcfs: 'FIFO order', sjf: 'Shortest first', rr: 'Circular queue', srtf: 'Preemptive' };

    /**
     * Returns a Promise that resolves after ALL chips for this step have
     * been added to the DOM one-by-one (slow reveal) and their entrance
     * animation has finished — so the caller can await the full display.
     */
    function updateReadyQueue(stepIndex, gantt, snapshots, algo) {
      const myGen = ++_queueGen; // capture this step's generation
      return new Promise(resolve => {
        if (!snapshots || stepIndex < 0 || stepIndex >= snapshots.length) {
          resolve(); return;
        }
        const t = gantt[stepIndex] ? gantt[stepIndex].start : 0;
        document.getElementById('rqTime').textContent = t;

        const tag = document.getElementById('rqAlgoTag');
        if (tag) tag.textContent = RQ_ALGO_LABELS[algo] || algo;

        const queue = snapshots[stepIndex];
        const slots  = document.getElementById('rqSlots');
        const empty  = document.getElementById('rqEmpty');
        slots.innerHTML = '';

        const animClass = 'anim-' + (algo || 'fcfs');

        if (!queue || queue.length === 0) {
          empty.style.display = '';
          resolve();
          return;
        }

        empty.style.display = 'none';

        const speedIdx  = parseInt(document.getElementById('simSpeed').value) - 1;
        const chipDelay = _chipDelays[speedIdx];
        const animDur   = Math.max(Math.round(chipDelay * 0.75), 180);

        let resolved = false;
        const safeResolve = () => {
          if (_queueGen !== myGen) return; // stale — another step took over
          if (!resolved) { resolved = true; resolve(); }
        };

        const maxWait = queue.length * chipDelay + animDur + 700;
        setTimeout(safeResolve, maxWait);

        queue.forEach((pid, idx) => {
          setTimeout(() => {
            if (_queueGen !== myGen) { safeResolve(); return; } // stale — bail

            const chip = document.createElement('div');
            chip.className = `rq-chip ${animClass}`;
            chip.style.background         = getColor(pid);
            chip.style.animationDuration  = animDur + 'ms';
            chip.style.animationDelay     = '0s';
            chip.textContent = pid;

            if (algo === 'srtf') {
              chip.style.outline       = '2px solid rgba(255,255,255,0.4)';
              chip.style.outlineOffset = '2px';
            }
            if (algo === 'rr') {
              const badge = document.createElement('span');
              badge.style.cssText = 'position:absolute;top:-6px;right:-4px;background:#7c3aed;color:#fff;' +
                                    'border-radius:50%;width:14px;height:14px;font-size:9px;' +
                                    'display:flex;align-items:center;justify-content:center;font-weight:bold;';
              badge.textContent = idx + 1;
              chip.appendChild(badge);
            }

            slots.appendChild(chip);

            if (idx === queue.length - 1) {
              setTimeout(() => {
                if (_queueGen !== myGen) return; // stale — skip group pulse
                const allChips = [...slots.querySelectorAll('.rq-chip')];
                allChips.forEach(c => {
                  c.style.transition = 'transform 0.22s cubic-bezier(.34,1.56,.64,1), filter 0.22s ease';
                  c.style.transform  = 'scale(1.18)';
                  c.style.filter     = 'brightness(1.45)';
                });
                setTimeout(() => {
                  if (_queueGen !== myGen) return; // stale — skip settle
                  allChips.forEach(c => {
                    c.style.transform = 'scale(1)';
                    c.style.filter    = 'brightness(1)';
                  });
                  setTimeout(safeResolve, 260);
                }, 260);
              }, animDur);
            }
          }, idx * chipDelay);
        });
      });
    }

    // Home / App navigation
    function showApp() {
      document.getElementById('homePage').style.display  = 'none';
      document.getElementById('comparePage').style.display = 'none';
      document.getElementById('appPage').style.display   = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    function showHome() {
      document.getElementById('appPage').style.display   = 'none';
      document.getElementById('comparePage').style.display = 'none';
      document.getElementById('homePage').style.display  = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Theme
    function initTheme() {
      const saved = localStorage.getItem('osTheme') || 'dark';
      applyTheme(saved);
    }
    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      const btn = document.getElementById('themeToggle');
      if (btn) btn.textContent = theme === 'dark' ? '🌙' : '☀️';
      localStorage.setItem('osTheme', theme);
    }
    function toggleTheme() {
      const cur = document.documentElement.getAttribute('data-theme');
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    }

    // Init
    generateTable();
    updateQuantumNote();
    initTheme();

    // Comparison
    let chartInstances = {};

    function destroyCharts() {
      Object.values(chartInstances).forEach(c => { try { c.destroy(); } catch(e){} });
      chartInstances = {};
    }

    function showCompare() {
      document.getElementById('homePage').style.display  = 'none';
      document.getElementById('appPage').style.display   = 'none';
      document.getElementById('comparePage').style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function runComparison() {
      const procs = getProcesses();
      for (const p of procs) {
        if (isNaN(p.bt) || p.bt < 1) { showError(`${p.id}: Burst time must be ≥ 1`); return; }
        if (isNaN(p.at) || p.at < 0) { showError(`${p.id}: Arrival time must be ≥ 0`); return; }
      }

      const q = parseInt(document.getElementById('quantum').value) || 2;

      showLoading('Comparing all algorithms...');
      showBackendWarn(false);
      let data;
      try {
        data = await callCompare(procs, q);
      } catch(e) {
        hideLoading();
        showBackendWarn(true);
        return;
      }
      hideLoading();

      // Map backend AlgoResult list to the same shape renderWinner/renderCompCharts/renderCmpTable expect
      const results = data.algorithms.map(a => ({
        key:    a.key,
        label:  a.label,
        metrics: a.metrics,
        avgWT:  a.avgWT,
        avgTAT: a.avgTAT,
        maxWT:  a.maxWT,
        maxTAT: a.maxTAT
      }));

      destroyCharts();
      renderWinner(results);
      renderCompCharts(results, procs);
      renderCmpTable(results);
      document.getElementById('quantumNote').textContent = `* RR uses Time Quantum = ${q}`;
      const sub = document.getElementById('cmpSubtitle');
      if (sub) sub.textContent = `${procs.length} processes · q=${q}`;

      showCompare();
    }

    function renderWinner(results) {
      // Score: rank each algo per metric, lower is better → sum ranks
      const metrics = ['avgWT','avgTAT','maxWT','maxTAT'];
      const scores = results.map(() => 0);
      metrics.forEach(m => {
        const sorted = [...results].sort((a,b) => a[m]-b[m]);
        sorted.forEach((r, rank) => {
          const idx = results.indexOf(r);
          scores[idx] += rank;
        });
      });
      const bestIdx = scores.indexOf(Math.min(...scores));
      const best = results[bestIdx];

      const wins = [];
      if (best.avgWT === Math.min(...results.map(r=>r.avgWT))) wins.push({label:'Best Avg WT', cls:'badge-green'});
      if (best.avgTAT === Math.min(...results.map(r=>r.avgTAT))) wins.push({label:'Best Avg TAT', cls:'badge-blue'});
      if (best.maxWT === Math.min(...results.map(r=>r.maxWT))) wins.push({label:'Best Max WT', cls:'badge-orange'});

      const badges = wins.map(w=>`<span class="badge ${w.cls}">${w.label}</span>`).join('');

      const reasons = [
        `Avg WT: <strong>${best.avgWT}</strong>`,
        `Avg TAT: <strong>${best.avgTAT}</strong>`,
        `Max WT: <strong>${best.maxWT}</strong>`
      ].join(' &nbsp;·&nbsp; ');

      document.getElementById('winnerBanner').innerHTML = `
        <div class="winner-crown">🏆</div>
        <div class="winner-info">
          <div class="winner-name">${best.label} wins</div>
          <div class="winner-reason">${reasons}</div>
        </div>
        <div class="winner-badges">${badges}</div>
      `;
    }

    const ALGO_COLORS = [
      'rgba(0,212,255,0.85)',
      'rgba(0,255,136,0.85)',
      'rgba(255,107,53,0.85)',
      'rgba(124,58,237,0.85)',
    ];
    const ALGO_BORDERS = [
      '#00d4ff','#00ff88','#ff6b35','#7c3aed'
    ];

    const chartDefaults = {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color:'#64748b', font:{family:'Share Tech Mono',size:11} }, grid:{color:'rgba(255,255,255,0.04)'} },
        y: { ticks: { color:'#64748b', font:{family:'Share Tech Mono',size:10} }, grid:{color:'rgba(255,255,255,0.06)'} }
      }
    };

    const tooltipDefaults = {
      backgroundColor: '#1a2235',
      borderColor: '#1e2d45',
      borderWidth: 1,
      titleColor: '#e2e8f0',
      bodyColor: '#94a3b8',
      titleFont: { family: 'Share Tech Mono' },
      bodyFont:  { family: 'Share Tech Mono' },
    };

    function makeLineChart(id, labels, data) {
      const ctx = document.getElementById(id).getContext('2d');
      const minVal = Math.min(...data);

      // Build per-point colors: green for best, else algo color
      const pointColors = data.map((v, i) => v === minVal ? '#00ff88' : ALGO_BORDERS[i]);
      const pointRadius = data.map(v => v === minVal ? 7 : 5);

      // Gradient fill under line
      const gradient = ctx.createLinearGradient(0, 0, 0, 200);
      gradient.addColorStop(0, 'rgba(0,212,255,0.18)');
      gradient.addColorStop(1, 'rgba(0,212,255,0.0)');

      chartInstances[id] = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            data,
            borderColor: '#00d4ff',
            borderWidth: 2.5,
            backgroundColor: gradient,
            pointBackgroundColor: pointColors,
            pointBorderColor: pointColors,
            pointRadius: pointRadius,
            pointHoverRadius: 9,
            tension: 0.35,
            fill: true,
          }]
        },
        options: {
          responsive: true,
          animation: { duration: 800, easing: 'easeOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: {
              ...tooltipDefaults,
              callbacks: {
                label: c => ` ${c.parsed.y}${c.parsed.y === minVal ? '  ★ Best' : ''}`
              }
            }
          },
          scales: {
            x: { ticks:{color:'#64748b',font:{family:'Share Tech Mono',size:10}}, grid:{color:'rgba(255,255,255,0.05)'} },
            y: { ticks:{color:'#64748b',font:{family:'Share Tech Mono',size:10}}, grid:{color:'rgba(255,255,255,0.07)'}, beginAtZero:true }
          }
        }
      });
    }

    function renderCompCharts(results, procs) {
      const labels = results.map(r => r.label);

      makeLineChart('chartWT',    labels, results.map(r=>r.avgWT));
      makeLineChart('chartTAT',   labels, results.map(r=>r.avgTAT));
      makeLineChart('chartMaxWT', labels, results.map(r=>r.maxWT));

      // Per-process WT line chart — one line per algorithm
      const procIds = procs.map(p=>p.id).sort((a,b)=>parseInt(a.slice(1))-parseInt(b.slice(1)));
      const ppCtx = document.getElementById('chartPerProc').getContext('2d');
      chartInstances['chartPerProc'] = new Chart(ppCtx, {
        type: 'line',
        data: {
          labels: procIds,
          datasets: results.map((r, i) => ({
            label: r.label,
            data: procIds.map(pid => {
              const m = r.metrics.find(x=>x.id===pid);
              return m ? m.wt : 0;
            }),
            borderColor: ALGO_BORDERS[i],
            backgroundColor: ALGO_BORDERS[i] + '18',
            pointBackgroundColor: ALGO_BORDERS[i],
            pointBorderColor: ALGO_BORDERS[i],
            pointRadius: 5,
            pointHoverRadius: 8,
            borderWidth: 2.5,
            tension: 0.35,
            fill: false,
          }))
        },
        options: {
          responsive: true,
          animation: { duration: 800, easing: 'easeOutQuart' },
          plugins: {
            legend: {
              display: true,
              labels: { color:'#94a3b8', font:{family:'Share Tech Mono', size:10}, boxWidth:12, padding:12 }
            },
            tooltip: { ...tooltipDefaults }
          },
          scales: {
            x: { ticks:{color:'#64748b',font:{family:'Share Tech Mono',size:10}}, grid:{color:'rgba(255,255,255,0.05)'} },
            y: { ticks:{color:'#64748b',font:{family:'Share Tech Mono',size:10}}, grid:{color:'rgba(255,255,255,0.07)'}, beginAtZero:true }
          }
        }
      });
    }

    function renderCmpTable(results) {
      const table = document.getElementById('cmpTable');

      const metricKeys = ['avgWT','avgTAT','maxWT','maxTAT'];
      const metricNames = ['Avg WT','Avg TAT','Max WT','Max TAT'];

      // Find best (min) for each metric
      const bests = metricKeys.map(m => Math.min(...results.map(r=>r[m])));
      const worsts = metricKeys.map(m => Math.max(...results.map(r=>r[m])));

      let html = `<thead><tr><th>Algorithm</th>${metricNames.map(n=>`<th>${n}</th>`).join('')}</tr></thead><tbody>`;

      // Score each for rank
      const scores = results.map(() => 0);
      metricKeys.forEach(m => {
        const sorted = [...results].sort((a,b)=>a[m]-b[m]);
        sorted.forEach((r,rank) => { scores[results.indexOf(r)] += rank+1; });
      });
      const rankOrder = [...scores].sort((a,b)=>a-b);

      results.forEach((r, i) => {
        const cells = metricKeys.map((m, mi) => {
          const v = r[m];
          if (v === bests[mi]) return `<td class="cell-best">${v}</td>`;
          if (v === worsts[mi]) return `<td class="cell-worst">${v}</td>`;
          return `<td>${v}</td>`;
        });
        html += `<tr><td><span style="color:${ALGO_BORDERS[i]};font-weight:bold">${r.label}</span></td>${cells.join('')}</tr>`;
      });

      html += '</tbody>';
      table.innerHTML = html;
    }

    // CSV Download
    function downloadCSV() {
      const btn = document.getElementById('btnCsv');

      if (!_lastMetrics || _lastMetrics.length === 0) {
        btn.textContent = '⚠ Run simulation first';
        setTimeout(() => { btn.innerHTML = '📥 &nbsp;Download CSV'; }, 2000);
        return;
      }

      const algo = document.getElementById('algoBadge').textContent || 'Result';
      const ts   = new Date().toLocaleString('en-US', {
        year:'numeric', month:'short', day:'2-digit',
        hour:'2-digit', minute:'2-digit', hour12:false
      });

      // Build CSV lines
      const lines = [];

      // Metadata header block
      lines.push('OS Scheduler Results');
      lines.push(`Algorithm,${algo}`);
      lines.push(`Generated,${ts}`);
      lines.push('');

      // Column headers
      lines.push('Process,Arrival Time,Burst Time,Completion Time,Turnaround Time,Waiting Time');

      // One row per process
      _lastMetrics.forEach(m => {
        lines.push(`${m.id},${m.at},${m.bt},${m.ct},${m.tat},${m.wt}`);
      });

      // Summary rows (pulled from the rendered avg-row cells)
      lines.push('');
      document.querySelectorAll('#outTable tr.avg-row').forEach(row => {
        const cells = [...row.querySelectorAll('td')];
        const label = cells[0]?.textContent?.trim() || '';
        const value = cells[cells.length - 1]?.textContent?.trim() || '';
        lines.push(`${label},${value}`);
      });

      // Trigger browser download
      const csv  = lines.join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const filename = `os-scheduler-${algo.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.csv`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      btn.innerHTML = '✅ &nbsp;Downloaded!';
      setTimeout(() => { btn.innerHTML = '📥 &nbsp;Download CSV'; }, 2000);
    }

    //  Animated CPU Background
  (function() {
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');
    let W, H, particles, pulses;

    const NODES = 18;
    const PULSE_INTERVAL = 90;
    let frame = 0;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function initNodes() {
      particles = Array.from({length: NODES}, (_, i) => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        label: ['P1','P2','P3','CPU','I/O','ALU','RAM','OS','RR','SJF','FCFS','IRQ','CLK','BUS','PCB','TLB','DMA','INT'][i % 18],
        size: Math.random() * 6 + 4,
        pulse: 0,
      }));
      pulses = [];
    }

    function getColor() {
      const theme = document.documentElement.getAttribute('data-theme');
      return theme === 'light'
        ? { node: '#0284C7', line: '#0284C720', text: '#0284C7', pulse: '#EA580C' }
        : { node: '#00d4ff', line: '#00d4ff18', text: '#00d4ff', pulse: '#00ff88' };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const C = getColor();
      frame++;

      // Move nodes
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        if (p.pulse > 0) p.pulse -= 0.03;
      });

      // Spawn pulse along a random edge
      if (frame % PULSE_INTERVAL === 0) {
        const a = particles[Math.floor(Math.random() * particles.length)];
        const b = particles[Math.floor(Math.random() * particles.length)];
        if (a !== b) pulses.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y, t: 0, src: a, dst: b });
        a.pulse = 1;
      }

      // Draw edges between nearby nodes
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 200) {
            ctx.beginPath();
            ctx.strokeStyle = C.line;
            ctx.lineWidth = 1;
            ctx.globalAlpha = (1 - dist / 200) * 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      // Draw pulses (data travelling along edges)
      pulses = pulses.filter(p => p.t <= 1);
      pulses.forEach(p => {
        p.t += 0.012;
        const x = p.ax + (p.bx - p.ax) * p.t;
        const y = p.ay + (p.by - p.ay) * p.t;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = C.pulse;
        ctx.shadowColor = C.pulse;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw nodes
      particles.forEach(p => {
        const r = p.size + (p.pulse > 0 ? p.pulse * 6 : 0);

        // Glow ring when pulsing
        if (p.pulse > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 6, 0, Math.PI * 2);
          ctx.strokeStyle = C.pulse;
          ctx.globalAlpha = p.pulse * 0.5;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = C.node + '22';
        ctx.fill();
        ctx.strokeStyle = C.node;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Label
        ctx.font = `bold 9px 'Share Tech Mono', monospace`;
        ctx.fillStyle = C.text;
        ctx.globalAlpha = 0.6;
        ctx.textAlign = 'center';
        ctx.fillText(p.label, p.x, p.y + 3);
        ctx.globalAlpha = 1;
      });

      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', () => { resize(); initNodes(); });
    resize();
    initNodes();
    draw();
  })();