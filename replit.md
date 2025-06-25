# Rock Paper Scissors - Gaming Edition

## Overview

This is a gamified Rock Paper Scissors web application that transforms the classic game into an engaging gaming experience. The application features a wallet system, daily rewards, leaderboards, and social integration capabilities. Built as a single-page application using vanilla HTML, CSS, and JavaScript with persistent local storage for game state management.

## System Architecture

### Frontend Architecture
- **Single-Page Application (SPA)**: Built with vanilla JavaScript using a screen-based navigation system
- **Component Structure**: Modular screen components (Home, Game, Leaderboard, Daily Check-in)
- **State Management**: Class-based architecture with centralized game state management
- **Persistence**: Browser localStorage for game data, user balance, and statistics

### Backend Architecture
- **Static File Server**: Simple Python HTTP server serving static assets
- **No Database**: All data stored client-side using localStorage
- **No API Layer**: Pure frontend application with no server-side logic

## Key Components

### Game Engine (`RockPaperScissorsGame` class)
- **Purpose**: Central game logic and state management
- **Responsibilities**: Game mechanics, score tracking, balance management, screen navigation
- **Data Storage**: Manages persistent data through localStorage wrapper methods

### User Interface Screens
1. **Home Screen**: Main navigation hub with balance display
2. **Game Screen**: Interactive gameplay with choice buttons and results
3. **Leaderboard Screen**: Score tracking and competitive elements
4. **Daily Check-in Screen**: Reward system for user retention

### Styling System
- **Design Language**: Gaming-focused with dark theme and neon accents
- **Typography**: Custom pixel font (PixChicago) with Orbitron fallback
- **Color Scheme**: Dark background with blue primary colors and accent gradients
- **Responsive Design**: Mobile-first approach with max-width container

## Data Flow

### Game Session Flow
1. User selects move from game screen
2. System generates computer choice
3. Game logic determines winner
4. Balance and statistics updated
5. Results displayed with animation
6. Data persisted to localStorage

### Reward System Flow
1. User accesses daily check-in screen
2. System validates last check-in date
3. If eligible, reward claimed and added to balance
4. Check-in date updated in localStorage
5. UI updated to reflect new balance

## External Dependencies

### CDN Resources
- **Font Awesome 6.0.0**: Icon library for UI elements
- **Google Fonts**: Orbitron and Exo 2 font families for gaming aesthetic

### Future Integrations (Planned)
- **Farcaster Social**: Social sharing and connectivity features
- **Wallet Integration**: Potential cryptocurrency wallet connections
- **Backend Services**: Future API integration for multiplayer features

## Deployment Strategy

### Current Setup
- **Development Server**: Python HTTP server on port 5000
- **Static Hosting**: All assets served as static files
- **Environment**: Replit-based development environment with Node.js and Python support

### Production Considerations
- **Static Site Hosting**: Can be deployed to any static hosting service
- **CDN Delivery**: External dependencies loaded from CDNs
- **No Build Process**: Direct file serving without compilation

### Scaling Path
- **Database Migration**: Future transition from localStorage to persistent database
- **API Development**: Backend services for multiplayer and leaderboards
- **Authentication**: User account system for cross-device persistence

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- June 25, 2025: Initial setup with basic Rock Paper Scissors functionality
- June 25, 2025: Enhanced UI with header withdraw button and connect wallet in main menu 
- June 25, 2025: Added interactive game animations (bounce, pulse, shake, glow effects)
- June 25, 2025: Implemented modal system for withdraw and wallet connect
- June 25, 2025: Added professional logo (rps-logo.svg) with floating animation
- June 25, 2025: Added Farcaster mini app support with meta tags and manifest.json
- June 25, 2025: Implemented loading screen with animated logo for professional feel
- June 25, 2025: Built complete Farcaster Frame server with dynamic image generation, POST endpoints, and state management

## Professional Features Added

### Farcaster Mini App Compatibility
- Meta tags for Farcaster Frame support
- Open Graph and Twitter Card meta tags for social sharing
- PWA manifest.json for app-like experience
- Professional loading screen with branding

### Enhanced User Experience
- Custom SVG logo with VS battle theme
- Floating logo animation on home screen
- Modal-based withdraw and wallet connect interfaces
- Sequential game animations for better engagement
- Improved button sizing and precision

### Technical Improvements
- Comprehensive error handling with user-friendly messages
- Loading state management
- Enhanced accessibility with proper meta tags
- Optimized for mobile and web deployment

## Advanced Frame Features

### Dynamic Image Generation
- SVG-based frame images for lightweight, scalable graphics
- Real-time game state visualization
- Custom graphics for different game phases (start, result, balance, stats)
- Proper aspect ratio (1.91:1) for Frame compatibility

### POST Endpoint Handling
- `/api/frame/play` - Handle game moves with proper state updates
- `/api/frame/balance` - Display user balance and statistics
- `/api/frame/reward` - Daily reward claiming system
- `/api/frame/restart` - Reset game state for new rounds
- `/api/frame/stats` - Comprehensive game statistics display

### Frame State Management
- Session-based state storage using Map structure
- Persistent game statistics across frame interactions
- Balance tracking and reward system integration
- Error handling for invalid states or corrupted sessions

### Error Handling
- Comprehensive error catching for all endpoints
- User-friendly error messages in Frame format
- Fallback states for corrupted or missing sessions
- Development vs production error detail levels