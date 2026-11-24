const API = '/api';

async function apiCall(path, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  const data = await res.json();
  if (res.status === 401 && !path.startsWith('/auth')) {
    logout();
  }
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

function requireLogin(allowedRoles) {
  const role = localStorage.getItem('role');
  if (!localStorage.getItem('token') || !allowedRoles.includes(role)) {
    window.location.href = '/index.html';
  }
}

function logout() {
  localStorage.clear();
  window.location.href = '/index.html';
}

function showMsg(id, text, ok) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'msg ' + (ok ? 'ok' : 'err');
}