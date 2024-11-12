// Fetch movies from the server
fetch('/api/get_content?type=movies')
.then(response => response.json())
.then(movies => {
    const moviesList = document.getElementById('movies-list');
    movies.forEach(movies => {
        const moviesElement = document.createElement('li');
        moviesElement.innerHTML = `
            <li class="content-element">
                <img src="${movies.poster}" alt="${movies.name}">
                <div class="movie_info">
                    <h4>${movies.name}</h4>
                    <p>${movies.description}</p>
                </div>
                <div class="tracker right-side">
                    <label for="movies-progress">Progress:</label>
                    <input type="text" id="movies-progress" name="movies-progress" value="${movies.progress}">    
                </div>
                <div class= "button-right-side">
                    <button class="remove-button"><i class="fa fa-trash-o"></i></button>
                </div>
                <div class="hidden">
                    <input type="hidden" name="movies-id" value="${movies.id}">
                </div>
            </li>
        `;
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

// Update movies progress on the server
document.getElementById('movies-list').addEventListener('change', function(event) {
    if (event.target.id === 'movies-progress') {
        const moviesElement = event.target.closest('.content-element');
        const moviesId = moviesElement.querySelector('input[name="movies-id"]').value;
        fetch('/api/update_content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id: moviesId, progress: event.target.value, type: 'movies'})
        })
        .then(response => {
            if (!response.ok) {
                console.error('Error updating movies:', response.status);
            }
        })
        .catch(error => console.error('Error updating movies:', error));
    }
});