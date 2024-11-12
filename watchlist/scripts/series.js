// Fetch series from the server
fetch('/api/get_content?type=series')
.then(response => response.json())
.then(series => {
    const seriesList = document.getElementById('series-list');
    series.forEach(series => {
        const seriesElement = document.createElement('li');
        seriesElement.innerHTML = `
            <li class="content-element">
                <img src="${series.poster}" alt="${series.name}">
                <div class="series_info">
                    <h4>${series.name}</h4>
                    <p>${series.description}</p>
                </div>
                <div class="tracker right-side">
                    <label for="series-progress">Progress:</label>
                    <input type="number" id="series-progress" name="series-progress" min="0" max="100" value="${series.progress}">    
                </div>
                <div class= "">
                    <button class="remove-button"><i class="fa fa-trash-o"></i></button>
                </div>
                <div class="hidden">
                    <input type="hidden" name="series-id" value="${series.id}">
                </div>
            </li>
        `;
        seriesList.appendChild(seriesElement);
    });
})
.catch(error => console.error('Error fetching series:', error));

// Remove series from the server
document.getElementById('series-list').addEventListener('click', function(event) {
    if (event.target.classList.contains('remove-button')) {
        const seriesElement = event.target.closest('.content-element');
        const seriesId = seriesElement.querySelector('input[name="series-id"]').value;
        fetch('/api/remove_content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id: seriesId, type: 'series'})
        })
        .then(response => {
            if (response.ok) {
                seriesElement.remove();
            } else {
                console.error('Error removing series:', response.status);
            }
        })
        .catch(error => console.error('Error removing series:', error));
    }
});

// Update series progress on the server
document.getElementById('series-list').addEventListener('change', function(event) {
    if (event.target.id === 'series-progress') {
        const seriesElement = event.target.closest('.content-element');
        const seriesId = seriesElement.querySelector('input[name="series-id"]').value;
        fetch('/api/update_content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id: seriesId, progress: event.target.value, type: 'series'})
        })
        .then(response => {
            if (!response.ok) {
                console.error('Error updating series progress:', response.status);
            }
        })
        .catch(error => console.error('Error updating series progress:', error));
    }
});