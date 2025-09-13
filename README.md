OralVis – Oral Health Analysis Platform

OralVis is a full-stack web application that allows patients to upload oral health images, receive AI-assisted annotation reports, and enables admins/doctors to review, annotate, and generate structured PDF health reports.

This project is built with:

Frontend: React + Redux Toolkit + TailwindCSS

Backend: Node.js + Express + MongoDB

Authentication: JWT with HttpOnly cookies

File Uploads: Multer + Sharp

Deployment: Render (Backend) + Netlify (Frontend)

atient Portal

Sign up and log in securely.

Auto-generated Patient ID during registration.

Upload oral health images with notes.

View submission status (uploaded → annotated → report generated).

Download personalized PDF health reports.

Admin/Doctor Dashboard

View all patient submissions in a structured table.

Review uploaded images and annotate them.

Update submission status (uploaded → annotated → completed).

Generate professional PDF reports for patients.

Authentication

Secure login using JWT tokens stored in HttpOnly cookies.

Role-based redirection:

Admin → /admin

Patient → /patient

OralVis/
│
├── oralvis-frontend/        # React app
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Patient & Admin pages
│   │   ├── redux/           # Redux Toolkit store & slices
│   │   ├── App.js           # Routes
│   │   └── index.js         # React entry point
│   └── .env                 # Frontend environment variables
│
├── oralvis-backend/         # Express app
│   ├── models/              # Mongoose models
│   ├── routes/              # API routes (auth, submissions, admin)
│   ├── middleware/          # Auth middlewares
│   ├── uploads/             # Uploaded images
│   ├── server.js            # Main entry point
│   └── .env                 # Backend environment variables
│
└── README.md

Tech Stack

Frontend: React, Redux Toolkit, TailwindCSS, Axios

Backend: Node.js, Express.js, MongoDB (Mongoose)

Authentication: JWT + HttpOnly Cookies

File Handling: Multer, Sharp (image processing)

Reporting: PDF generation (ReportLab / pdfkit / similar)

Deployment: Render (Backend), Netlify/Vercel (Frontend)

Frontend (.env)
REACT_APP_BASE_URL=https://oralvis-backend-wcv0.onrender.com/api


# Navigate to backend
cd oralvis-backend

# Install dependencies
npm install

# Start server
npm run dev  http://localhost:8080

# Navigate to frontend
cd oralvis-frontend

# Install dependencies
npm install

# Start React app
npm start




API Endpoints
Auth Routes

POST /api/signup → Register new patient (auto-generate patientId).

POST /api/login → Login (returns JWT in HttpOnly cookie).

Patient Routes

POST /api/submissions → Upload images + notes.

GET /api/submissions → Fetch user’s own submissions.

Admin Routes

GET /api/admin/submission → Fetch all patient submissions.

POST /api/admin/submissions/report/:id → Generate PDF report.


Submission Lifecycle

Uploaded → Patient submits images.

Annotated → Doctor/admin reviews and annotates.

Report Generated → PDF is created for the patient.


