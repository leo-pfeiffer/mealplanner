# Leo and Kristina's Mealplanner

<img src="https://github.com/leo-pfeiffer/mealplanner/blob/main/assets/img/logo.png?raw=true" width="84" height="84">

A full-stack meal planning application that helps you organize recipes, create meal plans, and generate smart shopping lists. Built with modern web technologies and designed for personal use.

## What It Does

**Recipe Management**
- Create and organize recipes with ingredients, notes, and tags
- Filter and search recipes by name or tags
- Copy and edit existing recipes
- Tag-based organization system

**Meal Planning**
- Build meal plans by selecting from your recipe collection
- Add custom ingredients to any meal plan
- Save, edit, and copy meal plans
- Track meal plan history

**Smart Shopping Lists**
- Automatically generate shopping lists from meal plans
- AI-powered ingredient categorization by supermarket sections (using Google Gemini)
- Duplicate ingredient consolidation
- Email delivery of organized shopping lists

**Additional Features**
- Secure authentication system
- Responsive design for desktop and mobile
- Email integration via Mailjet
- Clean, notebook-inspired UI design

## Technology Stack

**Frontend**
- **Nuxt.js 3** - Vue.js framework with SSR
- **Vue.js** - Reactive UI framework
- **Tailwind CSS** - Utility-first styling
- **TypeScript** - Type-safe development

**Backend**
- **Express.js** - Server framework
- **Sequelize** - PostgreSQL ORM
- **PostgreSQL** - Primary database

**External Services**
- **Google Gemini API** - AI-powered shopping list categorization
- **Mailjet** - Email delivery service

**Development**
- **Vitest** - Unit testing framework
- **PostCSS** - CSS processing

## Architecture

The application follows a full-stack architecture:

- **Client-side**: Vue.js components with Nuxt.js for SSR and routing
- **API Layer**: RESTful endpoints for recipes, meal plans, and internal services
- **Database**: PostgreSQL with Sequelize models for data persistence
- **Authentication**: Token-based auth with SHA-256 hashing
- **External Integrations**: Gemini for AI categorization, Mailjet for email delivery

## Key Features Deep Dive

### Recipe System
- Hierarchical ingredient management
- Support for recipe notes and multi-tag categorization
- Duplicate prevention and conflict resolution
- Bulk operations for efficiency

### Meal Plan Workflow
1. Select recipes from your collection
2. Add any additional ingredients needed
3. Save the meal plan with a custom name
4. Generate and email the shopping list

### AI Shopping List
The application uses Google Gemini to automatically categorize ingredients by supermarket sections (produce, dairy, meat, etc.), making grocery shopping more efficient.

### Security
- Credential-based authentication
- Token management with HTTP-only cookies
- API route protection middleware
- Environment variable configuration

## Setup

Install dependencies:
```bash
npm install
```

Configure environment variables in `.env`:
```
PG_DATABASE=...
PG_USER=...
PG_PASSWORD=...
PG_HOST=...
APP_USER=...
APP_PASSWORD=...
APP_URL=...
GEMINI_API_KEY=...
MAILJET_API_KEY=...
MAILJET_SECRET_KEY=...
MAILJET_URL=...
MAILJET_FROM_EMAIL=...
MAILJET_TO_EMAIL=...
```

Run development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

## Testing

Run the test suite:
```bash
npm test
```

Tests cover utility functions for ingredient processing and email functionality.
