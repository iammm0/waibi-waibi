"use client";

import { useState, useEffect } from 'react';
import { useVibe } from '@/app/providers';
import SectionHeader from '@/components/section-header';
import { MBTI_TYPES } from '@/lib/mbti';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/auth-utils';
import UniverseStatus from '@/components/universe-status';
import { universeToast } from '@/components/universe-toast';

interface Reply {
  id: string;
  content: string;
  username: string;
  userId?: string;
  avatarUrl?: string;
  isAnonymous: boolean;
  parentId?: string;
  replyToUserId?: string;
  replyToUsername?: string;
  personaCode?: string; // 添加 personaCode 属性
  createdAt: string;
  nestedReplies?: Reply[]; // 嵌套回复
}

interface Message {
  id: string;
  content: string;
  personaCode: string;
  username: string;
  userId?: string;
  avatarUrl?: string;
  isAnonymous: boolean;
  isSystem: boolean;
  createdAt: string;
  replies: Reply[];
  replyCount: number;
}

export default function GuestbookPage() {
  const { mode } = useVibe();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersona, setSelectedPersona] = useState<string>('all'); // 人格筛选
  const [replyingTo, setReplyingTo] = useState<{ messageId: string; replyId?: string; username?: string; userId?: string } | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [newCommentContent, setNewCommentContent] = useState('');
  const [newCommentPersona, setNewCommentPersona] = useState('intj');
  const [submittingNewComment, setSubmittingNewComment] = useState(false);
  const [layout, setLayout] = useState<1 | 2 | 3>(1); // 布局：1列、2列、3列
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showNewCommentForm, setShowNewCommentForm] = useState(false);
  const itemsPerPage = 10;

  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-green-500/30 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const inputClass = mode === 'waibi' ? 'border border-green-500/30 bg-gray-900/50 text-white placeholder-gray-500' : 'border border-gray-300 bg-white text-gray-900 placeholder-gray-400';
  const accentBtn = mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110';
  const cardClass = mode === 'waibi' ? 'bg-black/50 border border-green-500/30 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const replyCardClass = mode === 'waibi' ? 'bg-gray-900/50 border border-green-500/20 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900';

  const fetchMessages = async (page: number = currentPage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((page - 1) * itemsPerPage).toString());
      if (selectedPersona !== 'all') {
        params.append('personaCode', selectedPersona);
      }

      const res = await fetch(`/api/guestbook?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        setTotal(data.total || 0);
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error('获取留言失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchMessages(1);
  }, [selectedPersona]);

  useEffect(() => {
    fetchMessages(currentPage);
  }, [currentPage]);

  const handleReply = async (messageId: string, replyId?: string, replyToUsername?: string, replyToUserId?: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      universeToast.warning('请先登录后再评论');
      return;
    }

    if (!replyContent.trim()) {
      universeToast.warning('请输入回复内容');
      return;
    }

    setSubmittingReply(true);
    try {
      // 如果是对回复的回复，使用replyId作为parentId；否则使用messageId作为parentId
      const parentId = replyId || messageId;
      
      const res = await fetchWithAuth('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent.trim(),
          parentId: parentId,
          replyToUserId: replyToUserId,
          replyToUsername: replyToUsername,
          isAnonymous: false,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setReplyContent('');
        setReplyingTo(null);
        // 刷新评论列表
        await fetchMessages(currentPage);
      } else {
        universeToast.error(data?.message || '回复失败');
      }
    } catch (error: any) {
      universeToast.error(error?.message || '回复失败');
    } finally {
      setSubmittingReply(false);
    }
  };

  const toggleReplies = (messageId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedReplies(newExpanded);
  };

  const handleNewComment = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      universeToast.warning('请先登录后再评论');
      return;
    }

    if (!newCommentContent.trim()) {
      universeToast.warning('请输入评论内容');
      return;
    }

    setSubmittingNewComment(true);
    try {
      const res = await fetchWithAuth('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaCode: newCommentPersona,
          content: newCommentContent.trim(),
          isAnonymous: false,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNewCommentContent('');
        setShowNewCommentForm(false);
        // 刷新留言列表，回到第一页
        setCurrentPage(1);
        await fetchMessages(1);
      } else {
        universeToast.error(data?.message || '提交失败');
      }
    } catch (error: any) {
      universeToast.error(error?.message || '提交失败');
    } finally {
      setSubmittingNewComment(false);
    }
  };

  const getPersonaName = (code: string) => {
    const persona = MBTI_TYPES.find(p => p.name.toLowerCase() === code.toLowerCase());
    return persona?.name || code.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 递归渲染嵌套回复
  const renderReplies = (replies: Reply[], parentMessageId: string, depth: number = 0): React.ReactElement[] => {
    if (depth > 3 || !replies || replies.length === 0) return []; // 限制嵌套深度，避免无限递归

    return replies.map((reply) => {
      const persona = MBTI_TYPES.find(p => p.name.toLowerCase() === reply.personaCode?.toLowerCase());
      const nestedReplies = reply.nestedReplies || [];

      return (
        <div key={reply.id} className="mt-2" style={{ marginLeft: `${depth * 12}px` }}>
          <div className={`rounded-lg p-3 ${replyCardClass}`}>
            <div className="flex items-start gap-3">
              {reply.isAnonymous || !reply.userId ? (
                persona && (
                  <img 
                    src={persona.image} 
                    alt={persona.name}
                    className="w-8 h-8 rounded-full object-cover border border-current/20 shrink-0"
                  />
                )
              ) : reply.userId ? (
                <Link
                  href={`/profile/${encodeURIComponent(reply.username || '')}`}
                  className="cursor-pointer shrink-0"
                >
                  <img 
                    src={reply.avatarUrl || persona?.image || '/favicon.ico'} 
                    alt={reply.username}
                    className="w-8 h-8 rounded-full object-cover border border-current/20 hover:opacity-80 transition-opacity"
                  />
                </Link>
              ) : (
                persona && (
                  <img 
                    src={persona.image} 
                    alt={persona.name}
                    className="w-8 h-8 rounded-full object-cover border border-current/20 shrink-0"
                  />
                )
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {reply.isAnonymous ? (
                    <span className="font-semibold text-sm opacity-70">匿名用户</span>
                  ) : reply.userId ? (
                    <Link
                      href={`/profile/${encodeURIComponent(reply.username || '')}`}
                      className="font-semibold text-sm hover:underline cursor-pointer"
                    >
                      {reply.username}
                    </Link>
                  ) : (
                    <span className="font-semibold text-sm">{reply.username}</span>
                  )}
                  {reply.replyToUsername && (
                    <span className="text-xs opacity-70">
                      回复 <span className="font-medium">{reply.replyToUsername}</span>
                    </span>
                  )}
                  <span className="text-xs opacity-60">{formatDate(reply.createdAt)}</span>
                </div>
                <div className="text-sm whitespace-pre-wrap break-words mb-2">{reply.content}</div>
                {depth < 3 && (
                  <button
                    onClick={() => {
                      setReplyingTo({ messageId: parentMessageId, replyId: reply.id, username: reply.username, userId: reply.userId });
                    }}
                    className={`text-xs ${mode === 'waibi' ? 'text-green-400 hover:text-green-300' : 'text-[var(--accent-cyan)] hover:underline'}`}
                  >
                    回复
                  </button>
                )}
              </div>
            </div>
          </div>
          {nestedReplies.length > 0 && (
            <div className="mt-2">
              {renderReplies(nestedReplies, parentMessageId, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="container mx-auto px-4 py-2 max-w-6xl">
      <SectionHeader 
        icon="💬"
        title="留言板" 
        subtitle="选择你的人格，留下一句想说的话。匿名或实名都可以。"
        actions={
          <button
            onClick={() => setShowNewCommentForm(!showNewCommentForm)}
            className={`px-4 py-2 rounded-lg text-white transition ${accentBtn}`}
          >
            {showNewCommentForm ? '取消' : '留下留言'}
          </button>
        }
      />

      {/* 留言创建表单（可折叠） */}
      {showNewCommentForm && (
        <div className={`rounded-xl shadow-md p-6 mb-6 ${panelClass}`}>
          <h2 className="text-xl font-semibold mb-4">留下你的留言</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleNewComment();
          }} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">选择人格</label>
              <select
                className={`w-full p-3 rounded-lg ${inputClass} focus:outline-none focus:ring-2 ${mode === 'waibi' ? 'focus:ring-green-500' : 'focus:ring-[var(--accent-cyan)]'}`}
                value={newCommentPersona}
                onChange={(e) => setNewCommentPersona(e.target.value)}
              >
                {MBTI_TYPES.map((p) => (
                  <option key={p.id} value={p.name.toLowerCase()}>
                    {p.name} - {p.description.length > 50 ? p.description.slice(0, 50) + '...' : p.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">留言内容</label>
              <textarea
                className={`w-full p-3 rounded-lg min-h-[120px] ${inputClass} focus:outline-none focus:ring-2 ${mode === 'waibi' ? 'focus:ring-green-500' : 'focus:ring-[var(--accent-cyan)]'}`}
                placeholder="想说点什么..."
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                maxLength={500}
              />
              <div className="text-xs opacity-70 mt-1">
                {newCommentContent.length}/500
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingNewComment || !newCommentContent.trim()}
              className={`w-full py-3 rounded-lg text-white transition ${accentBtn} ${submittingNewComment || !newCommentContent.trim() ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {submittingNewComment ? '提交中...' : '提交留言'}
            </button>
          </form>
        </div>
      )}

      {/* 留言列表 */}
      <div className="space-y-4">
        {/* 筛选和布局控制 */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-sm ${mode === 'waibi' ? 'text-gray-300' : 'text-gray-700'}`}>筛选人格：</span>
            <select
              className={`px-4 py-2 rounded-lg text-sm ${inputClass} focus:outline-none focus:ring-2 ${
                mode === 'waibi' ? 'focus:ring-green-500' : 'focus:ring-[var(--accent-cyan)]'
              }`}
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value)}
            >
              <option value="all">全部人格</option>
              {MBTI_TYPES.map((p) => (
                <option key={p.id} value={p.name.toLowerCase()}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-sm ${mode === 'waibi' ? 'text-gray-300' : 'text-gray-700'}`}>布局：</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((cols) => (
                <button
                  key={cols}
                  onClick={() => setLayout(cols as 1 | 2 | 3)}
                  className={`px-3 py-1 rounded text-sm transition ${
                    layout === cols
                      ? mode === 'waibi'
                        ? 'bg-green-500 text-white'
                        : 'bg-[var(--accent-cyan)] text-white'
                      : mode === 'waibi'
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cols}列
                </button>
              ))}
            </div>
          </div>
        </div>

          {loading ? (
            <UniverseStatus type="loading" context="default" />
          ) : messages.length === 0 ? (
            <div className={`text-center py-12 ${cardClass} rounded-xl`}>
              <div className="text-sm opacity-70">还没有留言，快来留下第一条吧！</div>
            </div>
          ) : (
            <div className={`grid gap-4 ${
              layout === 1 ? 'grid-cols-1' :
              layout === 2 ? 'grid-cols-1 md:grid-cols-2' :
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {messages.map((msg) => {
                const persona = MBTI_TYPES.find(p => p.name.toLowerCase() === msg.personaCode.toLowerCase());
                const isReplying = replyingTo?.messageId === msg.id;
                // 顶级回复是直接回复该留言的（parentId指向该留言ID）
                const topLevelReplies = msg.replies.filter(r => r.parentId === msg.id);

                return (
                  <div key={msg.id} className={`rounded-xl p-5 shadow-md ${cardClass}`}>
                    {/* 母留言内容 */}
                    <div className="flex items-start gap-4">
                      {msg.isAnonymous || !msg.userId ? (
                        persona && (
                          <img 
                            src={persona.image} 
                            alt={persona.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-current/20 shrink-0"
                          />
                        )
                      ) : msg.userId ? (
                        <Link
                          href={`/profile/${encodeURIComponent(msg.username || '')}`}
                          className="cursor-pointer shrink-0"
                        >
                          <img 
                            src={msg.avatarUrl || persona?.image || '/favicon.ico'} 
                            alt={msg.username}
                            className="w-12 h-12 rounded-full object-cover border-2 border-current/20 hover:opacity-80 transition-opacity"
                          />
                        </Link>
                      ) : (
                        persona && (
                          <img 
                            src={persona.image} 
                            alt={persona.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-current/20 shrink-0"
                          />
                        )
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {msg.isAnonymous ? (
                            <span className="font-semibold opacity-70">匿名用户</span>
                          ) : msg.userId ? (
                            <Link
                              href={`/profile/${encodeURIComponent(msg.username || '')}`}
                              className="font-semibold hover:underline cursor-pointer"
                            >
                              {msg.username}
                            </Link>
                          ) : (
                            <span className="font-semibold">{msg.username}</span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded bg-current/10 ${mode === 'waibi' ? 'text-green-400' : 'text-[var(--accent-cyan)]'}`}>
                            {getPersonaName(msg.personaCode)}
                          </span>
                          <span className="text-xs opacity-60">{formatDate(msg.createdAt)}</span>
                        </div>
                        <div className="mb-4 whitespace-pre-wrap break-words">{msg.content}</div>
                        
                        {/* 回复按钮 */}
                        <button
                          onClick={() => {
                            setReplyingTo({ messageId: msg.id });
                            setReplyContent('');
                          }}
                          className={`text-sm mb-3 ${mode === 'waibi' ? 'text-green-400 hover:text-green-300' : 'text-[var(--accent-cyan)] hover:underline'}`}
                        >
                          评论 ({msg.replyCount})
                        </button>

                        {/* 回复输入框 */}
                        {isReplying && (
                          <div className={`mt-3 p-3 rounded-lg ${mode === 'waibi' ? 'bg-gray-900/50 border border-green-500/20' : 'bg-gray-50 border border-gray-200'}`}>
                            <textarea
                              className={`w-full p-2 rounded-lg text-sm min-h-[80px] ${inputClass} focus:outline-none focus:ring-2 ${
                                mode === 'waibi' ? 'focus:ring-green-500' : 'focus:ring-[var(--accent-cyan)]'
                              }`}
                              placeholder={replyingTo.replyId ? `回复 ${replyingTo.username}...` : '写下你的评论...'}
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              maxLength={500}
                            />
                            <div className="flex items-center justify-between mt-2">
                              <div className="text-xs opacity-70">
                                {replyContent.length}/500
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyContent('');
                                  }}
                                  className={`px-3 py-1 text-sm rounded ${mode === 'waibi' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                                >
                                  取消
                                </button>
                                <button
                                  onClick={() => handleReply(msg.id, replyingTo.replyId, replyingTo.username, replyingTo.userId)}
                                  disabled={submittingReply || !replyContent.trim()}
                                  className={`px-3 py-1 text-sm rounded text-white ${accentBtn} ${submittingReply || !replyContent.trim() ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                  {submittingReply ? '提交中...' : '回复'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 回复列表 - 嵌套在母留言内 */}
                        {msg.replyCount > 0 && (
                          <div className={`mt-4 pt-4 border-t ${mode === 'waibi' ? 'border-green-500/20' : 'border-gray-200'}`}>
                            {topLevelReplies.length > 0 && (
                              <div>
                                {renderReplies(topLevelReplies, msg.id, 0)}
                              </div>
                            )}
                            {msg.replyCount > topLevelReplies.length && (
                              <button
                                onClick={() => toggleReplies(msg.id)}
                                className={`text-xs mt-2 ${mode === 'waibi' ? 'text-green-400 hover:text-green-300' : 'text-[var(--accent-cyan)] hover:underline'}`}
                              >
                                {expandedReplies.has(msg.id) ? '收起' : `展开全部回复 (${msg.replyCount})`}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        {/* 分页控件 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                currentPage === 1
                  ? mode === 'waibi'
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : mode === 'waibi'
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              上一页
            </button>
            
            <div className={`px-4 py-2 rounded-lg text-sm ${
              mode === 'waibi' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'
            }`}>
              第 {currentPage} / {totalPages} 页
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                currentPage >= totalPages
                  ? mode === 'waibi'
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : mode === 'waibi'
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
