// Initialize Telegram Web App
let tg = window.Telegram?.WebApp;
let isTelegramApp = false;
let isInitialized = false;

console.log('Checking Telegram Web App availability:', !!tg);

if (tg) {
    try {
        console.log('Initializing Telegram Web App...');
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
            
            // Log user data for debugging
            console.log('Telegram user data:', tg.initDataUnsafe?.user);
            console.log('Telegram platform:', tg.platform);
            
            isInitialized = true;
            console.log('Telegram Web App initialized successfully');
        }
    } catch (error) {
        console.error('Telegram Web App error:', error);
        isTelegramApp = false;
    }
} else {
    console.log('Not running in Telegram Web App - normal browser mode');
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

// Check if all elements exist
if (!canvas || !ctx || !penSizeSlider || !penSizeValue || !clearBtn || !saveBtn || 
    !preview || !previewImage || !redrawBtn || !confirmBtn) {
    console.error('Missing HTML elements!');
    console.log('Elements check:', {
        canvas: !!canvas,
        ctx: !!ctx,
        penSizeSlider: !!penSizeSlider,
        penSizeValue: !!penSizeValue,
        clearBtn: !!clearBtn,
        saveBtn: !!saveBtn,
        preview: !!preview,
        previewImage: !!previewImage,
        redrawBtn: !!redrawBtn,
        confirmBtn: !!confirmBtn
    });
}

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
    console.log('Save button clicked');
    
    if (!hasSignature()) {
        const message = 'Пожалуйста, нарисуйте подпись!';
        if (isTelegramApp && tg && tg.showAlert) {
            tg.showAlert(message);
        } else {
            alert(message);
        }
        return;
    }
    
    console.log('Creating signature preview...');
    
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
    console.log('Signature data created, length:', currentSignatureData.length);
    
    // Show preview
    previewImage.src = currentSignatureData;
    preview.classList.remove('hidden');
    
    // Update main button text in Telegram
    if (isTelegramApp && tg && tg.MainButton) {
        tg.MainButton.text = "Отправить подпись";
    }
    
    // Scroll to preview
    preview.scrollIntoView({ behavior: 'smooth' });
    
    console.log('Preview shown successfully');
});

// Redraw button
redrawBtn.addEventListener('click', () => {
    console.log('Redraw button clicked');
    preview.classList.add('hidden');
    currentSignatureData = null;
    
    // Reset main button text in Telegram
    if (isTelegramApp && tg && tg.MainButton) {
        tg.MainButton.text = "Сохранить подпись";
    }
    
    // Re-enable confirm button
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Подтвердить';
});

// Confirm button - final save
confirmBtn.addEventListener('click', () => {
    console.log('Confirm button clicked');
    
    if (!currentSignatureData) {
        console.log('No signature data available');
        return;
    }
    
    const timestamp = Date.now();
    console.log('Preparing to send signature data...');
    
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
            
            console.log('Sending signature data to Telegram bot:', {
                type: signatureData.type,
                timestamp: signatureData.timestamp,
                user_id: signatureData.user_id,
                username: signatureData.username,
                image_length: signatureData.image.length
            });
            
            // Send data and immediately try to close
            tg.sendData(JSON.stringify(signatureData));
            console.log('Data sent to Telegram bot successfully');
            
            confirmBtn.textContent = 'Отправлено!';
            confirmBtn.disabled = true;
            
            // Try multiple methods to close the app
            console.log('Attempting to close mini-app...');
            
            // Method 1: Direct close
            if (tg.close) {
                console.log('Trying tg.close()...');
                tg.close();
            }
            
            // Method 2: MainButton hide and close
            setTimeout(() => {
                console.log('Fallback close attempt 1...');
                if (tg.MainButton) {
                    tg.MainButton.hide();
                }
                if (tg.close) {
                    tg.close();
                }
            }, 500);
            
            // Method 3: Force close
            setTimeout(() => {
                console.log('Fallback close attempt 2...');
                try {
                    window.close();
                } catch (e) {
                    console.log('window.close() failed:', e);
                }
                
                // Last resort - redirect to telegram
                if (tg.initDataUnsafe?.user?.username) {
                    window.location.href = `https://t.me/${tg.initDataUnsafe.user.username}`;
                } else {
                    window.location.href = 'https://t.me';
                }
            }, 1000);
            
        } catch (error) {
            console.error('Error sending data to Telegram:', error);
            downloadImage();
        }
    } else {
        console.log('Not in Telegram app, downloading image...');
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
                    // First click - show preview
                    if (hasSignature()) {
                        saveBtn.click();
                    } else {
                        if (tg.showAlert) {
                            tg.showAlert('Пожалуйста, нарисуйте подпись! ✍️');
                        }
                    }
                } else {
                    // Second click - send to bot and close
                    confirmBtn.click();
                }
            });
        }
        
        // Keep save button visible in Telegram for backup
        if (saveBtn) {
            saveBtn.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Telegram setup error:', error);
    }
}

// Initialize drawing properties
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.strokeStyle = '#000000';
ctx.lineWidth = penSizeSlider.value;