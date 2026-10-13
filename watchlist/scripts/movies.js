// Fetch movies from the server
fetch('/api/get_content?type=movies')
.then(response => response.json())
.then(movies => {
    const moviesList = document.getElementById('movies-list');
    movies.forEach(movies => {
        const moviesElement = document.createElement('li');
        var temphtml = `
            <li class="content-element">
                <img src="${movies.poster}" alt="${movies.name}">
                <div class="movie_info">
                    <h4>${movies.name}</h4>
                    <p>${movies.description}</p>
                </div>
                <div class="tracker right-side">
                   <label for="status">Status:</label>
                    <select class="status" id="status" name="status" value="${movies.status}" style="background-color:#`;
                    if (movies.status == 0) {
                        temphtml = temphtml + `ffb3ba`;
                    }  else if (movies.status == 2) {
                        temphtml = temphtml + `a2ff9a`;
                    }
                    temphtml = temphtml + `">
                        <option value="0" `;
                        if (movies.status == 0) {
                            temphtml = temphtml + `selected="selected"`;
                        }
                        temphtml = temphtml + `>Not Started</option>
                        <option value="2" `;
                        if (movies.status == 2) {
                            temphtml = temphtml + `selected="selected"`;
                        }
                        temphtml = temphtml + `>Done</option>
                    </select>    
                </div>
                <div class= "button-right-side">
                    <button class="remove-button"><i class="fa fa-trash-o"></i></button>
                </div>
                <div class="hidden">
                    <input type="hidden" name="movies-id" value="${movies.id}">
                </div>
            </li>
        `;
        moviesElement.innerHTML = temphtml;
        moviesList.appendChild(moviesElement);
    });
})
.catch(error => console.error('Error fetching movies:', error));

// Remove movies from the server
document.getElementById('movies-list').addEventListener('click', function(event) {
    if (event.target.classList.contains('remove-button')) {
        const moviesElement = event.target.closest('.content-element');
        const moviesId = moviesElement.querySelector('input[name="movies-id"]').value;
        fetch('/api/remove_content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id: moviesId, type: 'movies'})
        })
        .then(response => {
            if (response.ok) {
                moviesElement.remove();
            } else {
                console.error('Error removing movies:', response.status);
            }
        })
        .catch(error => console.error('Error removing movies:', error));
    }
});

// Update movie status on the server
document.getElementById('movies-list').addEventListener('change', function(event) {
    if (event.target.classList.contains('status')) {
        const moviesElement = event.target.closest('.content-element');
        const moviesId = moviesElement.querySelector('input[name="movies-id"]').value;
        const status = event.target.value;
        fetch('/api/update_content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id: moviesId, type: 'movies', status: status})
        })
        .then(response => {
            if (!response.ok) {
                console.error('Error updating movies status:', response.status);
            }
        })
        .catch(error => console.error('Error updating movies status:', error));
    }
});

//change background color of status select tag based on status
document.getElementById('movies-list').addEventListener('change', function(event) {
    if (event.target.classList.contains('status')) {
        const seriesElement = event.target.closest('.content-element');
        const seriesId = seriesElement.querySelector('input[name="movies-id"]').value;
        const status = event.target.value;
        if (status == 0) {
            event.target.style.backgroundColor = "#ffb3ba";
        } else if (status == 1) {
            event.target.style.backgroundColor = "#fff59a";
        } else if (status == 2) {
            event.target.style.backgroundColor = "#a2ff9a";
        } else if (status == 3) {
            event.target.style.backgroundColor = "#554746";
        }
    }
});

document.getElementById('movies-filter').addEventListener('change', function(event) {
    const filterValue = event.target.value;
    let url = '/api/get_content?type=movies';
    if (filterValue) {
        url += `&filter=${filterValue}`;
    }
    fetch(url)
        .then(response => response.json())
        .then(movies => {
            const moviesList = document.getElementById('movies-list');
            moviesList.innerHTML = '';
            movies.forEach(movies => {
                const moviesElement = document.createElement('li');
                var temphtml = `
                    <li class="content-element">
                        <img src="${movies.poster}" alt="${movies.name}">
                        <div class="movie_info">
                            <h4>${movies.name}</h4>
                            <p>${movies.description}</p>
                        </div>
                        <div class="tracker right-side">
                        <label for="status">Status:</label>
                            <select class="status" id="status" name="status" value="${movies.status}" style="background-color:#`;
                            if (movies.status == 0) {
                                temphtml = temphtml + `ffb3ba`;
                            }  else if (movies.status == 2) {
                                temphtml = temphtml + `a2ff9a`;
                            }
                            temphtml = temphtml + `">
                                <option value="0" `;
                                if (movies.status == 0) {
                                    temphtml = temphtml + `selected="selected"`;
                                }
                                temphtml = temphtml + `>Not Started</option>
                                <option value="2" `;
                                if (movies.status == 2) {
                                    temphtml = temphtml + `selected="selected"`;
                                }
                                temphtml = temphtml + `>Done</option>
                            </select>    
                        </div>
                        <div class= "button-right-side">
                            <button class="remove-button"><i class="fa fa-trash-o"></i></button>
                        </div>
                        <div class="hidden">
                            <input type="hidden" name="movies-id" value="${movies.id}">
                        </div>
                    </li>
                `;
                moviesElement.innerHTML = temphtml;
                moviesList.appendChild(moviesElement);
            });
        })
        .catch(error => console.error('Error fetching movies:', error));
});