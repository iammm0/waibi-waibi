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
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-green-500/30 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const inputClass = mode === 'waibi' ? 'border border-green-500/30 bg-black text-white' : 'border border-gray-300 bg-white text-gray-900';
  const accentBtn = mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110';

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

    // 计算图像尺寸以适应canvas
    const imageAspect = image.width / image.height;
    let drawWidth = canvasSize * 0.8 * scale;
    let drawHeight = canvasSize * 0.8 * scale;
    
    if (imageAspect > 1) {
      drawHeight = drawWidth / imageAspect;
    } else {
      drawWidth = drawHeight * imageAspect;
    }

    ctx.save();
    ctx.translate(canvasSize / 2, canvasSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(offsetX, offsetY);
    
    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    // 绘制裁剪框
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    const cropSize = outputSize;
    const cropX = (canvasSize - cropSize) / 2;
    const cropY = (canvasSize - cropSize) / 2;
    ctx.strokeRect(cropX, cropY, cropSize, cropSize);
  }, [image, rotation, scale, offsetX, offsetY, mode]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setScale(1);
        setRotation(0);
        setOffsetX(0);
        setOffsetY(0);
      };
      img.onerror = () => {
        alert('图片加载失败，请选择其他图片');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      alert('文件读取失败');
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

  const rotateLeft = () => setRotation((prev) => prev - 90);
  const rotateRight = () => setRotation((prev) => prev + 90);
  const zoomIn = () => setScale((prev) => Math.min(prev * 1.2, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev / 1.2, 0.5));

  const handleSave = async () => {
    if (!image) {
      alert('请先上传图片');
      return;
    }

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = outputSize;
    outputCanvas.height = outputSize;
    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return;

    // 计算图像在预览canvas中的尺寸
    const imageAspect = image.width / image.height;
    let previewWidth = canvasSize * 0.8 * scale;
    let previewHeight = canvasSize * 0.8 * scale;
    
    if (imageAspect > 1) {
      previewHeight = previewWidth / imageAspect;
    } else {
      previewWidth = previewHeight * imageAspect;
    }

    // 计算在输出canvas中的尺寸（保持比例）
    const scaleRatio = outputSize / (canvasSize * 0.8);
    let outputWidth = previewWidth * scaleRatio;
    let outputHeight = previewHeight * scaleRatio;

    // 计算偏移量（从预览canvas映射到输出canvas）
    const offsetRatio = outputSize / (canvasSize * 0.8);
    const outputOffsetX = offsetX * offsetRatio;
    const outputOffsetY = offsetY * offsetRatio;

    ctx.save();
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(outputOffsetX, outputOffsetY);
    
    ctx.drawImage(image, -outputWidth / 2, -outputHeight / 2, outputWidth, outputHeight);
    ctx.restore();

    const imageData = outputCanvas.toDataURL('image/png');
    await onSave(imageData);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4">
      <div className={`${panelClass} rounded-lg p-6 max-w-lg w-full shadow-lg`}>
        <h2 className="text-xl font-bold mb-4">编辑头像</h2>

        <div className="mb-4">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`px-4 py-2 rounded-lg ${accentBtn} text-white mb-2`}
          >
            选择图片
          </button>
        </div>

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

        <div className="mb-4 flex gap-2 justify-center flex-wrap">
          <button onClick={rotateLeft} className={`px-3 py-2 rounded ${inputClass}`}>
            左旋转
          </button>
          <button onClick={rotateRight} className={`px-3 py-2 rounded ${inputClass}`}>
            右旋转
          </button>
          <button onClick={zoomIn} className={`px-3 py-2 rounded ${inputClass}`}>
            放大
          </button>
          <button onClick={zoomOut} className={`px-3 py-2 rounded ${inputClass}`}>
            缩小
          </button>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className={`px-4 py-2 rounded ${inputClass}`}>
            取消
          </button>
          <button onClick={handleSave} className={`px-4 py-2 rounded text-white ${accentBtn}`}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

