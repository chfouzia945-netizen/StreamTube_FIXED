async function loadDash() {

  var profile = document.getElementById("profile");
  var box = document.getElementById("videos");

  try {

    var u = await me();

    if (!u) {
      location.href = "login.html";
      return;
    }

    var a = await api("/api/analytics");

    profile.innerHTML =
      '<div class="channel-head">' +

        '<div style="text-align:center;">' +

          '<img id="profileAvatar" class="channel-avatar" src="' +
            (u.avatar ? esc(u.avatar) : "/default-avatar.png") +
          '" onerror="this.style.display=\'none\';">' +

          '<div style="margin-top:12px;">' +

            '<label for="avatarFile" class="studio-btn secondary" style="display:inline-block;cursor:pointer;">' +
              'Choose Picture' +
            '</label>' +

            '<input ' +
              'type="file" ' +
              'id="avatarFile" ' +
              'accept="image/jpeg,image/png,image/webp" ' +
              'style="display:none;"' +
            '>' +

          '</div>' +

          '<button ' +
            'type="button" ' +
            'id="uploadAvatarBtn" ' +
            'class="studio-btn" ' +
            'style="margin-top:8px;"' +
          '>' +
            'Upload Picture' +
          '</button>' +

          '<div id="avatarStatus" class="muted" style="margin-top:8px;font-size:13px;"></div>' +

        '</div>' +

        '<div class="channel-info">' +

          '<h2>' +
            esc(u.name) +
          '</h2>' +

          '<div class="muted">@' +
            esc(u.username) +
          '</div>' +

          '<p>' +
            esc(u.bio || "No bio added yet.") +
          '</p>' +

          '<div class="studio-actions">' +

            '<a class="studio-btn" href="channel.html?u=' +
              encodeURIComponent(u.username) +
            '">' +
              'View Channel' +
            '</a>' +

            '<a class="studio-btn secondary" href="upload.html">' +
              'Upload Video' +
            '</a>' +

          '</div>' +

        '</div>' +

      '</div>' +

      '<div class="stats-grid">' +

        '<div class="stat-card">' +
          '<span>Videos</span>' +
          '<strong>' + a.totals.videos + '</strong>' +
        '</div>' +

        '<div class="stat-card">' +
          '<span>Total Views</span>' +
          '<strong>' +
            Number(a.totals.views).toLocaleString() +
          '</strong>' +
        '</div>' +

        '<div class="stat-card">' +
          '<span>Total Likes</span>' +
          '<strong>' + a.totals.likes + '</strong>' +
        '</div>' +

        '<div class="stat-card">' +
          '<span>Subscribers</span>' +
          '<strong>' + a.totals.subscribers + '</strong>' +
        '</div>' +

      '</div>' +

      '<div class="comments-total">' +
        'Total Comments: <strong>' +
          a.totals.comments +
        '</strong>' +
      '</div>';


    /*
     * AVATAR UPLOAD
     */

    var avatarFile =
      document.getElementById("avatarFile");

    var uploadAvatarBtn =
      document.getElementById("uploadAvatarBtn");

    var avatarStatus =
      document.getElementById("avatarStatus");

    uploadAvatarBtn.addEventListener(
      "click",
      async function() {

        if (!avatarFile.files.length) {

          avatarStatus.textContent =
            "Pehle picture select karein.";

          return;
        }

        var file =
          avatarFile.files[0];

        if (file.size > 10 * 1024 * 1024) {

          avatarStatus.textContent =
            "Picture 10MB se choti honi chahiye.";

          return;
        }

        var formData =
          new FormData();

        formData.append(
          "avatar",
          file
        );

        uploadAvatarBtn.disabled = true;

        avatarStatus.textContent =
          "Uploading...";

        try {

          var response =
            await fetch(
              "/api/me/avatar",
              {
                method: "POST",
                credentials: "include",
                body: formData
              }
            );

          var data = {};

          try {
            data = await response.json();
          } catch (e) {}

          if (!response.ok) {

            throw Error(
              data.error ||
              "Picture upload failed."
            );

          }

          var img =
            document.getElementById("profileAvatar");

          img.src =
            data.avatar +
            "?t=" +
            Date.now();

          img.style.display = "block";

          avatarStatus.textContent =
            "Profile picture uploaded successfully.";

        } catch (e) {

          avatarStatus.textContent =
            e.message ||
            "Picture upload failed.";

        }

        uploadAvatarBtn.disabled = false;

      }
    );


    /*
     * LOAD USER VIDEOS
     */

    var vd = await api(
      "/api/users/" +
      encodeURIComponent(u.username)
    );


    if (!vd.videos || !vd.videos.length) {

      box.innerHTML =
        '<div class="empty-state">' +

          '<h3>No videos yet</h3>' +

          '<p>' +
            'Upload your first video to start building your channel.' +
          '</p>' +

          '<a class="studio-btn" href="upload.html">' +
            'Upload Video' +
          '</a>' +

        '</div>';

      return;
    }


    box.innerHTML =
      '<div class="table-wrap">' +

        '<table class="studio-table">' +

          '<thead>' +

            '<tr>' +
              '<th>Video</th>' +
              '<th>Views</th>' +
              '<th>Category</th>' +
              '<th>Visibility</th>' +
              '<th>Actions</th>' +
            '</tr>' +

          '</thead>' +

          '<tbody>' +

            vd.videos.map(function(v) {

              return (

                '<tr>' +

                  '<td>' +
                    '<div class="video-title">' +
                      esc(v.title) +
                    '</div>' +
                  '</td>' +

                  '<td>' +
                    Number(v.views || 0).toLocaleString() +
                  '</td>' +

                  '<td>' +
                    esc(v.category || "Other") +
                  '</td>' +

                  '<td>' +
                    '<span class="visibility">' +
                      esc(v.visibility || "public") +
                    '</span>' +
                  '</td>' +

                  '<td>' +

                    '<div class="action-buttons">' +

                      '<a class="watch-btn" href="watch.html?id=' +
                        v.id +
                      '">' +
                        'Watch' +
                      '</a>' +

                      '<button class="delete-btn" data-id="' +
                        v.id +
                      '">' +
                        'Delete' +
                      '</button>' +

                    '</div>' +

                  '</td>' +

                '</tr>'

              );

            }).join("") +

          '</tbody>' +

        '</table>' +

      '</div>';


    /*
     * DELETE VIDEO
     */

    document.querySelectorAll("[data-id]").forEach(
      function(button) {

        button.addEventListener(
          "click",
          async function() {

            var videoId =
              button.getAttribute("data-id");

            if (!confirm("Delete this video?")) {
              return;
            }

            try {

              await api(
                "/api/videos/" + videoId,
                {
                  method: "DELETE"
                }
              );

              location.reload();

            } catch (x) {

              alert(
                x.message ||
                "Could not delete video."
              );

            }

          }
        );

      }
    );


  } catch (x) {

    profile.innerHTML =
      '<div class="error-box">' +
        esc(
          x.message ||
          "Could not load Studio."
        ) +
      '</div>';

    box.innerHTML = "";

  }

}


document.addEventListener(
  "DOMContentLoaded",
  loadDash
);