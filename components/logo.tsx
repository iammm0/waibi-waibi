"use client";

import Link from "next/link";

export default function Logo() {
    return (
        <Link
            href="/"
            className="flex items-center gap-2"
        >
            <div className="relative overflow-hidden px-2 py-1 text-xl sm:text-2xl font-bold pixel-text text-gray-700 dark:text-gray-300">
                <span className="sr-only">回到首页</span>
                <span aria-hidden>
                    歪比巴布
                </span>
            </div>
        </Link>
    );
}
