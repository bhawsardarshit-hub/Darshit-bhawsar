# StaffSync – HR Management System

StaffSync is a web-based Human Resource Management System (HRMS) developed using the MERN stack. It helps organizations manage employees, attendance, leave requests, announcements, and training opportunities through a centralized dashboard.

## Features

- **Dashboard:** Overview of HR activities and quick navigation.
- **Employee Management:** Manage employee information.
- **Attendance Management:** Track employee attendance.
- **Leave Management:** Manage employee leave requests.
- **Announcements:** HR and managers can publish announcements, which employees can view.
- **Training & Development:** Create and view training programs.
- **Role-Based Access:** Different access permissions for HR, managers, and employees.
- **Authentication:** Login and logout functionality.

## Technologies Used

- **Frontend:** React.js, HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **API Communication:** Axios
- **Authentication:** JSON Web Tokens (JWT)

## Project Structure

```text
StaffSync/
├── client/          # React frontend
├── server/          # Express backend
├── package-lock.json
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Install the following:

- Node.js and npm
- Git
- MongoDB Atlas account or a local MongoDB installation

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/bhawsardarshit-hub/Darshit-bhawsar.git
   ```

2. Navigate to the project folder:

   ```bash
   cd Darshit-bhawsar
   ```

3. Install frontend dependencies:

   ```bash
   cd client
   npm install
   ```

4. Install backend dependencies:

   ```bash
   cd ../server
   npm install
   ```

### Environment Configuration

Create a `.env` file inside the `server` directory and configure the required environment variables:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret
PORT=5000
```

Use your actual environment variable names if they differ in your project. Never upload your `.env` file or real credentials to GitHub.

### Run the Application

Start the backend in one terminal:

```bash
cd server
node server.js
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

Open the local URL displayed by Vite in your terminal, usually `http://localhost:5173`.

## Future Improvements

- Employee profile enhancements
- Training enrollment and progress tracking
- Advanced reporting and analytics
- Improved dashboard visualizations

## Author

**Darshit Bhawsar**

## License

This project was developed for educational purposes.
