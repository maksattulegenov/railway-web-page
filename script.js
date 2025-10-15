// Initialize Telegram Web App
let tg = window.Telegram?.WebApp;
let isTelegramApp = false;
let isInitialized = false;

if (tg) {
    try {
        tg.ready();
        isTelegramApp = true;
        
        if (!isInitialized) {
            tg.expand();
            if (tg.setHeaderColor) {
                tg.setHeaderColor('#007bff');
            }
            if (tg.disableClosingConfirmation) {
                tg.disableClosingConfirmation();
            }
            isInitialized = true;
        }
    } catch (error) {
        console.error('Telegram Web App error:', error);
        isTelegramApp = false;
    }
}

// Canvas and drawing variables
const canvas = document.getElementById('signatureCanvas');
const ctx = canvas.getContext('2d');
const penSizeSlider = document.getElementById('penSize');
const penSizeValue = document.getElementById('penSizeValue');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const preview = document.getElementById('preview');
const previewImage = document.getElementById('previewImage');
const redrawBtn = document.getElementById('redrawBtn');
const confirmBtn = document.getElementById('confirmBtn');

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentSignatureData = null;

// Set canvas size for high DPI displays
let resizeTimeout;
function resizeCanvas() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        try {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            const newWidth = rect.width * dpr;
            const newHeight = rect.height * dpr;
            
            if (canvas.width !== newWidth || canvas.height !== newHeight) {
                canvas.width = newWidth;
                canvas.height = newHeight;
                
                ctx.scale(dpr, dpr);
                canvas.style.width = rect.width + 'px';
                canvas.style.height = rect.height + 'px';
                
                // Set default drawing properties
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = penSizeSlider.value;
            }
        } catch (error) {
            console.error('Canvas resize error:', error);
        }
    }, 100);
}

// Initialize canvas
resizeCanvas();

// Handle window resize
let orientationChangeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(orientationChangeTimeout);
    orientationChangeTimeout = setTimeout(resizeCanvas, 200);
});

window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 300);
});

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
    ctx.strokeStyle = '#000000';
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

// Event listeners for drawing
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawing);

// Prevent scrolling when touching the canvas
document.body.addEventListener('touchstart', (e) => {
    if (e.target === canvas) e.preventDefault();
}, { passive: false });

document.body.addEventListener('touchend', (e) => {
    if (e.target === canvas) e.preventDefault();
}, { passive: false });

document.body.addEventListener('touchmove', (e) => {
    if (e.target === canvas) e.preventDefault();
}, { passive: false });

// Pen size control
penSizeSlider.addEventListener('input', (e) => {
    penSizeValue.textContent = e.target.value + 'px';
});

// Clear button
clearBtn.addEventListener('click', () => {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    preview.classList.add('hidden');
    clearBtn.textContent = 'Очищено!';
    setTimeout(() => {
        clearBtn.textContent = 'Очистить';
    }, 1000);
});

// Check if signature is drawn
function hasSignature() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] !== 255 || pixels[i + 1] !== 255 || pixels[i + 2] !== 255) {
            return true;
        }
    }
    return false;
}

// Save button - show preview
saveBtn.addEventListener('click', () => {
    if (!hasSignature()) {
        alert('Пожалуйста, нарисуйте подпись!');
        return;
    }
    
    // Create export canvas with white background
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    
    exportCtx.fillStyle = 'white';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(canvas, 0, 0);
    
    // Get image data
    currentSignatureData = exportCanvas.toDataURL('image/png');
    
    // Show preview
    previewImage.src = currentSignatureData;
    preview.classList.remove('hidden');
    
    // Scroll to preview
    preview.scrollIntoView({ behavior: 'smooth' });
});

// Redraw button
redrawBtn.addEventListener('click', () => {
    preview.classList.add('hidden');
    currentSignatureData = null;
});

// Confirm button - final save
confirmBtn.addEventListener('click', () => {
    if (!currentSignatureData) return;
    
    const timestamp = Date.now();
    
    if (isTelegramApp && tg) {
        try {
            // Send data to Telegram bot
            const signatureData = {
                type: 'signature_saved',
                timestamp: timestamp,
                image: currentSignatureData,
                user_id: tg.initDataUnsafe?.user?.id || 'unknown',
                username: tg.initDataUnsafe?.user?.username || 'unknown'
            };
            
            tg.sendData(JSON.stringify(signatureData));
            
            confirmBtn.textContent = 'Отправлено!';
            setTimeout(() => {
                if (tg.close) tg.close();
            }, 1000);
            
        } catch (error) {
            console.error('Telegram send error:', error);
            downloadImage();
        }
    } else {
        // Download for regular browsers
        downloadImage();
    }
});

// Download image function
function downloadImage() {
    const link = document.createElement('a');
    link.download = `signature_${Date.now()}.png`;
    link.href = currentSignatureData;
    link.click();
    
    confirmBtn.textContent = 'Скачано!';
    setTimeout(() => {
        confirmBtn.textContent = 'Подтвердить';
    }, 2000);
}

// Telegram Web App setup
if (tg && isTelegramApp && isInitialized) {
    try {
        // Apply theme if available
        if (tg.themeParams && tg.themeParams.bg_color) {
            document.body.style.background = tg.themeParams.bg_color;
            document.body.classList.add('telegram-mode');
        }
        
        // Set up main button
        if (tg.MainButton) {
            tg.MainButton.text = "Сохранить подпись";
            tg.MainButton.show();
            
            tg.MainButton.onClick(() => {
                if (preview.classList.contains('hidden')) {
                    saveBtn.click();
                } else {
                    confirmBtn.click();
                }
            });
        }
        
        // Hide save button in Telegram
        saveBtn.style.display = 'none';
        
    } catch (error) {
        console.error('Telegram setup error:', error);
    }
}

// Initialize drawing properties
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.strokeStyle = '#000000';
ctx.lineWidth = penSizeSlider.value;