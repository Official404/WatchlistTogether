const mysql = require('mysql2');
const express = require('express');
const session = require('express-session');
const path = require('path');

var pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10
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
        pool.getConnection(function(err, connection) {
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
            connection.release();
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
            pool.getConnection(function(err, connection) {
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
                connection.release();
            });
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
        
        pool.getConnection(function(err, connection) {
            connection.query(query, function(error, results, fields) {
                if (error) throw error;
                response.json(results);
            });
            connection.release();
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
        
        pool.getConnection(function(err, connection) {
            connection.query(query, [id], function(error, results, fields) {
                if (error) throw error;
                response.sendStatus(200);
            });
            connection.release();
        });
    } else {
        response.redirect('/');
    }
});

app.post('/api/update_content', function(request, response) {
    if (request.session.loggedin) {
        const { id, type, ...updateFields } = request.body;
        
        if (!id || !type || Object.keys(updateFields).length === 0) {
            return response.status(400).send('Missing required fields');
        }

        let table = 'watchlist';
        let idField = 'idseries';
        
        if (type === 'movies') {
            table = 'movies';
            idField = 'id';
        } else if (type === 'series') {
            table = 'series';
            idField = 'id';
        }

        const query = `UPDATE ${table} SET ? WHERE ${idField} = ?`;
        
        pool.getConnection(function(err, connection) {
            connection.query(query, [updateFields, id], function(error, results, fields) {
                if (error) throw error;
                response.sendStatus(200);
            });
            connection.release();
        });
    } else {
        response.redirect('/');
    }
});

app.use(function(request, response, next) {
    response.status(404).sendFile(path.join(__dirname + '/404.html'));
});

app.use(function(error, request, response, next) {
    console.error(error.stack);
    response.status(500).sendFile(path.join(__dirname + '/500.html'));
});

app.listen(8080, () => {
    console.log('Server is running at port 8080');
});