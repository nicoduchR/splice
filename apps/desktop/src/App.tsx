import { useEffect } from 'react';
import { useVideoStore } from './stores/video-store';

function App() {
  const {
    currentProject,
    allProjects,
    isImporting,
    importProgress,
    error,
    loadAllProjects,
    selectProject,
    clearProject,
  } = useVideoStore();

  // Load all projects on mount
  useEffect(() => {
    loadAllProjects();
  }, [loadAllProjects]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">State Management & SQLite Demo</h1>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Current Project */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Current Project</h2>
        {currentProject ? (
          <div className="border p-4 rounded">
            <p><strong>ID:</strong> {currentProject.id}</p>
            <p><strong>File:</strong> {currentProject.file_name}</p>
            <p><strong>Duration:</strong> {currentProject.duration_seconds}s</p>
            <button
              onClick={clearProject}
              className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Project
            </button>
          </div>
        ) : (
          <p className="text-gray-500">No project selected</p>
        )}
      </div>

      {/* All Projects List */}
      <div>
        <h2 className="text-xl font-semibold mb-2">All Projects (from SQLite)</h2>
        {allProjects.length === 0 ? (
          <p className="text-gray-500">No projects found</p>
        ) : (
          <ul className="space-y-2">
            {allProjects.map((project) => (
              <li
                key={project.id}
                className="border p-3 rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => selectProject(project.id)}
              >
                <p className="font-medium">{project.file_name}</p>
                <p className="text-sm text-gray-600">{project.duration_seconds}s</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Import Progress */}
      {isImporting && (
        <div className="mt-4">
          <p>Importing... {importProgress}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${importProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <p className="read-the-docs mt-4">
        Zustand stores configured with SQLite persistence
      </p>
    </div>
  );
}

export default App;
