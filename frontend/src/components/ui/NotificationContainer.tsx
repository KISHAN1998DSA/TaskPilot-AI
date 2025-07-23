import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { removeNotification } from '../../store/slices/uiSlice';

interface NotificationProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  autoClose?: boolean;
}

const Notification = ({ id, message, type, autoClose = true }: NotificationProps) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        dispatch(removeNotification(id));
      }, 5000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [autoClose, dispatch, id]);

  const handleClose = () => {
    dispatch(removeNotification(id));
  };

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-destructive',
    warning: 'bg-yellow-500',
    info: 'bg-primary',
  };

  const iconMap = {
    success: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    error: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
    warning: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    info: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  return (
    <div
      className={`mb-3 flex w-full max-w-sm overflow-hidden rounded-lg shadow-md ${bgColor[type]} text-white`}
    >
      <div className="flex w-12 items-center justify-center">{iconMap[type]}</div>
      <div className="flex-1 px-4 py-2">
        <div className="text-sm font-medium">{message}</div>
      </div>
      <div className="flex items-center">
        <button
          onClick={handleClose}
          className="mr-2 inline-flex rounded-md p-1.5 text-white hover:bg-white hover:bg-opacity-10 focus:outline-none"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

const NotificationContainer = () => {
  const { notifications } = useSelector((state: RootState) => state.ui);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 md:p-6">
      <div className="flex flex-col items-end space-y-2">
        {notifications.map((notification) => (
          <Notification key={notification.id} {...notification} />
        ))}
      </div>
    </div>
  );
};

export default NotificationContainer; 