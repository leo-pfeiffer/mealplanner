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
APP_USER=<your_app_user>
APP_PASSWORD=<your_app_password>
APP_URL=<your_app_url>
MAILJET_API_KEY=<your_mailjet_api_key>
MAILJET_SECRET_KEY=<your_mailjet_secret_key>
MAILJET_URL=<your_mailjet_url>
MAILJET_FROM_EMAIL=<your_mailjet_from_email>
MAILJET_TO_EMAIL=<your_mailjet_to_email>
```
