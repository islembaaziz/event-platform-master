import { Link } from 'react-router-dom';
import { Camera } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-dark p-4">
      {/* Logo in top right */}
      <div className="absolute top-4 right-4">
        <img 
          src="/BoomSnap white (1).png" 
          alt="BoomSnap" 
          className="h-8 w-auto"
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md w-full">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary-500 mb-6">
              <Camera className="h-12 w-12 text-dark" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Capture The moments</h1>
            <p className="text-xl text-dark-500">Keep the memories</p>
          </div>
          
          <Link
            to="/login"
            className="block w-full bg-primary-500 text-dark font-semibold py-4 px-6 rounded-lg text-lg hover:bg-primary-400 transition-colors"
          >
            BoomSnap
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;