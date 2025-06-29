import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, User, Users, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

type FormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'organizer' | 'participant' | 'administrator';
};

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      role: 'participant'
    }
  });
  const password = watch('password');
  const selectedRole = watch('role');
  
  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      await registerUser(data.name, data.email, data.password, data.role);
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    {
      value: 'participant',
      label: 'Participant',
      description: 'Join and attend events',
      icon: User,
      color: 'text-blue-500'
    },
    {
      value: 'organizer',
      label: 'Event Organizer',
      description: 'Create and manage events',
      icon: Users,
      color: 'text-green-500'
    },
    {
      value: 'administrator',
      label: 'Administrator',
      description: 'Full access to the system',
      icon: Shield,
      color: 'text-red-500'
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-4">
      {/* Logo in top right */}
      <div className="absolute top-4 right-4">
        <img 
          src="/BoomSnap white (1).png" 
          alt="BoomSnap" 
          className="h-8 w-auto"
        />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Create an account</h1>
          <p className="mt-2 text-dark-500">Sign up to start managing your events</p>
        </div>
        
        <div className="bg-dark-100 p-8 rounded-lg shadow-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="name" className="label">Full Name</label>
              <input
                id="name"
                type="text"
                className={`input ${errors.name ? 'border-error' : ''}`}
                placeholder="John Doe"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-error">{errors.name.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                className={`input ${errors.email ? 'border-error' : ''}`}
                placeholder="you@example.com"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  }
                })}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-error">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                className={`input ${errors.password ? 'border-error' : ''}`}
                placeholder="••••••••"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  }
                })}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-error">{errors.password.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="label">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className={`input ${errors.confirmPassword ? 'border-error' : ''}`}
                placeholder="••••••••"
                {...register('confirmPassword', { 
                  validate: value => value === password || 'Passwords do not match'
                })}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-error">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : 'Create account'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-dark-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-500 hover:text-primary-400">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-dark-500">
          <p>&copy; {new Date().getFullYear()} BoomSnap. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Register;
