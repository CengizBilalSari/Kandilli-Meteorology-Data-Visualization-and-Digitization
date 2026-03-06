import { useTiffLoader } from '../../hooks/useTiffLoader';
import { useDailyViewerStore } from '../../store/useDailyViewerStore';

export function TiffViewer() {
  const { canvasRef, dimensions, hasImage, tiffFilename } = useTiffLoader();
  const { tiffZoom, tiffLoading, tiffError, zoomIn, zoomOut, resetZoom, selectedDate } = useDailyViewerStore();

  if (!selectedDate) {
    return (
      <div className="bg-white rounded-lg shadow h-full flex items-center justify-center">
        <p className="text-gray-400">Select a date to view the document</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900">Original Document</h3>
          {tiffFilename && (
            <p className="text-xs text-gray-500 mt-0.5">{tiffFilename}</p>
          )}
        </div>

        {hasImage && (
          <div className="flex items-center gap-2">
            <button
              onClick={zoomOut}
              disabled={tiffZoom <= 0.5}
              className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom out"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>

            <span className="text-sm text-gray-600 w-12 text-center">
              {Math.round(tiffZoom * 100)}%
            </span>

            <button
              onClick={zoomIn}
              disabled={tiffZoom >= 4}
              className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom in"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <button
              onClick={resetZoom}
              className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 text-xs"
              title="Reset zoom"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {tiffLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-500">Loading document...</p>
            </div>
          </div>
        ) : tiffError ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">{tiffError}</p>
              <p className="text-xs text-gray-400 mt-1">
                File: {tiffFilename}
              </p>
            </div>
          </div>
        ) : hasImage ? (
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              className="border border-gray-200 shadow-sm"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            No document loaded
          </div>
        )}
      </div>

      {hasImage && dimensions && (
        <div className="p-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
          <span>Original size: {dimensions.width} x {dimensions.height}px</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Available
          </span>
        </div>
      )}
    </div>
  );
}
