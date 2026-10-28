import { useCallback, useEffect, useState } from 'react';
import api from './api';
import './Announcements.css';

function Announcements({ currentUser }) {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('General');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const canPublish = ['HR', 'Manager'].includes(currentUser?.role);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setError('');
      const response = await api.get('/announcements');
      setAnnouncements(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handlePublish = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/announcements', { title, message, category });
      setTitle('');
      setMessage('');
      setCategory('General');
      setSuccess('Announcement published successfully!');
      await fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish announcement.');
    }
  };

  return (
    <div className="announcements-page">
      <div className="announcements-header">
        <div>
          <h2>Announcements</h2>
          <p>Stay updated with the latest workplace news.</p>
        </div>
        <span className="announcement-count">
          {announcements.length} Updates
        </span>
      </div>

      {canPublish && (
        <form className="announcement-form" onSubmit={handlePublish}>
          <h3>Publish Announcement</h3>

          <label>Title</label>
          <input
            type="text"
            placeholder="Enter announcement title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            required
          />

          <label>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>General</option>
            <option>Important</option>
            <option>Event</option>
            <option>Policy</option>
          </select>

          <label>Message</label>
          <textarea
            placeholder="Write your announcement..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={5000}
            rows={5}
            required
          />

          <button type="submit">Publish Announcement</button>
        </form>
      )}

      {error && <p className="announcement-error">{error}</p>}
      {success && <p className="announcement-success">{success}</p>}

      <div className="announcement-list">
        <h3>Latest Announcements</h3>

        {loading ? (
          <p>Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <p>No announcements yet.</p>
        ) : (
          announcements.map((item) => (
            <article className="announcement-card" key={item._id}>
              <div className="announcement-card-top">
                <span className={`announcement-category ${item.category.toLowerCase()}`}>
                  {item.category}
                </span>
                <span className="announcement-date">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h4>{item.title}</h4>
              <p className="announcement-message">{item.message}</p>
              <small>Posted by {item.author}</small>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default Announcements;