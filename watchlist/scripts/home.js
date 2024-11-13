//Get all the watchlist items that has the status 'watching' and adds them to currently-watching-list
fetch('/api/get_content?type=series')
.then(response => response.json())
.then(series => {
    const currentlyWatchingList = document.getElementById('currently-watching-list');
    series.forEach(series => {
        if (series.status === 1) {
            const seriesElement = document.createElement('li');
            seriesElement.classList.add('content-element-slim');
            seriesElement.innerHTML = `
                <div class="content">
                    <img src="${series.poster}" alt="${series.name}">
                    <div class="home-info">
                        <h3>${series.name}</h3>
                        <p>Episode: ${series.progress}</p>
                        <div class="episode-buttons">
                            <button class="decreese">-</button>
                            <button class="increese">+</button>
                        </div>
                    </div>
                    <div class="hidden">
                        <input type="hidden" name="series-id" value="${series.id}">
                    </div>
                </div>
            `;
            currentlyWatchingList.appendChild(seriesElement);
        }
    });
})

// Add event listeners to the buttons in currently-watching-list
document.getElementById('currently-watching-list').addEventListener('click', function(event) {
    if (event.target.classList.contains('decreese') || event.target.classList.contains('increese')) {
        const seriesElement = event.target.closest('.content-element-slim');
        const seriesName = seriesElement.querySelector('h3').textContent;
        const seriesEpisode = seriesElement.querySelector('p').textContent.split(' ')[1];
        const seriesId = seriesElement.querySelector('input[name="series-id"]').value;
        const seriesProgress = event.target.classList.contains('decreese') ? parseInt(seriesEpisode) - 1 : parseInt(seriesEpisode) + 1;
        fetch('/api/update_content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id: seriesId, progress: seriesProgress, type: 'series'})
        })
        .then(response => {
            if (response.ok) {
                seriesElement.querySelector('p').textContent = `Episode: ${seriesProgress}`;
            } else {
                console.error('Error updating series progress:', response.status);
            }
        })
        .catch(error => console.error('Error updating series progress:', error));
    }
});