# 🎓 ECourse — Learning Management System (LMS)

**ECourse** is a modern, full-stack Learning Management System (LMS) built with **Next.js 16** and a scalable, production-ready architecture.  
It provides secure authentication, course management, payments, subscriptions, coupon handling, and optimized media delivery — all designed for real-world educational platforms.

🌐 **Live Website**: https://e-course-mo2i.vercel.app/  
📦 **Repository**: https://github.com/MohanadX/ECourse

---

## ✨ Features

- 🔐 **Authentication & User Management** with Clerk
- 💳 **Payments & Subscriptions** powered by Stripe
- 🎟 **Coupon & Protection System** integrated a PPP system using Arcjet
- 🗄 **Type-safe Database Access** with Drizzle ORM
- 🐘 **PostgreSQL** relational database
- 🖼 **Cloud Image Processing** via ImageKit
- 🎨 **Modern UI** using shadcn/ui & Tailwind CSS
- 🧩 **Drag & Drop (DnD)** interactions for course management
- ⚡ **Server Components & App Router** (Next.js 16)
- 🚀 **Deployed on Vercel**

---

## 🧱 Tech Stack

### Frontend

- **Next.js 16 (App Router)**  
  https://nextjs.org/docs
- **React 19**
- **Tailwind CSS**  
  https://tailwindcss.com/docs
- **shadcn/ui**  
  https://ui.shadcn.com/
- **Drag & Drop (DnD)**  
  https://dndkit.com/

---

### Backend & Infrastructure

- **Drizzle ORM** (Type-safe SQL)  
  https://orm.drizzle.team/
- **PostgreSQL**  
  https://www.postgresql.org/docs/
- **Stripe Payments**  
  https://stripe.com/docs
- **Arcjet (Coupons & Protection)**  
  https://arcjet.com/docs
- **Clerk Authentication**  
  https://clerk.com/docs
- **ImageKit (Media CDN & Processing)**  
  https://docs.imagekit.io/
- **Vercel Deployment**  
  https://vercel.com/docs

---

## 🧠 Architecture Overview

```
Next.js (App Router)
│
├── Clerk (Auth)
├── Stripe (Payments)
├── Arcjet (Coupons / Protection)
├── Drizzle ORM
│ └── PostgreSQL
├── ImageKit (Images / Media)
└── shadcn/ui + Tailwind (UI)
```

- **Server Actions & Server Components** are used for secure data access
- **Drizzle ORM** ensures type safety between database and application
- **Stripe webhooks** handle subscriptions and payment lifecycle events
- **ImageKit** optimizes images for performance and delivery

## Coming Features

- **Pagination**: some pages need some pagination like home (e.g home page) I plan to use React Query to deal with that.
- **User Profiles**: for now user profiles ain't needed but they are coming to the site.
- **Any Other Ideas you support**: ??

---

## Developer

**Mohanad Ayoub** [GitHub profile](https://github.com/zlmohanadlz) - [Linkedin Profile](https://www.linkedin.com/in/mohanad-ayoub-55bb29382)
