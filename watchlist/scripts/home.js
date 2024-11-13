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

// Get watchlist statistics like total number of movies, series and how many of them are in not started, watching, done and dropped status
fetch('/api/get_content?type=movies')
.then(response => response.json())
.then(movies => {
    const moviesCount = document.getElementById('movies-count');
    moviesCount.textContent = "Total Movies: " + movies.length;
});

// Create a pie chart using Canvas
fetch('/api/get_content?type=series')
.then(response => response.json())
.then(series => {
    const notStarted = series.filter(series => series.status === 0).length;
    const watching = series.filter(series => series.status === 1).length;
    const done = series.filter(series => series.status === 2).length;
    const dropped = series.filter(series => series.status === 3).length;
    const total = notStarted + watching + done + dropped;

    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    document.getElementById('series-piechart').appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;

    let startAngle = 0;
    const data = [
        { value: notStarted, color: '#ff6f61', label: 'Not Started', fillStyle: '#ffffff'},
        { value: watching, color: '#fff59a', label: 'Watching', fillStyle: '#000000' },
        { value: done, color: '#a2ff9a', label: 'Done', fillStyle: '#ffffff' },
        { value: dropped, color: '#554746', label: 'Dropped', fillStyle: '#ffffff' }
    ];

    // Draw pie slices
    data.forEach(segment => {
        const sliceAngle = (2 * Math.PI * segment.value) / total;
        const percentage = ((segment.value / total) * 100).toFixed(1);
        
        // Draw slice
        ctx.beginPath();
        ctx.fillStyle = segment.color;
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();

        // Add text
        const middleAngle = startAngle + sliceAngle / 2;
        const textX = centerX + Math.cos(middleAngle) * (radius * 0.6);
        const textY = centerY + Math.sin(middleAngle) * (radius * 0.6);

        ctx.fillStyle = segment.fillStyle;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${segment.label}`, textX, textY);
        ctx.fillText(`${percentage}%`, textX, textY + 15);
        
        startAngle += sliceAngle;
    });

    // Add legend
    const legendHtml = data.map(segment => {
        const percentage = ((segment.value / total) * 100).toFixed(1);
        return `
            <div class="legend-item">
                <span class="color-box" style="background-color: ${segment.color}"></span>
                ${segment.label} (${segment.value}) - ${percentage}%
            </div>
        `;
    }).join('');

    const legendDiv = document.createElement('div');
    legendDiv.className = 'legend';
    legendDiv.innerHTML = legendHtml;
    document.getElementById('series-piechart').appendChild(legendDiv);
});