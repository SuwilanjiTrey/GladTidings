import { useState, useEffect } from 'react';

const SystemAward = () => {
  const [completedUsers, setCompletedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get course ID from storage - for testing, let's hardcode it
  const courseId = 15; // or whatever test ID you want to use

  // Simplified certificate generation for a single user
  const generateSimpleCertificate = async (userId) => {
    try {
      console.log('Sending certificate generation request for user:', userId);
      
      const response = await fetch('http://localhost:5000/api/certificates/generate-simple/' + userId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate certificate');
      }

      const data = await response.json();
      console.log('Certificate generation response:', data);
      return data;

    } catch (error) {
      console.error('Error generating certificate:', error);
      throw error;
    }
  };

  // Fetch completed users
  useEffect(() => {
    const fetchCompletedUsers = async () => {
      try {
        console.log('Fetching completed users for course:', courseId);
        const response = await fetch(
          `http://localhost:5000/api/certificates/${courseId}/completed-users`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        console.log('Received users:', data);
        setCompletedUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to fetch completed users');
      }
    };

    if (courseId) {
      fetchCompletedUsers();
    }
  }, [courseId]);

  const handleGenerateCertificate = async (userId) => {
    setLoading(true);
    try {
      await generateSimpleCertificate(userId);
      alert('Certificate generated successfully!');
    } catch (error) {
      setError('Failed to generate certificate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Certificate Generation Debug</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {completedUsers.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Completed Users</h2>
          <ul className="space-y-2">
            {completedUsers.map(user => (
              <li key={user.user_id} className="flex items-center gap-4">
                <span>{user.FName} {user.LName}</span>
                <button 
                  onClick={() => handleGenerateCertificate(user.user_id)}
                  disabled={loading}
                  className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
                >
                  Generate Certificate
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SystemAward;