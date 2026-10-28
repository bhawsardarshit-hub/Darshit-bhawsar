
import { useState, useEffect, useCallback } from 'react';
import api from './api';
import './App.css';
import Auth from './Auth';
import Announcements from './Announcements';
import Training from './Training';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('staffsyncUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [page, setPage] = useState('Dashboard');
  const [showForm, setShowForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [attendance, setAttendance] = useState({});
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);

  const canManageLeaves = ['HR', 'Manager'].includes(currentUser?.role);
  const canManageEmployees = ['HR', 'Manager'].includes(currentUser?.role);
  const canManageAttendance = ['HR', 'Manager'].includes(currentUser?.role);

  const [form, setForm] = useState({
    name: '',
    email: '',
    department: 'IT',
    role: ''
  });

  const [leaveForm, setLeaveForm] = useState({
    name: '',
    type: '',
    dates: '',
    reason: ''
  });

  function handleLogout() {
    localStorage.removeItem('staffSyncToken');
    localStorage.removeItem('staffsyncToken');
    localStorage.removeItem('staffsyncUser');
    setCurrentUser(null);
    setPage('Dashboard');
  }

  const loadAttendance = useCallback(async () => {
    try {
      const response = await api.get('/attendance');
      const records = Array.isArray(response.data) ? response.data : [];
      const today = new Date().toLocaleDateString('en-CA');
      const attendanceMap = {};

      records.forEach((record) => {
        const employeeId = record.employee?._id || record.employee;
        const recordDate = record.date
          ? new Date(record.date).toLocaleDateString('en-CA')
          : '';

        if (employeeId && recordDate === today) {
          attendanceMap[String(employeeId)] = record.status;
        }
      });

      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  }, []);

  const loadLeaves = useCallback(async () => {
    try {
      const response = await api.get('/leaves');
      setLeaves(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading leaves:', error);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadAttendance();
      loadLeaves();
      loadEmployees();
    }
  }, [currentUser, loadAttendance, loadLeaves, loadEmployees]);

  const menu = [
    'Dashboard',
    'Employees',
    'Attendance',
    'Leave Management',
    'Announcements',
    'Training',
    'Reports'
  ];

  function navigateTo(item) {
    setPage(item);
    setShowForm(false);
    setShowLeaveForm(false);
  }

  async function addEmployee(event) {
    event.preventDefault();

    if (!canManageEmployees) {
      alert('Only HR and Managers can add employees.');
      return;
    }

    if (
      employees.some(
        (emp) => emp.email?.toLowerCase() === form.email.trim().toLowerCase()
      )
    ) {
      alert('An employee with this email already exists.');
      return;
    }

    try {
      const response = await api.post('/employees', {
        name: form.name.trim(),
        email: form.email.trim(),
        department: form.department,
        role: form.role.trim()
      });

      const newEmployee = response.data.employee || response.data;
      setEmployees((prev) => [...prev, newEmployee]);
      setForm({ name: '', email: '', department: 'IT', role: '' });
      setShowForm(false);
      alert('Employee added successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add employee.');
    }
  }

  async function deleteEmployee(id) {
    if (!canManageEmployees) {
      alert('Only HR and Managers can delete employees.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      await api.delete(`/employees/${id}`);
      setEmployees((prev) =>
        prev.filter((emp) => String(emp._id || emp.id) !== String(id))
      );
      setAttendance((prev) => {
        const updated = { ...prev };
        delete updated[String(id)];
        return updated;
      });
      alert('Employee deleted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete employee.');
    }
  }

  async function handleLeaveSubmit(event) {
    event.preventDefault();

    try {
      const response = await api.post('/leaves', {
        name: leaveForm.name.trim(),
        type: leaveForm.type,
        dates: leaveForm.dates.trim(),
        reason: leaveForm.reason.trim()
      });

      const createdLeave = response.data.leave || response.data;
      setLeaves((prev) => [createdLeave, ...prev]);
      setLeaveForm({ name: '', type: '', dates: '', reason: '' });
      setShowLeaveForm(false);
      alert('Leave application submitted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit leave application.');
    }
  }

  async function updateLeaveStatus(id, status) {
    if (!canManageLeaves) {
      alert('Only HR and Managers can review leave requests.');
      return;
    }

    try {
      const response = await api.patch(`/leaves/${id}`, { status });
      const updatedLeave = response.data.leave || response.data;

      setLeaves((prev) =>
        prev.map((leave) =>
          String(leave._id) === String(id) ? updatedLeave : leave
        )
      );

      alert(`Leave ${status.toLowerCase()} successfully!`);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update leave status.');
    }
  }

  async function markAttendance(employeeId, status) {
    if (!canManageAttendance) {
      alert('Only HR and Managers can mark attendance.');
      return;
    }

    try {
      await api.post('/attendance', {
        employee: employeeId,
        date: new Date().toISOString().slice(0, 10),
        status
      });

      await loadAttendance();
      alert('Attendance saved successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save attendance.');
    }
  }

  const pendingLeaves = leaves.filter(
    (leave) => leave.status === 'Pending'
  ).length;

  const approvedLeaves = leaves.filter(
    (leave) => leave.status === 'Approved'
  ).length;

  const rejectedLeaves = leaves.filter(
    (leave) => leave.status === 'Rejected'
  ).length;

  const departments = new Set(
    employees.map((emp) => emp.department).filter(Boolean)
  ).size;

  const presentCount = employees.filter(
    (emp) => attendance[String(emp._id || emp.id)] === 'Present'
  ).length;

  const absentCount = employees.filter(
    (emp) => attendance[String(emp._id || emp.id)] === 'Absent'
  ).length;

  const notMarkedCount = Math.max(
    0,
    employees.length - presentCount - absentCount
  );

  const displayName = currentUser?.name || 'User';
  const displayRole = currentUser?.role || 'Employee';

  if (!currentUser) {
    return (
      <Auth
        onLogin={(user) => {
          setCurrentUser(user);
          setPage('Dashboard');
        }}
      />
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <h2>Staff<span>Sync</span></h2>
          <p className="workspace-label">WORKSPACE</p>
        </div>

        <nav className="sidebar-nav">
          {menu.map((item) => (
            <button
              key={item}
              type="button"
              className={page === item ? 'active' : ''}
              onClick={() => navigateTo(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="user sidebar-user">
          <div className="avatar">
            {displayName
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="user-details">
            <b>{displayName}</b>
            <small>{displayRole}</small>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-title">
            <span className="breadcrumb">Workspace / {page}</span>
            <span className="topbar-role">{displayRole}</span>
          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>

        <section className="content">
          <div className="page-heading">
            <p className="eyebrow">HUMAN RESOURCE MANAGEMENT</p>
            <h1>
              {page === 'Dashboard' ? 'Welcome to StaffSync 👋' : page}
            </h1>
            <p className="subtitle">
              Manage your workforce efficiently from one place.
            </p>
          </div>

          {page === 'Dashboard' && (
            <>
              <div className="stats">
                <div className="card">
                  <p>Total Employees</p>
                  <h2>{employees.length}</h2>
                  <small>Registered employees</small>
                </div>
                <div className="card">
                  <p>Present Today</p>
                  <h2>{presentCount}</h2>
                  <small>Attendance overview</small>
                </div>
                <div className="card">
                  <p>Pending Leaves</p>
                  <h2>{pendingLeaves}</h2>
                  <small>Require review</small>
                </div>
                <div className="card">
                  <p>Departments</p>
                  <h2>{departments}</h2>
                  <small>Across the organization</small>
                </div>
              </div>

              <div className="section-card">
                <h3>Quick Actions</h3>
                <div className="actions">
                  <button onClick={() => navigateTo('Employees')}>
                    ＋ Manage Employees
                  </button>
                  <button onClick={() => navigateTo('Attendance')}>
                    ◷ View Attendance
                  </button>
                  <button onClick={() => navigateTo('Leave Management')}>
                    ▣ Review Leave Requests
                  </button>
                  <button onClick={() => navigateTo('Announcements')}>
                    ◉ View Announcements
                  </button>
                  <button onClick={() => navigateTo('Training')}>
                    ▣ View Trainings
                  </button>
                  <button onClick={() => navigateTo('Reports')}>
                    ▤ View Reports
                  </button>
                </div>
              </div>

              <div className="section-card">
                <h3>Recent Activity</h3>
                <div className="activity">
                  <div className="activity-item">
                    <span className="dot green-dot" />
                    <div>
                      <b>Attendance overview</b>
                      <p>{presentCount} employees marked present.</p>
                    </div>
                  </div>
                  <div className="activity-item">
                    <span className="dot orange-dot" />
                    <div>
                      <b>Leave requests</b>
                      <p>{pendingLeaves} requests are waiting for review.</p>
                    </div>
                  </div>
                  <div className="activity-item">
                    <span className="dot blue-dot" />
                    <div>
                      <b>Team updates</b>
                      <p>Check the announcements section.</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {page === 'Employees' && (
            <div className="section-card">
              <div className="module-heading">
                <div>
                  <h3>Employee Management</h3>
                  <p>View and manage employee records.</p>
                </div>
                {canManageEmployees && (
                  <button onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '＋ Add Employee'}
                  </button>
                )}
              </div>

              {showForm && canManageEmployees && (
                <form className="employee-form" onSubmit={addEmployee}>
                  <label>
                    Full Name
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    Email Address
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    Department
                    <select
                      value={form.department}
                      onChange={(e) =>
                        setForm({ ...form, department: e.target.value })
                      }
                    >
                      <option>IT</option>
                      <option>HR</option>
                      <option>Finance</option>
                      <option>Marketing</option>
                      <option>Sales</option>
                      <option>Operations</option>
                    </select>
                  </label>
                  <label>
                    Job Role
                    <input
                      type="text"
                      placeholder="Enter job role"
                      value={form.role}
                      onChange={(e) =>
                        setForm({ ...form, role: e.target.value })
                      }
                      required
                    />
                  </label>
                  <button type="submit" className="primary-btn">
                    Save Employee
                  </button>
                </form>
              )}

              <div className="table-wrap">
                <table className="employee-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Job Role</th>
                      {canManageEmployees && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp._id || emp.id}>
                        <td>{emp.name}</td>
                        <td>{emp.email}</td>
                        <td>{emp.department}</td>
                        <td>{emp.role}</td>
                        {canManageEmployees && (
                          <td>
                            <button
                              className="delete-btn"
                              onClick={() => deleteEmployee(emp._id || emp.id)}
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {employees.length === 0 && (
                      <tr>
                        <td colSpan={canManageEmployees ? 5 : 4}>
                          No employees found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="employee-count">
                Total employees: {employees.length}
              </p>
            </div>
          )}

          {page === 'Attendance' && (
            <div className="section-card">
              <h3>Attendance Management</h3>
              <p>View and manage today's attendance records.</p>

              <div className="attendance-summary">
                <span>Present: <b>{presentCount}</b></span>
                <span>Absent: <b>{absentCount}</b></span>
                <span>Not Marked: <b>{notMarkedCount}</b></span>
              </div>

              <div className="table-wrap">
                <table className="employee-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Attendance Status</th>
                      {canManageAttendance && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => {
                      const id = String(emp._id || emp.id);
                      const status = attendance[id] || 'Not Marked';

                      return (
                        <tr key={id}>
                          <td>{emp.name}</td>
                          <td>{emp.department}</td>
                          <td>
                            <span
                              className={`status ${status
                                .toLowerCase()
                                .replace(/\s+/g, '-')}`}
                            >
                              {status}
                            </span>
                          </td>
                          {canManageAttendance && (
                            <td className="attendance-actions">
                              <button
                                className="present-btn"
                                onClick={() => markAttendance(id, 'Present')}
                              >
                                Present
                              </button>
                              <button
                                className="absent-btn"
                                onClick={() => markAttendance(id, 'Absent')}
                              >
                                Absent
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {employees.length === 0 && (
                      <tr>
                        <td colSpan={canManageAttendance ? 4 : 3}>
                          No employees found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {page === 'Leave Management' && (
            <div className="section-card">
              <div className="module-heading">
                <div>
                  <h3>Leave Management</h3>
                  <p>Apply for leave and manage employee requests.</p>
                </div>
                <button onClick={() => setShowLeaveForm(!showLeaveForm)}>
                  {showLeaveForm ? 'Cancel' : '+ Apply for Leave'}
                </button>
              </div>

              <p className="employee-count">
                Pending Requests: {pendingLeaves}
              </p>

              {showLeaveForm && (
                <form className="employee-form" onSubmit={handleLeaveSubmit}>
                  <label>
                    Employee Name
                    <select
                      value={leaveForm.name}
                      onChange={(e) =>
                        setLeaveForm({ ...leaveForm, name: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp._id || emp.id} value={emp.name}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Leave Type
                    <select
                      value={leaveForm.type}
                      onChange={(e) =>
                        setLeaveForm({ ...leaveForm, type: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Leave Type</option>
                      <option>Casual Leave</option>
                      <option>Sick Leave</option>
                      <option>Emergency Leave</option>
                      <option>Earned Leave</option>
                    </select>
                  </label>
                  <label>
                    Leave Dates
                    <input
                      type="text"
                      placeholder="e.g. 28 Oct - 29 Oct 2026"
                      value={leaveForm.dates}
                      onChange={(e) =>
                        setLeaveForm({ ...leaveForm, dates: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    Reason
                    <textarea
                      placeholder="Enter reason for leave"
                      value={leaveForm.reason}
                      onChange={(e) =>
                        setLeaveForm({ ...leaveForm, reason: e.target.value })
                      }
                      required
                    />
                  </label>
                  <button type="submit" className="primary-btn">
                    Submit Leave Application
                  </button>
                </form>
              )}

              <div className="table-wrap">
                <table className="employee-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Leave Type</th>
                      <th>Dates</th>
                      <th>Reason</th>
                      <th>Status</th>
                      {canManageLeaves && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((leave) => (
                      <tr key={leave._id}>
                        <td>{leave.name}</td>
                        <td>{leave.type}</td>
                        <td>{leave.dates}</td>
                        <td>{leave.reason}</td>
                        <td>{leave.status}</td>
                        {canManageLeaves && (
                          <td>
                            {leave.status === 'Pending' ? (
                              <>
                                <button
                                  onClick={() =>
                                    updateLeaveStatus(leave._id, 'Approved')
                                  }
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    updateLeaveStatus(leave._id, 'Rejected')
                                  }
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              'Reviewed'
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    {leaves.length === 0 && (
                      <tr>
                        <td colSpan={canManageLeaves ? 6 : 5}>
                          No leave applications found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {page === 'Announcements' && (
            <Announcements currentUser={currentUser} />
          )}

          {page === 'Training' && (
            <Training currentUser={currentUser} />
          )}

          {page === 'Reports' && (
            <div className="section-card">
              <div className="module-heading">
                <div>
                  <h3>StaffSync Reports</h3>
                  <p>Summary of employee, attendance, and leave data.</p>
                </div>
                <button
                  onClick={() => {
                    loadEmployees();
                    loadAttendance();
                    loadLeaves();
                  }}
                >
                  Refresh Reports
                </button>
              </div>

              <div className="stats">
                <div className="card">
                  <p>Total Employees</p>
                  <h2>{employees.length}</h2>
                </div>
                <div className="card">
                  <p>Present Today</p>
                  <h2>{presentCount}</h2>
                </div>
                <div className="card">
                  <p>Absent Today</p>
                  <h2>{absentCount}</h2>
                </div>
                <div className="card">
                  <p>Not Marked</p>
                  <h2>{notMarkedCount}</h2>
                </div>
              </div>

              <div className="stats">
                <div className="card">
                  <p>Pending Leaves</p>
                  <h2>{pendingLeaves}</h2>
                </div>
                <div className="card">
                  <p>Approved Leaves</p>
                  <h2>{approvedLeaves}</h2>
                </div>
                <div className="card">
                  <p>Rejected Leaves</p>
                  <h2>{rejectedLeaves}</h2>
                </div>
                <div className="card">
                  <p>Departments</p>
                  <h2>{departments}</h2>
                </div>
              </div>

              <h3>Department Report</h3>
              <div className="table-wrap">
                <table className="employee-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Employees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...new Set(
                      employees.map((emp) => emp.department).filter(Boolean)
                    )].map((department) => (
                      <tr key={department}>
                        <td>{department}</td>
                        <td>
                          {employees.filter(
                            (emp) => emp.department === department
                          ).length}
                        </td>
                      </tr>
                    ))}
                    {departments === 0 && (
                      <tr>
                        <td colSpan={2}>No department data available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <h3>Attendance Report</h3>
              <div className="table-wrap">
                <table className="employee-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Today's Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp._id || emp.id}>
                        <td>{emp.name}</td>
                        <td>{emp.department || 'Not assigned'}</td>
                        <td>
                          {attendance[String(emp._id || emp.id)] || 'Not Marked'}
                        </td>
                      </tr>
                    ))}
                    {employees.length === 0 && (
                      <tr>
                        <td colSpan={3}>No employee data available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <h3>Leave Report</h3>
              <div className="table-wrap">
                <table className="employee-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Leave Type</th>
                      <th>Dates</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((leave) => (
                      <tr key={leave._id}>
                        <td>{leave.name}</td>
                        <td>{leave.type}</td>
                        <td>{leave.dates}</td>
                        <td>{leave.status}</td>
                      </tr>
                    ))}
                    {leaves.length === 0 && (
                      <tr>
                        <td colSpan={4}>No leave data available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <footer className="app-footer">
            © 2026 StaffSync · Modern Human Resource Management Solution
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;
