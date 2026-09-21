async function api(url,opt){
  opt=opt||{};
  var r=await fetch(url,Object.assign({
    credentials:"include"
  },opt));

  var d={};
  try{
    d=await r.json();
  }catch(e){}

  if(!r.ok){
    throw Error(d.error||"Request failed");
  }

  return d;
}


function esc(s){
  return String(s||"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}
function card(v){

  var img = "/default-thumb.png";

  if(v.thumbnail){
    img = "/media/thumbs/" + esc(v.thumbnail);
  }

  var creator = esc(v.creator_name || "");

  var channelLink = "";

  if(v.creator_username){
    channelLink =
      '<a href="channel.html?username=' +
      encodeURIComponent(v.creator_username) +
      '" class="muted" style="text-decoration:none;">' +
      creator +
      '</a>';
  }else{
    channelLink =
      '<span class="muted">' +
      creator +
      '</span>';
  }

  return (
    '<div class="video-card">'+
      '<a href="watch.html?id='+v.id+'" class="video-link">'+
        '<div class="thumb">'+
          '<img src="'+img+'" class="thumb-img" alt="">'+
        '</div>'+
        '<h3>'+esc(v.title)+'</h3>'+
      '</a>'+

      '<p class="muted">'+
        channelLink+
      '</p>'+

      '<p class="muted">'+
        Number(v.views||0).toLocaleString()+
        ' views'+
      '</p>'+

    '</div>'
  );
}

async function me(){

  try{

    var r=await api("/api/me");

    return r.user||null;

  }catch(e){

    return null;

  }

}


async function updateActions(){

  var box=document.getElementById("actions");

  if(!box)return;

  var u=await me();

  if(u){

    box.innerHTML=
      '<div style="' +
        'display:flex;' +
        'align-items:center;' +
        'gap:8px;' +
        'white-space:nowrap;' +
      '">' +

        '<a href="upload.html" style="' +
          'display:inline-flex;' +
          'align-items:center;' +
          'justify-content:center;' +
          'padding:8px 14px;' +
          'border-radius:7px;' +
          'background:#ff2b2b;' +
          'color:#fff;' +
          'text-decoration:none;' +
          'font-weight:600;' +
          'border:1px solid #ff2b2b;' +
          'box-shadow:0 2px 5px rgba(0,0,0,.12);' +
        '">' +
          'Upload' +
        '</a>' +

        '<a href="dashboard.html" style="' +
          'display:inline-flex;' +
          'align-items:center;' +
          'justify-content:center;' +
          'padding:8px 14px;' +
          'border-radius:7px;' +
          'background:#fff;' +
          'color:#222;' +
          'text-decoration:none;' +
          'font-weight:600;' +
          'border:1px solid #d5d5d5;' +
          'box-shadow:0 2px 5px rgba(0,0,0,.08);' +
        '">' +
          'Dashboard' +
        '</a>' +

        '<button id="logout" type="button" style="' +
          'display:inline-flex;' +
          'align-items:center;' +
          'justify-content:center;' +
          'padding:8px 14px;' +
          'border-radius:7px;' +
          'background:#fff;' +
          'color:#d11;' +
          'font:inherit;' +
          'font-weight:600;' +
          'border:1px solid #e0b0b0;' +
          'cursor:pointer;' +
          'box-shadow:0 2px 5px rgba(0,0,0,.07);' +
        '">' +
          'Logout' +
        '</button>' +

      '</div>';

    document.getElementById("logout")
    .onclick=async function(){

      await api("/api/auth/logout",{
        method:"POST"
      });

      location.href="index.html";

    };

  }else{

    box.innerHTML=
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
          'box-shadow:0 2px 5px rgba(0,0,0,.08);' +
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
          'box-shadow:0 2px 5px rgba(0,0,0,.12);' +
        '">' +
          'Register' +
        '</a>' +

      '</div>';

  }

}


document.addEventListener(
"DOMContentLoaded",
updateActions
);
