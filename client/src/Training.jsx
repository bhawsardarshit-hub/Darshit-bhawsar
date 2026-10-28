
import { useCallback, useEffect, useState } from 'react';
import api from './api';
import './Training.css';

function Training({ currentUser }) {
  const [trainings, setTrainings] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trainer, setTrainer] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('General');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const canManage = ['HR', 'Manager'].includes(currentUser?.role);

  const fetchTrainings = useCallback(async () => {
    try {
      setError('');
      const response = await api.get('/trainings');
      setTrainings(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load trainings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/trainings', {
        title,
        description,
        trainer,
        date,
        duration,
        category
      });

      setTitle('');
      setDescription('');
      setTrainer('');
      setDate('');
      setDuration('');
      setCategory('General');
      setSuccess('Training created successfully!');
      await fetchTrainings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create training.');
    }
  };

  return (
    <div className="training-page">
      <div className="training-header">
        <div>
          <h2>Training & Development</h2>
          <p>Explore learning opportunities and develop new skills.</p>
        </div>
        <span className="training-count">{trainings.length} Trainings</span>
      </div>

      {canManage && (
        <form className="training-form" onSubmit={handleSubmit}>
          <h3>Create Training</h3>

          <label>Training Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Enter training title" required />

          <label>Description</label>
          <textarea value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the training" rows={3} required />

          <label>Trainer</label>
          <input value={trainer} onChange={e => setTrainer(e.target.value)}
            placeholder="Trainer name" required />

          <label>Date</label>
          <input type="date" value={date}
            onChange={e => setDate(e.target.value)} required />

          <label>Duration</label>
          <input value={duration}
            onChange={e => setDuration(e.target.value)}
            placeholder="e.g. 2 hours or 3 days" required />

          <label>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option>General</option>
            <option>Technical</option>
            <option>Soft Skills</option>
            <option>Leadership</option>
            <option>Compliance</option>
          </select>

          <button type="submit">Create Training</button>
        </form>
      )}

      {error && <p className="training-error">{error}</p>}
      {success && <p className="training-success">{success}</p>}

      <div className="training-list">
        <h3>Available Trainings</h3>

        {loading ? (
          <p>Loading trainings...</p>
        ) : trainings.length === 0 ? (
          <p>No trainings available yet.</p>
        ) : (
          <div className="training-grid">
            {trainings.map(item => (
              <article className="training-card" key={item._id}>
                <span className="training-category">{item.category}</span>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <div className="training-details">
                  <span>👨‍🏫 {item.trainer}</span>
                  <span>📅 {new Date(item.date).toLocaleDateString()}</span>
                  <span>⏱️ {item.duration}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Training;
