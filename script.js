// Configuration
const STITCHES_PER_ROW = 55;
const MIN_ROWS = 150;
const START_DATE = new Date('2025-11-18T00:00:00');

// Canvas and progress variables
let canvas, ctx;
let currentRows = 0;

// Timer animation variables
let timerAnimationStartTime = null;
let timerAnimationDuration = 3000; // 3 seconds animation
let actualElapsedTime = 0;

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('scarfCanvas');
    ctx = canvas.getContext('2d');

    // Load saved progress
    loadProgress();

    // Setup canvas
    setupCanvas();

    // Setup event listeners
    document.getElementById('updateBtn').addEventListener('click', updateProgress);
    document.getElementById('resetBtn').addEventListener('click', resetProgress);

    // Start timer animation from zero
    startTimerAnimation();

    // Update timer every second after animation completes
    setInterval(updateTimer, 1000);

    // Redraw on window resize
    window.addEventListener('resize', () => {
        setupCanvas();
        drawScarf();
    });
});

function setupCanvas() {
    // Set canvas size based on container
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth - 40;

    // Calculate canvas dimensions
    const stitchWidth = Math.max(8, Math.min(12, containerWidth / STITCHES_PER_ROW));
    const stitchHeight = 8;

    canvas.width = STITCHES_PER_ROW * stitchWidth;
    canvas.height = MIN_ROWS * stitchHeight;

    drawScarf();
}

function drawScarf() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const stitchWidth = canvas.width / STITCHES_PER_ROW;
    const stitchHeight = canvas.height / MIN_ROWS;

    // Draw all rows
    for (let row = 0; row < MIN_ROWS; row++) {
        for (let stitch = 0; stitch < STITCHES_PER_ROW; stitch++) {
            const x = stitch * stitchWidth;
            const y = row * stitchHeight;

            // Determine if this stitch is completed
            const isCompleted = row < currentRows;

            // Draw stitch with knit texture
            drawStitch(x, y, stitchWidth, stitchHeight, isCompleted, row, stitch);
        }
    }

    // Add decorative fringe at the bottom of completed rows
    if (currentRows > 0) {
        drawFringe(currentRows * stitchHeight);
    }
}

function drawStitch(x, y, width, height, completed, row, stitch) {
    // Base color
    if (completed) {
        // Beautiful red gradient for completed stitches
        const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
        gradient.addColorStop(0, '#D88080');
        gradient.addColorStop(0.5, '#CD5C5C');
        gradient.addColorStop(1, '#B85555');
        ctx.fillStyle = gradient;
    } else {
        // Light outline for incomplete stitches
        ctx.fillStyle = 'rgba(139, 168, 136, 0.1)';
    }

    // Draw rounded stitch
    ctx.beginPath();
    ctx.roundRect(x + 1, y + 1, width - 2, height - 2, 2);
    ctx.fill();

    if (completed) {
        // Add stitch texture (V pattern for knit stitch)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x + width * 0.3, y + 2);
        ctx.lineTo(x + width * 0.5, y + height - 2);
        ctx.lineTo(x + width * 0.7, y + 2);
        ctx.stroke();
    } else {
        // Draw subtle grid for incomplete stitches
        ctx.strokeStyle = 'rgba(139, 168, 136, 0.2)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
    }
}

function drawFringe(startY) {
    // Draw decorative fringe at the bottom of the completed section
    const stitchWidth = canvas.width / STITCHES_PER_ROW;

    for (let i = 0; i < STITCHES_PER_ROW; i++) {
        if (i % 3 === 0) { // Every third stitch
            const x = i * stitchWidth + stitchWidth / 2;

            ctx.strokeStyle = '#CD5C5C';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';

            // Draw wavy fringe
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x + Math.sin(i) * 2, startY + 8);
            ctx.stroke();
        }
    }
}

function updateProgress() {
    const input = document.getElementById('rowInput');
    const rows = parseInt(input.value);

    if (isNaN(rows) || rows < 0 || rows > MIN_ROWS) {
        alert(`Please enter a number between 0 and ${MIN_ROWS}`);
        return;
    }

    currentRows = rows;
    saveProgress();
    updateStats();
    drawScarf();

    // Add a little celebration effect when reaching milestones
    if (rows === MIN_ROWS) {
        celebrate();
    }
}

function resetProgress() {
    if (confirm('Are you sure you want to reset your progress?')) {
        currentRows = 0;
        document.getElementById('rowInput').value = 0;
        saveProgress();
        updateStats();
        drawScarf();
    }
}

function saveProgress() {
    localStorage.setItem('knittingProgress', JSON.stringify({
        rows: currentRows,
        lastUpdated: new Date().toISOString()
    }));
}

function loadProgress() {
    const saved = localStorage.getItem('knittingProgress');
    if (saved) {
        const data = JSON.parse(saved);
        currentRows = data.rows || 0;
        document.getElementById('rowInput').value = currentRows;
        updateStats();
    }
}

function updateStats() {
    document.getElementById('rowsCompleted').textContent = currentRows;
    document.getElementById('totalStitches').textContent = (currentRows * STITCHES_PER_ROW).toLocaleString();
    const percent = Math.round((currentRows / MIN_ROWS) * 100);
    document.getElementById('progressPercent').textContent = `${percent}%`;
}

function startTimerAnimation() {
    // Calculate the actual elapsed time
    const now = new Date();
    actualElapsedTime = now - START_DATE;

    // Start the animation
    timerAnimationStartTime = Date.now();
    animateTimer();
}

function animateTimer() {
    const currentTime = Date.now();
    const elapsed = currentTime - timerAnimationStartTime;
    const progress = Math.min(elapsed / timerAnimationDuration, 1);

    // Easing function for smooth animation (ease-out cubic)
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);

    // Calculate the animated elapsed time
    const animatedElapsedTime = actualElapsedTime * easeOutCubic;

    // Update the display
    displayTime(animatedElapsedTime);

    // Continue animation if not complete
    if (progress < 1) {
        requestAnimationFrame(animateTimer);
    } else {
        // Animation complete, show actual time
        updateTimer();
    }
}

function displayTime(milliseconds) {
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    document.getElementById('days').textContent = days;
    document.getElementById('hours').textContent = hours;
    document.getElementById('minutes').textContent = minutes;
}

function updateTimer() {
    const now = new Date();
    const diff = now - START_DATE;
    displayTime(diff);
}

function celebrate() {
    // Simple celebration animation
    const container = document.querySelector('.container');
    container.style.animation = 'pulse 0.5s ease-in-out';
    setTimeout(() => {
        container.style.animation = '';
    }, 500);

    alert('🎉 Congratulations! You\'ve completed your scarf! 🧣');
}

// Polyfill for roundRect if not available
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
    };
}

// Add pulse animation
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
    }
`;
document.head.appendChild(style);
