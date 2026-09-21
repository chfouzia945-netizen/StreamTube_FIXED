function cleanText(text) {
return String(text || "")
.replace(/&/g, "&")
.replace(/</g, "<")
.replace(/>/g, ">")
.replace(/"/g, """);
}

function getVideoData(id, done) {
var frame = document.createElement("iframe");

frame.style.display = "none";
frame.src = "/api/videos/" + id;

frame.onload = function() {
try {
var text = "";

```
  if (frame.contentDocument && frame.contentDocument.body) {
    text = frame.contentDocument.body.innerText ||
           frame.contentDocument.body.textContent ||
           "";
  }

  document.body.removeChild(frame);

  var data = JSON.parse(text);

  if (!data.video) {
    done(null, "Video not found");
    return;
  }

  done(data.video, null);
} catch (e) {
  try {
    document.body.removeChild(frame);
  } catch (x) {}

  done(null, "Could not read video data");
}
```

};

frame.onerror = function() {
try {
document.body.removeChild(frame);
} catch (x) {}

```
done(null, "Could not connect to video API");
```

};

document.body.appendChild(frame);
}

function loadComments(id) {
var box = document.getElementById("comments");

if (!box) {
return;
}

var frame = document.createElement("iframe");

frame.style.display = "none";
frame.src = "/api/videos/" + id + "/comments";

frame.onload = function() {
try {
var text = "";

```
  if (frame.contentDocument && frame.contentDocument.body) {
    text = frame.contentDocument.body.innerText ||
           frame.contentDocument.body.textContent ||
           "";
  }

  document.body.removeChild(frame);

  var data = JSON.parse(text);
  var comments = data.comments || [];

  if (!comments.length) {
    box.innerHTML = '<p class="muted">No comments yet.</p>';
    return;
  }

  var html = "";

  comments.forEach(function(c) {
    html +=
      '<div class="comment">' +
        '<b>' + cleanText(c.name) + '</b>' +
        '<div class="muted">@' + cleanText(c.username) + '</div>' +
        '<div>' + cleanText(c.body) + '</div>' +
      '</div>';
  });

  box.innerHTML = html;

} catch (e) {
  try {
    document.body.removeChild(frame);
  } catch (x) {}

  box.innerHTML =
    '<p class="muted">Comments could not be loaded.</p>';
}
```

};

document.body.appendChild(frame);
}

function loadWatchPage() {
var root = document.getElementById("root");

if (!root) {
return;
}

var match = location.search.match(/[?&]id=([^&]+)/);
var id = match ? parseInt(match[1], 10) : 0;

if (!id) {
root.innerHTML =
'<div class="error">Video not specified</div>';
return;
}

root.innerHTML =
'<div class="notice">Loading video...</div>';

getVideoData(id, function(v, error) {

```
if (error || !v) {
  root.innerHTML =
    '<div class="error">' +
    cleanText(error || "Video not found") +
    '</div>';
  return;
}

root.innerHTML =
  '<div class="watchgrid">' +
    '<div>' +

      '<video id="player" class="player" controls preload="metadata" src="/media/video/' +
      v.id +
      '"></video>' +

      '<h1>' +
      cleanText(v.title) +
      '</h1>' +

      '<div class="muted">' +
      String(v.views || 0) +
      ' views</div>' +

      '<div class="actionsrow">' +

        '<button class="btn" id="like">' +
          (v.liked ? "Unlike" : "Like") +
          ' (' +
          String(v.like_count || 0) +
          ')' +
        '</button>' +

        '<a class="btn" href="channel.html?u=' +
          encodeURIComponent(v.creator_username || "") +
        '">' +
          cleanText(v.creator_name || "Creator") +
        '</a>' +

      '</div>' +

      '<p>' +
      cleanText(v.description) +
      '</p>' +

      '<div class="comments">' +
        '<h2>Comments</h2>' +
        '<div id="comments">Loading comments...</div>' +
      '</div>' +

    '</div>' +
  '</div>';

var like = document.getElementById("like");

if (like) {
  like.onclick = function() {

    var frame = document.createElement("iframe");

    frame.style.display = "none";
    frame.src = "/api/videos/" + id + "/like";

    document.body.appendChild(frame);

    setTimeout(function() {
      try {
        document.body.removeChild(frame);
      } catch (e) {}
    }, 1000);
  };
}

loadComments(id);
```

});
}

document.addEventListener("DOMContentLoaded", function() {
loadWatchPage();
});

/* StreamTube: automatic view counting */
try { fetch(`/api/videos/${id}/view`, {method:"POST", credentials:"include"}).catch(()=>{}); } catch(e) {}
