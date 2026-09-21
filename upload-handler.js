var form = document.getElementById("form");
var msg = document.getElementById("msg");
var thumbnailInput = document.getElementById("thumbnailInput");
var thumbnailPreview = document.getElementById("thumbnailPreview");
var uploadBtn = document.getElementById("uploadBtn");


function esc(s){

  return String(s || "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#39;");

}


/*
  Thumbnail preview
*/

if(thumbnailInput && thumbnailPreview){

  thumbnailInput.addEventListener(
    "change",
    function(){

      var file =
        thumbnailInput.files &&
        thumbnailInput.files[0];

      if(!file){

        thumbnailPreview.src =
          "/default-thumb.png";

        return;
      }


      if(!file.type ||
         (
           file.type !== "image/jpeg" &&
           file.type !== "image/png" &&
           file.type !== "image/webp"
         )){

        thumbnailInput.value = "";

        thumbnailPreview.src =
          "/default-thumb.png";

        msg.innerHTML =
          '<div class="error">' +
          'Please select JPG, PNG or WEBP thumbnail.' +
          '</div>';

        return;
      }


      var url =
        URL.createObjectURL(file);

      thumbnailPreview.src = url;

    }
  );

}


/*
  Video upload
*/

if(form){

  form.addEventListener(
    "submit",
    async function(e){

      e.preventDefault();


      if(msg){

        msg.innerHTML =
          '<div class="notice">Uploading...</div>';

      }


      if(uploadBtn){

        uploadBtn.disabled = true;
        uploadBtn.textContent = "Uploading...";
      }


      try{

        var formData =
          new FormData(form);


        var r =
          await fetch(
            "/api/videos",
            {
              method:"POST",
              credentials:"include",
              body:formData
            }
          );


        var d = {};

        try{

          d = await r.json();

        }catch(e){

          d = {};

        }


        if(!r.ok){

          throw Error(
            d.error ||
            "Upload failed"
          );

        }


        if(!d.video ||
           !d.video.id){

          throw Error(
            "Upload completed but video ID was not returned."
          );

        }


        location.href =
          "watch.html?id=" +
          encodeURIComponent(
            d.video.id
          );


      }catch(x){

        if(msg){

          msg.innerHTML =
            '<div class="error">' +
            esc(x.message) +
            '</div>';

        }


        if(uploadBtn){

          uploadBtn.disabled = false;
          uploadBtn.textContent = "Upload";

        }

      }

    }
  );

}