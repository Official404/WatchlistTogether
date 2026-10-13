# WatchlistTogether

A shared watchlist for movies and series.

## Requirements

- Node.js 22.5 or later (the app uses Node's built-in `node:sqlite` module)

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` in the project root. Set `INITIAL_USERNAME`
   and `INITIAL_PASSWORD` to create the first login. These are only needed when
   the SQLite database has no accounts; subsequent starts can omit them.
3. Set `API_KEY_THEMOVIEDB` to your TMDB API key to enable content search.
   Without a key, search returns a configuration error. Restart the app after
   updating `.env`.
4. Set `SESSION_SECRET` to a long, random value before exposing the app publicly.
5. Start the app with `npm start`, then open <http://localhost:8080>.

The app loads `.env` from the project root regardless of the working directory.
Environment variables already set by the OS take precedence over values in
`.env`. Account passwords are stored as plain text currently, so use this app 
only in a trusted environment.

After signing in, use **Create Account** in the navigation to add another login.

On its first start, the app creates `watchlist/watchlist.sqlite` and initializes
the account, movie, and series tables. Set `SQLITE_DB_PATH` to store the
database at another path; its parent directory must already exist. Back up this
file to preserve accounts and watchlists.
