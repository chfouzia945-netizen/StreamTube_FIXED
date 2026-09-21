function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* PROFILE IMAGE */

function avatarUrl(path) {

  if (path) {
    return esc(path);
  }

  return "/default-avatar.png";
}


/* LOAD WATCH PAGE */

function loadWatchPage() {

  var root = document.getElementById("root");

  if (!root) return;


  var params =
    new URLSearchParams(window.location.search);

  var id =
    Number(params.get("id"));


  if (!id) {

    root.innerHTML =
      '<div class="error">Video not specified</div>';

    return;
  }


  root.innerHTML =
    '<div class="notice">Loading video...</div>';


  fetch(
    "/api/videos/" + id,
    {
      method: "GET",
      credentials: "include"
    }
  )

    .then(function (r) {

      if (!r.ok) {
        throw new Error("Video request failed");
      }

      return r.json();

    })


    .then(function (data) {

      var v =
        data.video;


      if (!v) {
        throw new Error("Video not found");
      }


      /*
       * CREATOR AVATAR
       *
       * Backend may return creator_avatar
       * or avatar depending on endpoint.
       */

      var creatorAvatar =
        v.creator_avatar ||
        v.avatar ||
        "";


      var creatorName =
        v.creator_name ||
        v.name ||
        v.username ||
        "User";


      var creatorUsername =
        v.username ||
        "";


      root.innerHTML =

        '<div class="watchgrid">' +

          '<div>' +


            /* VIDEO */

            '<video class="player" controls src="/media/video/' +
              v.id +
            '"></video>' +


            /* TITLE */

            '<h1>' +
              esc(v.title) +
            '</h1>' +


            /* VIEWS */

            '<div class="muted" id="viewCount">' +
              String(v.views || 0) +
              ' views' +
            '</div>' +


            /* CREATOR */

            '<div class="watch-creator">' +

              '<img ' +
                'class="watch-creator-avatar" ' +
                'src="' +
                  avatarUrl(creatorAvatar) +
                '" ' +
                'alt="" ' +
                'onerror="this.src=\'/default-avatar.png\';">' +

              '<div class="watch-creator-info">' +

                '<strong>' +
                  esc(creatorName) +
                '</strong>' +

                (
                  creatorUsername
                    ? '<div class="muted">@' +
                        esc(creatorUsername) +
                      '</div>'
                    : ''
                ) +

              '</div>' +

            '</div>' +


            /* ACTIONS */

            '<div class="actionsrow">' +

              '<button class="btn" id="likeBtn">' +

                (
                  v.liked
                    ? "Liked ("
                    : "Like ("
                ) +

                String(v.like_count || 0) +

                ')' +

              '</button>' +


              '<button class="btn" id="subscribeBtn">' +
                'Subscribe' +
              '</button>' +


              '<button class="btn" id="editBtn">' +
                'Edit Video' +
              '</button>' +


              '<button class="btn danger" id="deleteBtn">' +
                'Delete Video' +
              '</button>' +

            '</div>' +


            /* DESCRIPTION */

            '<div class="card">' +

              '<h3>Description</h3>' +

              '<p>' +
                esc(v.description || "") +
              '</p>' +

            '</div>' +


            /* COMMENTS */

            '<div class="card">' +

              '<h3>Comments</h3>' +

              '<div id="comments">' +
                '<div class="muted">Loading comments...</div>' +
              '</div>' +

              '<form id="commentForm">' +

                '<input ' +
                  'id="commentInput" ' +
                  'placeholder="Write a comment..." ' +
                  'required>' +

                '<button class="btn" type="submit">' +
                  'Comment' +
                '</button>' +

              '</form>' +

            '</div>' +


          '</div>' +

        '</div>';


      /* VIEW COUNT */

      fetch(
        "/api/videos/" +
        v.id +
        "/view",
        {
          method: "POST",
          credentials: "include"
        }
      )

        .then(function (r) {
          return r.json();
        })

        .then(function (data) {

          if (typeof data.views === "number") {

            var viewCount =
              document.getElementById("viewCount");

            if (viewCount) {

              viewCount.textContent =
                data.views +
                " views";

            }

          }

        })

        .catch(function () {});


      /* LOAD COMMENTS */

      loadComments(v.id);


      /* LIKE */

      var likeBtn =
        document.getElementById("likeBtn");


      if (likeBtn) {

        likeBtn.addEventListener(
          "click",
          function () {

            fetch(
              "/api/videos/" +
              v.id +
              "/like",
              {
                method: "POST",
                credentials: "include"
              }
            )

              .then(function (r) {
                return r.json();
              })

              .then(function (data) {

                if (data.error) {

                  alert(data.error);

                  return;
                }


                if (typeof data.likes === "number") {

                  likeBtn.textContent =
                    (
                      data.liked
                        ? "Liked ("
                        : "Like ("
                    ) +
                    data.likes +
                    ")";

                }

              })

              .catch(function () {

                alert(
                  "Like request failed."
                );

              });

          }
        );

      }


      /* SUBSCRIBE */

      var subscribeBtn =
        document.getElementById(
          "subscribeBtn"
        );


      if (subscribeBtn) {

        subscribeBtn.addEventListener(
          "click",
          function () {

            fetch(
              "/api/channels/" +
              v.user_id +
              "/subscribe",
              {
                method: "POST",
                credentials: "include"
              }
            )

              .then(function (r) {
                return r.json();
              })

              .then(function (data) {

                if (data.error) {

                  alert(data.error);

                  return;
                }


                if (
                  typeof data.subscribed ===
                  "boolean"
                ) {

                  subscribeBtn.textContent =
                    data.subscribed

                      ? "Subscribed (" +
                        data.subscribers +
                        ")"

                      : "Subscribe (" +
                        data.subscribers +
                        ")";

                }

              })

              .catch(function () {

                alert(
                  "Subscribe request failed."
                );

              });

          }
        );

      }


      /* COMMENT */

      var commentForm =
        document.getElementById(
          "commentForm"
        );


      if (commentForm) {

        commentForm.addEventListener(
          "submit",
          function (e) {

            e.preventDefault();


            var input =
              document.getElementById(
                "commentInput"
              );


            var text =
              input.value.trim();


            if (!text) return;


            fetch(
              "/api/videos/" +
              v.id +
              "/comments",
              {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type":
                    "application/json"
                },
                body: JSON.stringify({
                  body: text
                })
              }
            )

              .then(function (r) {
                return r.json();
              })

              .then(function (data) {

                if (data.error) {

                  alert(data.error);

                  return;
                }


                input.value = "";

                loadComments(v.id);

              })

              .catch(function () {

                alert(
                  "Comment request failed."
                );

              });

          }
        );

      }


      /* EDIT VIDEO */

      var editBtn =
        document.getElementById(
          "editBtn"
        );


      if (editBtn) {

        editBtn.addEventListener(
          "click",
          function () {

            var newTitle =
              prompt(
                "Enter new video title:",
                v.title
              );


            if (newTitle === null) {
              return;
            }


            newTitle =
              newTitle.trim();


            if (!newTitle) {

              alert(
                "Title required."
              );

              return;
            }


            fetch(
              "/api/videos/" +
              v.id,
              {
                method: "PATCH",
                credentials: "include",
                headers: {
                  "Content-Type":
                    "application/json"
                },
                body: JSON.stringify({

                  title:
                    newTitle,

                  description:
                    v.description || "",

                  category:
                    v.category || "Other",

                  visibility:
                    v.visibility || "public"

                })
              }
            )

              .then(function (r) {
                return r.json();
              })

              .then(function (data) {

                if (data.error) {

                  alert(data.error);

                  return;
                }


                alert(
                  "Video updated successfully."
                );

                location.reload();

              })

              .catch(function () {

                alert(
                  "Edit request failed."
                );

              });

          }
        );

      }


      /* DELETE VIDEO */

      var deleteBtn =
        document.getElementById(
          "deleteBtn"
        );


      if (deleteBtn) {

        deleteBtn.addEventListener(
          "click",
          function () {

            var ok =
              confirm(
                "Are you sure you want to delete this video?"
              );


            if (!ok) {
              return;
            }


            fetch(
              "/api/videos/" +
              v.id,
              {
                method: "DELETE",
                credentials: "include"
              }
            )

              .then(function (r) {
                return r.json();
              })

              .then(function (data) {

                if (data.error) {

                  alert(data.error);

                  return;
                }


                if (data.ok) {

                  alert(
                    "Video deleted successfully."
                  );

                  window.location.href =
                    "index.html";

                }

              })

              .catch(function () {

                alert(
                  "Delete request failed."
                );

              });

          }
        );

      }

    })


    .catch(function (err) {

      root.innerHTML =
        '<div class="error">' +
          esc(err.message) +
        '</div>';

    });

}


/* LOAD COMMENTS */

function loadComments(videoId) {

  var comments =
    document.getElementById(
      "comments"
    );


  if (!comments) return;


  fetch(
    "/api/videos/" +
    videoId +
    "/comments",
    {
      method: "GET",
      credentials: "include"
    }
  )

    .then(function (r) {
      return r.json();
    })

    .then(function (data) {

      var list =
        data.comments || [];


      if (!list.length) {

        comments.innerHTML =
          '<div class="muted">No comments yet.</div>';

        return;
      }


      comments.innerHTML =

        list.map(function (c) {

          var commentAvatar =
            c.avatar ||
            c.user_avatar ||
            "";


          var commentName =
            c.username ||
            c.name ||
            "User";


          return (

            '<div class="comment">' +

              '<div class="comment-user">' +

                '<img ' +
                  'class="comment-avatar" ' +
                  'src="' +
                    avatarUrl(commentAvatar) +
                  '" ' +
                  'alt="" ' +
                  'onerror="this.src=\'/default-avatar.png\';">' +

                '<div>' +

                  '<strong>' +
                    esc(commentName) +
                  '</strong>' +

                  '<div class="muted">' +
                    esc(c.created_at || "") +
                  '</div>' +

                '</div>' +

              '</div>' +

              '<div class="comment-body">' +
                esc(c.body || "") +
              '</div>' +

            '</div>'

          );

        }).join("");

    })


    .catch(function () {

      comments.innerHTML =
        '<div class="muted">Could not load comments.</div>';

    });

}


document.addEventListener(
  "DOMContentLoaded",
  loadWatchPage
);