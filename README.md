# Real Estate App - Full Stack Property Platform

#### Video Demo:  <https://youtu.be/gNsgq2qVjwY>

#### Description:
The DomuState Real Estate App is a full-stack web application for managing real estate properties. It serves buyers, sellers, and contractors, providing tools for listing, searching, viewing, and managing properties. The stack includes Node.js and Express for the backend, Prisma ORM (MongoDB), and a frontend based on static HTML/CSS/JavaScript. The first prototype and the authentication ideology was made having the RealEstate App of LAMA DEV (on youtube:https://www.youtube.com/watch?v=eJ3YysWaP_A&t=1587s) as inspiration, it motivated me to build my own version and embrace this project with all my heart.

Key features: secure authentication and authorization, property listing creation with multi-image uploads and location mapping (Leaflet.js), user profile management, and a dedicated system for property images. The project separates backend API and frontend client for easier development and debugging.

This document describes the architecture, file structure, and main components.

## 1. Technology Stack

*   **Backend:** Node.js, Express.js
*   **Database ORM:** Prisma (with MongoDB)
*   **Frontend (Static):** HTML5, CSS3, JavaScript
*   **Styling:** TailwindCSS and Custom CSS
*   **Mapping:** Leaflet.js
*   **API Testing:** Postman

---

## 2. Project Structure Overview

*   `/` (Root): Global configuration (`package.json`), documentation (`README.md`, `diretorio.txt`, `estrutura.txt`), and main application folders (`api/`, `client/`).
*   `api/`: Contains the backend Node.js/Express application, including business logic, API routes, database interaction (Prisma), and image handling.
*   `client/`: Contains the frontend code, primarily static HTML pages in `client/public/` and client-side JavaScript.

---

## 3. Root Directory Files

*   **`package.json`:** Root package file, for managing workspace-level scripts or dependencies (if any).
*   **`README.md`:** This file. Project documentation.
*   **`diretorio.txt`:** Snapshot of the project directory structure.

---

## 4. Backend (`api/`) Details

### Core API Files

*   **`api/app.js`:** The main entry point for the Express.js application. It initializes the Express app, sets up middleware (including authentication), mounts all API routes, configures error handling, and starts the server.
*   **`api/package.json`:** Manages backend dependencies (like Express, Prisma, JWT, Multer) and defines scripts for running, developing, and managing the backend application (`npm run dev`).

### Controllers (`api/controllers/`)

*   **`auth.controllers.js`:** Handles user authentication logic, including registration (`register`), login (`login`), and logout with token refresh. Generates JWTs upon successful login.
*   **`post.controllers.js`:** Manages property listing operations (CRUD - Create, Read, Update, Delete). Handles data validation, interaction with the Prisma model for posts, user associations, and coordinates with image management.
*   **`user.controllers.js`:** Handles user-specific operations, such as fetching a user's profile information, updating user details, and retrieving all listings created by a specific user.

### Library (`api/lib/`)

*   **`prisma.js`:** Initializes and exports the Prisma Client instance. This client is used throughout the backend to interact with the database (MongoDB) in a type-safe manner.

### Middleware (`api/middlewares/`)

*   **`authMiddleware.js`:** Express middleware used to protect routes that require user authentication. It verifies the JWT token present in the request headers and, if valid, attaches the user's information to the request object for use in subsequent route handlers.

### Database (`api/prisma/`)

*   **`schema.prisma`:** The core file for Prisma. It defines the database connection (MongoDB), data models (e.g., User, Post/Listing, Image), their fields, relationships, and any enums or custom types. This schema is used by Prisma to generate the Prisma Client and to manage database migrations.

### Routes (`api/routes/`)

*   **`auth.route.js`:** Defines API endpoints related to user authentication (e.g., `/api/auth/register`, `/api/auth/login`). It maps these HTTP requests to the corresponding controller functions in `auth.controllers.js`.
*   **`listing-images.route.js`:** Defines API endpoints for managing images associated with property listings. This includes routes for uploading new images, deleting existing images, and reordering images for a listing. Uses `multer` for handling file uploads.
*   **`post.route.js`:** Defines API endpoints for property listings (e.g., creating new listings, fetching all listings, fetching a single listing by ID, updating a listing, deleting a listing). Maps requests to `post.controllers.js`.
*   **`user.route.js`:** Defines API endpoints for user-related actions, such as getting user profile details or fetching listings by a user. Maps requests to `user.controllers.js`.

### Uploads (`api/uploads/listings/`)

*   This directory is the storage location for images uploaded for property listings. Images are named using a convention that links them to specific listings and users (e.g., `img.<userId>.<listingId>.<sequence>.<extension>`). The backend serves these images or provides URLs to them.

### Utilities (`api/utils/`)

*   **`manage-listing-images.js`:** A command-line utility script for various image management tasks. This inclui finding orphaned images, correcting image sequence numbers, generating reports on image storage, or batch processing images (e.g., resizing).
*   **`update-image-urls.js`:** A utility script designed to update image URLs stored in the database. This is necessary if the image storage path changes, the domain name is updated, or if there's a migration to a new image serving strategy.

---

## 5. Frontend (`client/`) Details

### Core Client Files

*   **`client/package.json`:** Manages frontend-specific dependencies (if any, e.g., linters, bundlers, or small utility libraries not included directly in `<script>` tags) and scripts for frontend development tasks.
*   **`client/script.js`:** Main client-side JavaScript file, included in `index.html`. It handles global functionalities such as fetching and displaying property listings on the main page, user authentication status, navigation, and dynamic content updates.

### Static Pages & Assets (`client/public/`)

This directory contains all static assets served directly to the browser.

*   **HTML Files:**
    *   **`index.html`:** The main landing page of the application. Displays property listings, search/filter options, and navigation.
    *   **`login.html`:** Page with a form for users to log in.
    *   **`register.html`:** Page with a form for new users to register.
    *   **`new_listing.html`:** Page with a form for authenticated users to create new property listings. Includes fields for property details, image uploads, and location selection (using Leaflet.js).
    *   **`edit_listing.html`:** Page for authenticated users to edit their existing property listings. Pre-fills form data from the selected listing.
    *   **`property.html`:** Page to display detailed information about a single property, including all its images, description, features, and map location.
    *   **`favorites.html`:** Page to display listings a user has marked as favorite.
    *   **`user-profile.html`:** Page for users to view and manage their profile information and see a list of their own property listings.

*   **JavaScript (`client/public/js/`)**
    *   **`listing-image-upload.js`:** Client-side JavaScript for handling image uploads on the `new_listing.html` and `edit_listing.html` pages. It interacts with the backend's image upload API endpoints.
    *   **`script.js`:** Main script for dynamic interactions, API calls for fetching data, and DOM manipulation for the respective HTML pages it's included in.

### Client Source (`client/src/`)
*   **`utils/`**: This directory is for client-side JavaScript utility functions.
    *   `imageUpload.js` (Removed from this README as per previous discussions about its usage). If other utilities are added, they should reside here.

---

## 6. Root `uploads/` Folder

*   There is an `uploads/` folder in the project root. This is unused or a remnant of a previous structure, as the primary image storage is `api/uploads/listings/`

---

## 7. Key Features and Design Decisions

### Modular Architecture
The project is divided into a backend (`api/`) and a frontend (`client/`). Each part is modularized (e.g., controllers, routes, services in the backend; separate HTML/JS files for different pages/features in the frontend) to promote maintainability and scalability.

### Authentication and Authorization
User authentication is handled using JSON Web Tokens (JWT).
*   **Registration/Login:** `auth.controllers.js` and `auth.route.js` manage user sign-up and sign-in.
*   **Token Storage:** JWTs are stored in `localStorage` on the client-side after login.
*   **Protected Routes:** `authMiddleware.js` on the backend verifies the JWT for requests to protected API endpoints, ensuring only authenticated users can access certain resources or perform specific actions.

### Property Image Management System
A system for handling property images:
*   **Client-Side Upload:** `client/public/js/listing-image-upload.js` provides the UI and logic for users to select and upload images when creating or editing listings.
*   **Backend Handling:** The `listing-images.route.js` (using `multer`) on the backend receives and processes these image uploads.
*   **Storage:** Images are stored in the `api/uploads/listings/` directory with a consistent naming convention (e.g., `img.<userId>.<listingId>.<sequence>.<extension>`).
*   **Database Linking:** Image URLs or paths are stored in the database and associated with their respective property listings.
*   **Management Utilities:** Scripts like `api/utils/manage-listing-images.js` and `api/utils/update-image-urls.js` provide administrative capabilities for maintaining the image dataset.

### Database Schema with Prisma
*   **Schema Definition:** `api/prisma/schema.prisma` defines all data models (User, Post/Listing, etc.), their fields, types, and relationships.
*   **Migrations:** Prisma Migrate is used to evolve the database schema over time and keep it synchronized with the `schema.prisma` definition.
*   **Type-Safe Client:** Prisma Client, generated from the schema, provides a type-safe API for database queries from the backend Node.js application.

### Frontend Approach
*   **Static HTML Pages:** The frontend consists of static HTML files located in `client/public/`.
*   **Vanilla JavaScript:** Client-side interactivity, API communication, and DOM manipulation are handled using vanilla JavaScript, organized into specific files (e.g., `client/public/js/script.js`, `client/public/js/listing-image-upload.js`).

### Interactive Maps with Leaflet.js
Leaflet.js is integrated into the frontend to provide interactive map functionalities:
*   **Location Picking:** Used in `new_listing.html` and `edit_listing.html` for users to select or confirm the property's location on a map.
*   **Location Display:** Used in `property.html` to show the property's location to viewers.
*   **Address Search:** May include geocoding features to find locations by address.

### Image Storage Approach
For this test version, I chose to store images locally on the server (in the `api/uploads/listings/` directory) and save only the image URLs in the database. This approach simplifies local development and testing. In the future, I plan to migrate image storage to a modern cloud storage solution (such as AWS S3, Google Cloud Storage, or Azure Blob Storage) for better scalability, security, and availability.

---

## 8. Setup and Installation

1.  **Prerequisites:**
    *   Node.js (which includes npm)
    *   Git
    *   A MongoDB instance (local or cloud-hosted)

2.  **Clone Repository:**
    ```bash
    git clone <repository-url>
    cd real-estate-app-v0.022 # Or your project's root folder name
    ```

3.  **Backend Setup (`api/`):**
    *   Navigate to the API directory: `cd api`
    *   Install dependencies: `npm install`
    *   Create a `.env` file by copying `.env.example` (if it exists) or by creating a new one. Configure at least:
        *   `DATABASE_URL="mongodb+srv://<user>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority"` (Your MongoDB connection string)
        *   `JWT_SECRET="your_strong_jwt_secret"`
    *   Apply database migrations: `npx prisma migrate dev`
    *   (Optional) Seed database: `npx prisma db seed` (if a seed script is configured in `package.json` and `prisma/seed.js` exists)
    *   Start the backend server: `npm run dev` (for development with Nodemon) or `npm start` (for production).

4.  **Frontend Setup (`client/`):**
    *   The frontend consists of static HTML, CSS, and JS files.
    *   If there are any client-side build steps or dependencies managed via `client/package.json` (e.g., for TailwindCSS compilation or JS bundling):
        *   Navigate to the client directory: `cd client` (from the root, or `cd ../client` if you are in `api/`)
        *   Install dependencies: `npm install`
        *   Run any build script: `npm run build` (if applicable)
    *   To view the frontend, open the `client/public/index.html` file directly in your web browser, or serve the `client/public/` directory using a simple HTTP server (e.g., `npx serve client/public` or using the Live Server extension in VS Code).

---

## 9. API Endpoints Overview

(Refer to `api/routes/` for detailed definitions)

*   **Auth:**
    *   `POST /api/auth/register`
    *   `POST /api/auth/login`
*   **Users:**
    *   `GET /api/users/profile` (Requires Auth)
    *   `PUT /api/users/profile` (Requires Auth)
    *   `GET /api/users/:userId/listings`
*   **Listings (Posts):**
    *   `POST /api/posts` (Requires Auth)
    *   `GET /api/posts`
    *   `GET /api/posts/:id`
    *   `PUT /api/posts/:id` (Requires Auth, Ownership Check)
    *   `DELETE /api/posts/:id` (Requires Auth, Ownership Check)
*   **Listing Images:**
    *   `POST /api/listing-images/upload/:listingId` (Requires Auth)
    *   `DELETE /api/listing-images/:imageId` (Requires Auth)

---

## 10. Future Enhancements

*   User roles and permissions (e.g., differentiating between regular users, agents, contractors, admins).
*   Real-time notifications (e.g., for new listings matching saved searches, messages).
*   Admin dashboard for site management, user management, and content moderation.
*   "Renovation Options" feature for contractors.
*   Internationalization (i18n) and localization (l10n) for multi-language support.
*   Improved UI/UX and responsive design.

---

## 11. Conclusion

The DomuState Real Estate App provides a solid foundation for a property management platform with its modular architecture, robust backend API, and essential frontend features. The use of Prisma for database interaction and Leaflet.js for mapping enhances its capabilities. This README serves as a guide to its structure, setup, and core functionalities, aiming to support ongoing development and maintenance. This Was the Final Project and this is CS50!

---


