// ==========================================
// SLIDESHOW FUNCTIONALITY
// ==========================================
let current = 1;
const SLIDE_INTERVAL = 5000; // 5 seconds

const slideshow = () => {
    const slides = Array.from(document.querySelectorAll(".slide"));

    if (current > slides.length) {
        current = 1;
    } else if (current === 0) {
        current = slides.length;
    }

    slides.forEach((slide) => {
        const slideNumber = parseInt(slide.classList[1].split("-")[1]);
        if (slideNumber === current) {
            slide.style.cssText = "visibility: visible; opacity: 1;";
        } else {
            slide.style.cssText = "visibility: hidden; opacity: 0;";
        }
    });

    current++;
};

// Start slideshow
slideshow();
setInterval(slideshow, SLIDE_INTERVAL);

// ==========================================
// SIDEBAR & MENU FUNCTIONALITY
// ==========================================
const menuIcon = document.querySelector(".menu-icon");
const sidebar = document.querySelector(".sidebar");
const closeBtn = document.querySelector(".sidebar i.fa-xmark");
const sidebarBtn = document.querySelector(".sidebar-btn");

menuIcon.addEventListener("click", () => {
    sidebar.classList.add("navigate");
});

closeBtn.addEventListener("click", () => {
    sidebar.classList.remove("navigate");
});

sidebarBtn.addEventListener("click", () => {
    sidebar.classList.toggle("change");
});

// Close sidebar when clicking on navigation items
const sidebarNavItems = document.querySelectorAll(".sidebar-nav-items a");
sidebarNavItems.forEach(item => {
    item.addEventListener("click", () => {
        sidebar.classList.remove("navigate");
    });
});

// ==========================================
// SCROLL FUNCTIONALITY
// ==========================================
function scrollToSearch() {
    const target = document.getElementById('search');
    if (target) {
        target.scrollIntoView({ 
            behavior: 'smooth' 
        });
    }
}

// ==========================================
// MOVIE DATA & RECOMMENDATIONS
// ==========================================
// API detection: try candidates and enable live mode if reachable
let API_BASE = null;
let USE_API = false;

async function initApi() {
    // If user explicitly sets window.API_BASE, honor it
    const candidates = [];
    if (window.API_BASE) candidates.push(window.API_BASE);

    // Same-origin API (Render or any single-service deploy)
    if (window.location.protocol.startsWith('http')) {
        candidates.push(`${window.location.origin}/api`);
    }

    const isLocal = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
    if (isLocal) candidates.push('http://localhost:5001/api');

    // Legacy fallback (older Render service name)
    candidates.push('https://movie-recommender-api.onrender.com/api');

    for (const base of candidates) {
        try {
            const res = await fetch(`${base}/health`, { method: 'GET' });
            if (res.ok) {
                API_BASE = base;
                USE_API = true;
                return;
            }
        } catch (e) {
            // try next candidate
        }
    }

    // No API reachable; stay in demo mode
    API_BASE = null;
    USE_API = false;
}

// Demo data so index.html works offline after unzip
const DEMO_MOVIES = [
    { title: 'Avatar', rating: '7.8', poster: 'https://image.tmdb.org/t/p/w500/o76ZDm8PS9791XiuieNB93UZcRV.jpg' },
    { title: 'Inception', rating: '8.8', poster: 'https://image.tmdb.org/t/p/w500/628Dep6AxEtDxjZoGP78TsOxYbK.jpg' },
    { title: 'The Dark Knight', rating: '9.0', poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg' },
    { title: 'Interstellar', rating: '8.6', poster: 'https://image.tmdb.org/t/p/w500/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg' },
    { title: 'The Matrix', rating: '8.7', poster: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg' }
];
const DEMO_STATS = {
    total_movies: 5000,
    average_rating: 7.4,
    total_genres: 18,
    date_range: { oldest: '1902-01-01', newest: '2024-12-31' }
};
const DEMO_GENRES = [
    'Action','Adventure','Animation','Comedy','Crime','Documentary','Drama',
    'Family','Fantasy','History','Horror','Music','Mystery','Romance','Sci-Fi',
    'Thriller','War','Western'
];
let moviesList = [];
let searchHistory = normalizeHistory(JSON.parse(localStorage.getItem('searchHistory')) || []);

function normalizeHistory(raw) {
    return raw.map(entry => {
        if (typeof entry === 'string') {
            const title = entry.split(' (')[0] || entry;
            return { title, timestamp: '' };
        }
        return entry;
    }).filter(entry => entry && entry.title);
}

// Load movies list from CSV or API
async function loadMoviesList() {
    try {
        if (!USE_API) throw new Error('Offline demo mode');

        const response = await fetch(`${API_BASE}/movies`);
        const data = await response.json();
        moviesList = data.movies;
    } catch (error) {
        console.warn('Using demo movie list:', error.message || error);
        moviesList = DEMO_MOVIES.map(m => m.title);
    }

    const datalist = document.getElementById('movie-list');
    moviesList.forEach(movie => {
        const option = document.createElement('option');
        option.value = movie;
        datalist.appendChild(option);
    });
}

async function loadGenresList() {
    try {
        if (!USE_API) throw new Error('Offline demo mode');
        const res = await fetch(`${API_BASE}/genres`);
        const data = await res.json();
        populateGenres(data.genres || []);
    } catch (err) {
        console.warn('Using demo genres');
        populateGenres(DEMO_GENRES);
    }
}

function populateGenres(genres) {
    const select = document.getElementById('genre-filter');
    if (!select) return;
    // Clear existing except first option
    select.innerHTML = '<option value="">All Genres</option>';
    genres.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = g;
        select.appendChild(opt);
    });
}

// Get recommendations from backend
async function getRecommendations() {
    const input = document.getElementById('movie-input').value.trim();
    const selectedGenre = (document.getElementById('genre-filter')?.value || '').trim();
    
    if (!input) {
        alert('Please enter a movie name or genre!');
        return;
    }

    setRecommendationSummary({ recommendations: [], query: input });

    // Show loading
    document.getElementById('loading').classList.add('active');
    document.getElementById('movies-grid').innerHTML = '';

    try {
        if (!USE_API) {
            // Offline: show demo recs; genre filter not available in demo data
            showDemoRecommendations(input);
        } else {
            const response = await fetch(`${API_BASE}/recommend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ movie: input })
            });

            const data = await response.json();

            if (data.error) {
                if (data.suggestions && data.suggestions.length) {
                    showSuggestedMovies(data.suggestions);
                    setRecommendationSummary({
                        baseTitle: input,
                        matchType: 'suggestion',
                            recommendations: [],
                            query: input,
                            source: 'live',
                            note: 'No exact match found. Showing similar titles from our database.'
                    });
                }
                // Silent fail: no alert, just stop loading
                document.getElementById('loading').classList.remove('active');
                return;
            }

            // Add to history
            addToHistory(input);

            // Display recommendations (includes exact movie if found)
            let recs = data.recommendations || [];
            if (selectedGenre) {
                recs = recs.filter(m => (m.genres || '').toLowerCase().includes(selectedGenre.toLowerCase()));
            }

            // If results are too few, supplement with genre+keyword search
            if (selectedGenre && recs.length < 3) {
                const sup = await fetchSupplementByGenre(selectedGenre, input);
                recs = mergeByTitle(recs, sup);
            }

            displayMovies(recs, 'movies-grid');
            setRecommendationSummary({
                baseTitle: data.base_title || input,
                matchType: selectedGenre ? 'combined' : data.match_type,
                recommendations: recs,
                query: input,
                source: 'live'
            });
        }

        // Scroll to results
        document.getElementById('recommendations').scrollIntoView({ 
            behavior: 'smooth' 
        });

    } catch (error) {
        console.error('Error:', error);
        alert('Error connecting to server. Make sure Flask app is running!');
        
        // Demo fallback
        showDemoRecommendations(input);
    } finally {
        document.getElementById('loading').classList.remove('active');
    }
}

function mergeByTitle(primary, secondary) {
    const out = [...primary];
    const titles = new Set(primary.map(m => (m.title || '').toLowerCase()));
    secondary.forEach(m => {
        const t = (m.title || '').toLowerCase();
        if (t && !titles.has(t)) {
            titles.add(t);
            out.push(m);
        }
    });
    return out;
}

async function fetchSupplementByGenre(genre, query) {
    try {
        const url = new URL(`${API_BASE}/search`);
        if (genre) url.searchParams.set('genre', genre);
        if (query) url.searchParams.set('q', query);
        url.searchParams.set('limit', '10');
        const res = await fetch(url.toString());
        const data = await res.json();
        return data.movies || [];
    } catch (e) {
        return [];
    }
}

async function searchByGenre(genre, query) {
    try {
        const url = new URL(`${API_BASE}/search`);
        if (genre) url.searchParams.set('genre', genre);
        if (query) url.searchParams.set('q', query);
        const res = await fetch(url.toString());
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        displayMovies(data.movies || [], 'movies-grid');
        setRecommendationSummary({
            baseTitle: genre,
            matchType: 'genre',
            recommendations: data.movies || [],
            query: query,
            source: 'live'
        });
    } catch (err) {
        console.error('Genre search error', err);
        setRecommendationSummary({ recommendations: [], note: 'No movies found in the selected genre. Try a different genre or search term.' });
    }
}

function showDemoGenreSearch(genre) {
    const filtered = DEMO_MOVIES.filter(m => true); // demo: show all
    displayMovies(filtered, 'movies-grid');
    setRecommendationSummary({
        baseTitle: genre,
        matchType: 'genre-demo',
        recommendations: filtered,
        source: 'demo'
    });
}

async function showSuggestedMovies(suggestions) {
    const grid = document.getElementById('movies-grid');
    grid.innerHTML = '';

    // Try to fetch details via search endpoint if API available
    if (USE_API) {
        const items = [];
        for (const title of suggestions.slice(0, 5)) {
            try {
                const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(title)}&limit=1`);
                const data = await res.json();
                if (data.movies && data.movies.length) {
                    items.push(data.movies[0]);
                }
            } catch (e) {}
        }
        if (items.length) {
            displayMovies(items, 'movies-grid');
            return;
        }
    }

    // Fallback: show suggestion titles as plain cards
    suggestions.slice(0, 5).forEach(title => {
        grid.innerHTML += `<div class="movie-card"><div class="movie-info"><h3 class="movie-title">${title}</h3></div></div>`;
    });

    setRecommendationSummary({
        baseTitle: suggestions[0] || 'Gợi ý gần nhất',
        matchType: 'suggestion',
        recommendations: suggestions.map(title => ({ score: 0.0 })),
        note: 'No exact match found. Try one of the suggested titles to get personalized recommendations.',
    });
}

// Display movies in grid
function displayMovies(movies, gridId = 'movies-grid') {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '';
    // Constrain layout when only one movie
    grid.classList.toggle('single', movies.length === 1);

    movies.forEach(movie => {
        const card = createMovieCard(movie);
        grid.appendChild(card);
    });
}

function setRecommendationSummary({ baseTitle, matchType, recommendations, query, source, note }) {
    const summary = document.getElementById('rec-summary');
    if (!summary) return;

    if ((!recommendations || recommendations.length === 0) && !note) {
        summary.textContent = '';
        return;
    }

    if ((!recommendations || recommendations.length === 0) && note) {
        summary.textContent = note;
        return;
    }

    const scores = recommendations
        .map(m => typeof m.score === 'number' ? m.score : null)
        .filter(s => s !== null);

    const best = scores.length ? Math.max(...scores) : null;
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    const base = baseTitle || query || 'your search query';

    let matchLabel = 'similar match';
    if (matchType === 'exact') matchLabel = 'exact match';
    else if (matchType === 'case-insensitive') matchLabel = 'case-insensitive match';
    else if (matchType === 'partial') matchLabel = 'partial match';
    else if (matchType === 'suggestion') matchLabel = 'best suggestion';
    else if (matchType === 'combined') matchLabel = 'filtered by genre';
    else if (matchType === 'demo') matchLabel = 'demo mode';

    const parts = [];
    if (best !== null) parts.push(`highest match score ${Math.round(best * 100)}%`);
    if (avg !== null) parts.push(`average ${Math.round(avg * 100)}%`);
    const fitText = parts.length ? parts.join(', ') : 'based on content similarity';

    summary.innerHTML = `<strong>${base}</strong> (${matchLabel}) → ${fitText}. These movies are similar to your search.`;
}

// Create movie card element
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';

    const badge = (typeof movie.score === 'number')
        ? `<div class="match-badge">${Math.round(movie.score * 100)}% match</div>`
        : '';
    
    card.innerHTML = `
        ${badge}
        <img class="movie-poster" 
             src="${movie.poster || 'https://via.placeholder.com/300x450?text=' + encodeURIComponent(movie.title)}" 
             alt="${movie.title}"
             onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
        <div class="movie-info">
            <h3 class="movie-title">${movie.title}</h3>
            <div class="movie-rating">
                <i class="fa-solid fa-star"></i>
                <span>${movie.rating || 'N/A'}</span>
            </div>
            <div class="movie-meta">
                <div class="movie-genres">category: ${formatGenres(movie.genres)}</div>
                <div class="movie-overview">${(movie.overview || '').toString().slice(0, 140)}${(movie.overview || '').length > 140 ? '…' : ''}</div>
            </div>
        </div>
    `;
    
    return card;
}

function formatGenres(genres) {
    if (!genres) return 'N/A';
    const s = String(genres)
        .replace(/^[\[\{\(]+|[\]\}\)]+$/g, '')
        .replace(/"|\'/g, ' ');
    const parts = s.split(/\s*[\|,;/]+\s*/)
        .map(x => x.trim())
        .filter(Boolean);
    return parts.length ? parts.join(', ') : 'N/A';
}

// Demo recommendations (fallback when backend is not available)
function showDemoRecommendations(movieName) {
    displayMovies(DEMO_MOVIES, 'movies-grid');
    setRecommendationSummary({
        baseTitle: movieName,
        matchType: 'demo',
        recommendations: DEMO_MOVIES,
        query: movieName,
        source: 'demo'
    });
    addToHistory(movieName);
}

// ==========================================
// SEARCH HISTORY
// ==========================================
function addToHistory(movieName) {
    const timestamp = new Date().toLocaleString('vi-VN');

    // Remove old duplicate of same title
    searchHistory = searchHistory.filter(entry => entry.title !== movieName);

    // Add to beginning of array
    searchHistory.unshift({ title: movieName, timestamp });
    
    // Keep only last 10 searches
    if (searchHistory.length > 10) {
        searchHistory = searchHistory.slice(0, 10);
    }
    
    // Save to localStorage
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    
    // Update display and dependent sections
    displayHistory();
    buildHistoryRecommendations();
    renderRecentKeywords();
}

function displayHistory() {
    const historyList = document.getElementById('history-list');
    
    if (searchHistory.length === 0) {
        historyList.innerHTML = '<p class="no-history">No searches yet</p>';
        return;
    }
    
    historyList.innerHTML = '';
    searchHistory.forEach(entry => {
        const p = document.createElement('p');
        p.textContent = entry.timestamp ? `${entry.title} (${entry.timestamp})` : entry.title;
        historyList.appendChild(p);
    });
}

function clearHistory() {
    if (confirm('Are you sure you want to clear search history?')) {
        searchHistory = [];
        localStorage.removeItem('searchHistory');
        displayHistory();
        buildHistoryRecommendations();
    }
}

// Build recommendations based on search history
async function buildHistoryRecommendations() {
    const historyGrid = document.getElementById('history-grid');
    const emptyState = document.getElementById('history-empty');

    if (!historyGrid || !emptyState) return;

    if (searchHistory.length === 0) {
        historyGrid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    historyGrid.innerHTML = '<p class="empty-state">Loading recommendations...</p>';

    const uniqueTitles = Array.from(new Set(searchHistory.map(entry => entry.title))).slice(0, 5);
    const combined = [];
    const seenTitles = new Set();

    for (const title of uniqueTitles) {
        try {
            if (!USE_API) {
                DEMO_MOVIES.forEach(movie => {
                    if (!seenTitles.has(movie.title)) {
                        seenTitles.add(movie.title);
                        combined.push(movie);
                    }
                });
            } else {
                const res = await fetch(`${API_BASE}/recommend`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ movie: title })
                });
                const data = await res.json();
                if (data.recommendations) {
                    data.recommendations.forEach(movie => {
                        if (!seenTitles.has(movie.title)) {
                            seenTitles.add(movie.title);
                            combined.push(movie);
                        }
                    });
                }
            }
        } catch (err) {
            console.error('History recommendation error', err);
        }
    }

    if (combined.length === 0) {
        historyGrid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    historyGrid.innerHTML = '';
    combined.slice(0, 12).forEach(movie => {
        historyGrid.appendChild(createMovieCard(movie));
    });
}

// ==========================================
// ENTER KEY SUPPORT
// ==========================================
document.getElementById('movie-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        getRecommendations();
    }
});

// Recent keywords suggestions on focus
function renderRecentKeywords() {
    const container = document.getElementById('recent-keys');
    if (!container) return;
    const last5 = searchHistory.slice(0, 5);
    if (last5.length === 0) {
        container.classList.remove('active');
        container.innerHTML = '';
        return;
    }
    container.classList.add('active');
    container.innerHTML = '<div style="width: 100%; font-size: 1.3rem; color: rgba(255, 255, 255, 0.7); margin-bottom: 0.5rem;">Recent Searches:</div>';
    last5.forEach(entry => {
        const pill = document.createElement('span');
        pill.className = 'recent-pill';
        pill.textContent = entry.title;
        pill.addEventListener('click', () => {
            const input = document.getElementById('movie-input');
            input.value = entry.title;
            input.focus();
        });
        container.appendChild(pill);
    });
}

const movieInputEl = document.getElementById('movie-input');
if (movieInputEl) {
    movieInputEl.addEventListener('focus', () => {
        renderRecentKeywords();
    });
    movieInputEl.addEventListener('blur', () => {
        // Slight delay so clicks on pills still register
        setTimeout(() => {
            const container = document.getElementById('recent-keys');
            if (container) container.classList.remove('active');
        }, 150);
    });
}

// ==========================================
// SMOOTH SCROLL FOR NAVIGATION LINKS
// ==========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==========================================
// INITIALIZATION
// ==========================================
window.addEventListener('DOMContentLoaded', async () => {
    await initApi();
    loadMoviesList();
    loadGenresList();
    displayHistory();
    buildHistoryRecommendations();
    loadTrending();
    loadStats();
    
    // Add fade-in animation to elements
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });

    document.querySelectorAll('.stat-card, .movie-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(2rem)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
});

// ==========================================
// TRENDING & STATS
// ==========================================
let chartTop;
let chartLine;
let chartRatingDist;
let chartGenreFreq;

async function loadTrending() {
    try {
        if (!USE_API) throw new Error('Offline demo');
        const response = await fetch(`${API_BASE}/top?count=8`);
        const data = await response.json();
        if (data.movies) {
            displayMovies(data.movies, 'trending-grid');
            renderCharts(data.movies);
        }
    } catch (error) {
        console.warn('Using demo trending data');
        displayMovies(DEMO_MOVIES, 'trending-grid');
        renderCharts(DEMO_MOVIES);
    }
    
    // Load analytics charts
    loadAnalyticsCharts();
}

async function loadAnalyticsCharts() {
    try {
        if (!USE_API) throw new Error('Offline demo');
        const [ratingDist, genreFreq] = await Promise.all([
            fetch(`${API_BASE}/analytics/rating-distribution`).then(r => r.json()),
            fetch(`${API_BASE}/analytics/genre-frequency`).then(r => r.json())
        ]);
        renderRatingDistribution(ratingDist);
        renderGenreFrequency(genreFreq);
    } catch (err) {
        console.warn('Analytics charts unavailable in offline mode');
    }
}

function renderRatingDistribution(data) {
    const ctx = document.getElementById('chart-rating-dist');
    if (!ctx) return;
    if (chartRatingDist) chartRatingDist.destroy();
    
    chartRatingDist = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Number of Movies',
                data: data.counts,
                backgroundColor: 'rgba(243, 156, 18, 0.7)',
                borderColor: '#f39c12',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: { color: '#fff' }
                },
                x: { 
                    ticks: { color: '#fff' }
                }
            },
            plugins: { 
                legend: { display: false }
            }
        }
    });
}

function renderGenreFrequency(data) {
    const ctx = document.getElementById('chart-genre-freq');
    if (!ctx) return;
    if (chartGenreFreq) chartGenreFreq.destroy();
    
    chartGenreFreq = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Count',
                data: data.counts,
                backgroundColor: 'rgba(52, 211, 153, 0.7)',
                borderColor: '#34d399',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: { 
                    beginAtZero: true,
                    ticks: { color: '#fff' }
                },
                y: { 
                    ticks: { color: '#fff' }
                }
            },
            plugins: { 
                legend: { display: false }
            }
        }
    });
}

async function loadStats() {
    try {
        if (!USE_API) throw new Error('Offline demo');
        const res = await fetch(`${API_BASE}/stats`);
        const data = await res.json();
        setStat('stat-movies', data.total_movies);
        setStat('stat-rating', data.average_rating);
        setStat('stat-genres', data.total_genres);
        const span = data.date_range ? `${data.date_range.oldest} → ${data.date_range.newest}` : '–';
        setStat('stat-range', span);
    } catch (err) {
        console.warn('Using demo stats');
        setStat('stat-movies', DEMO_STATS.total_movies);
        setStat('stat-rating', DEMO_STATS.average_rating);
        setStat('stat-genres', DEMO_STATS.total_genres);
        const span = `${DEMO_STATS.date_range.oldest} → ${DEMO_STATS.date_range.newest}`;
        setStat('stat-range', span);
    }
}

function setStat(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const val = el.querySelector('.stat-value');
    if (val) {
        val.textContent = value || '–';
    }
}

function renderCharts(topMovies) {
    const labels = topMovies.map(m => m.title);
    const ratings = topMovies.map(m => Number(m.rating) || 0);

    const ctxBar = document.getElementById('chart-top');
    const ctxLine = document.getElementById('chart-line');
    if (!ctxBar || !ctxLine) return;

    if (chartTop) chartTop.destroy();
    if (chartLine) chartLine.destroy();

    chartTop = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Rating',
                data: ratings,
                backgroundColor: 'rgba(231, 76, 60, 0.7)',
                borderColor: '#e74c3c',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true, 
                    suggestedMax: 10,
                    ticks: { color: '#fff' }
                },
                x: { 
                    ticks: { color: '#fff', maxRotation: 45, minRotation: 45 }
                }
            },
            plugins: { 
                legend: { display: false }
            }
        }
    });

    chartLine = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Rating',
                data: ratings,
                fill: false,
                borderColor: '#f39c12',
                tension: 0.25,
                pointBackgroundColor: '#f39c12'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false }
            },
            scales: { 
                y: { 
                    beginAtZero: true, 
                    suggestedMax: 10,
                    ticks: { color: '#fff' }
                },
                x: { 
                    ticks: { color: '#fff', maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });
}

// ==========================================
// PERFORMANCE OPTIMIZATION
// ==========================================
// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Lazy loading images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}
