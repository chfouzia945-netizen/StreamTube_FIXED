const express = require("express");
const Database = require("./sync-sqlite");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA = path.join(ROOT, "data");
const UP = path.join(DATA, "uploads");
const TH = path.join(DATA, "thumbs");
fs.mkdirSync(UP,{recursive:true}); fs.mkdirSync(TH,{recursive:true});
const db = new Database(path.join(DATA,"Choudharyvideo.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL, username TEXT NOT NULL UNIQUE COLLATE NOCASE,
 email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL,
 avatar TEXT DEFAULT '', bio TEXT DEFAULT '', role TEXT NOT NULL DEFAULT 'user',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions(
 token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS videos(
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 title TEXT NOT NULL, description TEXT DEFAULT '', category TEXT DEFAULT 'Other',
 filename TEXT NOT NULL, original_name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL,
 thumbnail TEXT DEFAULT '', visibility TEXT NOT NULL DEFAULT 'public',
 views INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS likes(
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,video_id)
);
CREATE TABLE IF NOT EXISTS subscriptions(
subscriber_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
channel_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(subscriber_id,channel_id),
CHECK(subscriber_id <> channel_id)
);
CREATE TABLE IF NOT EXISTS comments(
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
 body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS video_views(
 video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
 viewer_key TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(video_id,viewer_key)
);

CREATE INDEX IF NOT EXISTS idx_videos_user ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_visibility ON videos(visibility);
CREATE INDEX IF NOT EXISTS idx_comments_video ON comments(video_id);
`);

function clean(v,max=500){return String(v == null ? "" : v).trim().slice(0,max)}
function publicUser(u){return {id:u.id,name:u.name,username:u.username,email:u.email,avatar:u.avatar||"",bio:u.bio||"",role:u.role,created_at:u.created_at}}
function token(){return crypto.randomBytes(48).toString("hex")}
function hash(s){return crypto.createHash("sha256").update(s).digest("hex")}
function setSession(res,userId){
 const t=token(), days=Number(process.env.SESSION_DAYS||14), exp=Date.now()+days*864e5;
 db.prepare("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").run(hash(t),userId,exp);
 res.cookie("cv_session",t,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:days*864e5,path:"/"});
}
function auth(req,res,next){
 const t=req.cookies.cv_session;
 if(!t) return res.status(401).json({error:"Login required"});
 const s=db.prepare("SELECT * FROM sessions WHERE token_hash=? AND expires_at>?").get(hash(t),Date.now());
 if(!s) return res.status(401).json({error:"Session expired"});
 const u=db.prepare("SELECT * FROM users WHERE id=?").get(s.user_id);
 if(!u) return res.status(401).json({error:"User not found"});
 req.user=u; next();
}
function optionalAuth(req,res,next){
 const t=req.cookies.cv_session;
 if(t){const s=db.prepare("SELECT * FROM sessions WHERE token_hash=? AND expires_at>?").get(hash(t),Date.now()); if(s) req.user=db.prepare("SELECT * FROM users WHERE id=?").get(s.user_id)}
 next();
}
function admin(req,res,next){ if(!req.user || req.user.role!=="admin") return res.status(403).json({error:"Admin only"}); next(); }
function videoRow(id,userId){
 return db.prepare(`
 SELECT v.*, u.name creator_name,u.username creator_username,u.avatar creator_avatar,
 (SELECT COUNT(*) FROM likes l WHERE l.video_id=v.id) like_count,
 (SELECT COUNT(*) FROM comments c WHERE c.video_id=v.id) comment_count
 FROM videos v JOIN users u ON u.id=v.user_id
 WHERE v.id=?`).get(id);
}
function canView(v,u){
 return v.visibility==="public" || v.visibility==="unlisted" || (u && (u.id===v.user_id || u.role==="admin"));
}

app.use(helmet({crossOriginResourcePolicy:false}));
app.use(express.json({limit:"2mb"}));
app.use(cookieParser());
app.use(express.urlencoded({extended:true,limit:"2mb"}));
// Small in-process abuse limiter for auth/write endpoints; use a reverse proxy/WAF for multi-instance production.
const hits=new Map();
setInterval(()=>{const now=Date.now();for(const [k,v] of hits)if(v.reset<now)hits.delete(k)},60000).unref();
function rate(limit,windowMs){return (req,res,next)=>{const k=req.ip+"|"+req.path,now=Date.now(),x=hits.get(k);if(!x||x.reset<now)hits.set(k,{n:1,reset:now+windowMs});else x.n++;const cur=hits.get(k);if(cur.n>limit)return res.status(429).json({error:"Too many requests. Try again shortly."});next()}}
app.use("/api/auth",rate(20,60000));

const videoStorage=multer.diskStorage({
 destination:UP,
 filename:(req,file,cb)=>cb(null,crypto.randomBytes(16).toString("hex")+path.extname(file.originalname).toLowerCase())
});
const imageStorage=multer.diskStorage({
 destination:TH,
 filename:(req,file,cb)=>cb(null,crypto.randomBytes(16).toString("hex")+path.extname(file.originalname).toLowerCase())
});
const maxVideo=Number(process.env.MAX_VIDEO_MB||2048)*1024*1024;
const maxImage=Number(process.env.MAX_IMAGE_MB||10)*1024*1024;
const uploadStorage=multer.diskStorage({
 destination:(req,file,cb)=>cb(null,file.fieldname==="thumbnail"?TH:UP),
 filename:(req,file,cb)=>cb(null,crypto.randomBytes(16).toString("hex")+path.extname(file.originalname).toLowerCase())
});

const videoUpload=multer({
 storage:uploadStorage,
 limits:{fileSize:maxVideo},
 fileFilter:(req,f,cb)=>{
  if(f.fieldname==="thumbnail"){
   const ok=["image/jpeg","image/png","image/webp"].includes(f.mimetype)||/\.(jpe?g|png|webp)$/i.test(f.originalname);
   return cb(ok?null:new Error("Unsupported image type"),ok);
  }
  const ok=["video/mp4","video/webm","video/ogg","video/quicktime","video/x-matroska","application/octet-stream"].includes(f.mimetype)||/\.(mp4|webm|ogg|mov|mkv)$/i.test(f.originalname);
  cb(ok?null:new Error("Unsupported video type"),ok);
 }
});
const imageUpload=multer({storage:imageStorage,limits:{fileSize:maxImage},fileFilter:(req,f,cb)=>{
 const ok=["image/jpeg","image/png","image/webp"].includes(f.mimetype); cb(ok?null:new Error("Unsupported image type"),ok);
}});

app.get("/api/me",optionalAuth,(req,res)=>res.json({user:req.user?publicUser(req.user):null}));
app.post("/api/auth/register", rate(10,3600000), (req,res)=>{
 const name=clean(req.body.name,80), username=clean(req.body.username,40).replace(/[^a-zA-Z0-9_.-]/g,"");
 const email=clean(req.body.email,160).toLowerCase(), pw=String(req.body.password||"");
 if(name.length<2||username.length<3||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||pw.length<8) return res.status(400).json({error:"Name, username, valid email and password (8+ chars) are required"});
 try{
  const password_hash=bcrypt.hashSync(pw,12);
  const info=db.prepare("INSERT INTO users(name,username,email,password_hash) VALUES(?,?,?,?)").run(name,username,email,password_hash);
  setSession(res,info.lastInsertRowid);
  res.json({user:publicUser(db.prepare("SELECT * FROM users WHERE id=?").get(info.lastInsertRowid))});
 }catch(e){res.status(409).json({error:"Username or email already exists"})}
});
app.post("/api/auth/login", rate(20,60000),(req,res)=>{
 const id=clean(req.body.login,160).toLowerCase(), pw=String(req.body.password||"");
 const u=db.prepare("SELECT * FROM users WHERE email=? OR username=?").get(id,id);
 if(!u||!bcrypt.compareSync(pw,u.password_hash)) return res.status(401).json({error:"Invalid login details"});
 setSession(res,u.id); res.json({user:publicUser(u)});
});
app.post("/api/auth/logout",(req,res)=>{const t=req.cookies.cv_session;if(t)db.prepare("DELETE FROM sessions WHERE token_hash=?").run(hash(t));res.clearCookie("cv_session",{path:"/"});res.json({ok:true})});

app.get("/api/users/:username",(req,res)=>{
 const u=db.prepare("SELECT id,name,username,avatar,bio,role,created_at FROM users WHERE username=?").get(req.params.username);
 if(!u)return res.status(404).json({error:"Channel not found"});
 const subscribers=db.prepare("SELECT COUNT(*) n FROM subscriptions WHERE channel_id=?").get(u.id).n;
 const videos=db.prepare("SELECT id,title,description,category,thumbnail,visibility,views,created_at FROM videos WHERE user_id=? AND visibility='public' ORDER BY created_at DESC").all(u.id);
 res.json({user:u,subscribers,videos});
});
app.patch("/api/me",auth,(req,res)=>{
 const name=clean(req.body.name,80), bio=clean(req.body.bio,500);
 db.prepare("UPDATE users SET name=?,bio=? WHERE id=?").run(name||req.user.name,bio,req.user.id);
 res.json({user:publicUser(db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id))});
});
app.post("/api/me/avatar",auth,imageUpload.single("avatar"),(req,res)=>{
 if(!req.file)return res.status(400).json({error:"Avatar required"});
 const old=req.user.avatar; const rel="/media/thumbs/"+req.file.filename;
 db.prepare("UPDATE users SET avatar=? WHERE id=?").run(rel,req.user.id);
 if(old&&old.startsWith("/media/thumbs/"))fs.unlink(path.join(TH,path.basename(old)),()=>{});
 res.json({avatar:rel});
});

app.get("/api/videos",optionalAuth,(req,res)=>{
 const q=clean(req.query.q,100), category=clean(req.query.category,40);
 let sql=`SELECT v.*,u.name creator_name,u.username creator_username,u.avatar creator_avatar,
 (SELECT COUNT(*) FROM likes l WHERE l.video_id=v.id) like_count
 FROM videos v JOIN users u ON u.id=v.user_id WHERE `;
 const args=[];
 if(q){sql+="(v.title LIKE ? OR v.description LIKE ? OR u.name LIKE ? OR u.username LIKE ?) ";const x="%"+q+"%";args.push(x,x,x,x)}
 else sql+="1=1 ";
 sql+="AND (v.visibility='public' ";
 if(req.user) {sql+="OR v.user_id=?";args.push(req.user.id)}
 sql+=") ";

if(category && category!=="Trending"){
  sql+="AND v.category=? ";
  args.push(category);
}

if(category==="Trending"){
  sql+="ORDER BY v.views DESC LIMIT 100";
}else{
  sql+="ORDER BY v.created_at DESC LIMIT 100";
}
 res.json({videos:db.prepare(sql).all(...args)});
});

app.post("/api/videos",auth,videoUpload.fields([{name:"video",maxCount:1},{name:"thumbnail",maxCount:1}]),(req,res)=>{
 const f=req.files && req.files.video ? req.files.video[0] : null; if(!f)return res.status(400).json({error:"Video file required"});
 const title=clean(req.body.title,150); if(!title){fs.unlink(f.path,()=>{});return res.status(400).json({error:"Title required"})}
 const thumb=req.files && req.files.thumbnail && req.files.thumbnail[0] ? req.files.thumbnail[0].filename : ""||"";
 const vis=["public","private","unlisted"].includes(req.body.visibility)?req.body.visibility:"public";
 const info=db.prepare(`INSERT INTO videos(user_id,title,description,category,filename,original_name,mime,size,thumbnail,visibility) VALUES(?,?,?,?,?,?,?,?,?,?)`)
 .run(req.user.id,title,clean(req.body.description,5000),clean(req.body.category,50)||"Other",f.filename,f.originalname,f.mimetype,f.size,thumb,vis);
 res.json({video:videoRow(info.lastInsertRowid,req.user.id)});
});

app.get("/api/videos/:id",optionalAuth,(req,res)=>{
 const v=videoRow(Number(req.params.id),req.user ? req.user.id : null); if(!v)return res.status(404).json({error:"Video not found"});
 if(!canView(v,req.user))return res.status(403).json({error:"This video is not available"});
 const liked=!!req.user&&!!db.prepare("SELECT 1 FROM likes WHERE user_id=? AND video_id=?").get(req.user.id,v.id);
 res.json({video:{...v,liked}});
});



app.post("/api/videos/:id/view",optionalAuth,(req,res)=>{
 const id=Number(req.params.id);
 const v=db.prepare("SELECT * FROM videos WHERE id=?").get(id);

 if(!v||!canView(v,req.user)){
   return res.status(404).json({error:"Video not found"});
 }

 const viewerKey=req.user
   ? "user:"+req.user.id
   : "ip:"+req.ip;

 const result=db.prepare(
   "INSERT OR IGNORE INTO video_views(video_id,viewer_key) VALUES(?,?)"
 ).run(v.id,viewerKey);

 if(result.changes>0){
   db.prepare("UPDATE videos SET views=views+1 WHERE id=?").run(v.id);
 }

 const current=db.prepare(
   "SELECT views FROM videos WHERE id=?"
 ).get(v.id);

 res.json({views:current.views});
});

app.post("/api/videos/:id/like",auth,(req,res)=>{
 const id=Number(req.params.id),v=db.prepare("SELECT * FROM videos WHERE id=?").get(id);
 if(!v||!canView(v,req.user))return res.status(404).json({error:"Video not found"});

 const exists=db.prepare(
   "SELECT 1 FROM likes WHERE user_id=? AND video_id=?"
 ).get(req.user.id,id);

 if(exists){
   db.prepare(
     "DELETE FROM likes WHERE user_id=? AND video_id=?"
   ).run(req.user.id,id);
 }else{
   db.prepare(
     "INSERT INTO likes(user_id,video_id) VALUES(?,?)"
   ).run(req.user.id,id);
 }

 res.json({
   liked:!exists,
   likes:db.prepare(
     "SELECT COUNT(*) n FROM likes WHERE video_id=?"
   ).get(id).n
 });
});

app.post("/api/channels/:id/subscribe",auth,(req,res)=>{
 const id=Number(req.params.id);

 if(id===req.user.id){
   return res.status(400).json({
     error:"You cannot subscribe to yourself"
   });
 }

 if(!db.prepare("SELECT id FROM users WHERE id=?").get(id)){
   return res.status(404).json({
     error:"Channel not found"
   });
 }

 const ex=db.prepare(
   "SELECT 1 FROM subscriptions WHERE subscriber_id=? AND channel_id=?"
 ).get(req.user.id,id);

 if(ex){
   db.prepare(
     "DELETE FROM subscriptions WHERE subscriber_id=? AND channel_id=?"
   ).run(req.user.id,id);
 }else{
   db.prepare(
     "INSERT INTO subscriptions(subscriber_id,channel_id) VALUES(?,?)"
   ).run(req.user.id,id);
 }

 res.json({
   subscribed:!ex,
   subscribers:db.prepare(
     "SELECT COUNT(*) n FROM subscriptions WHERE channel_id=?"
   ).get(id).n
 });
});

app.get("/api/videos/:id/comments",(req,res)=>{
 res.json({
   comments:db.prepare(`
     SELECT c.id,c.body,c.created_at,
            u.name,u.username,u.avatar
     FROM comments c
     JOIN users u ON u.id=c.user_id
     WHERE c.video_id=?
     ORDER BY c.created_at DESC
   `).all(Number(req.params.id))
 });
});

app.post("/api/videos/:id/comments",auth,(req,res)=>{
 const body=clean(req.body.body,1000);

 if(!body){
   return res.status(400).json({
     error:"Comment required"
   });
 }

 const v=db.prepare(
   "SELECT * FROM videos WHERE id=?"
 ).get(Number(req.params.id));

 if(!v||!canView(v,req.user)){
   return res.status(404).json({
     error:"Video not found"
   });
 }

 const i=db.prepare(
   "INSERT INTO comments(user_id,video_id,body) VALUES(?,?,?)"
 ).run(req.user.id,v.id,body);

 res.json({
   comment:db.prepare(`
     SELECT c.id,c.body,c.created_at,
            u.name,u.username,u.avatar
     FROM comments c
     JOIN users u ON u.id=c.user_id
     WHERE c.id=?
   `).get(i.lastInsertRowid)
 });
});
app.patch("/api/videos/:id",auth,(req,res)=>{
 const v=db.prepare("SELECT * FROM videos WHERE id=?").get(Number(req.params.id)); if(!v||v.user_id!==req.user.id&&req.user.role!=="admin")return res.status(404).json({error:"Video not found"});
 const title=clean(req.body.title,150)||v.title, desc=clean(req.body.description,5000), cat=clean(req.body.category,50)||"Other", vis=["public","private","unlisted"].includes(req.body.visibility)?req.body.visibility:v.visibility;
 db.prepare("UPDATE videos SET title=?,description=?,category=?,visibility=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(title,desc,cat,vis,v.id);
 res.json({video:videoRow(v.id,req.user.id)});
});
app.delete("/api/videos/:id",auth,(req,res)=>{
 const v=db.prepare("SELECT * FROM videos WHERE id=?").get(Number(req.params.id));if(!v||v.user_id!==req.user.id&&req.user.role!=="admin")return res.status(404).json({error:"Video not found"});
 db.prepare("DELETE FROM videos WHERE id=?").run(v.id);fs.unlink(path.join(UP,v.filename),()=>{});if(v.thumbnail)fs.unlink(path.join(TH,v.thumbnail),()=>{});res.json({ok:true});
});
app.get("/api/analytics",auth,(req,res)=>{
 const totals=db.prepare(`SELECT COUNT(*) videos,COALESCE(SUM(views),0) views FROM videos WHERE user_id=?`).get(req.user.id);
 const likes=db.prepare(`SELECT COUNT(*) n FROM likes l JOIN videos v ON v.id=l.video_id WHERE v.user_id=?`).get(req.user.id).n;
 const comments=db.prepare(`SELECT COUNT(*) n FROM comments c JOIN videos v ON v.id=c.video_id WHERE v.user_id=?`).get(req.user.id).n;
 const subscribers=db.prepare("SELECT COUNT(*) n FROM subscriptions WHERE channel_id=?").get(req.user.id).n;
 const top=db.prepare("SELECT id,title,views FROM videos WHERE user_id=? ORDER BY views DESC LIMIT 10").all(req.user.id);
 res.json({totals:{...totals,likes,comments,subscribers},top});
});
app.get("/api/admin/stats",auth,admin,(req,res)=>{
 res.json({users:db.prepare("SELECT COUNT(*) n FROM users").get().n,videos:db.prepare("SELECT COUNT(*) n FROM videos").get().n,views:db.prepare("SELECT COALESCE(SUM(views),0) n FROM videos").get().n,comments:db.prepare("SELECT COUNT(*) n FROM comments").get().n});
});
app.get("/api/admin/users",auth,admin,(req,res)=>res.json({users:db.prepare("SELECT id,name,username,email,role,created_at FROM users ORDER BY id DESC LIMIT 500").all()}));
app.delete("/api/admin/users/:id",auth,admin,(req,res)=>{if(Number(req.params.id)===req.user.id)return res.status(400).json({error:"Cannot delete yourself"});db.prepare("DELETE FROM users WHERE id=?").run(Number(req.params.id));res.json({ok:true})});

app.get("/media/video/:id",optionalAuth,function(req,res){
 const v=db.prepare("SELECT * FROM videos WHERE id=?").get(Number(req.params.id));
 if(!v || !canView(v,req.user)) return res.sendStatus(404);

 const file=path.join(UP,v.filename);
 if(!fs.existsSync(file)) return res.sendStatus(404);

 const stat=fs.statSync(file);
 const size=stat.size;
 const range=req.headers.range;

 res.setHeader("Accept-Ranges","bytes");
 res.setHeader("Content-Type",v.mime);
 res.setHeader("Content-Disposition","inline; filename*=UTF-8''"+encodeURIComponent(v.original_name));

 if(!range){
   res.setHeader("Content-Length",size);
   return fs.createReadStream(file).pipe(res);
 }

 const m=/^bytes=(\d*)-(\d*)$/.exec(range);

 if(!m){
   return res.status(416).set("Content-Range","bytes */"+size).end();
 }

 var start;
 var end;

 if(m[1]==="" && m[2]!==""){
   var suffix=Number(m[2]);
   if(!isFinite(suffix) || suffix<=0){
     return res.status(416).set("Content-Range","bytes */"+size).end();
   }
   start=Math.max(size-suffix,0);
   end=size-1;
 }else{
   start=Number(m[1]);
   end=m[2]==="" ? size-1 : Number(m[2]);
 }

 if(!isFinite(start) || !isFinite(end) || start<0 || start>=size || end<start){
   return res.status(416).set("Content-Range","bytes */"+size).end();
 }

 if(end>=size) end=size-1;

 var length=end-start+1;

 res.status(206).set({
   "Content-Range":"bytes "+start+"-"+end+"/"+size,
   "Content-Length":length
 });

 fs.createReadStream(file,{start:start,end:end}).pipe(res);
});app.listen(PORT,function(){console.log("StreamTube running on http://localhost:"+PORT)});

app.use("/media/thumbs",express.static(TH));

app.use(express.static(ROOT,{extensions:["html"]}));
