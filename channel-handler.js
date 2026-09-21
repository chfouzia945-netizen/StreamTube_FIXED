async function loadChannel() {

  var root = document.getElementById("channel");

  try {

    var u = new URLSearchParams(location.search).get("username");

    /*
      Agar URL mein username nahi hai,
      to logged-in user ka apna channel load hoga.
    */
    if (!u) {

      var current = await me();

      if (!current || !current.username) {
        throw Error("Please login to view your channel.");
      }

      u = current.username;
    }

    var d = await api(
      "/api/users/" + encodeURIComponent(u)
    );

    var meu = await me();

    var av = d.user.avatar || "/default-avatar.png";

    root.innerHTML =
      '<div class="channel-head">' +

        '<img class="channel-avatar" src="' +
          esc(av) +
        '">' +

        '<div>' +

          '<h1>' +
            esc(d.user.name) +
          '</h1>' +

          '<div class="muted">@' +
            esc(d.user.username) +
          '</div>' +

          '<div class="muted">' +
            esc(d.user.bio || "No bio") +
          '</div>' +

        '</div>' +

      '</div>' +

      '<div class="stats">' +

        '<div class="stat">' +
          'Subscribers' +
          '<b>' +
            Number(d.subscribers || 0).toLocaleString() +
          '</b>' +
        '</div>' +

        '<div class="stat">' +
          'Videos' +
          '<b>' +
            d.videos.length +
          '</b>' +
        '</div>' +

      '</div>' +

      '<div class="actionsrow" id="subrow"></div>' +

      '<h2>Videos</h2>' +

      '<div class="grid">' +

        (
          d.videos.length
            ? d.videos.map(card).join("")
            : '<p class="muted">No public videos.</p>'
        ) +

      '</div>';


    if (meu && meu.id !== d.user.id) {

      var b = document.createElement("button");

      b.className = "btn";

      b.textContent = "Subscribe";

      b.addEventListener("click", async function() {

        try {

          var x = await api(
            "/api/channels/" +
            d.user.id +
            "/subscribe",
            {
              method: "POST"
            }
          );

          b.textContent =
            x.subscribed
              ? "Subscribed"
              : "Subscribe";

        } catch (e) {

          alert(
            e.message ||
            "Could not subscribe."
          );

        }

      });

      document
        .getElementById("subrow")
        .appendChild(b);
    }

  } catch (x) {

    root.innerHTML =
      '<div class="error">' +
        esc(
          x.message ||
          "Could not load channel."
        ) +
      '</div>';

  }

}


document.addEventListener(
  "DOMContentLoaded",
  loadChannel
);
