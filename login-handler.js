document.getElementById('form').addEventListener('submit', async function(e) {
  e.preventDefault();

  var m = document.getElementById('msg');
  m.innerHTML = '<div class="notice">Logging in...</div>';

  try {
    var f = new FormData(e.target);

    var r = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        login: f.get('login'),
        password: f.get('password')
      })
    });

    var d = await r.json();

    if (!r.ok) {
      throw Error(d.error || 'Login failed');
    }

    location.href = 'index.html';

  } catch (x) {
    m.innerHTML = '<div class="error">' + esc(x.message) + '</div>';
  }
});