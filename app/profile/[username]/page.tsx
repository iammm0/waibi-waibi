'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useVibe } from '@/app/providers';
import SectionHeader from '@/components/section-header';
import UniverseStatus from '@/components/universe-status';

interface PublicProfile {
  userId: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  bio?: string;
  birthday?: string | Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  location?: string;
  occupation?: string;
  company?: string;
  interests?: string[];
  website?: string;
  socialLinks?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    weibo?: string;
    douban?: string;
    bilibili?: string;
    custom?: { name: string; url: string }[];
  };
  education?: {
    school?: string;
    major?: string;
    degree?: string;
    graduationYear?: number;
  }[];
  skills?: string[];
  tags?: string[];
  signature?: string;
  mbtiType?: string;
  languages?: string[];
  about?: string;
}

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const router = useRouter();
  const { mode } = useVibe();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isOwn, setIsOwn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-green-500/30 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const cardClass = mode === 'waibi' ? 'bg-black/50 border border-green-500/30 text-white' : 'bg-white border border-gray-200 text-gray-900';

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        // 公开主页可以使用fetchWithAuth，如果有token会自动带上，没有也可以访问
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`/api/profile/${encodeURIComponent(username)}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
          setIsOwn(data.isOwn || false);
        } else if (res.status === 404) {
          setError('用户不存在');
        } else {
          setError('获取用户信息失败');
        }
      } catch (err) {
        setError('获取用户信息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <UniverseStatus type="loading" context="profile" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <UniverseStatus
          type="error"
          context="profile"
          message={error || '用户不存在'}
          onAction={() => router.back()}
          actionLabel="返回"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <SectionHeader 
        icon="👥"
        title={isOwn ? '我的公开主页' : `${profile.username || profile.name || '用户'}的主页`}
        subtitle={isOwn ? '这是其他人看到的你的公开信息' : '公开信息'}
      />

      <div className={`rounded-xl shadow-md p-6 mt-8 ${panelClass}`}>
        <div className="flex items-center gap-6 mb-6">
          {profile.avatarUrl && (
            <img
              src={profile.avatarUrl}
              alt={profile.username || profile.name || '用户'}
              className="w-24 h-24 rounded-full object-cover border-2 border-current/20"
            />
          )}
          <div>
            <h2 className="text-2xl font-bold">{profile.username || profile.name || '用户'}</h2>
            {profile.name && profile.name !== profile.username && (
              <div className="text-sm opacity-70 mt-1">{profile.name}</div>
            )}
            <div className="text-xs opacity-60 mt-2">ID: {profile.userId}</div>
          </div>
        </div>

        <div className="space-y-6">
          {/* 个性签名 */}
          {profile.signature && (
            <div className="text-lg italic opacity-80 border-l-4 pl-4" style={{ borderColor: mode === 'waibi' ? 'rgba(34, 197, 94, 0.5)' : 'var(--accent-cyan)' }}>
              {profile.signature}
            </div>
          )}

          {/* 个人简介 */}
          {profile.bio && (
            <div>
              <div className="text-sm font-semibold opacity-80 mb-2">个人简介</div>
              <div className="opacity-90">{profile.bio}</div>
            </div>
          )}

          {/* 关于我 */}
          {profile.about && (
            <div>
              <div className="text-sm font-semibold opacity-80 mb-2">关于我</div>
              <div className="opacity-90 whitespace-pre-line">{profile.about}</div>
            </div>
          )}

          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.birthday && (
              <div>
                <div className="text-sm opacity-70 mb-1">生日</div>
                <div>{new Date(profile.birthday).toLocaleDateString('zh-CN')}</div>
              </div>
            )}
            {profile.gender && (
              <div>
                <div className="text-sm opacity-70 mb-1">性别</div>
                <div>
                  {profile.gender === 'male' ? '男' :
                   profile.gender === 'female' ? '女' :
                   profile.gender === 'other' ? '其他' : '不愿透露'}
                </div>
              </div>
            )}
            {profile.location && (
              <div>
                <div className="text-sm opacity-70 mb-1">所在地</div>
                <div>{profile.location}</div>
              </div>
            )}
            {profile.occupation && (
              <div>
                <div className="text-sm opacity-70 mb-1">职业</div>
                <div>{profile.occupation}</div>
              </div>
            )}
            {profile.company && (
              <div>
                <div className="text-sm opacity-70 mb-1">公司</div>
                <div>{profile.company}</div>
              </div>
            )}
            {profile.mbtiType && (
              <div>
                <div className="text-sm opacity-70 mb-1">MBTI类型</div>
                <div className="font-semibold">{profile.mbtiType}</div>
              </div>
            )}
            {profile.email && (
              <div>
                <div className="text-sm opacity-70 mb-1">邮箱</div>
                <div>{profile.email}</div>
              </div>
            )}
            {profile.phone && (
              <div>
                <div className="text-sm opacity-70 mb-1">手机</div>
                <div>{profile.phone}</div>
              </div>
            )}
            {profile.website && (
              <div>
                <div className="text-sm opacity-70 mb-1">个人网站</div>
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  {profile.website}
                </a>
              </div>
            )}
          </div>

          {/* 兴趣爱好 */}
          {profile.interests && profile.interests.length > 0 && (
            <div>
              <div className="text-sm font-semibold opacity-80 mb-2">兴趣爱好</div>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm ${
                      mode === 'waibi' ? 'bg-green-500/20 text-green-400' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 技能 */}
          {profile.skills && profile.skills.length > 0 && (
            <div>
              <div className="text-sm font-semibold opacity-80 mb-2">技能</div>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm ${
                      mode === 'waibi' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 语言 */}
          {profile.languages && profile.languages.length > 0 && (
            <div>
              <div className="text-sm font-semibold opacity-80 mb-2">语言</div>
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((lang, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm ${
                      mode === 'waibi' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 个人标签 */}
          {profile.tags && profile.tags.length > 0 && (
            <div>
              <div className="text-sm font-semibold opacity-80 mb-2">个人标签</div>
              <div className="flex flex-wrap gap-2">
                {profile.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm ${
                      mode === 'waibi' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 教育背景 */}
          {profile.education && profile.education.length > 0 && (
            <div>
              <div className="text-sm font-semibold opacity-80 mb-2">教育背景</div>
              <div className="space-y-3">
                {profile.education.map((edu, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      mode === 'waibi' ? 'bg-gray-900/50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="font-semibold">{edu.school}</div>
                    {edu.major && <div className="text-sm opacity-80">专业: {edu.major}</div>}
                    {edu.degree && <div className="text-sm opacity-80">学位: {edu.degree}</div>}
                    {edu.graduationYear && (
                      <div className="text-sm opacity-80">毕业年份: {edu.graduationYear}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 社交媒体链接 */}
          {profile.socialLinks && (
            <div>
              <div className="text-sm font-semibold opacity-80 mb-2">社交媒体</div>
              <div className="flex flex-wrap gap-3">
                {profile.socialLinks.github && (
                  <a
                    href={profile.socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-3 py-2 rounded-lg text-sm ${
                      mode === 'waibi' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    GitHub
                  </a>
                )}
                {profile.socialLinks.twitter && (
                  <a
                    href={profile.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-3 py-2 rounded-lg text-sm ${
                      mode === 'waibi' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Twitter
                  </a>
                )}
                {profile.socialLinks.linkedin && (
                  <a
                    href={profile.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-3 py-2 rounded-lg text-sm ${
                      mode === 'waibi' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    LinkedIn
                  </a>
                )}
                {profile.socialLinks.instagram && (
                  <a
                    href={profile.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-3 py-2 rounded-lg text-sm ${
                      mode === 'waibi' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Instagram
                  </a>
                )}
                {profile.socialLinks.weibo && (
                  <a
                    href={profile.socialLinks.weibo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-3 py-2 rounded-lg text-sm ${
                      mode === 'waibi' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    微博
                  </a>
                )}
                {profile.socialLinks.douban && (
                  <a
                    href={profile.socialLinks.douban}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-3 py-2 rounded-lg text-sm ${
                      mode === 'waibi' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    豆瓣
                  </a>
                )}
                {profile.socialLinks.bilibili && (
                  <a
                    href={profile.socialLinks.bilibili}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-3 py-2 rounded-lg text-sm ${
                      mode === 'waibi' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Bilibili
                  </a>
                )}
                {profile.socialLinks.custom && profile.socialLinks.custom.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-3 py-2 rounded-lg text-sm ${
                      mode === 'waibi' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {isOwn && (
          <div className="mt-6 pt-6 border-t border-current/20">
            <button
              onClick={() => router.push('/me')}
              className={`px-4 py-2 rounded-lg ${mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110'} text-white`}
            >
              编辑个人资料
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

