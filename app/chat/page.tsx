'use client';

import PersonaChat from "@/components/persona-chat";
import ChatSidebar from "@/components/chat-sidebar";
import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth-utils';

export default function ChatPage() {
    const [instanceId, setInstanceId] = useState<string>('');
    const [model, setModel] = useState<string>('gpt-4o-mini');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [instances, setInstances] = useState<any[]>([]);
    const [loadingInstances, setLoadingInstances] = useState(false);

    // 加载用户的模型实例列表
    useEffect(() => {
        const loadInstances = async () => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
            if (!token) return;
            
            setLoadingInstances(true);
            try {
                const res = await fetchWithAuth('/api/persona-instance');
                if (res.ok) {
                    const data = await res.json();
                    const instanceList = data.instances || [];
                    setInstances(instanceList);
                    // 如果有实例且当前没有选择，选择第一个
                    if (instanceList.length > 0 && !instanceId) {
                        setInstanceId(instanceList[0]._id);
                    } else if (instanceList.length === 0) {
                        setInstanceId('');
                    }
                }
            } catch (err) {
                console.error('加载模型实例失败:', err);
            } finally {
                setLoadingInstances(false);
            }
        };
        loadInstances();
    }, []);

    return (
        <div data-chat-page className="absolute inset-0 flex overflow-hidden pt-[134px] pb-[89px] sm:pt-[79px] sm:pb-[73px]">
            {/* 侧边栏 */}
            <ChatSidebar
                instanceId={instanceId}
                onInstanceChange={setInstanceId}
                instances={instances}
                loadingInstances={loadingInstances}
                model={model}
                onModelChange={setModel}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            
            {/* 主聊天区域 */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <PersonaChat 
                    instanceId={instanceId}
                    model={model}
                />
            </div>
        </div>
    );
}