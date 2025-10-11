// Initialize Telegram Web App
let tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// Canvas and drawing variables
const canvas = document.getElementById('signatureCanvas');
const ctx = canvas.getContext('2d');
const penSizeSlider = document.getElementById('penSize');
const penSizeValue = document.getElementById('penSizeValue');
const penColorPicker = document.getElementById('penColor');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');

let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Set canvas size for high DPI displays
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    // Set default drawing properties
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Initialize canvas
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Get coordinates for both mouse and touch events
function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

// Drawing functions
function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    const coords = getCoordinates(e);
    [lastX, lastY] = [coords.x, coords.y];
}

function draw(e) {
    e.preventDefault();
    if (!isDrawing) return;
    
    const coords = getCoordinates(e);
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = penColorPicker.value;
    ctx.lineWidth = penSizeSlider.value;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    
    [lastX, lastY] = [coords.x, coords.y];
}

function stopDrawing() {
    isDrawing = false;
}

// Mouse events
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch events for mobile
canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawing);

// Prevent scrolling when touching the canvas
document.body.addEventListener('touchstart', (e) => {
    if (e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });

document.body.addEventListener('touchend', (e) => {
    if (e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });

document.body.addEventListener('touchmove', (e) => {
    if (e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });

// Pen size control
penSizeSlider.addEventListener('input', (e) => {
    penSizeValue.textContent = e.target.value;
});

// Clear button
clearBtn.addEventListener('click', () => {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Show feedback
    clearBtn.textContent = '✅ Cleared!';
    setTimeout(() => {
        clearBtn.textContent = '🗑️ Clear';
    }, 1000);
});

// Save button
saveBtn.addEventListener('click', () => {
    // Add saving animation
    saveBtn.classList.add('saving');
    saveBtn.textContent = '💾 Saving...';
    
    // Create a new canvas with white background for better image quality
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    
    // Fill with white background
    exportCtx.fillStyle = 'white';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    
    // Draw the signature on top
    exportCtx.drawImage(canvas, 0, 0);
    
    // Convert to blob and download
    exportCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `signature_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Remove animation and show success
        saveBtn.classList.remove('saving');
        saveBtn.textContent = '✅ Saved!';
        
        setTimeout(() => {
            saveBtn.textContent = '💾 Save as Image';
        }, 2000);
        
        // Send data to Telegram if available
        if (tg && tg.sendData) {
            // Convert canvas to base64 for Telegram
            const imageData = exportCanvas.toDataURL('image/png');
            tg.sendData(JSON.stringify({
                type: 'signature',
                image: imageData,
                timestamp: Date.now()
            }));
        }
        
    }, 'image/png', 0.9);
});

// Telegram Web App specific functionality
if (tg) {
    // Set theme colors
    if (tg.themeParams) {
        document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
        document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
        document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
    }
    
    // Show main button in Telegram
    tg.MainButton.text = "Save Signature";
    tg.MainButton.show();
    
    tg.MainButton.onClick(() => {
        saveBtn.click();
    });
    
    // Handle back button
    tg.BackButton.onClick(() => {
        tg.close();
    });
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'z':
                e.preventDefault();
                clearBtn.click();
                break;
            case 's':
                e.preventDefault();
                saveBtn.click();
                break;
        }
    }
    
    if (e.key === 'Escape') {
        clearBtn.click();
    }
});

// Initialize drawing properties
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.strokeStyle = penColorPicker.value;
ctx.lineWidth = penSizeSlider.value;

console.log('Signature Draw App initialized successfully!');