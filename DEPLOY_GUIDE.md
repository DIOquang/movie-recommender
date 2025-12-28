# 🚀 Movie Recommendation System - Deploy on Render.com

## Quick Start (3 Steps)

### Step 1: Push to GitHub

```bash
cd /Users/quang/Desktop/web_app

# Initialize git
git init
git add .
git commit -m "Movie recommendation system ready to deploy"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/movie-recommender.git
git branch -M main
git push -u origin main
```

### Step 2: Create Render Service

1. Go to **[render.com](https://render.com)**
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**
4. Select your repository
5. Fill in settings:
   - **Name:** `movie-recommender`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 30`
   - **Plan:** `Free`

6. **Add Environment Variable:**
   - Key: `TMDB_API_KEY`
   - Value: `973eac1c6ee5c0af02fd6281ff2bb30b`

7. Click **"Create Web Service"**

### Step 3: Wait & Share

- Deployment takes 2-3 minutes
- You'll get a URL: `https://movie-recommender-xxxxx.onrender.com`
- Share this URL with your instructor!

---

## Project Structure

```
web_app/
├── app.py                    # Flask launcher
├── api.py                    # Backend API & recommendation engine
├── index.html               # Frontend HTML
├── script.js                # JavaScript & interactivity
├── style.css                # Styling & layout
├── movies_clean.csv         # Movie dataset (5000+ movies)
├── requirements.txt         # Python dependencies
├── render.yaml             # Render configuration
├── README.md               # Project documentation
└── DEPLOY_GUIDE.md         # This file
```

---

## What's Included

✅ **TF-IDF Recommendation Engine** - Content-based movie recommendations
✅ **Genre Filtering** - Filter recommendations by genre
✅ **Search History** - Track recent searches with quick recall
✅ **Data Analytics** - Rating distribution, genre frequency charts
✅ **Responsive UI** - Works on desktop & mobile
✅ **Offline Demo Mode** - Works without API
✅ **Dynamic Charts** - Chart.js visualizations

---

## Features to Demo

**For Your Instructor:**

1. **Search & Recommend**
   - Type "Avatar" → Get 5 similar movies
   - Shows match scores & similarity percentage

2. **Genre Filtering**
   - Select "Action" genre
   - Get filtered recommendations
   - See genres & overview for each movie

3. **Analytics**
   - Rating distribution histogram
   - Genre frequency chart
   - Top rated movies
   - Dataset statistics

4. **Search History**
   - Click search box → See recent 5 searches
   - Click any to reuse

---

## Free Tier Details

**Render Free Plan:**
- 750 dyno hours/month
- Shared CPU & 0.5GB RAM
- Perfect for demos & learning
- Auto-sleeps after 15 minutes of inactivity (re-wakes on request)

**Cost:** $0/month

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check all packages in `requirements.txt` are installed locally first |
| "Module not found" | Add missing package to `requirements.txt` and redeploy |
| Slow response | Free tier has cold starts; upgraded plan = instant |
| CSV not found | Ensure `movies_clean.csv` is committed to git |

---

## Local Demo (Backup)

If cloud deployment has issues, demo locally:

```bash
cd /Users/quang/Desktop/web_app
python app.py

# Opens http://localhost:5001 automatically
```

---

## Files Ready for Deployment

✅ `render.yaml` - Render configuration (auto-created)
✅ `requirements.txt` - All dependencies listed
✅ `app.py` - Flask launcher with port config
✅ `api.py` - REST API backend
✅ `index.html`, `script.js`, `style.css` - Frontend
✅ `movies_clean.csv` - Dataset included

**You're ready to deploy!** 🎉

   - **Environment:** Python 3
   - **Build Command:** `pip install -r web_app/requirements.txt`
   - **Start Command:** `cd web_app && gunicorn -w 4 -b 0.0.0.0:$PORT api:app`
6. **Advanced** → **Auto-deploy:** Turn ON
7. Click **"Create Web Service"**

### Bước 3: Đợi Deploy (~2-3 phút)

Streamlit Cloud sẽ:
- Clone repo từ GitHub
- Install dependencies
- Load movies_clean.csv
- Start Flask server

### Bước 4: Cập nhật Frontend

Khi API deployed, thay đổi URL trong `script.js`:

```javascript
// OLD (localhost)
const API_BASE = 'http://localhost:5001/api';

// NEW (Render)
const API_BASE = 'https://movie-recommender-api.onrender.com/api';
```

Commit và push:
```bash
git add web_app/script.js
git commit -m "Update API endpoint for production"
git push
```

---

## 📊 Deployment URLs

**API Server:**
```
https://movie-recommender-api.onrender.com
```

**API Endpoints:**
```
GET  https://movie-recommender-api.onrender.com/api/movies
GET  https://movie-recommender-api.onrender.com/api/recommendations?movie=Avatar
```

**Frontend (Static File):**
- Open `web_app/index.html` locally
- Hoặc deploy lên GitHub Pages

---

## 🔗 Deploy Frontend (HTML/CSS/JS)

### Option 1: GitHub Pages (FREE)

```bash
# Tạo branch gh-pages
git checkout -b gh-pages

# Copy web_app files
cp web_app/index.html .
cp web_app/script.js .
cp web_app/style.css .

# Commit
git add index.html script.js style.css
git commit -m "Deploy frontend to GitHub Pages"
git push origin gh-pages
```

Sau đó trong GitHub:
- Vào **Settings** → **Pages**
- Chọn source: `gh-pages`

**Frontend sẽ ở:** `https://YOUR_USERNAME.github.io/movie-recommender/`

### Option 2: Render (Static Site)

1. Vào https://render.com/
2. Click **"New +"** → **"Static Site"**
3. Chọn branch: `main`
4. **Publish directory:** `web_app`
5. **Build command:** Leave empty
6. Click **"Create Static Site"**

---

## ⚠️ Lưu ý quan trọng

| Điểm | Chi tiết |
|------|----------|
| **Dataset** | `movies_clean.csv` (40MB) ✅ OK |
| **Startup time** | ~10-15 giây (load TF-IDF model) |
| **Memory** | Render free tier: 512MB ✅ OK |
| **API Key** | TMDB API public key (no auth needed) |
| **CORS** | ✅ Enabled trong api.py |

---

## 🐛 Troubleshooting

### API Error 500
```
❌ "Internal Server Error"
```
**Giải pháp:**
- Kiểm tra logs trong Render dashboard
- Verify `movies_clean.csv` có trong `web_app/`
- Test local: `python web_app/api.py`

### Frontend CORS Error
```
❌ "CORS policy: No 'Access-Control-Allow-Origin' header"
```
**Giải pháp:**
- Flask CORS đã enable (`from flask_cors import CORS`)
- Verify API_BASE URL correct trong `script.js`

### Build Error
```
❌ "Build failed"
```
**Giải pháp:**
- Kiểm tra `requirements.txt` syntax
- Verify Python version 3.10+
- Check log messages

### Slow Loading
```
⏳ App takes > 30 seconds to load
```
**Giải pháp:**
- TF-IDF build mất time first load
- Render cache sau lần đầu

---

## 📝 Local Development

```bash
# Install dependencies
cd web_app
pip install -r requirements.txt

# Run API
python api.py
# Server at: http://localhost:5001

# Run frontend (new terminal)
python -m http.server 8000 --directory web_app
# Open: http://localhost:8000
```

---

## 🔄 Update Code

```bash
# Make changes
# ...

# Commit
git add web_app/
git commit -m "Update features"

# Push
git push origin main

# Render auto-redeploy
```

---

## 📚 Resources

- **Render Docs:** https://render.com/docs
- **Flask Docs:** https://flask.palletsprojects.com/
- **TMDB API:** https://www.themoviedb.org/settings/api

**Happy Deploying! 🚀**
