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

1. Create a new bot with [@BotFather](https://t.me/botfather)
2. Use `/newapp` command to create a Mini App
3. Set your Railway deployment URL as the Mini App URL
4. Your Mini App will be ready to use!

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