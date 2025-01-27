import React from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { authMode, setAuthMode, clearToken } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 shadow-md rounded">
        <h2 className="text-2xl font-bold text-center mb-6">Profile</h2>
        <p className="text-center mb-4">Current Session Mode: <strong>{authMode}</strong></p>
        
        <div className="flex justify-around mb-6">
          <button
            onClick={() => setAuthMode('LOCAL')}
            className={`px-4 py-2 rounded ${authMode === 'LOCAL' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            LOCAL
          </button>
          <button
            onClick={() => setAuthMode('SESSION')}
            className={`px-4 py-2 rounded ${authMode === 'SESSION' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            SESSION
          </button>
          <button
            onClick={() => setAuthMode('NONE')}
            className={`px-4 py-2 rounded ${authMode === 'NONE' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            NONE
          </button>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Back to Dashboard
          </button>
          <button
            onClick={clearToken}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
