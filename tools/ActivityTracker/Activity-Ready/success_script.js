let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let successScore = parseInt(localStorage.getItem('successScore')) || 0;
let failedScore = parseInt(localStorage.getItem('failedScore')) || 0;

function renderSuccessTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    tasks.forEach(task => {
        if (task.completed) {
            const tr = document.createElement('tr');
            const taskText = document.createElement('td');
            const dayName = getDayName(task.date);
            taskText.textContent = `${task.name}`;
            const taskDate = document.createElement('td');
            taskDate.textContent = `${dayName}, ${task.date}`;
            const taskTime = document.createElement('td');
            taskTime.textContent = task.time ? task.time : '00:00';
            tr.appendChild(taskText);
            tr.appendChild(taskDate);
            tr.appendChild(taskTime);
            taskList.appendChild(tr);
        }
    });

    updateScores();
}

function getDayName(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long' };
    return date.toLocaleDateString('id-ID', options);
}

function updateScores() {
    document.getElementById('success-score').textContent = successScore;
    document.getElementById('failed-score').textContent = failedScore;
    const description = document.getElementById('description');
    if (successScore >= failedScore) {
        description.textContent = 'Terima Kasih Atas Kerja Keras nya';
    } else {
        description.textContent = 'Semangat, jangan malas';
    }
}

function resetLeaderboard() {
    tasks = [];
    successScore = 0;
    failedScore = 0;
    localStorage.removeItem('tasks');
    localStorage.setItem('successScore', successScore);
    localStorage.setItem('failedScore', failedScore);
    renderSuccessTasks();
    updateScores();
}

window.onload = renderSuccessTasks;
