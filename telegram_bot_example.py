# Telegram Bot Handler Example
# This is an example of how to handle the signature data sent from the web app

import json
import base64
import io
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from PIL import Image

# Replace with your bot token
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send a message with the web app button"""
    keyboard = [
        [InlineKeyboardButton(
            "✍️ Draw Signature", 
            web_app=WebApp("https://railway-web-page-production.up.railway.app")
        )]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "Welcome! Click the button below to draw your signature:",
        reply_markup=reply_markup
    )

async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle data sent from the web app"""
    try:
        # Parse the JSON data sent from the web app
        data = json.loads(update.effective_message.web_app_data.data)
        
        if data.get('type') == 'signature_saved':
            # Extract the base64 image data
            image_data = data.get('image', '')
            user_id = data.get('user_id', 'unknown')
            timestamp = data.get('timestamp', 'unknown')
            
            # Remove the data URL prefix if present
            if image_data.startswith('data:image/png;base64,'):
                image_data = image_data.replace('data:image/png;base64,', '')
            
            # Decode the base64 image
            image_bytes = base64.b64decode(image_data)
            
            # Create a BytesIO object to send as photo
            image_io = io.BytesIO(image_bytes)
            image_io.name = f'signature_{timestamp}.png'
            
            # Send the signature back to the user
            await update.effective_message.reply_photo(
                photo=image_io,
                caption=f"✅ Your signature has been saved!\n📅 Timestamp: {timestamp}"
            )
            
            # Optionally, you can save the signature to a database here
            # save_signature_to_database(user_id, image_bytes, timestamp)
            
        else:
            await update.effective_message.reply_text("❌ Unknown data type received")
            
    except json.JSONDecodeError:
        await update.effective_message.reply_text("❌ Invalid data format received")
    except Exception as e:
        print(f"Error handling web app data: {e}")
        await update.effective_message.reply_text("❌ Error processing your signature")

def main():
    """Start the bot"""
    # Create the Application
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Register handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))
    
    # Run the bot
    application.run_polling()

if __name__ == '__main__':
    main()