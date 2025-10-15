// Initialize Telegram Web App
let tg = window.Telegram?.WebApp;
let isTelegramApp = false;
let isInitialized = false;

if (tg) {
    try {
        tg.ready();
        isTelegramApp = true;
        
        // Prevent multiple initializations
        if (!isInitialized) {
            tg.expand();
            
            // Set header color once
            if (tg.setHeaderColor) {
                tg.setHeaderColor('#667eea');
            }
            
            // Disable closing confirmation to prevent issues
            if (tg.disableClosingConfirmation) {
                tg.disableClosingConfirmation();
            }
            
            isInitialized = true;
            console.log('Telegram Web App initialized successfully');
        }
    } catch (error) {
        console.error('Error initializing Telegram Web App:', error);
        isTelegramApp = false;
    }
} else {
    console.log('Not running in Telegram Web App');
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
let resizeTimeout;
function resizeCanvas() {
    // Debounce resize to prevent constant resizing
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        try {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            // Only resize if dimensions actually changed
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
            }
        } catch (error) {
            console.error('Error resizing canvas:', error);
        }
    }, 100);
}

// Initialize canvas
resizeCanvas();

// Add resize listener with debouncing for mobile
let orientationChangeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(orientationChangeTimeout);
    orientationChangeTimeout = setTimeout(resizeCanvas, 200);
});

// Handle orientation changes on mobile
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
    
    // Convert to blob and process
    exportCanvas.toBlob((blob) => {
        const timestamp = Date.now();
        
        if (isTelegramApp && tg) {
            // For Telegram Web App - send data back to bot
            try {
                // Convert to base64 for Telegram
                const reader = new FileReader();
                reader.onload = function(e) {
                    const base64Data = e.target.result;
                    
                    // Prepare data to send back to Telegram bot
                    const signatureData = {
                        type: 'signature_saved',
                        timestamp: timestamp,
                        image: base64Data,
                        user_id: tg.initDataUnsafe?.user?.id || 'unknown',
                        username: tg.initDataUnsafe?.user?.username || 'unknown'
                    };
                    
                    // Send data back to the bot
                    tg.sendData(JSON.stringify(signatureData));
                    
                    // Show success message
                    saveBtn.classList.remove('saving');
                    saveBtn.textContent = '✅ Sent to Bot!';
                    
                    // Show Telegram-specific success message
                    showNotification('Signature sent to bot successfully! 🤖', 'success');
                    
                    setTimeout(() => {
                        saveBtn.textContent = '💾 Save as Image';
                        // Optionally close the mini app after sending data
                        // tg.close();
                    }, 2000);
                };
                reader.readAsDataURL(blob);
                
            } catch (error) {
                console.error('Error sending data to Telegram:', error);
                // Fallback to download
                downloadImage(blob, timestamp);
            }
        } else {
            // For regular web browsers - download the image
            downloadImage(blob, timestamp);
        }
        
    }, 'image/png', 0.9);
});

// Function to download image (for regular browsers)
function downloadImage(blob, timestamp) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signature_${timestamp}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Remove animation and show success
    saveBtn.classList.remove('saving');
    saveBtn.textContent = '✅ Downloaded!';
    
    showNotification('Signature downloaded successfully! 📥', 'success');
    
    setTimeout(() => {
        saveBtn.textContent = '💾 Save as Image';
    }, 2000);
}

// Function to show notifications
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
    
    // If in Telegram, also show Telegram notification
    if (isTelegramApp && tg && tg.showAlert) {
        tg.showAlert(message);
    }
}

// Telegram Web App specific functionality
if (tg && isTelegramApp && isInitialized) {
    // Set theme colors based on Telegram theme (only once)
    try {
        if (tg.themeParams) {
            const root = document.documentElement;
            
            // Apply theme colors carefully
            const themeColors = {
                '--tg-theme-bg-color': tg.themeParams.bg_color || '#ffffff',
                '--tg-theme-text-color': tg.themeParams.text_color || '#000000',
                '--tg-theme-hint-color': tg.themeParams.hint_color || '#999999',
                '--tg-theme-link-color': tg.themeParams.link_color || '#2481cc',
                '--tg-theme-button-color': tg.themeParams.button_color || '#2481cc',
                '--tg-theme-button-text-color': tg.themeParams.button_text_color || '#ffffff'
            };
            
            Object.entries(themeColors).forEach(([property, value]) => {
                root.style.setProperty(property, value);
            });
            
            // Apply Telegram theme to body
            if (tg.themeParams.bg_color) {
                document.body.style.background = tg.themeParams.bg_color;
                document.body.classList.add('telegram-mode');
            }
        }
        
        // Configure Main Button
        if (tg.MainButton) {
            tg.MainButton.text = "Отправить подпись боту";
            tg.MainButton.color = tg.themeParams?.button_color || '#2481cc';
            tg.MainButton.textColor = tg.themeParams?.button_text_color || '#ffffff';
            tg.MainButton.show();
            
            // Handle Main Button clicks
            tg.MainButton.onClick(() => {
                try {
                    // Check if there's actually a signature drawn
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const pixels = imageData.data;
                    let hasDrawing = false;
                    
                    // Check if any pixel is not white/transparent
                    for (let i = 0; i < pixels.length; i += 4) {
                        if (pixels[i] !== 255 || pixels[i + 1] !== 255 || pixels[i + 2] !== 255) {
                            hasDrawing = true;
                            break;
                        }
                    }
                    
                    if (hasDrawing) {
                        saveBtn.click();
                    } else {
                        if (tg.showAlert) {
                            tg.showAlert('Пожалуйста, нарисуйте подпись! ✍️');
                        }
                    }
                } catch (error) {
                    console.error('Error in MainButton click:', error);
                }
            });
        }
        
        // Remove viewport change listener to prevent blinking
        // Handle back button if needed
        if (tg.BackButton) {
            tg.BackButton.onClick(() => {
                if (tg.close) {
                    tg.close();
                }
            });
        }
        
        // Update UI for Telegram context
        const header = document.querySelector('.header h1');
        if (header && tg.initDataUnsafe?.user?.first_name) {
            header.textContent = `✍️ Привет, ${tg.initDataUnsafe.user.first_name}!`;
        }
        
        // Hide the regular save button since we're using Telegram's Main Button
        if (saveBtn) {
            saveBtn.style.display = 'none';
        }
        
        console.log('Telegram Web App UI configured successfully');
        
    } catch (error) {
        console.error('Error configuring Telegram Web App:', error);
        // Fallback: show regular save button
        if (saveBtn) {
            saveBtn.style.display = 'block';
        }
    }
    
} else {
    // Regular web browser - show instructions
    const info = document.querySelector('.info p');
    if (info) {
        info.innerHTML = '👆 Используйте палец или мышь для рисования подписи<br>💡 Для интеграции с Telegram откройте эту ссылку в Telegram Mini App';
    }
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