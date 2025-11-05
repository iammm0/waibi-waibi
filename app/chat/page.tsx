'use client';

import PersonaChat from "@/components/persona-chat";
import ChatSidebar from "@/components/chat-sidebar";
import { useState } from 'react';

export default function ChatPage() {
    const [personaCode, setPersonaCode] = useState<string>('intj');
    const [model, setModel] = useState<string>('gpt-4o-mini');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div data-chat-page className="absolute inset-0 flex overflow-hidden pt-[134px] pb-[89px] sm:pt-[79px] sm:pb-[73px]">
            {/* 侧边栏 */}
            <ChatSidebar
                personaCode={personaCode}
                onPersonaChange={setPersonaCode}
                model={model}
                onModelChange={setModel}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            
            {/* 主聊天区域 */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <PersonaChat 
                    personaCode={personaCode}
                    model={model}
                />
            </div>
        </div>
    );
}