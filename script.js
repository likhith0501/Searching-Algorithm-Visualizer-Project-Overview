// Global variables
let array = [];
let arraySize = 20;
let searchSpeed = 500;
let targetValue = 50;
let selectedAlgorithm = 'linear';
let isSearching = false;
let isPaused = false;
let pauseResolve = null;
let comparisons = 0;
let startTime = 0;

// DOM Elements
const arrayContainer = document.getElementById('array-container');
const arraySizeSlider = document.getElementById('array-size');
const arraySizeValue = document.getElementById('array-size-value');
const speedSlider = document.getElementById('search-speed');
const speedValue = document.getElementById('speed-value');
const targetInput = document.getElementById('target-value');
const generateBtn = document.getElementById('generate-btn');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const pauseBtn = document.getElementById('pause-btn');
const algoButtons = document.querySelectorAll('.algo-btn');

// Algorithm information
const algorithmInfo = {
    linear: {
        name: 'Linear Search',
        description: 'Linear Search is the simplest searching algorithm. It sequentially checks each element of the array until it finds the target or reaches the end.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        bestCase: 'O(1) - target is first element',
        worksOn: 'Any array (sorted or unsorted)',
        note: 'Note: For visualization, array is sorted to fairly compare with other algorithms.'
    },
    binary: {
        name: 'Binary Search',
        description: 'Binary Search is an efficient algorithm that works on sorted arrays. It repeatedly divides the search interval in half, eliminating half of the remaining elements with each comparison.',
        timeComplexity: 'O(log n)',
        spaceComplexity: 'O(1)',
        bestCase: 'O(1) - target is middle element',
        worksOn: 'Sorted arrays only'
    },
    jump: {
        name: 'Jump Search',
        description: 'Jump Search is an algorithm for sorted arrays that jumps ahead by fixed steps (√n) instead of searching linearly. When it finds a range containing the target, it performs a linear search within that range.',
        timeComplexity: 'O(√n)',
        spaceComplexity: 'O(1)',
        bestCase: 'O(1) - target is at jump position',
        worksOn: 'Sorted arrays only',
        note: `Jump size: √${arraySize} ≈ ${Math.floor(Math.sqrt(arraySize))}`
    },
    interpolation: {
        name: 'Interpolation Search',
        description: 'Interpolation Search is an improved variant of Binary Search for uniformly distributed sorted arrays. It estimates the position of the target using linear interpolation, potentially reducing comparisons significantly.',
        timeComplexity: 'O(log log n) average, O(n) worst case',
        spaceComplexity: 'O(1)',
        bestCase: 'O(1) - uniform distribution',
        worksOn: 'Sorted, uniformly distributed arrays'
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    generateArray();
    setupEventListeners();
    updateAlgorithmInfo('linear');
});

function setupEventListeners() {
    arraySizeSlider.addEventListener('input', (e) => {
        arraySize = parseInt(e.target.value);
        arraySizeValue.textContent = arraySize;
        updateJumpInfo();
        generateArray();
    });

    speedSlider.addEventListener('input', (e) => {
        searchSpeed = parseInt(e.target.value);
        speedValue.textContent = `${searchSpeed}ms`;
    });

    targetInput.addEventListener('change', (e) => {
        targetValue = parseInt(e.target.value);
        if (targetValue < 0) targetValue = 0;
        if (targetValue > 100) targetValue = 100;
        e.target.value = targetValue;
    });

    generateBtn.addEventListener('click', generateArray);
    startBtn.addEventListener('click', startSearch);
    resetBtn.addEventListener('click', resetVisualization);
    pauseBtn.addEventListener('click', togglePause);

    algoButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isSearching) return;
            algoButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedAlgorithm = btn.dataset.algo;
            updateAlgorithmInfo(selectedAlgorithm);
            resetVisualization();
        });
    });
}

function generateArray() {
    if (isSearching) return;
    
    array = [];
    for (let i = 0; i < arraySize; i++) {
        // Generate sorted array with values between 0 and 100
        array.push(Math.floor((i / (arraySize - 1)) * 100));
    }
    
    // Add some variation while keeping sorted
    for (let i = 1; i < arraySize - 1; i++) {
        const variation = Math.floor(Math.random() * 3) - 1;
        array[i] = Math.max(array[i - 1], Math.min(100, array[i] + variation));
    }
    
    // Ensure strictly increasing for interpolation search
    for (let i = 1; i < arraySize; i++) {
        if (array[i] <= array[i - 1]) {
            array[i] = array[i - 1] + 1;
        }
    }
    
    renderArray();
    showMessage('New array generated!', 'success');
}

function renderArray(highlightIndex = -1, eliminatedIndices = [], foundIndex = -1) {
    arrayContainer.innerHTML = '';
    
    const maxHeight = 180;
    const minValue = Math.min(...array);
    const maxValue = Math.max(...array);
    const range = maxValue - minValue || 1;
    
    array.forEach((value, index) => {
        const bar = document.createElement('div');
        bar.className = 'bar unvisited';
        bar.id = `bar-${index}`;
        
        // Calculate height based on value
        const height = ((value - minValue) / range) * maxHeight + 20;
        bar.style.height = `${height}px`;
        
        // Bar value display
        const valueSpan = document.createElement('span');
        valueSpan.className = 'bar-value';
        valueSpan.textContent = value;
        bar.appendChild(valueSpan);
        
        // Bar index display
        const indexSpan = document.createElement('span');
        indexSpan.className = 'bar-index';
        indexSpan.textContent = index;
        bar.appendChild(indexSpan);
        
        arrayContainer.appendChild(bar);
    });
}

async function startSearch() {
    if (isSearching) return;
    
    targetValue = parseInt(targetInput.value);
    if (isNaN(targetValue)) {
        showMessage('Please enter a valid target value', 'error');
        return;
    }
    
    isSearching = true;
    comparisons = 0;
    startTime = Date.now();
    
    // Disable controls
    generateBtn.disabled = true;
    startBtn.disabled = true;
    arraySizeSlider.disabled = true;
    pauseBtn.disabled = false;
    
    // Update stats
    document.getElementById('stat-algorithm').textContent = algorithmInfo[selectedAlgorithm].name;
    document.getElementById('stat-target').textContent = targetValue;
    document.getElementById('stat-comparisons').textContent = '0';
    document.getElementById('stat-result').textContent = 'Searching...';
    document.getElementById('stat-index').textContent = '-';
    document.getElementById('stat-time').textContent = '0ms';
    
    let result = -1;
    
    switch (selectedAlgorithm) {
        case 'linear':
            result = await linearSearch();
            break;
        case 'binary':
            result = await binarySearch();
            break;
        case 'jump':
            result = await jumpSearch();
            break;
        case 'interpolation':
            result = await interpolationSearch();
            break;
    }
    
    // Update final stats
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    
    document.getElementById('stat-comparisons').textContent = comparisons;
    document.getElementById('stat-time').textContent = `${elapsedTime}ms`;
    
    if (result !== -1) {
        document.getElementById('stat-result').textContent = 'Found ✓';
        document.getElementById('stat-result').style.color = '#00b894';
        document.getElementById('stat-index').textContent = result;
        showMessage(`Target ${targetValue} found at index ${result}!`, 'success');
    } else {
        document.getElementById('stat-result').textContent = 'Not Found ✗';
        document.getElementById('stat-result').style.color = '#d63031';
        document.getElementById('stat-index').textContent = '-';
        showMessage(`Target ${targetValue} not found in array`, 'error');
    }
    
    isSearching = false;
    isPaused = false;
    
    // Re-enable controls
    generateBtn.disabled = false;
    startBtn.disabled = false;
    arraySizeSlider.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '⏸ Pause';
}

async function linearSearch() {
    for (let i = 0; i < array.length; i++) {
        await highlightBar(i, 'comparing');
        comparisons++;
        updateComparisons();
        
        if (array[i] === targetValue) {
            await highlightBar(i, 'found');
            return i;
        }
        
        await highlightBar(i, 'eliminated');
        await delay();
    }
    return -1;
}

async function binarySearch() {
    let low = 0;
    let high = array.length - 1;
    
    while (low <= high) {
        let mid = Math.floor((low + high) / 2);
        
        // Highlight current search range
        for (let i = 0; i < array.length; i++) {
            if (i < low || i > high) {
                document.getElementById(`bar-${i}`).className = 'bar eliminated';
            }
        }
        
        await highlightBar(mid, 'comparing');
        comparisons++;
        updateComparisons();
        
        if (array[mid] === targetValue) {
            await highlightBar(mid, 'found');
            return mid;
        }
        
        if (array[mid] < targetValue) {
            await highlightBar(mid, 'eliminated');
            low = mid + 1;
        } else {
            await highlightBar(mid, 'eliminated');
            high = mid - 1;
        }
        
        await delay();
    }
    return -1;
}

async function jumpSearch() {
    const n = array.length;
    const step = Math.floor(Math.sqrt(n));
    let prev = 0;
    
    // Update jump info
    updateJumpInfo();
    
    // Find the block where target may be present
    while (prev < n && array[Math.min(step, n) - 1] < targetValue) {
        // Highlight jumped elements
        for (let i = prev; i < Math.min(step, n); i++) {
            if (i !== step - 1) {
                await highlightBar(i, 'eliminated');
            }
        }
        
        await highlightBar(Math.min(step, n) - 1, 'comparing');
        comparisons++;
        updateComparisons();
        
        prev = step;
        step += Math.floor(Math.sqrt(n));
        
        await delay();
    }
    
    // Do linear search in the found block
    while (prev < Math.min(step, n)) {
        await highlightBar(prev, 'comparing');
        comparisons++;
        updateComparisons();
        
        if (array[prev] === targetValue) {
            await highlightBar(prev, 'found');
            return prev;
        }
        
        await highlightBar(prev, 'eliminated');
        prev++;
        await delay();
    }
    
    return -1;
}

async function interpolationSearch() {
    let low = 0;
    let high = array.length - 1;
    
    while (low <= high && targetValue >= array[low] && targetValue <= array[high]) {
        // Highlight current search range
        for (let i = 0; i < array.length; i++) {
            if (i < low || i > high) {
                document.getElementById(`bar-${i}`).className = 'bar eliminated';
            }
        }
        
        // Calculate probe position using interpolation formula
        let pos = low + Math.floor(((targetValue - array[low]) * (high - low)) / (array[high] - array[low]));
        
        // Ensure pos is within bounds
        pos = Math.max(low, Math.min(high, pos));
        
        await highlightBar(pos, 'comparing');
        comparisons++;
        updateComparisons();
        
        if (array[pos] === targetValue) {
            await highlightBar(pos, 'found');
            return pos;
        }
        
        if (array[pos] < targetValue) {
            await highlightBar(pos, 'eliminated');
            low = pos + 1;
        } else {
            await highlightBar(pos, 'eliminated');
            high = pos - 1;
        }
        
        await delay();
    }
    
    return -1;
}

async function highlightBar(index, state) {
    const bar = document.getElementById(`bar-${index}`);
    if (bar) {
        bar.className = `bar ${state}`;
        await delay();
    }
}

function delay() {
    return new Promise(resolve => {
        if (isPaused) {
            pauseResolve = resolve;
        } else {
            setTimeout(resolve, searchSpeed);
        }
    });
}

function togglePause() {
    if (!isSearching) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        pauseBtn.textContent = '▶ Resume';
        showMessage('Search paused', 'info');
    } else {
        pauseBtn.textContent = '⏸ Pause';
        if (pauseResolve) {
            pauseResolve();
            pauseResolve = null;
        }
        showMessage('Search resumed', 'info');
    }
}

function resetVisualization() {
    if (isSearching) {
        isSearching = false;
        isPaused = false;
        if (pauseResolve) {
            pauseResolve();
            pauseResolve = null;
        }
    }
    
    renderArray();
    
    // Reset stats
    document.getElementById('stat-comparisons').textContent = '0';
    document.getElementById('stat-result').textContent = '-';
    document.getElementById('stat-result').style.color = '#00d9ff';
    document.getElementById('stat-index').textContent = '-';
    document.getElementById('stat-time').textContent = '0ms';
    
    // Re-enable controls
    generateBtn.disabled = false;
    startBtn.disabled = false;
    arraySizeSlider.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '⏸ Pause';
    
    showMessage('Visualization reset', 'info');
}

function updateComparisons() {
    document.getElementById('stat-comparisons').textContent = comparisons;
    
    // Update elapsed time in real-time
    const currentTime = Date.now();
    document.getElementById('stat-time').textContent = `${currentTime - startTime}ms`;
}

function updateAlgorithmInfo(algo) {
    const info = algorithmInfo[algo];
    const content = document.getElementById('algo-info-content');
    
    let html = `
        <h4>${info.name}</h4>
        <p>${info.description}</p>
        <ul>
            <li><strong>Time Complexity:</strong> ${info.timeComplexity}</li>
            <li><strong>Space Complexity:</strong> ${info.spaceComplexity}</li>
            <li><strong>Best Case:</strong> ${info.bestCase}</li>
            <li><strong>Works on:</strong> ${info.worksOn}</li>
    `;
    
    if (info.note) {
        html += `<li><strong>Note:</strong> ${info.note}</li>`;
    }
    
    html += '</ul>';
    content.innerHTML = html;
}

function updateJumpInfo() {
    const jumpSize = Math.floor(Math.sqrt(arraySize));
    algorithmInfo.jump.note = `Jump size: √${arraySize} ≈ ${jumpSize}`;
    if (selectedAlgorithm === 'jump') {
        updateAlgorithmInfo('jump');
    }
}

function showMessage(text, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    document.body.appendChild(message);
    
    // Remove after 3 seconds
    setTimeout(() => {
        message.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => message.remove(), 300);
    }, 3000);
}