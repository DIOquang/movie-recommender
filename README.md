link deploy: https://movie-recommender-h4e7.onrender.com/
link github: https://github.com/DIOquang/movie-recommender.git


# 🎬 Movie Recommendation System - Modern Web App

Beautiful movie recommendation system with stunning UI and slideshow effects.

## ✨ Features

- 🎨 **Beautiful Slideshow**: Auto-rotating hero section with cinematic transitions
- 🎯 **Smart Recommendations**: AI-powered movie suggestions using TF-IDF + Cosine Similarity
- 📱 **Fully Responsive**: Works perfectly on all devices
- 🎭 **Smooth Animations**: Professional CSS animations and transitions
- 🔍 **Autocomplete Search**: Easy movie selection with datalist
- 📊 **Search History**: Track your recent searches
- 🌟 **Movie Posters**: Real-time poster fetching from TMDB API
- ⚡ **Fast Performance**: Optimized with lazy loading and debouncing

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start Backend API

```bash
python api.py
```

The Flask server will start at `http://localhost:5001` (default)

Quick start (macOS): double-click `start_backend.command`

```bash
# Or via terminal
chmod +x start_backend.sh start_backend.command
./start_backend.sh
```

### 3. Open Frontend

- **Nhanh nhất (demo offline):** mở trực tiếp `index.html` sau khi giải nén (trang sẽ tự dò API; nếu không có, dùng dữ liệu demo).
- **Dùng API thật (TF-IDF + Poster động):** chạy backend (bước 2), sau đó mở `index.html`. Trang sẽ tự chuyển sang chế độ live nếu tìm thấy API.

### 4. One-Step Run (Backend + Frontend)

```bash
python app.py
```

- Tác dụng: tạo `.venv`, cài dependencies, bật backend (ưu tiên gunicorn), chờ `/api/health` ok, khởi chạy HTTP server tĩnh và mở trình duyệt.
- Mặc định: backend ở `:5001`, frontend ở `:8000`.

```bash
# Using Python
python -m http.server 8000
# Visit http://localhost:8000

# Using Node.js (http-server)
npx http-server -p 8000
# Visit http://localhost:8000
```

## 📁 Project Structure

```
web_app/
├── index.html          # Frontend HTML
├── style.css           # Styling & animations
├── script.js           # Frontend JavaScript
├── api.py              # Flask backend API
├── requirements.txt    # Python dependencies
└── README.md           # This file
```

## 🎯 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API documentation |
| `/api/movies` | GET | Get all movie titles |
| `/api/recommend` | POST | Get recommendations |
| `/api/movie/<id>` | GET | Get movie details |
| `/api/random` | GET | Get random movies |
| `/api/top` | GET | Get top rated movies |
| `/api/search` | GET | Search movies by title |
| `/api/stats` | GET | Get database statistics |
| `/api/health` | GET | Health/status (dataset, TMDB key) |

### Example: Get Recommendations

```bash
curl -X POST http://localhost:5001/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"movie": "Avatar"}'

### Environment

Set your TMDB key (recommended for full poster coverage):

```bash
export TMDB_API_KEY=YOUR_KEY
```

### Useful query params
- `/api/movies?limit=200&offset=0` (limit max 1000)
- `/api/search?q=avatar&limit=20` (limit max 50)
```

## 🎨 Design Features

### Slideshow Effect
- Auto-rotating slides every 5 seconds
- Smooth fade transitions
- Zoom-in animation on background images
- Gradient text strokes with glow effects

### Navigation
- Sticky navbar with blur effect
- Hover animations with gradient underlines
- Responsive hamburger menu
- Animated sidebar with history tracking

### Movie Cards
- Hover effects with shadows
- Real movie posters from TMDB
- Rating display with stars
- Grid layout with responsive columns

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Flask, Python
- **ML**: Scikit-learn (TF-IDF, Cosine Similarity)
- **Data**: Pandas
- **API**: TMDB (The Movie Database)
- **Fonts**: Google Fonts (Fjalla One, Inknut Antiqua)
- **Icons**: Font Awesome 6

## 📊 Performance Optimizations

- Lazy loading for images
- Debounced search input
- CSS transitions instead of JS animations
- Intersection Observer for scroll effects
- LocalStorage for history caching

## 🎭 Inspired By

The design is inspired by modern food/restaurant landing pages with:
- Cinematic slideshow effects
- Elegant typography
- Smooth animations
- Dark gradient backgrounds

## 🔧 Customization

### Change Slideshow Speed
Edit `script.js`:
```javascript
const SLIDE_INTERVAL = 5000; // milliseconds
```

### Change Color Scheme
Edit `style.css`:
```css
--primary-color: #e74c3c;   /* Red */
--secondary-color: #f39c12; /* Orange */
```

### Add More Slides
Add new slide div in `index.html`:
```html
<div class="slide slide-5">
    <!-- Your content here -->
</div>
```

## 📝 Notes

- Make sure `movies_clean.csv` is in the parent directory
- TMDB API key is included (replace with your own for production)
- Backend must be running for full functionality
- Frontend works standalone with demo data if backend is offline

## 🐛 Troubleshooting

**Backend not connecting?**
- Check if Flask server is running on port 5001
- Check CORS settings if using different domains

**Posters not loading?**
- Verify TMDB API key is valid
- Check internet connection
- Images will show placeholders if unavailable

**Movies not found?**
- Ensure CSV file path is correct in `api.py`
- Try case-insensitive search
- Use autocomplete suggestions

## 🎓 Learning Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [TF-IDF Explained](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction)
- [CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)
- [TMDB API](https://developers.themoviedb.org/3)

## 📄 License

This project is for educational purposes. Movie data and posters are provided by TMDB.

## 👨‍💻 Author

Created for Final Project - AI Engineer Course

---

**Enjoy discovering your next favorite movie! 🍿🎬**
