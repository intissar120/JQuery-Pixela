$(document).ready(function() {
    const BASE_URL = 'https://pixe.la/v1/users';//URL de base pour interagir avec l'API de Pixela.
    let username = localStorage.getItem('pixelaUsername');//récuperer les infos
    let token = localStorage.getItem('pixelaToken');//a partir du localstorage

    function showMessage(message, isError = false) { //afficher un message temporaire au user
        const messageClass = isError ? 'error' : 'success';
        $('#messageArea').html(`<div class="${messageClass}">${message}</div>`);
        setTimeout(() => $('#messageArea').empty());
    }//si c'est erreur ça va s'afficher en rouge sinon en vert (succès)

    function updateAuthUI() {//gere l'authentification
        if (username && token) {
            $('#authSection').hide();
            $('#dashboardSection').show();
            $('#userDisplay').text(username);
            fetchGraphs();
        } else {
            $('#authSection').show();
            $('#dashboardSection').hide();
        }
    }

    function fetchGraphs() {//recupere les graphes du user connecté
        $.ajax({
            url: `${BASE_URL}/${username}/graphs`,
            method: 'GET',
            headers: { 'X-USER-TOKEN': token },
            success: function(response) {
                const graphs = response.graphs;
                $('#graphsList').empty();
                $('#pixelGraphSelect').empty();

                graphs.forEach(graph => {
                    $('#graphsList').append(`
                                <li>
                                    <span>${graph.name} (${graph.id})</span>
                                    <div>
                                        <button onclick="displayGraph('${graph.id}')">View</button>
                                        <button onclick="deleteGraph('${graph.id}')">Delete</button>
                                    </div>
                                </li>
                            `);
                    $('#pixelGraphSelect').append(`
                                <option value="${graph.id}">${graph.name}</option>
                            `);
                });
            },
            error: function(xhr) {
                showMessage('Failed to fetch graphs: ' + xhr.responseText, true);
            }
        });
    }

    function displayGraph(graphId) {//permet d'afficher le graphe en récuperant l'image depuis l'api pixela
        const graphUrl = `${BASE_URL}/${username}/graphs/${graphId}`;
        $('#graphDisplay').html(`<img src="${graphUrl}" class="graph-image" alt="Graph ${graphId}">`);
    }

    function deleteGraph(graphId) {//permet de supprimer le graphe
        if (!confirm('Are you sure you want to delete this graph?')) return;

        $.ajax({
            url: `${BASE_URL}/${username}/graphs/${graphId}`,
            method: 'DELETE',
            headers: { 'X-USER-TOKEN': token },
            success: function() {
                showMessage('Graph deleted successfully');
                fetchGraphs();
            },
            error: function(xhr) {
                showMessage('Failed to delete graph: ' + xhr.responseText, true);
            }
        });
    }

    $('#signupBtn').click(function() {
        const newUsername = $('#signupUsername').val();
        const newToken = $('#signupToken').val();

        $.ajax({
            url: BASE_URL,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                token: newToken,
                username: newUsername,
                agreeTermsOfService: 'yes',
                notMinor: 'yes'
            }),
            success: function() {
                username = newUsername;
                token = newToken;
                localStorage.setItem('pixelaUsername', username);
                localStorage.setItem('pixelaToken', token);
                showMessage('Signup successful!');
                updateAuthUI();
            },
            error: function(xhr) {
                showMessage('Signup failed: ' + xhr.responseText, true);
            }
        });
    });

    $('#loginBtn').click(function() {//le username et le token sont récupérés
        username = $('#loginUsername').val();
        token = $('#loginToken').val();
        localStorage.setItem('pixelaUsername', username);
        localStorage.setItem('pixelaToken', token);
        updateAuthUI();
    });

    $('#logoutBtn').click(function() {//les informations de l'utilisateur sont
        // supprimées du localStorage
        localStorage.removeItem('pixelaUsername');
        localStorage.removeItem('pixelaToken');
        username = null;
        token = null;
        updateAuthUI();
    });

    $('#createGraphBtn').click(function() {//créer un graphe avec ID,nom,unité...
        const graphData = {
            id: $('#graphId').val(),
            name: $('#graphName').val(),
            unit: $('#graphUnit').val(),
            type: $('#graphType').val(),
            color: $('#graphColor').val()
        };

        $.ajax({
            url: `${BASE_URL}/${username}/graphs`,
            method: 'POST',
            headers: { 'X-USER-TOKEN': token },
            contentType: 'application/json',
            data: JSON.stringify(graphData),
            success: function() {
                showMessage('Graph created successfully!');
                fetchGraphs();
            },
            error: function(xhr) {
                showMessage('Failed to create graph: ' + xhr.responseText, true);
            }
        });
    });

    $('#addPixelBtn').click(function() {//choix de la date et quantité
        const graphId = $('#pixelGraphSelect').val();
        const date = $('#pixelDate').val().replace(/-/g, '');
        const quantity = $('#pixelQuantity').val();

        $.ajax({
            url: `${BASE_URL}/${username}/graphs/${graphId}`,//requete post
            method: 'POST',
            headers: { 'X-USER-TOKEN': token },
            contentType: 'application/json',
            data: JSON.stringify({
                date: date,
                quantity: quantity
            }),
            success: function() {
                showMessage('Pixel added successfully!');
                displayGraph(graphId);
            },
            error: function(xhr) {
                showMessage('Failed to add pixel: ' + xhr.responseText, true);
            }
        });
    });

    //ajuster l'interface en fct des infos présentes dans le localstorage
    updateAuthUI();

    // rendre les fonctions disponibles
    window.displayGraph = displayGraph;
    window.deleteGraph = deleteGraph;
});
