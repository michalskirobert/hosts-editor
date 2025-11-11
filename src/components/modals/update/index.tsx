import { useEffect, useState } from "react";

function UpdateChecker() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const listener = (percent: number) => setProgress(percent);
    window.electronAPI?.onUpdateProgress(listener);
    return () => {
      window.electronAPI?.removeUpdateProgressListener(listener);
    };
  }, []);

  if ([0, 100].includes(progress)) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-96">
        <h1 className="text-white text-lg font-bold mb-4">
          Downloading Update...
        </h1>
        <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
          <div
            className="h-6 bg-yellow-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-white mt-2 text-right">{Math.round(progress)}%</p>
        {/* <div className="mt-4 flex justify-end">
          {progress === 100 && (
            <button
              onClick={toggle}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
            >
              Finish
            </button>
          )}
        </div> */}
      </div>
    </div>
  );
}

export default UpdateChecker;
