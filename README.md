# Dermalyze

AI-powered skin analysis tool that provides personalized skincare recommendations with direct Amazon product links.

## Features

- **11 Skin Metrics Analysis**: Acne, wrinkles, pores, texture, hydration, oil control, redness, dark circles, firmness, radiance, and dark spots
- **Overall Health Score**: Get a comprehensive skin health rating (0-100)
- **Smart Product Recommendations**: Personalized skincare products based on your top concerns
- **Direct Amazon Links**: One-click shopping for recommended products
- **Privacy-First**: Photos are analyzed in real-time and never stored
- **Modern UI**: Clean, responsive design with smooth animations

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **API**: Perfect Corp Skin Analysis API
- **Deployment Ready**: Optimized production builds

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/DermAINew.git
cd DermAINew
npm install
```

### 2. Get API Key

1. Sign up at [Perfect Corp Developer Portal](https://developer.perfectcorp.com/)
2. Create a new project
3. Copy your API key
4. **Note**: Free tier has limited credits - you may need to purchase more

### 3. Configure Environment

Create a `.env` file in the root directory:

```env
VITE_PERFECTCORP_API_KEY=your_api_key_here
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Photo Requirements

For accurate analysis, photos must meet these criteria:

✅ **Face Position**: Looking directly at camera (not tilted or turned)  
✅ **Lighting**: Well-lit from the front, no harsh shadows  
✅ **People**: Only one person in frame  
✅ **Visibility**: Face clearly visible and prominent  
✅ **Accessories**: Remove glasses/masks if possible  

❌ Common issues: Side angles, poor lighting, multiple faces, face too small

## Production Build

```bash
npm run build
npm run preview  # Test production build locally
```

Built files will be in the `dist` directory, ready for deployment to Vercel, Netlify, or any static hosting.

## Troubleshooting

### "Credit Insufficiency" Error
Your API key has run out of credits. Purchase more credits from Perfect Corp or use a different API key.

### "Large Face Angle" Error
The face in your photo is tilted or turned. Take a new photo looking directly at the camera.

### API Key Not Loading
Make sure your `.env` file is in the root directory and the variable starts with `VITE_`.

### Build Errors
Try deleting `node_modules` and `package-lock.json`, then run `npm install` again.

## Project Structure

```
DermAINew/
├── src/
│   ├── components/       # UI components
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   └── lib/             # Utilities
├── public/              # Static assets
└── .env                 # Environment variables (create this)
```

## Contributing

Feel free to submit issues or pull requests to improve the app!

## License

MIT License - feel free to use this project however you'd like.
