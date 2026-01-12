# Dermalyze

AI-powered skin analysis tool that provides personalized skincare recommendations.

## What It Does

Upload a photo and get instant analysis of 11 skin metrics including acne, wrinkles, pores, hydration, and more. The app provides an overall skin health score and recommends specific products available on Amazon.

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Perfect Corp Skin Analysis API

## Setup

1. Clone the repo
```bash
git clone <your-repo-url>
cd DermAINew
```

2. Install dependencies
```bash
npm install
```

3. Get a Perfect Corp API key
   - Sign up at [Perfect Corp Developer Portal](https://developer.perfectcorp.com/)
   - Create a new project and get your API key
   - Note: Free tier may have limited credits

4. Create a `.env` file in the root directory
```env
VITE_PERFECTCORP_API_KEY=your_api_key_here
```

5. Run the dev server
```bash
npm run dev
```

## Photo Requirements

For best results, use photos with:
- Face looking directly at camera (not tilted)
- Good lighting from the front
- Only one person visible
- Face clearly visible and prominent
- No glasses or masks if possible

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Notes

- API calls require credits in your Perfect Corp account
- Photos are processed client-side and sent directly to the API
- No data is stored on any server
