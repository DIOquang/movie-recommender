import os

from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import difflib
import requests
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# TMDB API Configuration (override via env TMDB_API_KEY)
TMDB_API_KEY = os.getenv("TMDB_API_KEY", "973eac1c6ee5c0af02fd6281ff2bb30b")

# Simple in-memory cache to avoid repeated TMDB calls during a session
poster_cache = {}

# Load and prepare data
print("Loading movie data...")
df = pd.read_csv('movies_clean.csv')
df['overview'] = df['overview'].fillna('')
df['genres'] = df['genres'].fillna('')
df['keywords'] = df['keywords'].fillna('')

# Create soup
df['soup'] = df['overview'] + ' ' + df['genres'] + ' ' + df['keywords']

# Build TF-IDF matrix
print("Building TF-IDF matrix...")
tfidf = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf.fit_transform(df['soup'])

# Compute cosine similarity
print("Computing cosine similarity...")
cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)

# Create indices
indices = pd.Series(df.index, index=df['original_title']).drop_duplicates()

print("✅ Model ready!")

def fetch_poster(movie_id):
    """Fetch movie poster from TMDB API with basic caching"""
    if movie_id in poster_cache:
        return poster_cache[movie_id]

    if not TMDB_API_KEY:
        return None

    try:
        url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={TMDB_API_KEY}&language=en-US"
        data = requests.get(url, timeout=5).json()
        poster_path = data.get('poster_path')
        if poster_path:
            poster_cache[movie_id] = f"https://image.tmdb.org/t/p/w500{poster_path}"
        else:
            poster_cache[movie_id] = None
    except Exception:
        poster_cache[movie_id] = None

    return poster_cache[movie_id]

def get_recommendations(title, n=5):
    """Get movie recommendations with similarity score"""
    if title not in indices:
        return None
    
    idx = indices[title]
    sim_scores = list(enumerate(cosine_sim[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    sim_scores = sim_scores[1:n+1]
    
    recommendations = []
    for i, score in sim_scores:
        movie_data = df.iloc[i]
        recommendations.append({
            'title': movie_data['original_title'],
            'rating': round(float(movie_data['vote_average']), 1) if pd.notna(movie_data['vote_average']) else 'N/A',
            'poster': fetch_poster(movie_data['id']),
            'id': int(movie_data['id']),
            'score': round(float(score), 4),
            'genres': movie_data.get('genres', ''),
            'overview': movie_data.get('overview', '')
        })
    
    return recommendations

# ==========================================
# API ENDPOINTS
# ==========================================

@app.route('/')
def home():
    return jsonify({
        'message': 'Movie Recommendation API',
        'version': '1.0',
        'endpoints': {
            '/api/movies': 'GET - Get list of all movies',
            '/api/recommend': 'POST - Get recommendations for a movie',
            '/api/movie/<id>': 'GET - Get movie details by ID'
        }
    })

@app.route('/api/movies', methods=['GET'])
def get_movies():
    """Get list of all movie titles"""
    limit = request.args.get('limit', default=500, type=int)
    offset = request.args.get('offset', default=0, type=int)

    limit = max(1, min(limit, 1000))
    offset = max(0, offset)

    movies = df['original_title'].iloc[offset:offset + limit].tolist()
    return jsonify({
        'movies': movies,
        'count': len(movies),
        'limit': limit,
        'offset': offset,
        'total': len(df)
    })

@app.route('/api/recommend', methods=['POST'])
def recommend():
    """Get movie recommendations"""
    data = request.get_json()
    movie_name = data.get('movie', '').strip()
    matched_title = None
    match_type = None
    
    if not movie_name:
        return jsonify({'error': 'Movie name is required'}), 400
    
    # Try exact match first
    recommendations = get_recommendations(movie_name, n=5)
    exact_movie = None
    if movie_name in indices:
        idx = indices[movie_name]
        movie_row = df.iloc[idx]
        exact_movie = {
            'title': movie_row['original_title'],
            'rating': round(float(movie_row['vote_average']), 1) if pd.notna(movie_row['vote_average']) else 'N/A',
            'poster': fetch_poster(movie_row['id']),
            'id': int(movie_row['id']),
            'score': 1.0,
            'genres': movie_row.get('genres', ''),
            'overview': movie_row.get('overview', '')
        }
        matched_title = movie_row['original_title']
        match_type = 'exact'
    
    # If not found, try case-insensitive search
    if recommendations is None:
        matches = df[df['original_title'].str.lower() == movie_name.lower()]
        if not matches.empty:
            recommendations = get_recommendations(matches.iloc[0]['original_title'], n=5)
            movie_row = matches.iloc[0]
            exact_movie = {
                'title': movie_row['original_title'],
                'rating': round(float(movie_row['vote_average']), 1) if pd.notna(movie_row['vote_average']) else 'N/A',
                'poster': fetch_poster(movie_row['id']),
                'id': int(movie_row['id']),
                'score': 1.0,
                'genres': movie_row.get('genres', ''),
                'overview': movie_row.get('overview', '')
            }
            matched_title = movie_row['original_title']
            match_type = 'case-insensitive'
    
    # If still not found, try partial match
    if recommendations is None:
        matches = df[df['original_title'].str.contains(movie_name, case=False, na=False)]
        if not matches.empty:
            top_match = matches.iloc[0]
            recommendations = get_recommendations(top_match['original_title'], n=5)
            matched_title = top_match['original_title']
            match_type = 'partial'
        else:
            # fuzzy suggestions using difflib
            titles = df['original_title'].tolist()
            close = difflib.get_close_matches(movie_name, titles, n=5, cutoff=0.3)
            # fallback: top-rated if still empty
            if not close:
                close = df.nlargest(5, 'vote_average')['original_title'].tolist()
            return jsonify({
                'error': f'Movie "{movie_name}" not found in database',
                'suggestions': close,
                'suggestion': 'Try a suggested title',
            }), 404
    
    if exact_movie:
        # Put the exact movie at the top if not already present
        titles = [m['title'] for m in recommendations]
        if exact_movie['title'] not in titles:
            recommendations = [exact_movie] + recommendations
        else:
            # move it to front
            recommendations = [exact_movie] + [m for m in recommendations if m['title'] != exact_movie['title']]

    return jsonify({
        'movie': movie_name,
        'recommendations': recommendations,
        'count': len(recommendations),
        'base_title': matched_title,
        'match_type': match_type
    })

@app.route('/api/movie/<int:movie_id>', methods=['GET'])
def get_movie_details(movie_id):
    """Get movie details by ID"""
    movie = df[df['id'] == movie_id]
    
    if movie.empty:
        return jsonify({'error': 'Movie not found'}), 404
    
    movie_data = movie.iloc[0]
    return jsonify({
        'id': int(movie_data['id']),
        'title': movie_data['original_title'],
        'overview': movie_data['overview'],
        'genres': movie_data['genres'],
        'rating': float(movie_data['vote_average']) if pd.notna(movie_data['vote_average']) else None,
        'vote_count': int(movie_data['vote_count']) if pd.notna(movie_data['vote_count']) else 0,
        'poster': fetch_poster(movie_data['id'])
    })

@app.route('/api/random', methods=['GET'])
def random_movies():
    """Get random movies"""
    count = request.args.get('count', default=10, type=int)
    count = min(count, 50)  # Max 50 movies
    
    random_movies = df.sample(n=count)
    movies = []
    
    for _, movie in random_movies.iterrows():
        movies.append({
            'id': int(movie['id']),
            'title': movie['original_title'],
            'rating': round(float(movie['vote_average']), 1) if pd.notna(movie['vote_average']) else 'N/A',
            'poster': fetch_poster(movie['id']),
            'genres': movie.get('genres', ''),
            'overview': movie.get('overview', '')
        })
    
    return jsonify({
        'movies': movies,
        'count': len(movies)
    })

@app.route('/api/top', methods=['GET'])
def top_movies():
    """Get top rated movies"""
    count = request.args.get('count', default=10, type=int)
    count = min(count, 50)
    
    top = df.nlargest(count, 'vote_average')
    movies = []
    
    for _, movie in top.iterrows():
        movies.append({
            'id': int(movie['id']),
            'title': movie['original_title'],
            'rating': round(float(movie['vote_average']), 1),
            'poster': fetch_poster(movie['id']),
            'genres': movie.get('genres', ''),
            'overview': movie.get('overview', '')
        })
    
    return jsonify({
        'movies': movies,
        'count': len(movies)
    })

@app.route('/api/search', methods=['GET'])
def search_movies():
    """Search movies by title and/or genre"""
    query = request.args.get('q', '').strip()
    genre = request.args.get('genre', '').strip()
    limit = request.args.get('limit', default=20, type=int)
    limit = max(1, min(limit, 50))
    
    if not query and not genre:
        return jsonify({'error': 'Provide at least one of "q" or "genre"'}), 400
    
    matches = df
    if query:
        matches = matches[matches['original_title'].str.contains(query, case=False, na=False)]
    if genre:
        matches = matches[matches['genres'].str.contains(genre, case=False, na=False)]
    movies = []

    for _, movie in matches.head(limit).iterrows():
        movies.append({
            'id': int(movie['id']),
            'title': movie['original_title'],
            'rating': round(float(movie['vote_average']), 1) if pd.notna(movie['vote_average']) else 'N/A',
            'poster': fetch_poster(movie['id']),
            'genres': movie.get('genres', ''),
            'overview': movie.get('overview', '')
        })
    
    return jsonify({
        'query': query,
        'genre': genre,
        'movies': movies,
        'count': len(movies),
        'limit': limit,
        'total_matches': int(matches.shape[0])
    })

@app.route('/api/health', methods=['GET'])
def health():
    """Basic health/status endpoint"""
    return jsonify({
        'status': 'ok',
        'dataset_count': len(df),
        'tmdb_key_present': bool(TMDB_API_KEY),
        'poster_cache_entries': len(poster_cache)
    })

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get database statistics"""
    return jsonify({
        'total_movies': len(df),
        'average_rating': round(float(df['vote_average'].mean()), 2),
        'total_genres': len(df['genres'].unique()),
        'date_range': {
            'oldest': str(df['release_date'].min()) if 'release_date' in df.columns else None,
            'newest': str(df['release_date'].max()) if 'release_date' in df.columns else None
        }
    })

@app.route('/api/genres', methods=['GET'])
def list_genres():
    """List unique genres extracted from dataset"""
    tokens = set()
    for g in df['genres'].fillna(''):
        s = str(g)
        s = s.replace('[', ' ').replace(']', ' ').replace('{', ' ').replace('}', ' ')
        s = s.replace('"', ' ').replace("'", ' ')
        parts = re.split(r"\s*[\|,;/]+\s*", s)
        for part in parts:
            part = part.strip()
            if part:
                tokens.add(part)
    genres = sorted(tokens)
    return jsonify({'genres': genres, 'count': len(genres)})

@app.route('/api/analytics/rating-distribution', methods=['GET'])
def rating_distribution():
    """Get rating distribution histogram data"""
    bins = [0, 2, 4, 6, 8, 10]
    labels = ['0-2', '2-4', '4-6', '6-8', '8-10']
    counts = []
    for i in range(len(bins) - 1):
        count = len(df[(df['vote_average'] >= bins[i]) & (df['vote_average'] < bins[i+1])])
        counts.append(count)
    return jsonify({
        'labels': labels,
        'counts': counts,
        'total': len(df)
    })

@app.route('/api/analytics/genre-frequency', methods=['GET'])
def genre_frequency():
    """Get genre frequency (top 15)"""
    genre_counts = {}
    for g in df['genres'].fillna(''):
        s = str(g)
        s = s.replace('[', ' ').replace(']', ' ').replace('{', ' ').replace('}', ' ')
        s = s.replace('"', ' ').replace("'", ' ')
        parts = re.split(r"\s*[\|,;/]+\s*", s)
        for part in parts:
            part = part.strip()
            if part:
                genre_counts[part] = genre_counts.get(part, 0) + 1
    
    # Sort by count descending and get top 15
    sorted_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[:15]
    labels = [g[0] for g in sorted_genres]
    counts = [g[1] for g in sorted_genres]
    return jsonify({
        'labels': labels,
        'counts': counts
    })


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🎬 MOVIE RECOMMENDATION API SERVER")
    print("="*60)
    print("📊 Dataset: {} movies loaded".format(len(df)))
    print("🚀 Server starting at: http://localhost:5001")
    print("📚 API Documentation: http://localhost:5001/")
    print("="*60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5001)
