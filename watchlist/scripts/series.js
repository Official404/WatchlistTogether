// Fetch series from the server
fetch('/api/get_content?type=series')
.then(response => response.json())
.then(series => {
    const seriesList = document.getElementById('series-list');
    series.forEach(series => {
        const seriesElement = document.createElement('li');
        var temphtml = `
            <li class="content-element">
                <img src="${series.poster}" alt="${series.name}">
                <div class="series_info">
                    <h4>${series.name}</h4>
                    <p>${series.description}</p>
                </div>
                <div class="tracker right-side">
                    <label for="series-progress">Progress:</label>
                    <input type="number" id="series-progress" name="series-progress" min="0" max="2500" value="${series.progress}">    
                    <label for="status">Status:</label>
                    <select class="status" id="status" name="status" value="${series.status}" style="background-color:#`;
                    if (series.status == 0) {
                        temphtml = temphtml + `ffb3ba`;
                    } else if (series.status == 1) {
                        temphtml = temphtml + `fff59a`;
                    } else if (series.status == 2) {
                        temphtml = temphtml + `a2ff9a`;
                    } else if (series.status == 3) {
                        temphtml = temphtml + `554746`;
                    } 
                    temphtml = temphtml + `">
                        <option value="0" `;
                        if (series.status == 0) {
                            temphtml = temphtml + `selected="selected"`;
                        }
                        temphtml = temphtml + `>Not Started</option>
                        <option value="1" `;
                        if (series.status == 1) {
                            temphtml = temphtml + `selected="selected"`;
                        }
                        temphtml = temphtml + `>Watching</option>
                        <option value="2" `;
                        if (series.status == 2) {
                            temphtml = temphtml + `selected="selected"`;
                        }
                        temphtml = temphtml + `>Done</option>
                        <option value="3" `;
                        if (series.status == 3) {
                            temphtml = temphtml + `selected="selected"`;
                        }
                        temphtml = temphtml + `>Dropped</option>
                    </select>
                </div>
                <div class= "">
                    <button class="remove-button"><i class="fa fa-trash-o"></i></button>
                </div>
                <div class="hidden">
                    <input type="hidden" name="series-id" value="${series.id}">
                </div>
            </li>
        `;
        seriesElement.innerHTML = temphtml;
        seriesList.appendChild(seriesElement);
    });
}).catch(error => console.error('Error fetching series:', error));

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

// Update series status on the server
document.getElementById('series-list').addEventListener('change', function(event) {
    if (event.target.classList.contains('status')) {
        const seriesElement = event.target.closest('.content-element');
        const seriesId = seriesElement.querySelector('input[name="series-id"]').value;
        const status = event.target.value;
        console.log(status);
        fetch('/api/update_content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id: seriesId, status: status, type: 'series'})
        })
        .then(response => {
            if (!response.ok) {
                console.error('Error updating series status:', response.status);
            }
        })
        .catch(error => console.error('Error updating series status:', error));
    }
});

//change background color of status select tag based on status
document.getElementById('series-list').addEventListener('change', function(event) {
    if (event.target.classList.contains('status')) {
        const seriesElement = event.target.closest('.content-element');
        const seriesId = seriesElement.querySelector('input[name="series-id"]').value;
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

document.getElementById('series-filter').addEventListener('change', function(event) {
    const filterValue = event.target.value;
    let url = '/api/get_content?type=series';
    if (filterValue) {
        url += `&filter=${filterValue}`;
    }
    fetch(url)
        .then(response => response.json())
        .then(series => {
            // Update the series list in the UI
            const seriesList = document.getElementById('series-list');
            seriesList.innerHTML = '';
            series.forEach(series => {
                const seriesElement = document.createElement('li');
                var temphtml = `
                    <li class="content-element">
                        <img src="${series.poster}" alt="${series.name}">
                        <div class="series_info">
                            <h4>${series.name}</h4>
                            <p>${series.description}</p>
                        </div>
                        <div class="tracker right-side">
                            <label for="series-progress">Progress:</label>
                            <input type="number" id="series-progress" name="series-progress" min="0" max="2500" value="${series.progress}">    
                            <label for="status">Status:</label>
                            <select class="status" id="status" name="status" value="${series.status}" style="background-color:#`;
                            if (series.status == 0) {
                                temphtml = temphtml + `ffb3ba`;
                            } else if (series.status == 1) {
                                temphtml = temphtml + `fff59a`;
                            } else if (series.status == 2) {
                                temphtml = temphtml + `a2ff9a`;
                            } else if (series.status == 3) {
                                temphtml = temphtml + `554746`;
                            } 
                            temphtml = temphtml + `">
                                <option value="0" `;
                                if (series.status == 0) {
                                    temphtml = temphtml + `selected="selected"`;
                                }
                                temphtml = temphtml + `>Not Started</option>
                                <option value="1" `;
                                if (series.status == 1) {
                                    temphtml = temphtml + `selected="selected"`;
                                }
                                temphtml = temphtml + `>Watching</option>
                                <option value="2" `;
                                if (series.status == 2) {
                                    temphtml = temphtml + `selected="selected"`;
                                }
                                temphtml = temphtml + `>Done</option>
                                <option value="3" `;
                                if (series.status == 3) {
                                    temphtml = temphtml + `selected="selected"`;
                                }
                                temphtml = temphtml + `>Dropped</option>
                            </select>
                        </div>
                        <div class= "">
                            <button class="remove-button"><i class="fa fa-trash-o"></i></button>
                        </div>
                        <div class="hidden">
                            <input type="hidden" name="series-id" value="${series.id}">
                        </div>
                    </li>
                `;
                seriesElement.innerHTML = temphtml;
                seriesList.appendChild(seriesElement);
            });
        })
        .catch(error => console.error('Error fetching series:', error));
});