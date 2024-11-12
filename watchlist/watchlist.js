const mysql = require('mysql2');
const express = require('express');
const session = require('express-session');
const path = require('path');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

/*const url = 'https://api.themoviedb.org/3/authentication';
const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxMDVkMzQzMjlkMzZiYzdkMzJlNTA0NjljMzFmZmE1YiIsIm5iZiI6MTczMTAwMzE4Ni4zNTg5NzE0LCJzdWIiOiI2NzJkMDI1MmM3NDg3MThiZjA3Mzk0MDkiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.DqiQBt4T59wsUiIv4rYpDbGqzVRYAH-KmOU1Xm2NdrQ'
  }
};

fetch(url, options)
  .then(res => res.json())
  .then(json => console.log(json))
  .catch(err => console.error(err));*/

connection.connect(function(err) {
    if (err) throw err;
    console.log('Connected to the database on id ' + connection.threadId);
});

const app = express();

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(express.static(path.join(__dirname, 'static')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));

app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname + '/login.html'));
});

app.post('/auth', function(request, response) {
    var username = request.body.username;
    var password = request.body.password;
    if (username && password) {
        connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
            if (error) throw error;

            if (results.length > 0) {
                request.session.loggedin = true;
                request.session.username = username;
                response.redirect('/home');
            } else {
                response.send('Incorrect Username and/or Password!');
            }			
            response.end();
        });
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});

app.get('/home', function(request, response) {
    if (request.session.loggedin) {
        response.sendFile(path.join(__dirname + '/home.html'));
    } else {
        response.redirect('/');
    }
});

app.get('/series', function(request, response) {
    if (request.session.loggedin) {
        response.sendFile(path.join(__dirname + '/series.html'));
    } else {
        response.redirect('/');
    }
});

app.get('/movies', function(request, response) {
    if (request.session.loggedin) {
        response.sendFile(path.join(__dirname + '/movies.html'));
    } else {
        response.redirect('/');
    }
});

app.get('/add_content', function(request, response) {
    if (request.session.loggedin) {
        response.sendFile(path.join(__dirname + '/add_content.html'));
    } else {
        response.redirect('/');
    }
});

app.get('/api/search', function(request, response) {
    if (request.session.loggedin) {
        const query = request.query.query;
        if (query) {
            const searchUrl = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&api_key=${process.env.API_KEY_THEMOVIEDB}`;
            fetch(searchUrl)
                .then(res => res.json())
                .then(data => {
                    response.json(data.results);
                })
                .catch(err => {
                    console.error(err);
                    response.status(500).send('Error occurred while searching for content');
                });
        } else {
            response.status(400).send('Query parameter is missing');
        }
    } else {
        response.redirect('/');
    }
});

app.post('/api/add_content', function(request, response) {
    if (request.session.loggedin) {
        const content = request.body;
        if (content) {
            if (content.media_type === 'movie') {
                const { media_type, ...contentWithoutMediaType } = content;
                connection.query('INSERT INTO movies SET ?', contentWithoutMediaType, function(error, results, fields) {
                    if (error) throw error;
                    response.json({id: results.insertId});
                });
            } else {
                const { media_type, ...contentWithoutMediaType } = content;
                connection.query('INSERT INTO series SET ?', contentWithoutMediaType, function(error, results, fields) {
                    if (error) throw error;
                    response.json({id: results.insertId});
                });
            }
        } else {
            response.status(400).sendFile(path.join(__dirname + '/400.html'));
        }
    } else {
        response.redirect('/');
    }
});

app.get('/api/get_content', function(request, response) {
    if (request.session.loggedin) {
        const type = request.query.type;
        let query = 'SELECT * FROM watchlist';
        
        if (type === 'movies') {
            query = 'SELECT * FROM movies';
        } else if (type === 'series') {
            query = 'SELECT * FROM series';
        }

        connection.query(query, function(error, results, fields) {
            if (error) throw error;
            response.json(results);
        });
    } else {
        response.redirect('/');
    }
});

app.post('/api/remove_content', function(request, response) {
    if (request.session.loggedin) {
        const id = request.body.id;
        const type = request.body.type;
        let query = 'DELETE FROM watchlist WHERE idseries = ?';
        
        if (type === 'movies') {
            query = 'DELETE FROM movies WHERE id = ?';
        } else if (type === 'series') {
            query = 'DELETE FROM series WHERE id = ?';
        }

        connection.query(query, [id], function(error, results, fields) {
            if (error) throw error;
            response.sendStatus(200);
        });
    } else {
        response.redirect('/');
    }
});

app.post('/api/update_content', function(request, response) {
    if (request.session.loggedin) {
        const id = request.body.id;
        const progress = request.body.progress;
        const type = request.body.type;
        let query = 'UPDATE watchlist SET progress = ? WHERE idseries = ?';
        
        if (type === 'movies') {
            query = 'UPDATE movies SET progress = ? WHERE id = ?';
        } else if (type === 'series') {
            query = 'UPDATE series SET progress = ? WHERE id = ?';
        }

        connection.query(query, [progress, id], function(error, results, fields) {
            if (error) throw error;
            response.sendStatus(200);
        });
    } else {
        response.redirect('/');
    }
});

app.use(function(request, response, next) {
    response.status(404).sendFile(path.join(__dirname + '/404.html'));
});

app.listen(8080, () => {
    console.log('Server is running at port 8080');
});