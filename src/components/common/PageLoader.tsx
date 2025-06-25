import { Loader2 } from 'lucide-react';

const PageLoader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-dark z-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-primary-500 animate-spin mx-auto" />
        <p className="mt-4 text-dark-600 font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default PageLoader;