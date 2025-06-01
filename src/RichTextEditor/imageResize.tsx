import React, { useRef, useState, useEffect, useCallback } from 'react';

interface ImageResizerProps {
  imgElement: HTMLImageElement;
  onResize: (newWidth: number, newHeight: number) => void;
}

type ResizeDirection = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const ImageResizer: React.FC<ImageResizerProps> = ({ imgElement, onResize }) => {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: imgElement.naturalWidth,
    height: imgElement.naturalHeight,
  });
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startWidthRef = useRef(0);
  const startHeightRef = useRef(0);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    if (!isResizing) {
      setIsHovered(false);
    }
  };

  // Use useCallback to memoize the functions
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeDirection) return;

    const deltaX = e.clientX - startXRef.current;
    const deltaY = e.clientY - startYRef.current;

    let newWidth = startWidthRef.current;
    let newHeight = startHeightRef.current;

    // Calculate new dimensions based on resize direction
    switch (resizeDirection) {
      case 'top-left':
        newWidth = startWidthRef.current - deltaX;
        newHeight = startHeightRef.current - deltaY;
        break;
      case 'top-right':
        newWidth = startWidthRef.current + deltaX;
        newHeight = startHeightRef.current - deltaY;
        break;
      case 'bottom-left':
        newWidth = startWidthRef.current - deltaX;
        newHeight = startHeightRef.current + deltaY;
        break;
      case 'bottom-right':
        newWidth = startWidthRef.current + deltaX;
        newHeight = startHeightRef.current + deltaY;
        break;
    }

    // Prevent negative dimensions
    newWidth = Math.max(50, newWidth);  // Minimum width
    newHeight = Math.max(50, newHeight);  // Minimum height

    // Maintain aspect ratio (optional)
    const aspectRatio = startWidthRef.current / startHeightRef.current;
    if (newWidth / newHeight !== aspectRatio) {
      if (resizeDirection.includes('left') || resizeDirection.includes('right')) {
        newHeight = newWidth / aspectRatio;
      } else {
        newWidth = newHeight * aspectRatio;
      }
    }

    setDimensions({ width: newWidth, height: newHeight });
    
    // Update image element
    imgElement.style.width = `${newWidth}px`;
    imgElement.style.height = `${newHeight}px`;

    // Notify parent about new dimensions
    onResize(newWidth, newHeight);
  }, [isResizing, resizeDirection, onResize, imgElement]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeDirection(null);

    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const startResize = (
    e: React.MouseEvent, 
    direction: ResizeDirection
  ) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);

    // Store initial mouse and image dimensions
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    startWidthRef.current = dimensions.width;
    startHeightRef.current = dimensions.height;

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Cleanup event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className="image-resizer-container"
      style={{
        position: 'relative',
        display: 'inline-block',
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Original Image */}
      <img
        src={imgElement.src}
        alt={imgElement.alt || 'Resizable Image'}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          display: 'block',
          border: isHovered ? '2px solid blue' : 'none',
        }}
      />

      {/* Resize Handlers */}
      {isHovered && (
        <>
          {/* Top-Left Handler */}
          <div
            className="resize-handle top-left"
            style={{
              position: 'absolute',
              width: '10px',
              height: '10px',
              top: '-5px',
              left: '-5px',
              cursor: 'nwse-resize',
              backgroundColor: 'blue',
              zIndex: 10,
            }}
            onMouseDown={(e) => startResize(e, 'top-left')}
          />

          {/* Top-Right Handler */}
          <div
            className="resize-handle top-right"
            style={{
              position: 'absolute',
              width: '10px',
              height: '10px',
              top: '-5px',
              right: '-5px',
              cursor: 'nesw-resize',
              backgroundColor: 'blue',
              zIndex: 10,
            }}
            onMouseDown={(e) => startResize(e, 'top-right')}
          />

          {/* Bottom-Left Handler */}
          <div
            className="resize-handle bottom-left"
            style={{
              position: 'absolute',
              width: '10px',
              height: '10px',
              bottom: '-5px',
              left: '-5px',
              cursor: 'nesw-resize',
              backgroundColor: 'blue',
              zIndex: 10,
            }}
            onMouseDown={(e) => startResize(e, 'bottom-left')}
          />

          {/* Bottom-Right Handler */}
          <div
            className="resize-handle bottom-right"
            style={{
              position: 'absolute',
              width: '10px',
              height: '10px',
              bottom: '-5px',
              right: '-5px',
              cursor: 'nwse-resize',
              backgroundColor: 'blue',
              zIndex: 10,
            }}
            onMouseDown={(e) => startResize(e, 'bottom-right')}
          />
        </>
      )}
    </div>
  );
};

export default ImageResizer;