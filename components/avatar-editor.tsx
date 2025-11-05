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

    // 绘制图片（居中，允许拖拽调整位置）
    const centerX = canvasSize / 2 + offsetX;
    const centerY = canvasSize / 2 + offsetY;
    
    ctx.drawImage(
      image,
      centerX - drawWidth / 2,
      centerY - drawHeight / 2,
      drawWidth,
      drawHeight
    );

    // 绘制裁剪框
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    const cropX = (canvasSize - cropSize) / 2;
    const cropY = (canvasSize - cropSize) / 2;
    ctx.strokeRect(cropX, cropY, cropSize, cropSize);
  }, [image, offsetX, offsetY, mode]);

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

    // 计算偏移量（从预览canvas映射到输出canvas，比例1:1）
    const outputOffsetX = offsetX;
    const outputOffsetY = offsetY;

    // 绘制图片（居中+偏移）
    const centerX = outputSize / 2 + outputOffsetX;
    const centerY = outputSize / 2 + outputOffsetY;
    
    ctx.drawImage(
      image,
      centerX - drawWidth / 2,
      centerY - drawHeight / 2,
      drawWidth,
      drawHeight
    );

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

        <div className="mb-4 text-center text-sm opacity-70">
          拖拽图片调整位置，对齐绿色框
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

