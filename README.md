# Signature Draw App

A simple web application for drawing and saving digital signatures, optimized for Telegram Mini Apps and Railway deployment.

## Features

- ✍️ **Canvas Drawing**: Smooth signature drawing with touch and mouse support
- 🎨 **Customization**: Adjustable pen size and color selection
- 💾 **Save as Image**: Download signatures as PNG files
- 📱 **Mobile Optimized**: Responsive design for mobile devices
- 🤖 **Telegram Integration**: Works as a Telegram Mini App
- ☁️ **Railway Ready**: Configured for easy Railway deployment

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open your browser to `http://localhost:3000`

## Railway Deployment

1. Connect your GitHub repository to Railway
2. Railway will automatically detect the Node.js project
3. Deploy with default settings
4. Your app will be available at your Railway-provided URL

## Telegram Mini App Setup

### Step 1: Create Your Bot
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Use `/newbot` command to create a new bot
3. Get your bot token (save it securely)

### Step 2: Create Mini App
1. Use `/newapp` command with @BotFather
2. Select your bot
3. Provide app details:
   - **App Name**: Signature Draw
   - **Description**: Draw and save digital signatures
   - **Photo**: Upload an icon (optional)
   - **Web App URL**: `https://railway-web-page-production.up.railway.app`

### Step 3: Set Up Bot Handler (Optional)
If you want to receive the signature data in your bot:

1. Use the provided `telegram_bot_example.py` file
2. Replace `YOUR_BOT_TOKEN_HERE` with your actual bot token
3. Install required packages:
   ```bash
   pip install python-telegram-bot pillow
   ```
4. Run the bot:
   ```bash
   python telegram_bot_example.py
   ```

### Step 4: Test Your Mini App
1. Open your bot in Telegram
2. Send `/start` command
3. Click the "✍️ Draw Signature" button
4. Draw your signature and click "Send Signature to Bot"
5. The signature will be sent back to your bot as an image

## Usage

1. Open the app in your browser or Telegram
2. Draw your signature on the canvas using touch or mouse
3. Adjust pen size and color as needed
4. Click "Save as Image" to download your signature
5. Use "Clear" to start over

## Technologies Used

- **Frontend**: HTML5 Canvas, Vanilla JavaScript, CSS3
- **Backend**: Node.js, Express.js
- **Deployment**: Railway Platform
- **Integration**: Telegram Web Apps API

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT License - feel free to use and modify as needed!