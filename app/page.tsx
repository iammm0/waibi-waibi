import EntryHero from "@/components/entry-hero";
import ChatWidget from "@/components/chat-widget";

export default function HomePage() {
    return (
        <main className="flex flex-col items-center px-4 sm:px-8 space-y-20">
            {/* 顶部 EntryHero：自适应高度、居中显示 */}
            <section className="w-full max-w-5xl">
                <EntryHero />
            </section>

            {/* 聊天组件：有自己的容器宽度，不受上方挤压 */}
            <section className="w-full max-w-5xl">
                <ChatWidget />
            </section>
        </main>
    );
}