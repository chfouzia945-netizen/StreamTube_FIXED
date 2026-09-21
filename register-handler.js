/* ==============================
   REGISTER PAGE TOP BUTTONS
   ============================== */

var actions = document.getElementById('actions');

if (actions) {

  actions.innerHTML =
    '<div style="' +
      'display:flex;' +
      'align-items:center;' +
      'gap:8px;' +
      'white-space:nowrap;' +
    '">' +

      '<a href="login.html" style="' +
        'display:inline-flex;' +
        'align-items:center;' +
        'justify-content:center;' +
        'padding:8px 15px;' +
        'border-radius:7px;' +
        'background:#fff;' +
        'color:#222;' +
        'text-decoration:none;' +
        'font-weight:600;' +
        'border:1px solid #d5d5d5;' +
        'box-shadow:0 1px 3px rgba(0,0,0,.08);' +
      '">' +
        'Login' +
      '</a>' +

      '<a href="register.html" style="' +
        'display:inline-flex;' +
        'align-items:center;' +
        'justify-content:center;' +
        'padding:8px 15px;' +
        'border-radius:7px;' +
        'background:#ff2b2b;' +
        'color:#fff;' +
        'text-decoration:none;' +
        'font-weight:600;' +
        'border:1px solid #ff2b2b;' +
        'box-shadow:0 1px 3px rgba(0,0,0,.12);' +
      '">' +
        'Register' +
      '</a>' +

    '</div>';
}


/* ==============================
   REGISTER FORM
   ============================== */

document.getElementById('form').addEventListener('submit', async function(e) {

  e.preventDefault();

  var m = document.getElementById('msg');

  m.innerHTML =
    '<div class="notice">Creating account...</div>';

  try {

    var f = new FormData(e.target);

    var r = await fetch('/api/auth/register', {

      method: 'POST',

      credentials: 'include',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({

        name: f.get('name'),

        username: f.get('username'),

        email: f.get('email'),

        password: f.get('password')

      })

    });

    var d = await r.json();

    if (!r.ok) {
      throw Error(d.error || 'Registration failed');
    }

    location.href = 'index.html';

  } catch (x) {

    m.innerHTML =
      '<div class="error">' +
      esc(x.message) +
      '</div>';

  }

});