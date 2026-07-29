# OASIS Skills & Certification Portal 🎓

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Django](https://img.shields.io/badge/Django-5.0-092E20?style=for-the-badge&logo=django)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)

A state-of-the-art, full-stack e-learning and certification platform designed to provide a premium educational experience. The platform features dynamic course delivery, secure Google OAuth authentication, video processing, and real-time verifiable cryptographic certificates.

## 🌟 Key Features

* **Advanced Authentication:** Seamless login with Google OAuth or standard email/password, protected by an OTP-based email verification gate.
* **Premium User Experience:** Stunning UI built with Next.js 15, featuring a sleek dark mode, micro-animations, and dynamic glassmorphism components.
* **Course Enrollment & Delivery:** Comprehensive learning management system with categorizable courses, modular lessons, and integrated video playback.
* **Verifiable Certificates:** Cryptographically generated PDF certificates that can be instantly verified globally using a unique UUID scanner.
* **Intelligent Avatars:** Customizable user profiles with an interactive preset avatar picker and direct photo uploads.
* **Admin Dashboard:** Powerful Django Unfold admin panel with deep analytics and course management capabilities.

## 🏗️ System Architecture

The platform uses a decoupled architecture to ensure massive scalability and lightning-fast frontend delivery.

```mermaid
graph TD
    User([End User]) -->|HTTPS| Frontend
    
    subgraph Frontend [Frontend Tier - Next.js]
        Next[Next.js App Router]
        Tailwind[Tailwind CSS]
        NextAuth[Auth.js / NextAuth]
    end
    
    subgraph Backend [Backend Tier - Django]
        API[Django Ninja API]
        Celery[Celery Workers]
        Redis[Redis Cache / Broker]
    end
    
    subgraph Storage [Data Tier]
        PG[(PostgreSQL)]
        S3[(AWS S3 / Media)]
    end
    
    Frontend <-->|REST API / JWT| API
    API <--> PG
    API <--> Redis
    Celery <--> Redis
    Celery <--> PG
    API <--> S3
```

## 🚀 Getting Started (Local Development)

### Prerequisites
* Node.js (v18+)
* Python (3.11+)
* PostgreSQL

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🌍 Deployment Strategy
This massive project is designed to be deployed using a robust microservices approach:
1. **Frontend:** Deployed globally on [Netlify](https://netlify.com) for edge-caching and fast LCP.
2. **Backend:** Deployed on [Render](https://render.com) for persistent WSGI application scaling.
3. **Database:** Hosted on [Neon.tech](https://neon.tech) for serverless PostgreSQL.

---
*Built with ❤️ for the future of learning.*
