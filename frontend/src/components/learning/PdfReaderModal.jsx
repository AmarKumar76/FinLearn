import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCw,
  FileText,
  AlertCircle,
  X,
  List,
  Search,
  BookOpen
} from 'lucide-react';
import { Button } from '../common/Button';
import { Loading } from '../common/Loading';
import { API_BASE_URL } from '../../services/api';

// Configure Mozilla PDF.js worker using Vite asset URL resolution
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export function PdfReaderModal({ isOpen, onClose, materialId, title }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOutline, setShowOutline] = useState(false);
  const [outline, setOutline] = useState([]);
  const [outlineSearch, setOutlineSearch] = useState('');

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Keyboard shortcut listener
  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentPage((prev) => Math.min(numPages, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentPage((prev) => Math.max(1, prev - 1));
      } else if (e.key === '+' || e.key === '=') {
        setScale((prev) => Math.min(2.5, +(prev + 0.2).toFixed(1)));
      } else if (e.key === '-') {
        setScale((prev) => Math.max(0.6, +(prev - 0.2).toFixed(1)));
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, numPages, onClose]);

  // Load authenticated PDF document via fetch + blob + pdfjsLib
  useEffect(() => {
    if (!isOpen || !materialId) {
      setPdfDoc(null);
      setCurrentPage(1);
      setNumPages(0);
      setError(null);
      return;
    }

    let isCancelled = false;
    async function loadPdf() {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('finlearn_token');
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const url = `${API_BASE_URL}/learning/materials/${materialId}/download`;

        const response = await fetch(url, {
          headers,
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication expired. Please log in again to access this material.');
          } else if (response.status === 403) {
            throw new Error('Access denied. This material has not yet been published.');
          } else if (response.status === 404) {
            throw new Error('Target PDF document was not found on the server.');
          }
          throw new Error(`Failed to load document (${response.status})`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (isCancelled) return;

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);

        // Attempt to fetch bookmarks/outline
        try {
          const docOutline = await doc.getOutline();
          if (!isCancelled && docOutline && docOutline.length > 0) {
            setOutline(docOutline);
          } else {
            setOutline([]);
          }
        } catch {
          setOutline([]);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Error parsing PDF document');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, materialId]);

  // Render current page to HTML5 Canvas
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || currentPage < 1 || currentPage > numPages) return;

    try {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale, rotation });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set high-DPI resolution
      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

      const renderContext = {
        canvasContext: context,
        transform,
        viewport,
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;
      await task.promise;
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('PDF render error:', err);
      }
    }
  }, [pdfDoc, currentPage, numPages, scale, rotation]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  // Fit to container width
  const handleFitWidth = async () => {
    if (!pdfDoc || !containerRef.current) return;
    try {
      const page = await pdfDoc.getPage(currentPage);
      const unscaledViewport = page.getViewport({ scale: 1, rotation });
      const containerWidth = containerRef.current.clientWidth - 48; // padding
      if (containerWidth > 200 && unscaledViewport.width > 0) {
        const calculated = +(containerWidth / unscaledViewport.width).toFixed(2);
        setScale(Math.max(0.6, Math.min(2.5, calculated)));
      }
    } catch (e) {
      console.warn('Fit to width error:', e);
    }
  };

  const handleOutlineClick = async (dest) => {
    if (!pdfDoc) return;
    try {
      let pageIndex = -1;
      if (typeof dest === 'string') {
        const destArr = await pdfDoc.getDestination(dest);
        if (destArr && destArr[0]) {
          pageIndex = await pdfDoc.getPageIndex(destArr[0]);
        }
      } else if (Array.isArray(dest) && dest[0]) {
        pageIndex = await pdfDoc.getPageIndex(dest[0]);
      }
      if (pageIndex >= 0) {
        setCurrentPage(pageIndex + 1);
        setShowOutline(false);
      }
    } catch (err) {
      console.error('TOC navigation error:', err);
    }
  };

  if (!isOpen) return null;

  const filteredOutline = outline.filter((item) =>
    item.title?.toLowerCase().includes(outlineSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col bg-aubergine/80 backdrop-blur-md">
      {/* Top Header / Toolbar */}
      <div className="h-16 px-4 sm:px-6 bg-aubergine text-ivory border-b border-brass/30 flex items-center justify-between shrink-0 shadow-lg">
        {/* Left: Title & File Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-terracotta flex items-center justify-center font-bold text-white shrink-0 shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h2 className="text-sm sm:text-base font-bold text-ivory truncate max-w-xs sm:max-w-md">
              {title || 'Integrated PDF Reader'}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-brass-light">
              <span>Verified Educational Document</span>
              <span>•</span>
              <span>In-App Reading</span>
            </div>
          </div>
        </div>

        {/* Center: Controls Toolbar */}
        {!loading && !error && numPages > 0 && (
          <div className="hidden md:flex items-center gap-2 bg-aubergine-dark/80 px-3 py-1.5 rounded-xl border border-brass/25">
            {/* Outline toggle */}
            {outline.length > 0 && (
              <button
                onClick={() => setShowOutline(!showOutline)}
                className={`p-1.5 rounded-lg transition-colors ${
                  showOutline ? 'bg-terracotta text-white' : 'text-ivory/80 hover:bg-brass/20'
                }`}
                title="Table of Contents"
              >
                <List className="w-4 h-4" />
              </button>
            )}

            {/* Page navigation */}
            <div className="flex items-center gap-1 px-2 border-x border-brass/20">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded text-ivory/80 hover:text-white disabled:opacity-30 disabled:hover:text-ivory/80 transition-colors"
                title="Previous Page (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono font-semibold px-1 text-ivory">
                {currentPage} / {numPages}
              </span>

              <button
                disabled={currentPage >= numPages}
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                className="p-1 rounded text-ivory/80 hover:text-white disabled:opacity-30 disabled:hover:text-ivory/80 transition-colors"
                title="Next Page (Right Arrow)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(1)))}
                className="p-1.5 rounded hover:bg-brass/20 text-ivory/80 hover:text-white transition-colors"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono w-12 text-center text-ivory/90">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(2.5, +(s + 0.2).toFixed(1)))}
                className="p-1.5 rounded hover:bg-brass/20 text-ivory/80 hover:text-white transition-colors"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Fit Width */}
            <button
              onClick={handleFitWidth}
              className="px-2 py-1 text-xs rounded hover:bg-brass/20 text-brass-light hover:text-white font-medium transition-colors"
              title="Fit to Container Width"
            >
              Fit Width
            </button>

            {/* Rotate */}
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-1.5 rounded hover:bg-brass/20 text-ivory/80 hover:text-white transition-colors"
              title="Rotate 90 degrees"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Right: Fullscreen & Close button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg text-ivory/80 hover:text-white hover:bg-aubergine-light transition-colors hidden sm:block"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-terracotta hover:bg-terracotta-dark text-white text-xs font-bold shadow-xs transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Close Reader</span>
          </button>
        </div>
      </div>

      {/* Main Reader Viewport */}
      <div className="flex-1 flex overflow-hidden relative bg-[#2A182D]">
        {/* Table of Contents Drawer */}
        {showOutline && outline.length > 0 && (
          <div className="w-72 bg-aubergine border-r border-brass/25 text-ivory flex flex-col z-20 shadow-xl">
            <div className="p-3 border-b border-brass/20 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brass-light">
                Table of Contents
              </span>
              <button
                onClick={() => setShowOutline(false)}
                className="p-1 rounded text-ivory/60 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-2 border-b border-brass/20">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-ivory/40 absolute left-2.5 top-2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter chapters..."
                  value={outlineSearch}
                  onChange={(e) => setOutlineSearch(e.target.value)}
                  className="w-full pl-8 pr-2 py-1 text-xs rounded bg-aubergine-dark border border-brass/20 text-ivory focus:outline-none focus:border-terracotta"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredOutline.length === 0 ? (
                <div className="text-[11px] text-ivory/50 text-center py-4">No sections match</div>
              ) : (
                filteredOutline.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOutlineClick(item.dest)}
                    className="w-full text-left px-2.5 py-1.5 rounded text-xs text-ivory/80 hover:bg-aubergine-light hover:text-white transition-colors truncate block"
                  >
                    {item.title}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto flex flex-col items-center justify-start p-4 sm:p-8"
        >
          {loading ? (
            <div className="m-auto flex flex-col items-center justify-center p-8 text-ivory">
              <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-semibold text-ivory/80">
                Streaming secure educational PDF document...
              </p>
              <span className="text-xs text-brass-light mt-1">
                Authenticating through FinLearn security gateway
              </span>
            </div>
          ) : error ? (
            <div className="m-auto max-w-md p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-rose-500/40 text-center text-ivory">
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-ivory">Unable to Render PDF</h3>
              <p className="text-xs text-ivory/70 mt-1.5 leading-relaxed">{error}</p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <Button variant="secondary" size="sm" onClick={onClose}>
                  Back to Learning Lab
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative shadow-2xl rounded-sm overflow-hidden bg-white border border-brass/30 transition-all">
              <canvas ref={canvasRef} className="block select-none" />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {!loading && !error && numPages > 0 && (
        <div className="md:hidden h-14 bg-aubergine border-t border-brass/25 px-4 flex items-center justify-between text-ivory shrink-0">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            icon={ChevronLeft}
          >
            Prev
          </Button>

          <span className="text-xs font-mono font-semibold text-brass-light">
            {currentPage} of {numPages}
          </span>

          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage >= numPages}
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            icon={ChevronRight}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default PdfReaderModal;
