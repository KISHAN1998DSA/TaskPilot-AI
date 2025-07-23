import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-9xl font-bold text-primary">404</h1>
      <h2 className="mb-4 text-3xl font-bold text-foreground">Page Not Found</h2>
      <p className="mb-8 text-muted-foreground">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default NotFound; 