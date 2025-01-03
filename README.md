<img src="https://github.com/leo-pfeiffer/mealplanner/blob/main/assets/img/logo.png?raw=true" width="84" height="84">

# Leo and Kristina's Mealplanner
This is a mealplanner built with Nuxt.js, Vue.js, and Tailwind CSS. It allows users to manage recipes, meal plans, and send meal plans via email.

### Setup
Install dependencies:

```bash
npm install
```

### Development Server
Start the development server on http://localhost:3000:

```bash
npm run dev
```

### Production
Build the application for production

```bash
npm run build
```

### Environment Variables
Ensure the following environment variables are set in your .env file:

```
PG_DATABASE=...
PG_USER=...
PG_PASSWORD=...
PG_HOST=....
PG_TEST_ENV_VAR=...
APP_USER=...
APP_PASSWORD=...
APP_URL=...
MAILJET_URL=...
MAILJET_API_KEY=...
MAILJET_SECRET_KEY=...
MAILJET_FROM_EMAIL=...
MAILJET_TO_EMAIL=...
```
