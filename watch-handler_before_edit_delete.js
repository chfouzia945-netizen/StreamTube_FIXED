function esc(t) {
  return String(t || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadWatchPage() {

  var root = document.getElementById("root");

  if (!root) return;

  var params = new URLSearchParams(window.location.search);
  var id = Number(params.get("id"));

  if (!id) {
    root.innerHTML = '<div class="error">Video not specified</div>';
    return;
  }

  root.innerHTML = '<div class="notice">Loading video...</div>';

  fetch("/api/videos/" + id, {
    method: "GET",
    credentials: "include"
  })
  .then(function(r) {
    return r.json();
  })
  .then(function(data) {

    var v = data.video;

    if (!v) {
      throw new Error("Video not found");
    }

    root.innerHTML =
      '<div class="watchgrid">' +
        '<div>' +

        '<video class="player" controls src="/media/video/' +
        v.id +
        '"></video>' +

        '<h1>' +
        esc(v.title) +
        '</h1>' +

        '<div class="muted">' +
        String(v.views || 0) +
        ' views</div>' +

        '<div class="actionsrow">' +
        '<button class="btn" id="likeBtn">' +
        (v.liked ? "Unlike" : "Like") +
        ' (' +
        String(v.like_count || 0) +
        ')' +
        '</button>' +
        '</div>' +

        '<p>' +
        esc(v.description) +
        '</p>' +

        '<div class="comments">' +
        '<h2>Comments</h2>' +
        '<div id="comments">Loading comments...</div>' +
        '</div>' +

        '</div>' +
      '</div>';

    loadComments(id);

  })
  .catch(function(e) {

    root.innerHTML =
      '<div class="error">' +
      esc(e.message) +
      '</div>';

  });
}


function loadComments(id) {

  var box = document.getElementById("comments");

  if (!box) return;

  fetch("/api/videos/" + id + "/comments", {
    credentials: "include"
  })
  .then(function(r){
    return r.json();
  })
  .then(function(data){

    var list = data.comments || [];

    if (!list.length) {
      box.innerHTML =
      '<p class="muted">No comments yet.</p>';
      return;
    }

    var html = "";

    list.forEach(function(c){

      html +=
      '<div class="comment">' +
      '<b>' + esc(c.name) + '</b>' +
      '<div>' + esc(c.body) + '</div>' +
      '</div>';

    });

    box.innerHTML = html;

  })
  .catch(function(){

    box.innerHTML =
    '<p class="muted">Comments not available.</p>';

  });

}


document.addEventListener(
  "DOMContentLoaded",
  loadWatchPage
);
/* StreamTube: automatic view counting */
try { fetch(`/api/videos/${id}/view`, {method:"POST", credentials:"include"}).catch(()=>{}); } catch(e) {}
