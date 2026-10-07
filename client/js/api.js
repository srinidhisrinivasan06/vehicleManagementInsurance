const BASE_URL = 'http://localhost:8080/api';

function getToken() {
  return localStorage.getItem('token');
}

function getHeaders(auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = 'Bearer ' + getToken();
  return headers;
}

async function request(method, path, body = null, auth = true) {
  const options = { method, headers: getHeaders(auth) };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(BASE_URL + path, options);
  if (res.status === 401) { logout(); return; }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  delete: (path)        => request('DELETE', path),
  postPublic: (path, body) => request('POST', path, body, false),
};

// Auth helpers
function saveAuth(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user',  JSON.stringify(data.user));
}

function getUser() {
  return JSON.parse(localStorage.getItem('user') || 'null');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

function requireAuth(role) {
  const user = getUser();
  if (!user || !getToken()) { window.location.href = '/login.html'; return null; }
  if (role && user.role !== role) {
    window.location.href = '/login.html';
    return null;
  }
  return user;
}

// Toast notification
function showToast(message, type = 'default') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = 'toast ' + type;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
