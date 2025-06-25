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

## Changelog

Changelog:
- June 25, 2025. Initial setup