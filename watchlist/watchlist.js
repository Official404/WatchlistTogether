const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { DatabaseSync } = require('node:sqlite');
const express = require('express');
const session = require('express-session');

const databasePath = process.env.SQLITE_DB_PATH || path.join(__dirname, 'watchlist.sqlite');
const database = new DatabaseSync(databasePath);

database.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        poster TEXT NOT NULL DEFAULT '',
        status INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS series (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        poster TEXT NOT NULL DEFAULT '',
        status INTEGER NOT NULL DEFAULT 0,
        progress INTEGER NOT NULL DEFAULT 0
    );
`);

const initialUsername = process.env.INITIAL_USERNAME;
const initialPassword = process.env.INITIAL_PASSWORD;
if (initialUsername || initialPassword) {
    if (!initialUsername || !initialPassword) {
        throw new Error('Set both INITIAL_USERNAME and INITIAL_PASSWORD to create the first account.');
    }
}
if (database.prepare('SELECT COUNT(*) AS count FROM accounts').get().count === 0) {
    if (!initialUsername || !initialPassword) {
        throw new Error('Set INITIAL_USERNAME and INITIAL_PASSWORD to create the first account.');
    }
    database.prepare(
        'INSERT INTO accounts (username, password) VALUES (?, ?)'
    ).run(initialUsername, initialPassword);
}

const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET || 'change-this-session-secret',
    resave: false,
    saveUninitialized: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));

app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/auth', function(request, response) {
    const { username, password } = request.body;
    if (!username || !password) {
        return response.status(400).send('Please enter Username and Password!');
    }

    const account = database.prepare(
        'SELECT username FROM accounts WHERE username = ? AND password = ?'
    ).get(username, password);

    if (!account) {
        return response.status(401).send('Incorrect Username and/or Password!');
    }

    request.session.loggedin = true;
    request.session.username = account.username;
    return response.redirect('/home');
});

app.get('/home', function(request, response) {
    if (request.session.loggedin) {
        response.sendFile(path.join(__dirname, 'home.html'));
    } else {
        response.redirect('/');
    }
});

app.get('/series', function(request, response) {
    if (request.session.loggedin) {
        response.sendFile(path.join(__dirname, 'series.html'));
    } else {
        response.redirect('/');
    }
});

app.get('/movies', function(request, response) {
    if (request.session.loggedin) {
        response.sendFile(path.join(__dirname, 'movies.html'));
    } else {
        response.redirect('/');
    }
});

app.get('/add_content', function(request, response) {
    if (request.session.loggedin) {
        response.sendFile(path.join(__dirname, 'add_content.html'));
    } else {
        response.redirect('/');
    }
});

app.get('/create_account', function(request, response) {
    if (request.session.loggedin) {
        response.sendFile(path.join(__dirname, 'create_account.html'));
    } else {
        response.redirect('/');
    }
});

app.post('/api/accounts', function(request, response) {
    if (!request.session.loggedin) {
        return response.status(401).json({ error: 'Please sign in to create an account.' });
    }

    const { username, password, confirmPassword } = request.body;
    if (typeof username !== 'string' || !username.trim() ||
        typeof password !== 'string' || !password ||
        typeof confirmPassword !== 'string' || !confirmPassword) {
        return response.status(400).json({ error: 'Username and password are required.' });
    }
    if (password !== confirmPassword) {
        return response.status(400).json({ error: 'Passwords do not match.' });
    }

    const result = database.prepare(
        'INSERT INTO accounts (username, password) VALUES (?, ?) ON CONFLICT(username) DO NOTHING'
    ).run(username.trim(), password);
    if (result.changes === 0) {
        return response.status(409).json({ error: 'That username is already taken.' });
    }

    return response.status(201).json({ message: 'Account created successfully.' });
});

app.get('/api/search', async function(request, response) {
    if (!request.session.loggedin) {
        return response.status(401).json({ error: 'Please sign in to search for content.' });
    }

    const query = request.query.query;
    if (typeof query !== 'string' || !query.trim()) {
        return response.status(400).json({ error: 'A search query is required.' });
    }
    if (!process.env.API_KEY_THEMOVIEDB) {
        return response.status(503).json({ error: 'Content search is not configured.' });
    }

    const searchUrl = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&api_key=${process.env.API_KEY_THEMOVIEDB}`;
    try {
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) {
            console.error(`TMDB search failed with status ${searchResponse.status}`);
            return response.status(502).json({ error: 'The content provider could not complete the search.' });
        }

        const data = await searchResponse.json();
        if (!Array.isArray(data.results)) {
            console.error('TMDB search response did not contain a results array');
            return response.status(502).json({ error: 'The content provider returned an invalid search response.' });
        }

        return response.json(data.results);
    } catch (err) {
        console.error('TMDB search request failed:', err);
        return response.status(502).json({ error: 'Unable to search for content right now.' });
    }
});

app.post('/api/add_content', function(request, response) {
    if (!request.session.loggedin) {
        return response.redirect('/');
    }

    const { name, description = '', poster = '', media_type: mediaType } = request.body;
    if (typeof name !== 'string' || !name.trim() || !['movie', 'tv'].includes(mediaType) ||
        typeof description !== 'string' || typeof poster !== 'string') {
        return response.status(400).send('A content name and valid media type are required');
    }

    const table = mediaType === 'movie' ? 'movies' : 'series';
    const result = database.prepare(
        `INSERT INTO ${table} (name, description, poster) VALUES (?, ?, ?)`
    ).run(name, description, poster);

    return response.json({ id: Number(result.lastInsertRowid) });
});

app.get('/api/get_content', function(request, response) {
    if (!request.session.loggedin) {
        return response.redirect('/');
    }

    const { type } = request.query;
    const { filter } = request.query;
    if (type === 'movies') {
        if (filter) {
            const filterValue = parseInt(filter, 10);
            if (!Number.isInteger(filterValue) || filterValue < 0 || filterValue > 3) {
                return response.status(400).send('Invalid filter value for movies');
            } else {
                return response.json(database.prepare('SELECT * FROM movies WHERE status = ?').all(filterValue));
            }
        }
        return response.json(database.prepare('SELECT * FROM movies').all());
    }
    if (type === 'series') {
        if (filter) {
            const filterValue = parseInt(filter, 10);
            if (!Number.isInteger(filterValue) || filterValue < 0 || filterValue > 3) {
                return response.status(400).send('Invalid filter value for series');
            } else {
                return response.json(database.prepare('SELECT * FROM series WHERE status = ?').all(filterValue));
            }
        }
        return response.json(database.prepare('SELECT * FROM series').all());
    }
    if (type && type !== 'watchlist') {
        return response.status(400).send('Invalid content type');
    }

    const movies = database.prepare(
        "SELECT id, name, description, poster, status, 'movie' AS media_type FROM movies"
    ).all();
    const series = database.prepare(
        "SELECT id, name, description, poster, status, progress, 'tv' AS media_type FROM series"
    ).all();
    return response.json([...movies, ...series]);
});

app.post('/api/remove_content', function(request, response) {
    if (!request.session.loggedin) {
        return response.redirect('/');
    }

    const { id, type } = request.body;
    const contentId = typeof id === 'number' ? id : /^\d+$/.test(id) ? Number(id) : NaN;
    if (!Number.isSafeInteger(contentId) || contentId <= 0 || !['movies', 'series'].includes(type)) {
        return response.status(400).send('A valid id and content type are required');
    }

    const result = database.prepare(`DELETE FROM ${type} WHERE id = ?`).run(contentId);
    return response.sendStatus(result.changes ? 200 : 404);
});

app.post('/api/update_content', function(request, response) {
    if (!request.session.loggedin) {
        return response.redirect('/');
    }

    const { id, type, ...fields } = request.body;
    const contentId = typeof id === 'number' ? id : /^\d+$/.test(id) ? Number(id) : NaN;
    if (!Number.isSafeInteger(contentId) || contentId <= 0 || !['movies', 'series'].includes(type)) {
        return response.status(400).send('A valid id and content type are required');
    }

    const allowedFields = type === 'movies' ? ['status'] : ['status', 'progress'];
    const entries = Object.entries(fields);
    if (entries.length === 0 || entries.some(([field]) => !allowedFields.includes(field))) {
        return response.status(400).send('Missing valid fields to update');
    }

    const updates = entries.map(([field, value]) => [
        field,
        typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN
    ]);
    if (updates.some(([field, value]) =>
        !Number.isInteger(value) || (field === 'status' && (value < 0 || value > 3)) ||
        (field === 'progress' && value < 0)
    )) {
        return response.status(400).send('Status or progress value is invalid');
    }

    const columns = updates.map(([field]) => `${field} = ?`).join(', ');
    const values = updates.map(([, value]) => value);
    const result = database.prepare(`UPDATE ${type} SET ${columns} WHERE id = ?`)
        .run(...values, contentId);
    return response.sendStatus(result.changes ? 200 : 404);
});

app.use(function(request, response, next) {
    response.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.use(function(error, request, response, next) {
    console.error(error.stack);
    response.status(500).sendFile(path.join(__dirname, '500.html'));
});

const port = Number(process.env.PORT) || 8080;
app.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});
