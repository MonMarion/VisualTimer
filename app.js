// DOM Elements
const hoursDisplay = document.getElementById('hours');
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const timerDisplay = document.querySelector('.timer-display');
const progressCircle = document.getElementById('progress-circle');

const inputHours = document.getElementById('input-hours');
const inputMinutes = document.getElementById('input-minutes');
const inputSeconds = document.getElementById('input-seconds');

const playPauseBtn = document.getElementById('play-pause-btn');
const resetBtn = document.getElementById('reset-btn');
const subtractBtn = document.getElementById('subtract-btn');
const addBtn = document.getElementById('add-btn');
const progressRing = document.querySelector('.progress-ring');

// Timer state
let totalSeconds = 0;        // Total time (from inputs, set when timer starts)
let remainingSeconds = 0;    // Current remaining time
let startingSeconds = 0;     // Pre-start: time to start with (adjustable via arrows)
let timerInterval = null;
let isRunning = false;
let timerStarted = false;    // Has the timer been started at least once?

// Audio state
let audioContext = null;
let isTick = true;           // Alternates between tick and tock

// Get or create audio context
function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// Play a single tick or tock sound
function playSingleTick(volume) {
    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        gainNode.gain.value = volume;

        // Alternate between tick (higher) and tock (lower) frequencies
        oscillator.frequency.value = isTick ? 1200 : 800;
        oscillator.type = 'sine';

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.05);

        isTick = !isTick;  // Alternate for next time
    } catch (e) {
        console.log('Tick-tock audio not available');
    }
}

// Play tick-tock sound with volume based on remaining time
function playTickTock(secondsLeft) {
    if (secondsLeft > 30 || secondsLeft <= 0) return;

    // Calculate volume: low at 30s, max at 10s and below
    let volume;
    if (secondsLeft <= 10) {
        volume = 0.4;  // Max volume for final 10 seconds
    } else {
        // Linear interpolation from 0.05 at 30s to 0.4 at 10s
        volume = 0.05 + (0.35 * (30 - secondsLeft) / 20);
    }

    // Play first tick-tock
    playSingleTick(volume);

    // Double tempo for final 10 seconds - play second tick-tock after 500ms
    if (secondsLeft <= 10) {
        setTimeout(() => {
            playSingleTick(volume);
        }, 500);
    }
}

// Progress circle circumference
const circumference = 2 * Math.PI * 90; // radius = 90

// Initialize progress circle
progressCircle.style.strokeDasharray = circumference;
progressCircle.style.strokeDashoffset = 0;

// Format number to 2 digits
function formatNumber(num) {
    return num.toString().padStart(2, '0');
}

// Update display
function updateDisplay() {
    let displaySeconds;
    let maxSeconds;

    if (timerStarted) {
        // Timer has been started - show remaining time
        displaySeconds = remainingSeconds;
        maxSeconds = totalSeconds;
    } else {
        // Timer not started - show starting time
        displaySeconds = startingSeconds;
        maxSeconds = getInputSeconds();
    }

    const hours = Math.floor(displaySeconds / 3600);
    const minutes = Math.floor((displaySeconds % 3600) / 60);
    const seconds = displaySeconds % 60;

    hoursDisplay.textContent = formatNumber(hours);
    minutesDisplay.textContent = formatNumber(minutes);
    secondsDisplay.textContent = formatNumber(seconds);

    // Update progress ring
    if (maxSeconds > 0) {
        const progress = displaySeconds / maxSeconds;
        const offset = circumference * (1 - progress);
        progressCircle.style.strokeDashoffset = offset;

        // Change color based on remaining time
        progressCircle.classList.remove('warning', 'danger');
        if (progress <= 0.25) {
            progressCircle.classList.add('danger');
        } else if (progress <= 0.5) {
            progressCircle.classList.add('warning');
        }
    } else {
        progressCircle.style.strokeDashoffset = 0;
        progressCircle.classList.remove('warning', 'danger');
    }
}

// Get total seconds from inputs
function getInputSeconds() {
    const hours = parseInt(inputHours.value) || 0;
    const minutes = parseInt(inputMinutes.value) || 0;
    const seconds = parseInt(inputSeconds.value) || 0;
    return (hours * 3600) + (minutes * 60) + seconds;
}

// Set inputs enabled/disabled
function setInputsEnabled(enabled) {
    inputHours.disabled = !enabled;
    inputMinutes.disabled = !enabled;
    inputSeconds.disabled = !enabled;
}

// Timer tick
function tick() {
    if (remainingSeconds > 0) {
        remainingSeconds--;
        updateDisplay();

        // Play tick-tock sound in final 30 seconds
        if (remainingSeconds <= 30 && remainingSeconds > 0) {
            playTickTock(remainingSeconds);
        }
    }

    if (remainingSeconds === 0) {
        timerComplete();
    }
}

// Timer complete
function timerComplete() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;

    timerDisplay.classList.remove('running');
    timerDisplay.classList.add('finished');

    playPauseBtn.disabled = true;
    playPauseBtn.classList.remove('playing');

    // Play notification sound (if available)
    try {
        const ctx = getAudioContext();
        const gainNode = ctx.createGain();
        gainNode.connect(ctx.destination);
        gainNode.gain.value = 0.3;

        // Function to play one beep sequence
        function playBeepSequence(startTime) {
            // First beep
            const osc1 = ctx.createOscillator();
            osc1.connect(gainNode);
            osc1.frequency.value = 800;
            osc1.type = 'sine';
            osc1.start(ctx.currentTime + startTime);
            osc1.stop(ctx.currentTime + startTime + 0.2);

            // Second beep
            const osc2 = ctx.createOscillator();
            osc2.connect(gainNode);
            osc2.frequency.value = 800;
            osc2.type = 'sine';
            osc2.start(ctx.currentTime + startTime + 0.3);
            osc2.stop(ctx.currentTime + startTime + 0.5);

            // Third beep (higher pitch)
            const osc3 = ctx.createOscillator();
            osc3.connect(gainNode);
            osc3.frequency.value = 1000;
            osc3.type = 'sine';
            osc3.start(ctx.currentTime + startTime + 0.6);
            osc3.stop(ctx.currentTime + startTime + 1.0);
        }

        // Play the sequence 3 times
        playBeepSequence(0);
        playBeepSequence(1.2);
        playBeepSequence(2.4);
    } catch (e) {
        // Audio not supported
        console.log('Audio notification not available');
    }
}

// Start timer
function startTimer() {
    if (isRunning) return;

    if (!timerStarted) {
        // First start - set total from inputs, remaining from startingSeconds
        totalSeconds = getInputSeconds();
        if (totalSeconds === 0) return;

        // If no starting time set, default to full time
        if (startingSeconds === 0) {
            startingSeconds = totalSeconds;
        }
        remainingSeconds = startingSeconds;
        timerStarted = true;
    }

    if (remainingSeconds === 0) return;

    isRunning = true;
    setInputsEnabled(false);
    timerDisplay.classList.add('running');
    timerDisplay.classList.remove('finished');

    playPauseBtn.classList.add('playing');

    updateDisplay();
    timerInterval = setInterval(tick, 1000);
}

// Pause timer
function pauseTimer() {
    if (!isRunning) return;

    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;

    timerDisplay.classList.remove('running');

    playPauseBtn.classList.remove('playing');
}

// Toggle play/pause
function togglePlayPause() {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

// Reset timer
function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    timerStarted = false;

    totalSeconds = 0;
    remainingSeconds = 0;
    startingSeconds = getInputSeconds(); // Reset to full time from inputs
    isTick = true; // Reset tick-tock alternation

    setInputsEnabled(true);
    timerDisplay.classList.remove('running', 'finished');
    progressCircle.classList.remove('warning', 'danger');

    playPauseBtn.disabled = false;
    playPauseBtn.classList.remove('playing');

    updateDisplay();
}

// Subtract 5 seconds
function subtractTime() {
    if (timerStarted) {
        // Timer has been started - modify remaining time
        remainingSeconds = Math.max(0, remainingSeconds - 5);
        updateDisplay();

        if (remainingSeconds === 0 && !isRunning) {
            timerComplete();
        }
    } else {
        // Timer not started - modify starting time (capped at 0)
        startingSeconds = Math.max(0, startingSeconds - 5);
        updateDisplay();
    }
}

// Add 5 seconds
function addTime() {
    if (timerStarted) {
        // Timer has been started - add to remaining (cap at total)
        remainingSeconds = Math.min(totalSeconds, remainingSeconds + 5);
        updateDisplay();
    } else {
        // Timer not started - add to starting time (capped at input total)
        const maxTime = getInputSeconds();
        startingSeconds = Math.min(maxTime, startingSeconds + 5);
        updateDisplay();
    }
}

// Sync starting time when inputs change
function syncStartingTime() {
    const inputTotal = getInputSeconds();
    // Cap startingSeconds to not exceed input total
    if (startingSeconds > inputTotal) {
        startingSeconds = inputTotal;
    }
    // If startingSeconds is 0 and we have input, set it to input total
    if (startingSeconds === 0 && inputTotal > 0) {
        startingSeconds = inputTotal;
    }
    updateDisplay();
}

// Event listeners
playPauseBtn.addEventListener('click', togglePlayPause);
resetBtn.addEventListener('click', resetTimer);
subtractBtn.addEventListener('click', subtractTime);
addBtn.addEventListener('click', addTime);

// Allow Enter key to start timer
document.querySelectorAll('.input-group input').forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isRunning) {
            startTimer();
        }
    });
});

// Input validation and sync
[inputHours, inputMinutes, inputSeconds].forEach(input => {
    input.addEventListener('input', () => {
        let value = parseInt(input.value) || 0;
        const max = parseInt(input.max);
        const min = parseInt(input.min);

        if (value > max) input.value = max;
        if (value < min) input.value = min;

        // Sync starting time with input changes
        if (!timerStarted) {
            syncStartingTime();
        }
    });
});

// Handle click on progress ring to set time
function handleRingClick(e) {
    const rect = progressRing.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Get click position relative to center
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;

    // Calculate angle from top (12 o'clock position)
    // atan2 gives angle from positive x-axis, we need from negative y-axis (top)
    let angle = Math.atan2(-x, -y); // Note: -x and -y to measure from top, counter-clockwise

    // Convert to 0 to 2*PI range (clockwise from top)
    if (angle < 0) {
        angle += 2 * Math.PI;
    }

    // Convert angle to progress (0 at top going clockwise = 100% down to 0%)
    // Full circle (2*PI) = 0%, no rotation (0) = 100%
    const progress = 1 - (angle / (2 * Math.PI));

    // Calculate new time based on progress
    if (timerStarted) {
        remainingSeconds = Math.round(totalSeconds * progress);
        updateDisplay();

        if (remainingSeconds === 0 && !isRunning) {
            timerComplete();
        }
    } else {
        const maxTime = getInputSeconds();
        if (maxTime > 0) {
            startingSeconds = Math.round(maxTime * progress);
            updateDisplay();
        }
    }
}

progressRing.addEventListener('click', handleRingClick);

// Initialize
startingSeconds = getInputSeconds();
updateDisplay();
