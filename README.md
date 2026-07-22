# 🎬 MovieTix

**MovieTix** is a **full-stack movie ticket booking platform** that allows users to browse movies, pick showtimes, select seats, and pay online. It simulates real-world cinema booking operations with an admin panel for managing shows and bookings.

[🚀 Live Demo](https://movietix-rho.vercel.app/) | [📂 GitHub Repo](https://github.com/VKGarg7/MovieTix)

---

## ✨ Key Features

* **Authentication with Clerk:**
  Secure sign-up/sign-in, session management, and user sync to MongoDB via Inngest webhooks.

* **Seat Booking System:**
  Interactive seat map with occupied-seat tracking; unpaid bookings are automatically released after 10 minutes by a scheduled Inngest job.

* **Stripe Payments:**
  Checkout Sessions with webhook-driven payment confirmation.

* **Email Notifications:**
  Booking confirmations, new-show announcements, and pre-show reminder emails (Nodemailer + Inngest cron).

* **Admin Panel:**
  Role-protected dashboard (revenue, bookings, active shows), add shows from live TMDB data, list shows and bookings.

* **Movie Data from TMDB:**
  Now-playing movies, posters, cast, trailers, and metadata.

---

## 🛠️ Tech Stack

| Frontend        | Backend      | Services                 |
| --------------- | ------------ | ------------------------ |
| React 19 + Vite | Node.js      | MongoDB Atlas (Mongoose) |
| Tailwind CSS 4  | Express 5    | Clerk (auth)             |
| React Router 7  | Inngest      | Stripe (payments)        |
| Context API     | Nodemailer   | TMDB API (movie data)    |

---

## ⚙️ How to Run Locally

1. **Clone the Repository**

```bash
git clone https://github.com/VKGarg7/MovieTix.git
cd MovieTix
```

2. **Setup Backend**

```bash
cd server
npm install
npm run server
```

3. **Setup Frontend**

```bash
cd client
npm install
npm run dev
```

---

## 🔐 Environment Variables

Copy `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env`, then fill in the values below. Both example files list every variable the code actually reads, with a one-line comment explaining each.

### Backend (`server/.env`)

```env
MONGODB_URI=your_mongodb_connection_string
PORT=3000
CORS_ORIGIN=http://localhost:5173

CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

TMDB_API_KEY=your_tmdb_v4_read_access_token

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_signing_secret

GMAIL_USER=your_gmail_address
GMAIL_PASS=your_gmail_app_password

# Optional — see server/.env.example for defaults
LOG_LEVEL=info
RATE_LIMIT_PUBLIC_WINDOW_MIN=1
RATE_LIMIT_PUBLIC_MAX=60
RATE_LIMIT_SEATS_WINDOW_MIN=1
RATE_LIMIT_SEATS_MAX=30
RATE_LIMIT_ALLOWLIST=
```

### Frontend (`client/.env`)

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_BASE_URL=http://localhost:3000
VITE_CURRENCY=$
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/original
```

---

## 🚀 Deployment

* **Frontend:** Vercel
* **Backend:** Vercel (serverless, `server/vercel.json`)
* **Background jobs:** Inngest Cloud

---

## 🤝 Contributing

Contributions are welcome! Feel free to fork this repo and submit a pull request.

---

## 📬 Contact

**Vansh Garg**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/VKGarg7)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/vansh-garg-bb5060202/)
[![Gmail](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:14garg04@gmail.com)

---

## ⭐ Show Your Support

If you like this project, consider giving it a ⭐ on GitHub!
