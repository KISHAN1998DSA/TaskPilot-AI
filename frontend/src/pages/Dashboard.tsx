import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { fetchBoards } from '../store/slices/boardSlice';
import { openModal } from '../store/slices/uiSlice';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Dashboard = () => {
  const { boards, isLoading, error } = useSelector((state: RootState) => state.boards);
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchBoards());
  }, [dispatch]);

  const handleCreateBoard = () => {
    dispatch(openModal({ modal: 'createBoard' }));
  };

  const handleBoardClick = (boardId: string) => {
    navigate(`/board/${boardId}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-destructive">{error}</p>
          <button
            onClick={() => dispatch(fetchBoards())}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Dashboard</h1>
        <button
          onClick={handleCreateBoard}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Create Board
        </button>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Welcome back, {user?.name || 'User'}!</h2>
        <p className="text-muted-foreground">
          Here's an overview of your projects and recent activities.
        </p>
      </div>

      <div className="mb-8">
        <h3 className="mb-4 text-lg font-medium text-foreground">Your Boards</h3>
        {boards.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="mb-4 text-muted-foreground">You don't have any boards yet.</p>
            <button
              onClick={handleCreateBoard}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Create Your First Board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {boards.map((board) => (
              <div
                key={board.id}
                onClick={() => handleBoardClick(board.id)}
                className="cursor-pointer rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <h4 className="mb-2 text-lg font-medium text-foreground">{board.name}</h4>
                {board.description && (
                  <p className="mb-4 text-sm text-muted-foreground">{board.description}</p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {/* This would show member avatars */}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {board.members.length}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(board.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h3 className="mb-4 text-lg font-medium text-foreground">Recent Activity</h3>
        <div className="rounded-lg border border-border bg-card">
          <div className="p-4 text-center text-muted-foreground">
            No recent activity to display.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 