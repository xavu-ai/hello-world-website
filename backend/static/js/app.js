// Hello World Application
document.addEventListener('DOMContentLoaded', function() {
    const app = document.getElementById('app');
    
    // Display a message
    const message = document.createElement('p');
    message.textContent = 'JavaScript is running!';
    message.style.color = '#667eea';
    message.style.fontWeight = 'bold';
    app.appendChild(message);
    
    // Display timestamp
    const timestamp = document.createElement('p');
    timestamp.style.fontSize = '0.9rem';
    timestamp.style.color = '#888';
    timestamp.style.marginTop = '0.5rem';
    timestamp.textContent = 'Page loaded at: ' + new Date().toLocaleTimeString();
    app.appendChild(timestamp);
    
    console.log('Hello World app initialized');
});
