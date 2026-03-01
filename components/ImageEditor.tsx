import React, { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { X, Check, RotateCw, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageEditorProps {
  image: string;
  onConfirm: (croppedImage: string, width: number, height: number) => void;
  onCancel: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ image, onConfirm, onCancel }) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [targetWidth, setTargetWidth] = useState<number>(800);
  const [targetHeight, setTargetHeight] = useState<number>(600);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
    if (maintainAspectRatio) {
      const ratio = croppedAreaPixels.width / croppedAreaPixels.height;
      setTargetHeight(Math.round(targetWidth / ratio));
    }
  }, [maintainAspectRatio, targetWidth]);

  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (maintainAspectRatio && croppedAreaPixels) {
      const ratio = croppedAreaPixels.width / croppedAreaPixels.height;
      setTargetHeight(Math.round(val / ratio));
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (maintainAspectRatio && croppedAreaPixels) {
      const ratio = croppedAreaPixels.width / croppedAreaPixels.height;
      setTargetWidth(Math.round(val * ratio));
    }
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0,
    width: number,
    height: number
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return '';
    }

    const rotRad = (rotation * Math.PI) / 180;
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    );

    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);

    ctx.drawImage(image, 0, 0);

    const data = ctx.getImageData(
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height
    );

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(data, 0, 0);

    // Resize to target dimensions
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = width;
    resizedCanvas.height = height;
    const resizedCtx = resizedCanvas.getContext('2d');
    if (resizedCtx) {
      resizedCtx.drawImage(canvas, 0, 0, width, height);
      return resizedCanvas.toDataURL('image/jpeg');
    }

    return canvas.toDataURL('image/jpeg');
  };

  const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = (rotation * Math.PI) / 180;
    return {
      width:
        Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height:
        Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  };

  const handleConfirm = async () => {
    if (croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation, targetWidth, targetHeight);
        onConfirm(croppedImage, targetWidth, targetHeight);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-8"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[80vh]">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Maximize size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Edit Image</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Crop & Resize</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative flex-1 bg-gray-900">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={undefined}
            onCropChange={setCrop}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="p-6 bg-white border-t border-gray-100 space-y-6 overflow-y-auto max-h-[40vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <ZoomIn size={12} />
                      <span>Zoom</span>
                    </div>
                    <span>{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <RotateCw size={12} />
                      <span>Rotation</span>
                    </div>
                    <span>{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    value={rotation}
                    min={0}
                    max={360}
                    step={1}
                    aria-labelledby="Rotation"
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Output Dimensions</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={maintainAspectRatio} 
                    onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                    className="w-3 h-3 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Lock Ratio</span>
                </label>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Width (px)</label>
                  <input 
                    type="number" 
                    value={targetWidth}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Height (px)</label>
                  <input 
                    type="number" 
                    value={targetHeight}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Check size={18} />
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
