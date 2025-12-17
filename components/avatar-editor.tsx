"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useVibe } from '@/app/providers';

interface AvatarEditorProps {
  currentAvatarUrl?: string;
  onSave: (imageData: string) => Promise<void>;
  onCancel: () => void;
}

export default function AvatarEditor({ currentAvatarUrl, onSave, onCancel }: AvatarEditorProps) {
  const { mode } = useVibe();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [scale, setScale] = useState(1); // 缩放比例
  const [rotation, setRotation] = useState(0); // 旋转角度（度）
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const inputClass = mode === 'waibi' ? 'border border-gray-700 bg-black text-white' : 'border border-gray-300 bg-white text-gray-900';
  const accentBtn = mode === 'waibi' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600';

  const canvasSize = 400;
  const outputSize = 200;

  useEffect(() => {
    if (currentAvatarUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setImage(img);
      img.onerror = () => setImage(null);
      img.src = currentAvatarUrl;
    }
  }, [currentAvatarUrl]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    if (!image) {
      ctx.fillStyle = mode === 'waibi' ? '#1a1a1a' : '#f0f0f0';
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      ctx.fillStyle = mode === 'waibi' ? '#555' : '#999';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('请上传图片', canvasSize / 2, canvasSize / 2);
      return;
    }

    // 计算图像尺寸以适应裁剪框（保持宽高比，覆盖整个区域）
    const imageAspect = image.width / image.height;
    const cropSize = outputSize;
    let drawWidth = cropSize;
    let drawHeight = cropSize;
    
    if (imageAspect > 1) {
      // 横向图片，高度固定，宽度按比例
      drawHeight = cropSize;
      drawWidth = cropSize * imageAspect;
    } else {
      // 纵向或正方形图片，宽度固定，高度按比例
      drawWidth = cropSize;
      drawHeight = cropSize / imageAspect;
    }

    // 应用缩放
    drawWidth *= scale;
    drawHeight *= scale;

    // 保存上下文状态
    ctx.save();

    // 移动到画布中心并应用旋转
    const centerX = canvasSize / 2 + offsetX;
    const centerY = canvasSize / 2 + offsetY;
    
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    
    // 绘制图片（居中）
    ctx.drawImage(
      image,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );

    // 恢复上下文状态
    ctx.restore();

    // 绘制裁剪框
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    const cropX = (canvasSize - cropSize) / 2;
    const cropY = (canvasSize - cropSize) / 2;
    ctx.strokeRect(cropX, cropY, cropSize, cropSize);
  }, [image, offsetX, offsetY, scale, rotation, mode]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      const { universeToast } = await import('@/components/universe-toast');
      universeToast.warning('请选择图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setOffsetX(0);
        setOffsetY(0);
        setScale(1);
        setRotation(0);
      };
      img.onerror = async () => {
        const { universeToast } = await import('@/components/universe-toast');
        universeToast.error('图片加载失败，请选择其他图片');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = async () => {
      const { universeToast } = await import('@/components/universe-toast');
      universeToast.error('文件读取失败');
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX - rect.left - canvasSize / 2 - offsetX, 
      y: e.clientY - rect.top - canvasSize / 2 - offsetY 
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setOffsetX(e.clientX - rect.left - canvasSize / 2 - dragStart.x);
    setOffsetY(e.clientY - rect.top - canvasSize / 2 - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };


  const handleSave = async () => {
    if (!image) {
      const { universeToast } = await import('@/components/universe-toast');
      universeToast.warning('请先上传图片');
      return;
    }

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = outputSize;
    outputCanvas.height = outputSize;
    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return;

    // 计算图像尺寸（与预览canvas中相同）
    const imageAspect = image.width / image.height;
    const cropSize = outputSize;
    let drawWidth = cropSize;
    let drawHeight = cropSize;
    
    if (imageAspect > 1) {
      drawHeight = cropSize;
      drawWidth = cropSize * imageAspect;
    } else {
      drawWidth = cropSize;
      drawHeight = cropSize / imageAspect;
    }

    // 应用缩放
    drawWidth *= scale;
    drawHeight *= scale;

    // 计算偏移量（从预览canvas映射到输出canvas，比例1:1）
    const outputOffsetX = offsetX;
    const outputOffsetY = offsetY;

    // 保存上下文状态
    ctx.save();

    // 移动到画布中心并应用旋转
    const centerX = outputSize / 2 + outputOffsetX;
    const centerY = outputSize / 2 + outputOffsetY;
    
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    
    // 绘制图片（居中）
    ctx.drawImage(
      image,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );

    // 恢复上下文状态
    ctx.restore();

    const imageData = outputCanvas.toDataURL('image/png');
    await onSave(imageData);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3)); // 最大3倍
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.3)); // 最小0.3倍
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setOffsetX(0);
    setOffsetY(0);
    setScale(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4">
      <div className={`${panelClass} rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] flex flex-col`}>
        {/* 固定头部 */}
        <div className="flex-shrink-0 p-4 border-b border-opacity-20" style={{
          borderColor: mode === 'waibi' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 0, 0, 0.1)'
        }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">编辑头像</h2>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`px-4 py-2 rounded-lg text-sm ${accentBtn} text-white`}
            >
              选择图片
            </button>
          </div>
        </div>

        {/* 可滚动内容区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 flex justify-center">
            <canvas
              ref={canvasRef}
              width={canvasSize}
              height={canvasSize}
              className="border rounded-lg cursor-move max-w-full h-auto"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>

          {/* 控制面板 */}
          {image && (
            <div className="mb-4 space-y-4">
              {/* 缩放控制 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">缩放: {Math.round(scale * 100)}%</label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleZoomOut}
                      disabled={scale <= 0.3}
                      className={`px-3 py-1 rounded text-sm ${accentBtn} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      −
                    </button>
                    <button
                      onClick={handleZoomIn}
                      disabled={scale >= 3}
                      className={`px-3 py-1 rounded text-sm ${accentBtn} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      +
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="3"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: mode === 'waibi' 
                      ? `linear-gradient(to right, #22c55e 0%, #22c55e ${((scale - 0.3) / 2.7) * 100}%, #333 ${((scale - 0.3) / 2.7) * 100}%, #333 100%)`
                      : `linear-gradient(to right, var(--accent-cyan) 0%, var(--accent-cyan) ${((scale - 0.3) / 2.7) * 100}%, #ddd ${((scale - 0.3) / 2.7) * 100}%, #ddd 100%)`
                  }}
                />
              </div>

              {/* 旋转控制 */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">旋转: {rotation}°</label>
                <button
                  onClick={handleRotate}
                  className={`px-4 py-2 rounded text-sm ${accentBtn} text-white`}
                >
                  🔄 旋转 90°
                </button>
              </div>

              {/* 重置按钮 */}
              <div className="flex justify-end">
                <button
                  onClick={handleReset}
                  className={`px-3 py-1 rounded text-sm ${inputClass}`}
                >
                  🔄 重置
                </button>
              </div>
            </div>
          )}

          <div className="text-center text-sm opacity-70">
            拖拽图片调整位置，使用滑块缩放，对齐绿色框
          </div>
        </div>

        {/* 固定底部按钮 */}
        <div className="flex-shrink-0 p-4 border-t border-opacity-20 flex gap-2 justify-end" style={{
          borderColor: mode === 'waibi' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 0, 0, 0.1)'
        }}>
          <button onClick={onCancel} className={`px-4 py-2 rounded ${inputClass}`}>
            取消
          </button>
          <button 
            onClick={handleSave} 
            disabled={!image}
            className={`px-4 py-2 rounded text-white ${accentBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

