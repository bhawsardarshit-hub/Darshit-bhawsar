
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Announcement = require('./models/Announcement');
const Training = require('./models/Training');
require('dotenv').config();

const Employee = require('./models/Employee');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');

const app = express();

app.use(cors());
app.use(express.json());

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  });
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
}

app.get('/', (req, res) => {
  res.send('StaffSync API is running');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// REGISTER EMPLOYEE
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email and password are required'
      });
    }

    const existingUser = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'Employee'
    });

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email?.trim().toLowerCase()
    });

    if (!user || !(await bcrypt.compare(password || '', user.password))) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Login failed' });
  }
});

// GET EMPLOYEES
app.get('/api/employees', authenticateToken, async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    console.error('Fetch employees error:', error.message);
    res.status(500).json({ message: 'Failed to load employees' });
  }
});

// ADD EMPLOYEE
app.post(
  '/api/employees',
  authenticateToken,
  allowRoles('HR', 'Manager'),
  async (req, res) => {
    try {
      const employee = await Employee.create(req.body);
      res.status(201).json(employee);
    } catch (error) {
      console.error('Add employee error:', error.message);
      res.status(400).json({ message: 'Failed to add employee' });
    }
  }
);

// DELETE EMPLOYEE
app.delete(
  '/api/employees/:id',
  authenticateToken,
  allowRoles('HR', 'Manager'),
  async (req, res) => {
    try {
      const employee = await Employee.findByIdAndDelete(req.params.id);

      if (!employee) {
        return res.status(404).json({
          message: 'Employee not found'
        });
      }

      res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
      console.error('Delete employee error:', error.message);
      res.status(400).json({ message: 'Failed to delete employee' });
    }
  }
);

// GET ATTENDANCE
app.get('/api/attendance', authenticateToken, async (req, res) => {
  try {
    const records = await Attendance.find().sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    console.error('Fetch attendance error:', error.message);
    res.status(500).json({ message: 'Failed to load attendance' });
  }
});

// RECORD ATTENDANCE
app.post(
  '/api/attendance',
  authenticateToken,
  allowRoles('HR', 'Manager'),
  async (req, res) => {
    try {
      const record = await Attendance.create(req.body);
      res.status(201).json(record);
    } catch (error) {
      console.error('Record attendance error:', error.message);
      res.status(400).json({ message: 'Failed to record attendance' });
    }
  }
);

// GET LEAVE REQUESTS
app.get('/api/leaves', authenticateToken, async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    console.error('Fetch leaves error:', error.message);
    res.status(500).json({ message: 'Failed to load leave requests' });
  }
});

// APPLY FOR LEAVE
app.post('/api/leaves', authenticateToken, async (req, res) => {
  try {
    const { name, type, dates, reason } = req.body;

    if (!name || !type || !dates || !reason) {
      return res.status(400).json({
        message: 'Name, type, dates and reason are required'
      });
    }

    const leave = await Leave.create({
      name,
      type,
      dates,
      reason,
      status: 'Pending'
    });

    res.status(201).json({
      message: 'Leave application submitted successfully',
      leave
    });
  } catch (error) {
    console.error('Apply leave error:', error.message);
    res.status(400).json({ message: 'Failed to submit leave application' });
  }
});

// APPROVE OR REJECT LEAVE — HR / MANAGER ONLY
app.patch(
  '/api/leaves/:id',
  authenticateToken,
  allowRoles('HR', 'Manager'),
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({
          message: 'Status must be Approved or Rejected'
        });
      }

      const leave = await Leave.findByIdAndUpdate(
        req.params.id,
        { $set: { status } },
        { new: true, runValidators: true }
      );

      if (!leave) {
        return res.status(404).json({
          message: 'Leave application not found'
        });
      }

      res.json({
        message: `Leave ${status.toLowerCase()} successfully`,
        leave
      });
    } catch (error) {
      console.error('Update leave error:', error.message);
      res.status(500).json({
        message: 'Failed to update leave status'
      });
    }
  }
);

// START SERVER
async function startServer() {
  try {
    if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
      throw new Error('MONGODB_URI and JWT_SECRET must be set in .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    const PORT = process.env.PORT || 5000;
// ANNOUNCEMENTS API

app.get('/api/announcements', authenticateToken, async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
});

app.post(
  '/api/announcements',
  authenticateToken,
  allowRoles('HR', 'Manager'),
  async (req, res) => {
    try {
      const { title, message, category } = req.body;

      if (!title?.trim() || !message?.trim()) {
        return res.status(400).json({
          message: 'Title and message are required'
        });
      }

      const user = await User.findById(req.user.userId).select('name');

      if (!user) {
        return res.status(401).json({
          message: 'User account not found'
        });
      }

      const announcement = await Announcement.create({
        title: title.trim(),
        message: message.trim(),
        category: category || 'General',
        author: user.name
      });

      res.status(201).json(announcement);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to publish announcement' });
    }
  }
);

 // TRAINING API

app.get('/api/trainings', authenticateToken, async (req, res) => {
  try {
    const trainings = await Training.find().sort({ date: 1 });
    res.json(trainings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load trainings' });
  }
});

app.post(
  '/api/trainings',
  authenticateToken,
  allowRoles('HR', 'Manager'),
  async (req, res) => {
    try {
      const { title, description, trainer, date, duration, category } = req.body;

      if (!title?.trim() || !description?.trim() ||
          !trainer?.trim() || !date || !duration?.trim()) {
        return res.status(400).json({
          message: 'Please fill in all required fields'
        });
      }

      const training = await Training.create({
        title: title.trim(),
        description: description.trim(),
        trainer: trainer.trim(),
        date,
        duration: duration.trim(),
        category: category || 'General'
      });

      res.status(201).json(training);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to create training' });
    }
  }
);

    app.listen(PORT, () => {
      console.log(`StaffSync server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error.message);
    process.exit(1);
  }
}

startServer();
