<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Upload • StreamTube</title>
  <link rel="stylesheet" href="style.css">
</head>

<body>

<header class="top">

  <a class="logo" href="index.html">
    StreamTube
  </a>

  <div class="search">
    <input id="searchInput" placeholder="Search">
    <button id="searchBtn">Search</button>
  </div>

  <div class="actions" id="actions"></div>

</header>


<main class="main">

  <section class="panel form">

    <h1>Upload video</h1>

    <div id="msg"></div>

    <form id="form">

      <div class="field">

        <label>Video file</label>

        <input
          type="file"
          name="video"
          accept="video/*"
          required
        >

      </div>


      <div class="field">

        <label>Thumbnail</label>

        <input
          id="thumbnailInput"
          type="file"
          name="thumbnail"
          accept="image/jpeg,image/png,image/webp"
        >

        <img
          id="thumbnailPreview"
          class="thumb"
          src="/default-thumb.png"
          alt=""
          style="margin-top:10px;max-width:320px;"
        >

      </div>


      <div class="field">

        <label>Title</label>

        <input
          name="title"
          maxlength="150"
          required
        >

      </div>


      <div class="field">

        <label>Description</label>

        <textarea
          name="description"
          maxlength="5000"
        ></textarea>

      </div>


      <div class="field">

        <label>Category</label>

        <select name="category">

          <option>Other</option>
          <option>Music</option>
          <option>Gaming</option>
          <option>Education</option>
          <option>Comedy</option>
          <option>News</option>

        </select>

      </div>


      <div class="field">

        <label>Visibility</label>

        <select name="visibility">

          <option value="public">Public</option>
          <option value="unlisted">Unlisted</option>
          <option value="private">Private</option>

        </select>

      </div>


      <button
        class="btn"
        type="submit"
        id="uploadBtn"
      >
        Upload
      </button>

    </form>

  </section>

</main>


<script src="app.js"></script>
<script src="upload-handler.js"></script>

</body>
</html>