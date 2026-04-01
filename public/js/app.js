/**
 * Main Application Logic for MailMind
 * Connects the UI to the API Services.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const els = {
    // Inputs
    intentInput: document.getElementById('intent-input'),
    receiverEmail: document.getElementById('receiver-email'),
    toneChips: document.querySelectorAll('.chip'),
    
    // Editor
    draftSubject: document.getElementById('draft-subject'),
    draftBody: document.getElementById('draft-body'),
    receiverBadge: document.getElementById('detected-receiver-badge'),
    loadingIndicator: document.getElementById('loading-indicator'),
    
    // Buttons
    btnGenerate: document.getElementById('btn-generate'),
    btnRegenerate: document.getElementById('btn-regenerate'),
    btnSend: document.getElementById('btn-send'),
    
    // Panels
    historyContainer: document.getElementById('history-container'),
    historyFilterSelect: document.getElementById('history-filter-select'),
    toastContainer: document.getElementById('toast-container'),
  };

  let state = {
    currentTone: 'formal',
    currentDraft: null,
    isGenerating: false,
    parsedIntent: null, // We store the receiver/purpose parsed by IntentAgent if returned
    historyFilter: 'all' // all, sent, draft
  };

  // Initialization
  init();

  function init() {
    setupEventListeners();
    loadHistory();
  }

  function setupEventListeners() {
    // Tone Selection
    els.toneChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        els.toneChips.forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        state.currentTone = e.target.dataset.tone;
      });
    });

    // Primary Actions
    els.btnGenerate.addEventListener('click', handleGenerate);
    els.btnRegenerate.addEventListener('click', handleGenerate);
    els.btnSend.addEventListener('click', handleSend);

    // History Filter
    if (els.historyFilterSelect) {
      els.historyFilterSelect.addEventListener('change', (e) => {
        state.historyFilter = e.target.value;
        loadHistory();
      });
    }

    // Auto-resize textarea
    els.draftBody.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
    });
  }

  // ==========================================
  // CORE WORKFLOWS
  // ==========================================

  async function handleGenerate() {
    const userInput = els.intentInput.value.trim();
    const receiverEmail = els.receiverEmail.value.trim();

    if (!userInput) {
      return showToast('Please enter what you want to say.', 'error');
    }

    setLoadingState(true);

    try {
      const result = await ApiService.generateEmail({
        userInput,
        tone: state.currentTone,
        receiverEmail
      });

      // Update State
      state.currentDraft = result;

      // Update UI
      els.draftSubject.value = result.subject || result.rawOutput?.subject || '';
      els.draftBody.value = result.body || result.rawOutput?.email_body || '';

      // Update Receiver Badge if intent data was sent back 
      // (Assuming the backend might attach intent data for debugging/UI)
      if (result.intent && result.intent.receiver) {
        state.parsedIntent = result.intent;
        els.receiverBadge.textContent = `Receiver: ${result.intent.receiver}`;
        els.receiverBadge.classList.add('active');
      }

      // Enable Actions
      els.draftSubject.removeAttribute('readonly');
      els.draftBody.removeAttribute('readonly');
      els.btnRegenerate.removeAttribute('disabled');
      els.btnSend.removeAttribute('disabled');

      if (result.usedFallback) {
        showToast('AI Service offline. Using fallback template.', 'info');
      } else {
        showToast('Draft generated successfully.', 'success');
      }

    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingState(false);
    }
  }

  async function handleSend() {
    if (!state.currentDraft) return;

    const to = els.receiverEmail.value.trim();
    const subject = els.draftSubject.value.trim();
    const body = els.draftBody.value.trim();

    if (!to) {
      return showToast('Recipient email is required to send.', 'error');
    }

    // Lock button to prevent double-sets
    const originalBtnHTML = els.btnSend.innerHTML;
    els.btnSend.innerHTML = '<div class="spinner"></div> Sending...';
    els.btnSend.setAttribute('disabled', 'true');

    try {
      // The Sender Agent contract requires `confirmed: true`
      const payload = {
        to,
        subject,
        body,
        userInput: els.intentInput.value.trim(),
        tone: state.currentTone,
        receiver: state.parsedIntent?.receiver || 'Unknown',
        purpose: state.parsedIntent?.purpose || 'general_request',
        confirmed: true
      };

      const result = await ApiService.sendEmail(payload);

      if (result.success) {
        showToast('Email sent successfully!', 'success');
        // Reset form or refresh history
        setTimeout(loadHistory, 1000);
      } else {
        // Retry logic might have failed or pending status
        if (result.status === 'pending') {
           showToast('Email is pending confirmation.', 'info');
        } else {
           showToast(`Failed to send: ${result.message}`, 'error');
        }
      }

    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      els.btnSend.innerHTML = originalBtnHTML;
      els.btnSend.removeAttribute('disabled');
      feather.replace();
    }
  }

  // ==========================================
  // HISTORY PANEL
  // ==========================================

  async function loadHistory() {
    try {
      const history = await ApiService.getHistory();
      renderHistoryItems(history);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  }

  function renderHistoryItems(items) {
    els.historyContainer.innerHTML = '';
    
    // Apply Filter
    const filteredItems = items.filter(item => {
      if (state.historyFilter === 'sent') return item.sent === true;
      if (state.historyFilter === 'draft') return item.sent === false;
      return true; // 'all'
    });
    
    if (filteredItems.length === 0) {
      els.historyContainer.innerHTML = `
        <div style="color: var(--text-muted); text-align: center; padding: 20px 0; font-size: 0.85rem;">
          No emails match the selected filter.
        </div>`;
      return;
    }

    filteredItems.forEach(item => {
      const card = document.createElement('div');
      card.className = `history-card ${!item.sent ? 'unread' : ''}`;
      
      const isSent = item.sent;
      const statusBadge = isSent 
        ? `<span class="history-badge sent">Sent</span>` 
        : `<span class="history-badge">Draft</span>`;

      const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
      });

      card.innerHTML = `
        <div class="history-meta">
          ${statusBadge}
          <span class="history-date">${dateStr}</span>
          <button class="btn-delete-history" title="Remove draft/email"><i data-feather="trash-2"></i></button>
        </div>
        <div class="history-subject">${item.subject || '(No Subject)'}</div>
      `;

      // Click to reuse
      card.addEventListener('click', () => {
        els.intentInput.value = item.userInput || '';
        els.receiverEmail.value = item.receiverEmail || '';
        els.draftSubject.value = item.subject || '';
        els.draftBody.value = item.body || '';
        
        // Setup tone
        if (item.tone) {
          els.toneChips.forEach(c => {
            c.classList.remove('active');
            if(c.dataset.tone === item.tone.toLowerCase()) {
              c.classList.add('active');
              state.currentTone = item.tone.toLowerCase();
            }
          });
        }
        
        // Setup read-only / disabled states for reuse
        els.draftSubject.removeAttribute('readonly');
        els.draftBody.removeAttribute('readonly');
        els.btnRegenerate.removeAttribute('disabled');
        els.btnSend.removeAttribute('disabled');
        
        els.draftBody.style.height = 'auto';
        els.draftBody.style.height = (els.draftBody.scrollHeight) + 'px';
      });

      // Handle Delete Action
      const delBtn = card.querySelector('.btn-delete-history');
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevents triggers the click-to-reuse above
        try {
          const success = await ApiService.deleteHistory(item.id);
          if (success) {
            showToast('Email removed from history', 'success');
            loadHistory();
          }
        } catch (err) {
          showToast('Failed to delete history item', 'error');
        }
      });

      els.historyContainer.appendChild(card);
    });
    
    feather.replace();
  }

  // ==========================================
  // UI UTILITIES
  // ==========================================

  function setLoadingState(isLoading) {
    state.isGenerating = isLoading;
    if (isLoading) {
      els.loadingIndicator.style.display = 'flex';
      els.btnGenerate.setAttribute('disabled', 'true');
      els.btnRegenerate.setAttribute('disabled', 'true');
      els.btnSend.setAttribute('disabled', 'true');
    } else {
      els.loadingIndicator.style.display = 'none';
      els.btnGenerate.removeAttribute('disabled');
    }
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';
    
    toast.innerHTML = `
      <i data-feather="${icon}"></i>
      <span>${message}</span>
    `;
    
    els.toastContainer.appendChild(toast);
    feather.replace();

    // Auto-remove
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

});
