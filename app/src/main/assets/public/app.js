// ===== PTA App — Native Mobile JavaScript =====

// ===== Splash Screen =====
window.addEventListener('load', () => {
  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash) splash.classList.add('hide');
  }, 1200);
});

// ===== Service Worker Registration =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.error('SW reg failed:', err));
  });
}

// ===== Theme Management =====
const root = document.body;
const savedTheme = localStorage.getItem('theme');
if (savedTheme) root.dataset.theme = savedTheme;

function updateThemeIcon() {
  const icon = document.querySelector('#themeToggle i');
  if (icon) icon.className = root.dataset.theme === 'light' ? 'bi bi-moon' : 'bi bi-sun';
}
updateThemeIcon();

document.getElementById('themeToggle').addEventListener('click', () => {
  const current = root.dataset.theme;
  const next = current === 'light' ? 'dark' : 'light';
  root.dataset.theme = next;
  localStorage.setItem('theme', next);
  updateThemeIcon();
});

// ===== Tab Navigation (Page Switching) =====
const tabs = document.querySelectorAll('.tab-item');
const pages = document.querySelectorAll('.page');

function switchPage(pageId) {
  pages.forEach((p) => p.classList.remove('active'));
  tabs.forEach((t) => t.classList.remove('active'));

  const page = document.getElementById(pageId);
  const tab = document.querySelector(`.tab-item[data-page="${pageId}"]`);

  if (page) page.classList.add('active');
  if (tab) tab.classList.add('active');

  // Update app bar title
  const titles = {
    'page-home': 'Precious Tots Academy',
    'page-programs': 'Programs',
    'page-gallery': 'Gallery',
    'page-contact': 'Contact',
    'page-admin': 'Admin Panel',
  };
  const titleEl = document.getElementById('appBarTitle');
  if (titleEl && titles[pageId]) titleEl.textContent = titles[pageId];

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Trigger scroll animations
  setTimeout(handleScrollAnimation, 100);
}

tabs.forEach((tab) => {
  tab.addEventListener('click', (e) => {
    e.preventDefault();
    const pageId = tab.getAttribute('data-page');
    switchPage(pageId);
  });
});

// ===== Bottom Sheet Management =====
function showSheet(sheetId) {
  const overlay = document.getElementById('sheetOverlay');
  const sheet = document.getElementById(sheetId);
  if (overlay) overlay.classList.add('show');
  if (sheet) sheet.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function hideSheet() {
  const overlay = document.getElementById('sheetOverlay');
  const sheets = document.querySelectorAll('.bottom-sheet');
  if (overlay) overlay.classList.remove('show');
  sheets.forEach((s) => s.classList.remove('show'));
  document.body.style.overflow = '';

  // Clear forms and alerts
  sheets.forEach((sheet) => {
    sheet.querySelectorAll('form').forEach((f) => f.reset());
    sheet.querySelectorAll('.alert-message').forEach((a) => a.remove());
  });
}

document.getElementById('sheetOverlay').addEventListener('click', hideSheet);

// Close sheet on handle click
document.querySelectorAll('.sheet-handle').forEach((h) => {
  h.addEventListener('click', hideSheet);
});

// ===== Auth Sheet Triggers =====
document.getElementById('loginTrigger').addEventListener('click', async () => {
  if (sb) await sb.auth.signOut();
  showAuthLanding('loginPanel');
});
document.getElementById('signupTrigger').addEventListener('click', () => showAuthLanding('signupPanel'));

function showAuthLanding(panelId = 'loginPanel') {
  document.getElementById('authLanding').style.display = 'flex';
  document.querySelectorAll('.protected-app').forEach((el) => { el.style.display = 'none'; });
  document.querySelectorAll('.auth-panel').forEach((panel) => panel.classList.toggle('active', panel.id === panelId));
  document.querySelectorAll('.auth-tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.authPanel === panelId));
}

function showProtectedApp(user) {
  document.getElementById('authLanding').style.display = 'none';
  document.querySelectorAll('.protected-app').forEach((el) => { el.style.display = ''; });
  switchPage('page-home');
  updateNavigationForLoggedInUser(user);
}

document.querySelectorAll('.auth-tab').forEach((tab) => {
  tab.addEventListener('click', () => showAuthLanding(tab.dataset.authPanel));
});

// Switch between auth sheets
document.querySelectorAll('[data-sheet]').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    hideSheet();
    setTimeout(() => showSheet(el.getAttribute('data-sheet')), 300);
  });
});

document.getElementById('backToLogin')?.addEventListener('click', (e) => {
  e.preventDefault();
  hideSheet();
  showAuthLanding('loginPanel');
});

// ===== Alert Helper =====
function showAlert(message, type = 'error', sheetId) {
  const sheet = sheetId ? document.getElementById(sheetId) : document.querySelector('.bottom-sheet.show');
  if (!sheet) {
    const panel = document.querySelector('.auth-panel.active');
    const container = panel && panel.querySelector('.auth-alerts');
    if (!container) return;
    container.querySelectorAll('.alert-message').forEach((a) => a.remove());
    const alert = document.createElement('div');
    alert.className = `alert-message alert-${type}`;
    alert.textContent = message;
    container.appendChild(alert);
    return;
  }

  sheet.querySelectorAll('.alert-message').forEach((a) => a.remove());

  const alert = document.createElement('div');
  alert.className = `alert-message alert-${type}`;
  alert.textContent = message;

  const content = sheet.querySelector('.sheet-content') || sheet.querySelector('.sheet-icon').parentNode;
  content.insertBefore(alert, content.firstChild);

  setTimeout(() => alert.remove(), 5000);
}

function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}

// ===== Supabase Auth =====
console.log('DEBUG: window.supabase =', typeof window.supabase, window.supabase);
console.log('DEBUG: window.sb =', typeof window.sb, window.sb);
const sb = window.sb || (window.supabase && window.supabase.auth ? window.supabase : null);
console.log('DEBUG: sb =', typeof sb, sb);

// ===== Admin Constants (production admins) =====
const ADMIN_EMAILS = [
  'precioustotsacademy@outlook.com',
  'precioustotsacademy@gmail.com',
  'admin@precioustotsacademy.com',
  '2frankincense4m@gmail.com',
];

function isAdmin(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// ===== Biometric / Screen Lock 2FA =====
let biometricUnlocked = false;
let biometricEnabled = localStorage.getItem('biometricEnabled') === 'true';

async function checkBiometricAvailability() {
  if (!window.Capacitor || !window.Capacitor.Plugins.BiometricAuth) return null;
  try {
    const result = await window.Capacitor.Plugins.BiometricAuth.checkBiometry();
    return result;
  } catch (e) {
    console.error('Biometric check error:', e);
    return null;
  }
}

async function biometricAuthenticate() {
  if (!window.Capacitor || !window.Capacitor.Plugins.BiometricAuth) {
    // Web fallback — no biometric on web, auto-pass
    biometricUnlocked = true;
    return true;
  }
  try {
    await window.Capacitor.Plugins.BiometricAuth.authenticate({
      reason: 'Authenticate to access PTA',
      allowDeviceCredential: true,
      androidBiometryStrength: 'weak',
    });
    biometricUnlocked = true;
    return true;
  } catch (e) {
    console.error('Biometric auth error:', e);
    return false;
  }
}

function showBiometricLock() {
  const lock = document.getElementById('biometricLock');
  if (lock) lock.style.display = 'flex';
}

function hideBiometricLock() {
  const lock = document.getElementById('biometricLock');
  if (lock) lock.style.display = 'none';
}

async function tryBiometricUnlock() {
  const success = await biometricAuthenticate();
  if (success) {
    hideBiometricLock();
  } else {
    const msg = document.getElementById('biometricMsg');
    if (msg) msg.textContent = 'Authentication failed. Try again.';
  }
}

// Initialize biometric on app load if enabled and user is logged in
async function initBiometricIfNeeded() {
  if (!biometricEnabled) return;
  const { data } = await sb.auth.getSession();
  if (!data.session) return;

  const biometry = await checkBiometricAvailability();
  if (biometry && biometry.isAvailable) {
    showBiometricLock();
    await tryBiometricUnlock();
  }
}

// Biometric lock button handlers
document.addEventListener('DOMContentLoaded', () => {
  const unlockBtn = document.getElementById('biometricUnlockBtn');
  if (unlockBtn) unlockBtn.addEventListener('click', tryBiometricUnlock);
});

// Signup form
document.getElementById('signupForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const fullName = document.getElementById('fullName').value.trim();
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const submitButton = this.querySelector('.auth-btn');

  if (!fullName || !email || !password || !confirmPassword) {
    showAlert('Please fill in all fields');
    return;
  }
  if (password !== confirmPassword) {
    showAlert('Passwords do not match');
    return;
  }
  if (password.length < 6) {
    showAlert('Password must be at least 6 characters long');
    return;
  }
  if (!sb) {
    showAlert('Authentication service not available.', 'error');
    return;
  }

  try {
    setButtonLoading(submitButton, true);
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, invite_status: 'pending' } }
    });
    if (error) throw error;

    if (data.user && data.session === null) {
      showAlert('Request sent. Confirm your email, then wait for the administrator to provide your invite code.', 'success');
    } else {
      await sb.auth.signOut();
      showAlert('Request sent to the administrator. You can log in after receiving your invite code.', 'success');
    }
    this.reset();
    setTimeout(() => showAuthLanding('loginPanel'), 2500);
  } catch (error) {
    console.error('Signup error:', error);
    let msg = 'Signup failed. Please try again.';
    if (error.message) {
      if (error.message.includes('already registered')) msg = 'This email is already registered. Please login.';
      else if (error.message.includes('invalid email')) msg = 'Please enter a valid email address.';
      else if (error.message.includes('weak password')) msg = 'Password is too weak. Please choose a stronger password.';
      else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('network')) msg = 'Network error. Check your internet connection and try again.';
      else msg = 'Signup failed: ' + error.message;
    }
    showAlert(msg);
  } finally {
    setButtonLoading(submitButton, false);
  }
});

// Login form
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const inviteCode = document.getElementById('loginInviteCode').value.trim().toUpperCase();
  const submitButton = this.querySelector('.auth-btn');

  if (!email || !password || (!isAdmin(email) && !inviteCode)) {
    showAlert('Please fill in all fields');
    return;
  }

  if (!sb) {
    showAlert('Authentication service not available.', 'error');
    return;
  }

  try {
    setButtonLoading(submitButton, true);
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (!isAdmin(data.user.email)) {
      const verifiedUser = await verifyInviteCode(inviteCode);
      data.user = verifiedUser;
    }

    this.reset();
    showProtectedApp(data.user);

    // Trigger biometric lock if enabled
    if (biometricEnabled) {
      setTimeout(() => initBiometricIfNeeded(), 1600);
    }
  } catch (error) {
    console.error('Login error:', error);
    if (sb) await sb.auth.signOut();
    let msg = 'Login failed. Please check your credentials.';
    if (error.message.includes('Invalid login')) msg = 'Invalid email or password.';
    else if (error.message.includes('not confirmed')) msg = 'Please confirm your email first.';
    else if (error.message.includes('too many')) msg = 'Too many attempts. Try again later.';
    else if (error.message.includes('invite') || error.message.includes('approval')) msg = error.message;
    showAlert(msg);
  } finally {
    setButtonLoading(submitButton, false);
  }
});

// Forgot password
document.getElementById('forgotPasswordForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value;
  const submitButton = this.querySelector('.auth-btn');

  if (!email) {
    showAlert('Please enter your email address');
    return;
  }

  if (!sb) {
    showAlert('Authentication service not available.', 'error');
    return;
  }

  try {
    setButtonLoading(submitButton, true);
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    if (error) throw error;

    showAlert('Password reset email sent! Check your inbox.', 'success');
    this.reset();
    setTimeout(() => hideSheet(), 3000);
  } catch (error) {
    console.error('Password reset error:', error);
    let msg = 'Failed to send reset email. Please try again.';
    if (error.message.includes('not found')) msg = 'No account found with this email.';
    else if (error.message.includes('invalid email')) msg = 'Please enter a valid email address.';
    showAlert(msg);
  } finally {
    setButtonLoading(submitButton, false);
  }
});

// Update nav for logged-in user
function updateNavigationForLoggedInUser(user) {
  const loginTrigger = document.getElementById('loginTrigger');
  if (loginTrigger) {
    const name = (user.user_metadata && (user.user_metadata.first_name || user.user_metadata.full_name)) || user.email.split('@')[0];
    loginTrigger.innerHTML = `<i class="bi bi-person-check"></i> ${name}`;
    loginTrigger.onclick = async () => {
      if (sb) {
        await sb.auth.signOut();
        showAuthLanding('loginPanel');
      }
    };
  }
  // Show upload section if logged in
  const uploadSection = document.getElementById('uploadSection');
  if (uploadSection) uploadSection.style.display = isAdmin(user.email) ? 'block' : 'none';

  // Show admin tab if user is admin
  if (isAdmin(user.email)) {
    const adminTab = document.getElementById('adminTab');
    if (adminTab) adminTab.style.display = 'flex';
    loadAdminMembers();
  }

  // Show biometric toggle in settings
  const biometricToggle = document.getElementById('biometricToggleContainer');
  if (biometricToggle) biometricToggle.style.display = 'block';
}

// Check auth state on load
if (sb) {
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') showAuthLanding('loginPanel');
    if (session && session.user && (isAdmin(session.user.email) || session.user.app_metadata?.invite_status === 'approved')) {
      showProtectedApp(session.user);
    }
  });

  // Check existing session
  sb.auth.getSession().then(({ data }) => {
    if (data.session && data.session.user && (isAdmin(data.session.user.email) || data.session.user.app_metadata?.invite_status === 'approved')) {
      showProtectedApp(data.session.user);
    } else {
      showAuthLanding('signupPanel');
    }
  });
}

// ===== Upload Logic (Supabase Storage) =====

// ===== Side Menu & Community Chat =====
let chatChannel = null;
function closeMenu() { document.getElementById('sideMenu')?.classList.remove('show'); document.getElementById('menuOverlay')?.classList.remove('show'); }
document.getElementById('menuToggle')?.addEventListener('click', () => { document.getElementById('sideMenu')?.classList.add('show'); document.getElementById('menuOverlay')?.classList.add('show'); });
document.getElementById('menuClose')?.addEventListener('click', closeMenu);
document.getElementById('menuOverlay')?.addEventListener('click', closeMenu);
document.querySelectorAll('[data-menu-page]').forEach(btn => btn.addEventListener('click', () => { const page = btn.dataset.menuPage; closeMenu(); switchPage(page); if (page === 'page-chat') loadChatMessages(); }));
document.getElementById('settingsMenuToggle')?.addEventListener('click', (event) => {
  const button = event.currentTarget;
  const submenu = document.getElementById('settingsSubmenu');
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded));
  if (submenu) submenu.hidden = expanded;
});
document.querySelectorAll('[data-menu-sheet]').forEach((button) => button.addEventListener('click', () => {
  closeMenu();
  showSheet(button.dataset.menuSheet);
}));

document.getElementById('changePasswordForm')?.addEventListener('submit', async function (event) {
  event.preventDefault();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmNewPassword').value;
  const submitButton = this.querySelector('.auth-btn');

  if (newPassword.length < 6) {
    showAlert('Your new password must be at least 6 characters.', 'error', 'changePasswordSheet');
    return;
  }
  if (newPassword !== confirmPassword) {
    showAlert('The new passwords do not match.', 'error', 'changePasswordSheet');
    return;
  }
  if (currentPassword === newPassword) {
    showAlert('Choose a new password that is different from your current password.', 'error', 'changePasswordSheet');
    return;
  }

  setButtonLoading(submitButton, true);
  try {
    if (!sb) throw new Error('Account service is unavailable.');
    const { data: sessionData, error: sessionError } = await sb.auth.getSession();
    if (sessionError || !sessionData.session?.user?.email) throw new Error('Your session has expired. Please log in again.');

    const email = sessionData.session.user.email;
    const { error: verifyError } = await sb.auth.signInWithPassword({ email, password: currentPassword });
    if (verifyError) throw new Error('Your current password is incorrect.');

    const { error: updateError } = await sb.auth.updateUser({ password: newPassword });
    if (updateError) throw updateError;

    this.reset();
    showAlert('Password changed successfully.', 'success', 'changePasswordSheet');
    setTimeout(hideSheet, 1200);
  } catch (error) {
    showAlert(error.message || 'Unable to change your password. Please try again.', 'error', 'changePasswordSheet');
  } finally {
    setButtonLoading(submitButton, false);
  }
});
function renderChatMessage(m, uid) { const row=document.createElement('div'); row.className='chat-message'+(m.user_id===uid?' mine':''); const n=document.createElement('strong'); n.textContent=m.sender_name||'PTA Member'; const p=document.createElement('p'); p.textContent=m.body; const t=document.createElement('small'); t.textContent=new Date(m.created_at).toLocaleString(); row.append(n,p,t); return row; }
async function loadChatMessages() { if(!sb)return; const {data:s}=await sb.auth.getSession(); if(!s.session)return; const box=document.getElementById('chatMessages'); const {data,error}=await sb.from('chat_messages').select('*').order('created_at',{ascending:true}).limit(200); box.innerHTML=''; if(error){box.textContent='Chatroom setup is required in Supabase.';return;} data.forEach(m=>box.appendChild(renderChatMessage(m,s.session.user.id))); box.scrollTop=box.scrollHeight; if(!chatChannel)chatChannel=sb.channel('pta-chat').on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages'},p=>{box.appendChild(renderChatMessage(p.new,s.session.user.id));box.scrollTop=box.scrollHeight;}).subscribe(); }
document.getElementById('chatForm')?.addEventListener('submit',async e=>{e.preventDefault();const input=document.getElementById('chatInput'),body=input.value.trim();if(!body)return;const {data}=await sb.auth.getSession(),user=data.session?.user;if(!user)return;const sender_name=user.user_metadata?.full_name||user.user_metadata?.first_name||user.email.split('@')[0];const {error}=await sb.from('chat_messages').insert({user_id:user.id,sender_name,body});if(!error)input.value='';else alert(error.message);});

const STORAGE_BUCKET = 'pta_uploads';

function getCurrentUserId() {
  if (!sb) return null;
  return null;
}

async function uploadFile(file, category) {
  if (!sb) { showUploadAlert('Service not available.', 'error'); return; }

  const { data: sessionData } = await sb.auth.getSession();
  if (!sessionData.session) {
    showUploadAlert('Please login to upload files.', 'error');
    showAuthLanding('loginPanel');
    return;
  }

  const userId = sessionData.session.user.id;
  const ext = file.name.split('.').pop().toLowerCase();
  const fileName = `${category}/${userId}/${Date.now()}.${ext}`;
  const validTypes = {
    photo: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'heif'],
    pdf: ['pdf'],
    video: ['mp4', 'mov', 'avi', 'mkv', 'webm']
  };

  if (!validTypes[category] || !validTypes[category].includes(ext)) {
    showUploadAlert(`Invalid file type for ${category}. Allowed: ${validTypes[category].join(', ')}`, 'error');
    return;
  }

  const maxSize = category === 'video' ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
  if (file.size > maxSize) {
    showUploadAlert(`File too large. Max: ${category === 'video' ? '100MB' : '20MB'}`, 'error');
    return;
  }

  const progressEl = document.getElementById('uploadProgress');
  if (progressEl) { progressEl.style.display = 'block'; progressEl.textContent = 'Uploading...'; }

  try {
    const { data, error } = await sb.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, { contentType: file.type, upsert: false });

    if (error) throw error;

    const { data: urlData } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
    showUploadAlert(`${category.charAt(0).toUpperCase() + category.slice(1)} uploaded successfully!`, 'success');
    addGalleryItem(urlData.publicUrl, category, file.name);
  } catch (error) {
    console.error('Upload error:', error);
    let msg = 'Upload failed. Please try again.';
    if (error.message.includes('not found') || error.message.includes('bucket')) {
      msg = 'Storage bucket not found. Please create "pta_uploads" bucket in Supabase dashboard.';
    } else if (error.message.includes('policy') || error.message.includes('permission')) {
      msg = 'Upload permission denied. Please configure storage policies in Supabase dashboard.';
    }
    showUploadAlert(msg, 'error');
  } finally {
    if (progressEl) { progressEl.style.display = 'none'; }
  }
}

function showUploadAlert(message, type = 'error') {
  const container = document.getElementById('uploadAlerts');
  if (!container) return;
  container.querySelectorAll('.alert-message').forEach((a) => a.remove());
  const alert = document.createElement('div');
  alert.className = `alert-message alert-${type}`;
  alert.textContent = message;
  container.appendChild(alert);
  setTimeout(() => alert.remove(), 5000);
}

function addGalleryItem(url, category, fileName) {
  const galleryGrid = document.querySelector('#page-gallery .gallery-grid');
  if (!galleryGrid) return;
  const item = document.createElement('div');
  item.className = 'gallery-item scroll-animate animated';
  if (category === 'photo') {
    item.innerHTML = `<img src="${url}" alt="${fileName}" style="width:100%;height:120px;object-fit:cover;border-radius:10px;margin-bottom:6px;"><h4>${fileName}</h4>`;
  } else if (category === 'pdf') {
    item.innerHTML = `<i class="bi bi-file-earmark-pdf gallery-icon"></i><h4>${fileName}</h4><a href="${url}" target="_blank" class="auth-link" style="font-size:0.7rem;">View PDF</a>`;
  } else if (category === 'video') {
    item.innerHTML = `<video src="${url}" controls style="width:100%;height:120px;object-fit:cover;border-radius:10px;margin-bottom:6px;"></video><h4 style="font-size:0.75rem;">${fileName}</h4>`;
  }
  galleryGrid.prepend(item);
}

// File input handlers
document.addEventListener('DOMContentLoaded', () => {
  const photoInput = document.getElementById('photoInput');
  const pdfInput = document.getElementById('pdfInput');
  const videoInput = document.getElementById('videoInput');

  if (photoInput) photoInput.addEventListener('change', (e) => {
    if (e.target.files[0]) uploadFile(e.target.files[0], 'photo');
  });
  if (pdfInput) pdfInput.addEventListener('change', (e) => {
    if (e.target.files[0]) uploadFile(e.target.files[0], 'pdf');
  });
  if (videoInput) videoInput.addEventListener('change', (e) => {
    if (e.target.files[0]) uploadFile(e.target.files[0], 'video');
  });
});

// Camera capture (Capacitor)
async function capturePhoto() {
  if (!window.Capacitor || !window.Capacitor.Plugins.Camera) {
    // Fallback: trigger file input with camera capture
    const photoInput = document.getElementById('photoInput');
    if (photoInput) { photoInput.setAttribute('capture', 'environment'); photoInput.click(); }
    return;
  }
  try {
    const photo = await window.Capacitor.Plugins.Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: 'uri',
      source: 'CAMERA'
    });
    const blob = await fetch(photo.webPath).then(r => r.blob());
    const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
    uploadFile(file, 'photo');
  } catch (err) {
    console.error('Camera error:', err);
  }
}

if (document.getElementById('cameraBtn')) {
  document.getElementById('cameraBtn').addEventListener('click', capturePhoto);
}

// ===== Admin Member Management (via Supabase Edge Function) =====
const EDGE_FUNCTION_URL = 'https://pvhfkjinyrgxakvsoblp.supabase.co/functions/v1/admin-operations';

async function verifyInviteCode(inviteCode) {
  const headers = await getAdminHeaders();
  const res = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'verifyInviteCode', inviteCode }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Invite code verification failed.');
  const { data: refreshed, error } = await sb.auth.refreshSession();
  if (error || !refreshed.user) throw error || new Error('Could not refresh your access.');
  return refreshed.user;
}

async function getAdminHeaders() {
  const { data: sessionData } = await sb.auth.getSession();
  if (!sessionData.session) throw new Error('Not authenticated');
  return {
    'Authorization': `Bearer ${sessionData.session.access_token}`,
    'Content-Type': 'application/json',
  };
}

async function loadAdminMembers() {
  if (!sb) return;
  const { data: sessionData } = await sb.auth.getSession();
  if (!sessionData.session || !isAdmin(sessionData.session.user.email)) return;

  const listEl = document.getElementById('adminMemberList');
  const loadingEl = document.getElementById('adminLoading');
  if (loadingEl) loadingEl.style.display = 'block';
  if (listEl) listEl.innerHTML = '';

  try {
    const headers = await getAdminHeaders();
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'listUsers' }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Failed to load members');

    if (loadingEl) loadingEl.style.display = 'none';

    if (!data.users || data.users.length === 0) {
      if (listEl) listEl.innerHTML = '<p style="text-align:center;opacity:0.6;font-size:0.85rem;">No members found.</p>';
      return;
    }

    data.users.forEach((u) => {
      const name = (u.user_metadata && (u.user_metadata.first_name || u.user_metadata.full_name)) || u.email.split('@')[0];
      const userIsAdmin = isAdmin(u.email);
      const inviteStatus = u.app_metadata?.invite_status || (userIsAdmin ? 'approved' : 'pending');
      const item = document.createElement('div');
      item.className = 'admin-member-item';
      item.innerHTML = `
        <div class="admin-member-info">
          <i class="bi ${userIsAdmin ? 'bi-shield-check' : 'bi-person'} admin-member-icon"></i>
          <div>
            <div class="admin-member-name">${name}</div>
            <div class="admin-member-email">${u.email}</div>
          </div>
        </div>
        <div class="admin-member-actions">
          ${userIsAdmin ? '<span class="admin-badge">Admin</span>' : `${inviteStatus !== 'approved' ? `<button class="admin-code-btn" data-user-id="${u.id}" data-email="${u.email}"><i class="bi bi-key"></i> Issue code</button>` : '<span class="admin-badge">Active</span>'}<button class="admin-action-btn admin-remove" data-user-id="${u.id}" data-email="${u.email}"><i class="bi bi-person-x"></i></button>`}
        </div>
      `;
      if (listEl) listEl.appendChild(item);
    });

    // Wire remove buttons
    listEl.querySelectorAll('.admin-remove').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const userId = btn.getAttribute('data-user-id');
        const email = btn.getAttribute('data-email');
        if (confirm(`Remove user ${email}? This will delete their account.`)) {
          await removeMember(userId);
        }
      });
    });

    listEl.querySelectorAll('.admin-code-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          const headers = await getAdminHeaders();
          const res = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST', headers,
            body: JSON.stringify({ action: 'issueInviteCode', userId: btn.dataset.userId }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Could not issue code');
          showInviteShareOptions(btn.dataset.email, data.inviteCode);
          loadAdminMembers();
        } catch (error) {
          showAdminAlert(error.message, 'error');
          btn.disabled = false;
        }
      });
    });
  } catch (error) {
    console.error('Admin list error:', error);
    if (loadingEl) loadingEl.style.display = 'none';
    if (listEl) listEl.innerHTML = '<p style="text-align:center;color:var(--primary-red);font-size:0.85rem;">Failed to load members. ' + (error.message || '') + '</p>';
  }
}

async function removeMember(userId) {
  if (!sb) return;
  try {
    const headers = await getAdminHeaders();
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'deleteUser', userId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove member');
    loadAdminMembers();
    showAdminAlert('Member removed successfully.', 'success');
  } catch (error) {
    console.error('Remove member error:', error);
    showAdminAlert('Failed to remove member. ' + (error.message || ''), 'error');
  }
}

async function inviteMember(email, firstName, lastName) {
  if (!sb) return;
  try {
    const headers = await getAdminHeaders();
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'inviteUser', email, firstName, lastName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send invitation');
    showAdminAlert(`Invitation sent to ${email}!`, 'success');
    loadAdminMembers();
  } catch (error) {
    console.error('Invite error:', error);
    let msg = 'Failed to send invitation.';
    if (error.message.includes('already')) msg = 'This email is already registered.';
    showAdminAlert(msg, 'error');
  }
}

function showAdminAlert(message, type = 'error') {
  const container = document.getElementById('adminAlerts');
  if (!container) return;
  container.querySelectorAll('.alert-message').forEach((a) => a.remove());
  const alert = document.createElement('div');
  alert.className = `alert-message alert-${type}`;
  alert.textContent = message;
  container.appendChild(alert);
  setTimeout(() => alert.remove(), 5000);
}

function showInviteShareOptions(email, inviteCode) {
  const container = document.getElementById('adminAlerts');
  if (!container) return;
  container.querySelectorAll('.alert-message, .invite-share-panel').forEach((el) => el.remove());

  const message = `Your Precious Tots Academy account has been approved.\n\nInvite code: ${inviteCode}\n\nOpen the PTA app and log in with your email, password, and this invite code. Please keep this code private.`;
  const panel = document.createElement('div');
  panel.className = 'invite-share-panel';

  const summary = document.createElement('p');
  summary.textContent = `Invite code for ${email}: ${inviteCode}`;
  panel.appendChild(summary);

  const actions = document.createElement('div');
  actions.className = 'invite-share-actions';

  const emailButton = document.createElement('button');
  emailButton.type = 'button';
  emailButton.className = 'invite-share-btn share-email';
  emailButton.innerHTML = '<i class="bi bi-envelope"></i> Email';
  emailButton.addEventListener('click', () => {
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Your PTA invite code')}&body=${encodeURIComponent(message)}`;
  });

  const whatsappButton = document.createElement('button');
  whatsappButton.type = 'button';
  whatsappButton.className = 'invite-share-btn share-whatsapp';
  whatsappButton.innerHTML = '<i class="bi bi-whatsapp"></i> WhatsApp';
  whatsappButton.addEventListener('click', () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  });

  actions.append(emailButton, whatsappButton);
  panel.appendChild(actions);
  container.appendChild(panel);
}

// Admin invite form handler
document.addEventListener('DOMContentLoaded', () => {
  const inviteForm = document.getElementById('inviteForm');
  if (inviteForm) {
    inviteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('inviteEmail').value;
      const firstName = document.getElementById('inviteFirstName').value;
      const lastName = document.getElementById('inviteLastName').value;
      const btn = inviteForm.querySelector('.auth-btn');
      setButtonLoading(btn, true);
      await inviteMember(email, firstName, lastName);
      setButtonLoading(btn, false);
      inviteForm.reset();
    });
  }

  // Biometric toggle handler
  const biometricToggle = document.getElementById('biometricToggle');
  if (biometricToggle) {
    biometricToggle.checked = biometricEnabled;
    biometricToggle.addEventListener('change', async (e) => {
      biometricEnabled = e.target.checked;
      localStorage.setItem('biometricEnabled', biometricEnabled);
      if (biometricEnabled) {
        const biometry = await checkBiometricAvailability();
        if (!biometry || !biometry.isAvailable) {
          showAdminAlert('Biometric authentication not available on this device.', 'error');
          biometricEnabled = false;
          localStorage.setItem('biometricEnabled', 'false');
          e.target.checked = false;
        }
      }
    });
  }
});

// ===== Program Detail Sheet =====
const programData = {
  creche: { title: 'Crèche', body: 'Our crèche program provides gentle, nurturing care for our youngest learners. We focus on creating a warm, secure environment where children can explore and develop at their own pace. Activities are designed to stimulate sensory development and encourage early social interaction in a safe, supervised setting.' },
  reception: { title: 'Reception', body: 'The reception program introduces structured learning through play-based activities that foster creativity and teamwork. Children develop foundational skills in a supportive environment that encourages curiosity and builds confidence.' },
  kg1: { title: 'KG 1', body: 'In KG 1, we focus on building essential early learning skills through a balanced mix of structured activities and guided play. Children begin developing literacy and numeracy foundations while continuing to explore their creativity and social skills.' },
  kg2: { title: 'KG 2', body: 'Our KG 2 program prepares children for the transition to primary education with more structured learning experiences. We focus on developing independence, problem-solving skills, and a love for learning.' },
  preparatory: { title: 'Preparatory', body: 'The preparatory class offers comprehensive preparation for primary school with an enhanced curriculum that challenges and engages young minds. We focus on developing the academic and social skills needed for a successful transition to formal schooling.' },
  grade1: { title: 'Grade 1', body: 'First grade at Precious Tots Academy focuses on building strong foundational skills in literacy and numeracy. Our curriculum is designed to make learning engaging and meaningful while supporting each child\'s individual growth.' },
  grade2: { title: 'Grade 2', body: 'In second grade, we build upon core academic skills while encouraging greater independence in learning. Students continue to develop reading, writing, and mathematical abilities through interactive lessons.' },
  grade3: { title: 'Grade 3', body: 'Third grade expands subject knowledge and introduces more complex concepts across the curriculum. We focus on developing critical thinking skills and fostering a deeper understanding of core subjects.' },
  grade4: { title: 'Grade 4', body: 'Fourth grade emphasizes independent learning skills and personal responsibility in academic work. Students are encouraged to take ownership of their learning while receiving the guidance needed to succeed.' },
  grade5: { title: 'Grade 5', body: 'Our fifth grade program prepares students for the transition to secondary education with a comprehensive curriculum. We focus on developing the academic skills, study habits, and personal responsibility needed for success.' },
};

document.querySelectorAll('.program-card[data-program]').forEach((card) => {
  card.addEventListener('click', () => {
    const key = card.getAttribute('data-program');
    const data = programData[key];
    if (data) {
      document.getElementById('programDetailTitle').textContent = data.title;
      document.getElementById('programDetailBody').textContent = data.body;
      showSheet('programSheet');
    }
  });
});

// ===== Scroll Animations =====
function elementInView(el, dividend = 1.2) {
  const elementTop = el.getBoundingClientRect().top;
  return elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend;
}

function handleScrollAnimation() {
  document.querySelectorAll('.scroll-animate:not(.animated)').forEach((el) => {
    if (elementInView(el)) el.classList.add('animated');
  });
}

window.addEventListener('scroll', handleScrollAnimation, { passive: true });
document.addEventListener('DOMContentLoaded', handleScrollAnimation);

// ===== Prevent pinch zoom (native feel) =====
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());

// Let inputs zoom on focus (iOS accessibility)
document.querySelectorAll('input, textarea, select').forEach((el) => {
  el.addEventListener('focus', () => {
    el.style.fontSize = '16px';
  });
});
