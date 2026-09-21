async function loadHome(){

  var box = document.getElementById("videos");
  var title = document.getElementById("pageTitle");

  if(!box){
    return;
  }

  try{

    var p = new URLSearchParams(location.search);

    var q = p.get("q");
    var cat = p.get("category");

    var url = "/api/videos";


    /* SEARCH */
    if(q){

      url += "?q=" +
        encodeURIComponent(q);

      if(title){
        title.textContent =
          "Search results";
      }

    }

    /* CATEGORY */
    else if(cat){

      url += "?category=" +
        encodeURIComponent(cat);

      if(title){

        title.textContent =
          cat === "Trending"
            ? "Trending"
            : cat + " videos";

      }

    }


    /* GET VIDEOS */
    var r = await fetch(url,{
      credentials:"include"
    });

    var d = await r.json();

    if(!r.ok){
      throw Error(
        d.error || "Failed"
      );
    }


    var vs = d.videos || [];


    /* NO VIDEOS */
    if(!vs.length){

      box.innerHTML =
        '<p class="muted">' +
        'No videos found' +
        '</p>';

      return;
    }


    /* VIDEO CARDS */
    box.innerHTML = vs.map(
      function(v){

        var titleText =
          String(v.title || "");

        var creator =
          String(
            v.creator_name ||
            v.name ||
            v.username ||
            "User"
          );

        var views =
          Number(
            v.views || 0
          ).toLocaleString();


        /* CREATOR PROFILE PICTURE */
        var avatar =
          v.creator_avatar ||
          v.avatar ||
          "";


        var avatarHTML = "";

        if(avatar){

          avatarHTML =
            '<img ' +
              'src="' +
              escapeHome(avatar) +
              '" ' +
              'alt="" ' +
              'style="' +
                'width:36px;' +
                'height:36px;' +
                'border-radius:50%;' +
                'object-fit:cover;' +
                'display:block;' +
                'flex:none;' +
              '" ' +
              'onerror="' +
                'this.style.display=\'none\';' +
              '">' ;

        }


        /* THUMBNAIL */
        var thumbnail =
          String(
            v.thumbnail || ""
          );


        return (

          '<div class="card">' +

            '<a href="watch.html?id=' +
              encodeURIComponent(v.id) +
            '">' +

              '<div ' +
                'class="thumb" ' +
                'style="' +
                  'width:100%;' +
                  'aspect-ratio:16/9;' +
                  'overflow:hidden;' +
                  'background:#ddd;' +
                  'border-radius:9px;' +
                '">' +

                '<img ' +
                  'class="thumb-img" ' +
                  'src="/default-thumb.png" ' +
                  'data-thumb="' +
                    escapeHome(thumbnail) +
                  '" ' +
                  'alt="" ' +
                  'style="' +
                    'width:100%;' +
                    'height:100%;' +
                    'object-fit:cover;' +
                    'display:block;' +
                  '">' +

              '</div>' +

              /* CREATOR ROW */
              '<div ' +
                'style="' +
                  'display:flex;' +
                  'align-items:center;' +
                  'gap:10px;' +
                  'margin-top:9px;' +
                '">' +

                avatarHTML +

                '<div ' +
                  'style="' +
                    'min-width:0;' +
                    'flex:1;' +
                  '">' +

                  '<div class="ct">' +
                    escapeHome(titleText) +
                  '</div>' +

                  '<div class="muted">' +
                    escapeHome(creator) +
                  '</div>' +

                  '<div class="muted">' +
                    views +
                    ' views' +
                  '</div>' +

                '</div>' +

              '</div>' +

            '</a>' +

          '</div>'

        );

      }
    ).join("");


    /* LOAD THUMBNAILS */
    loadThumbnails();

  }
  catch(e){

    console.log(e);

    box.innerHTML =
      '<p class="error">' +
      'Failed to load videos' +
      '</p>';

  }

}


/* ESCAPE HTML */
function escapeHome(s){

  return String(s || "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}


/* LOAD VIDEO THUMBNAILS */
function loadThumbnails(){

  var imgs =
    document.querySelectorAll(
      ".thumb-img"
    );


  for(
    var i = 0;
    i < imgs.length;
    i++
  ){

    (function(img){

      var name =
        img.getAttribute(
          "data-thumb"
        );


      if(!name){
        return;
      }


      var test =
        new Image();


      test.onload =
        function(){

          img.src =
            "/media/thumbs/" +
            encodeURIComponent(
              name
            );

        };


      test.onerror =
        function(){

          img.src =
            "/default-thumb.png";

        };


      test.src =
        "/media/thumbs/" +
        encodeURIComponent(
          name
        );

    })(imgs[i]);

  }

}


/* ==========================================
   PROFESSIONAL HOME PROFILE / TOP ACTIONS
   ========================================== */

async function loadHomeProfile(){

  var actions =
    document.getElementById("actions");

  if(!actions){
    return;
  }


  try{

    var response =
      await fetch("/api/me",{
        credentials:"include"
      });


    var data =
      await response.json();


    /* NOT LOGGED IN */
    if(
      !response.ok ||
      !data.user
    ){

     actions.innerHTML =
  '<div style="' +
    'display:flex;' +
    'align-items:center;' +
    'gap:8px;' +
    'white-space:nowrap;' +
  '">' +

    /* LOGIN BUTTON */
    '<a href="login.html" ' +
      'style="' +
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

    /* REGISTER BUTTON */
    '<a href="register.html" ' +
      'style="' +
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
      return;
    }


    var user =
      data.user;


    var name =
      user.name ||
      user.username ||
      "User";


    var username =
      user.username ||
      "";


    var avatar =
      user.avatar ||
      "";


    /*
      PROFILE PICTURE
    */
    var avatarHTML = "";

    if(avatar){

      avatarHTML =
        '<img ' +
          'src="' +
            escapeHome(avatar) +
          '" ' +
          'alt="Profile" ' +
          'style="' +
            'width:38px;' +
            'height:38px;' +
            'border-radius:50%;' +
            'object-fit:cover;' +
            'display:block;' +
            'border:2px solid #ffffff;' +
            'box-shadow:0 1px 5px rgba(0,0,0,.25);' +
          '" ' +
          'onerror="' +
            'this.style.display=\'none\';' +
          '">' ;

    }
    else{

      avatarHTML =
        '<div ' +
          'style="' +
            'width:38px;' +
            'height:38px;' +
            'border-radius:50%;' +
            'background:#e5e7eb;' +
            'display:flex;' +
            'align-items:center;' +
            'justify-content:center;' +
            'font-weight:700;' +
            'font-size:16px;' +
            'color:#555;' +
            'flex:none;' +
          '">' +
          escapeHome(
            name.charAt(0).toUpperCase()
          ) +
        '</div>';

    }


    /*
      PROFESSIONAL TOP BAR
    */
    actions.innerHTML =
      '<div style="' +
        'display:flex;' +
        'align-items:center;' +
        'gap:8px;' +
        'white-space:nowrap;' +
      '">' +

        '<a href="channel.html?username=' +
          encodeURIComponent(username) +
        '" style="' +
          'display:inline-flex;' +
          'align-items:center;' +
          'gap:7px;' +
          'padding:4px 11px 4px 5px;' +
          'border:1px solid #d8d8d8;' +
          'border-radius:22px;' +
          'background:#fff;' +
          'color:#222;' +
          'text-decoration:none;' +
          'font-weight:600;' +
          'box-shadow:0 1px 3px rgba(0,0,0,.08);' +
        '">' +

          avatarHTML +

          '<span style="' +
            'max-width:110px;' +
            'overflow:hidden;' +
            'text-overflow:ellipsis;' +
            'white-space:nowrap;' +
          '">' +
            escapeHome(name) +
          '</span>' +

        '</a>' +

        '<a href="upload.html" style="' +
          'display:inline-flex;' +
          'align-items:center;' +
          'justify-content:center;' +
          'padding:8px 13px;' +
          'border-radius:7px;' +
          'background:#ff2b2b;' +
          'color:#fff;' +
          'text-decoration:none;' +
          'font-weight:600;' +
          'border:1px solid #ff2b2b;' +
        '">' +
          'Upload' +
        '</a>' +

        '<a href="dashboard.html" style="' +
          'display:inline-flex;' +
          'align-items:center;' +
          'justify-content:center;' +
          'padding:8px 13px;' +
          'border-radius:7px;' +
          'background:#fff;' +
          'color:#222;' +
          'text-decoration:none;' +
          'font-weight:600;' +
          'border:1px solid #d5d5d5;' +
        '">' +
          'Dashboard' +
        '</a>' +

        '<button id="homeLogout" type="button" style="' +
          'display:inline-flex;' +
          'align-items:center;' +
          'justify-content:center;' +
          'padding:8px 13px;' +
          'border-radius:7px;' +
          'background:#fff;' +
          'color:#d11;' +
          'font:inherit;' +
          'font-weight:600;' +
          'border:1px solid #e0b0b0;' +
          'cursor:pointer;' +
        '">' +
          'Logout' +
        '</button>' +

      '</div>';

        /* LOGOUT */
        '<button ' +
          'id="homeLogout" ' +
          'type="button" ' +
          'style="' +
            'border:0;' +
            'background:transparent;' +
            'font:inherit;' +
            'font-weight:600;' +
            'cursor:pointer;' +
            'padding:6px 4px;' +
          '">' +
          'Logout' +
        '</button>' +

      '</div>';


    /* LOGOUT BUTTON */
    var logout =
      document.getElementById(
        "homeLogout"
      );


    if(logout){

      logout.onclick =
        async function(){

          try{

            await fetch(
              "/api/auth/logout",
              {
                method:"POST",
                credentials:"include"
              }
            );

          }
          catch(e){}


          location.href =
            "index.html";

        };

    }

  }
  catch(e){

    console.log(
      "Profile error:",
      e
    );

  }

}


/* START HOME */
document.addEventListener(
  "DOMContentLoaded",
  function(){

    loadHome();

    loadHomeProfile();

  }
);