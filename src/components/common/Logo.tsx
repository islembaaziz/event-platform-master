import { Link } from 'react-router-dom';

const Logo = () => {
  return (
    <Link to="/dashboard" className="flex items-center space-x-2">
      <img 
        src="/BoomSnap white (1).png" 
        alt="BoomSnap" 
        className="h-8 w-auto"
      />
    </Link>
  );
};

export default Logo;