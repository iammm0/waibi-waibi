'use client';

import { useVibe } from '@/app/providers';
import SectionHeader from '@/components/section-header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TutorialPage() {
  const { mode } = useVibe();
  const router = useRouter();

  const panelClass = mode === 'waibi' 
    ? 'bg-black/90 border border-green-500/30 text-white' 
    : 'bg-white border border-gray-200 text-gray-900';
  
  const cardClass = mode === 'waibi' 
    ? 'bg-gray-900/50 border border-green-500/30 hover:border-green-500/50 transition-all' 
    : 'bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all';
  
  const accentClass = mode === 'waibi' 
    ? 'text-green-400' 
    : 'text-[var(--accent-cyan)]';
  
  const buttonClass = mode === 'waibi'
    ? 'bg-green-500 hover:bg-green-600 text-white'
    : 'bg-[var(--accent-cyan)] hover:brightness-110 text-white';

  const steps = [
    {
      id: 1,
      title: '注册与登录',
      icon: '🚀',
      content: (
        <div className="space-y-3">
          <p className="opacity-80">首先，你需要注册一个账号才能开始创建和训练模型实例。</p>
          <ol className="list-decimal list-inside space-y-2 opacity-90">
            <li>点击右上角的<strong className={accentClass}>"登录"</strong>按钮</li>
            <li>如果还没有账号，点击<strong className={accentClass}>"注册"</strong>创建新账号</li>
            <li>填写用户名、邮箱和密码完成注册</li>
            <li>登录后，你就可以开始创建自己的模型实例了</li>
          </ol>
        </div>
      ),
      action: { label: '前往登录', href: '/login' }
    },
    {
      id: 2,
      title: '创建模型实例',
      icon: '✨',
      content: (
        <div className="space-y-4">
          <p className="opacity-80">创建模型实例有三种方式，你可以根据需求选择：</p>
          
          <div className="space-y-3">
            <div className={`p-4 rounded-lg ${cardClass}`}>
              <h4 className={`font-semibold mb-2 ${accentClass}`}>方式一：空白创建</h4>
              <p className="text-sm opacity-80 mb-2">从零开始，完全自定义你的模型实例。</p>
              <ol className="list-decimal list-inside space-y-1 text-sm opacity-90 ml-2">
                <li>进入<strong className={accentClass}>"个人中心"</strong> → 点击<strong className={accentClass}>"创建模型实例"</strong></li>
                <li>选择<strong className={accentClass}>"空白创建"</strong></li>
                <li>填写基本信息（名称、描述、头像等）</li>
                <li>编写系统提示词（System Prompt）</li>
                <li>添加训练样本</li>
                <li>调整模型参数（可选）</li>
                <li>保存创建</li>
              </ol>
            </div>

            <div className={`p-4 rounded-lg ${cardClass}`}>
              <h4 className={`font-semibold mb-2 ${accentClass}`}>方式二：基于MBTI人格创建</h4>
              <p className="text-sm opacity-80 mb-2">基于16种MBTI人格类型快速创建，系统会自动加载基础提示词和训练集。</p>
              <ol className="list-decimal list-inside space-y-1 text-sm opacity-90 ml-2">
                <li>进入<strong className={accentClass}>"训练"</strong>页面，选择你想要的MBTI人格类型</li>
                <li>在人格详情页点击<strong className={accentClass}>"基于此人格创建模型实例"</strong>按钮</li>
                <li>系统会自动填充该人格的基础信息</li>
                <li>你可以在此基础上修改和完善</li>
                <li>添加更多训练样本以优化模型表现</li>
                <li>保存创建</li>
              </ol>
            </div>

            <div className={`p-4 rounded-lg ${cardClass}`}>
              <h4 className={`font-semibold mb-2 ${accentClass}`}>方式三：基于收藏模型创建</h4>
              <p className="text-sm opacity-80 mb-2">基于其他用户公开的模型实例进行二次开发，继承原创作者的工作成果。</p>
              <ol className="list-decimal list-inside space-y-1 text-sm opacity-90 ml-2">
                <li>在<strong className={accentClass}>"开放实例"</strong>页面浏览公开的模型实例</li>
                <li>找到你感兴趣的模型，点击<strong className={accentClass}>"收藏"</strong>按钮</li>
                <li>进入<strong className={accentClass}>"个人中心"</strong> → 点击<strong className={accentClass}>"创建模型实例"</strong></li>
                <li>选择<strong className={accentClass}>"基于收藏模型"</strong></li>
                <li>从你的收藏列表中选择一个模型作为模板</li>
                <li>系统会自动继承模板的所有信息</li>
                <li>在此基础上进行修改和优化</li>
                <li>保存创建（系统会自动标识原创作者和二创作者）</li>
              </ol>
            </div>
          </div>
        </div>
      ),
      action: { label: '开始创建', href: '/persona-instance/create' }
    },
    {
      id: 3,
      title: '训练模型',
      icon: '🎯',
      content: (
        <div className="space-y-4">
          <p className="opacity-80">训练是提升模型表现的关键步骤，通过添加训练样本和调整参数来优化模型行为。</p>
          
          <div className="space-y-3">
            <div className={`p-4 rounded-lg ${cardClass}`}>
              <h4 className={`font-semibold mb-2 ${accentClass}`}>添加训练样本</h4>
              <p className="text-sm opacity-80 mb-2">训练样本是模型学习的"教材"，包含输入和期望的输出。</p>
              <ol className="list-decimal list-inside space-y-1 text-sm opacity-90 ml-2">
                <li>在创建页面或模型详情页的<strong className={accentClass}>"训练中心"</strong>部分</li>
                <li>填写<strong className={accentClass}>"输入"</strong>（用户的问题或场景）</li>
                <li>填写<strong className={accentClass}>"期望输出"</strong>（模型应该如何回答）</li>
                <li>可选：添加<strong className={accentClass}>"场景描述"</strong>（帮助模型理解上下文）</li>
                <li>点击<strong className={accentClass}>"添加样本"</strong>保存</li>
                <li>重复添加多个样本，样本越多，模型表现越好</li>
              </ol>
              <p className="text-xs opacity-70 mt-2">💡 提示：训练样本应该覆盖模型可能遇到的各种场景，包括正面和负面示例。</p>
            </div>

            <div className={`p-4 rounded-lg ${cardClass}`}>
              <h4 className={`font-semibold mb-2 ${accentClass}`}>调整模型参数</h4>
              <p className="text-sm opacity-80 mb-2">模型参数控制模型的行为特征，你可以根据需求调整。</p>
              <ul className="list-disc list-inside space-y-1 text-sm opacity-90 ml-2">
                <li><strong className={accentClass}>Temperature（温度）</strong>：控制输出的随机性，值越高越随机</li>
                <li><strong className={accentClass}>Top P</strong>：控制输出的多样性</li>
                <li><strong className={accentClass}>Top K</strong>：限制候选词的数量</li>
                <li><strong className={accentClass}>Max Tokens</strong>：限制输出的最大长度</li>
                <li><strong className={accentClass}>Epochs（训练轮数）</strong>：模型训练的迭代次数</li>
                <li><strong className={accentClass}>Learning Rate（学习率）</strong>：模型学习的速度</li>
              </ul>
              <p className="text-xs opacity-70 mt-2">💡 提示：初学者可以使用默认参数，高级用户可以开启"高级模式"进行精细调整。</p>
            </div>

            <div className={`p-4 rounded-lg ${cardClass}`}>
              <h4 className={`font-semibold mb-2 ${accentClass}`}>预览和测试</h4>
              <p className="text-sm opacity-80 mb-2">在正式使用前，先预览模型的表现。</p>
              <ol className="list-decimal list-inside space-y-1 text-sm opacity-90 ml-2">
                <li>在训练中心点击<strong className={accentClass}>"预览模型"</strong>按钮</li>
                <li>输入测试问题，查看模型的回答</li>
                <li>根据预览结果调整训练样本或参数</li>
                <li>重复测试直到满意为止</li>
              </ol>
            </div>
          </div>
        </div>
      ),
      action: { label: '前往训练', href: '/mbti' }
    },
    {
      id: 4,
      title: '收藏和使用模型',
      icon: '⭐',
      content: (
        <div className="space-y-3">
          <p className="opacity-80">你可以收藏其他用户公开的模型实例，用于学习、参考或二次开发。</p>
          <ol className="list-decimal list-inside space-y-2 opacity-90">
            <li>在<strong className={accentClass}>"开放实例"</strong>页面浏览公开的模型</li>
            <li>点击模型卡片上的<strong className={accentClass}>"收藏"</strong>按钮（⭐）</li>
            <li>收藏后，按钮会变为<strong className={accentClass}>"已收藏"</strong>状态</li>
            <li>你可以在模型详情页查看收藏的模型</li>
            <li>收藏的模型可以用于<strong className={accentClass}>"基于收藏模型创建"</strong>进行二次开发</li>
            <li>注意：每个公开模型每个用户只能收藏一次</li>
          </ol>
          <div className={`p-3 rounded-lg ${cardClass} mt-3`}>
            <p className="text-sm opacity-80">
              <strong className={accentClass}>权限说明：</strong>收藏的模型只能查看、二次开发和预览，不能编辑。这是为了保护原创作者的作品。
            </p>
          </div>
        </div>
      ),
      action: { label: '浏览公开实例', href: '/' }
    },
    {
      id: 5,
      title: '二次开发',
      icon: '🔧',
      content: (
        <div className="space-y-3">
          <p className="opacity-80">二次开发允许你在其他用户的作品基础上进行改进和创新。</p>
          <ol className="list-decimal list-inside space-y-2 opacity-90">
            <li>收藏一个你感兴趣的公开模型实例</li>
            <li>在模型详情页，如果这是你收藏的模型，会显示<strong className={accentClass}>"二次开发"</strong>按钮</li>
            <li>点击<strong className={accentClass}>"二次开发"</strong>，系统会创建一个新的模型实例</li>
            <li>新实例会继承原模型的所有信息（提示词、训练样本、参数等）</li>
            <li>你可以在继承的基础上进行修改和优化</li>
            <li>保存后，系统会自动标识<strong className={accentClass}>"原创作者"</strong>和<strong className={accentClass}>"二创作者"</strong></li>
            <li>你的二次开发作品也可以公开，让更多人看到你的创新</li>
          </ol>
          <div className={`p-3 rounded-lg ${cardClass} mt-3`}>
            <p className="text-sm opacity-80">
              <strong className={accentClass}>开发层级：</strong>系统会自动追踪开发层级，如果基于二次开发的作品再次开发，层级会递增，形成完整的开发链。
            </p>
          </div>
        </div>
      ),
      action: { label: '查看我的模型', href: '/me' }
    },
    {
      id: 6,
      title: '公开和分享',
      icon: '🌐',
      content: (
        <div className="space-y-3">
          <p className="opacity-80">将你的模型实例公开，让其他用户可以看到、收藏和基于你的作品进行二次开发。</p>
          <ol className="list-decimal list-inside space-y-2 opacity-90">
            <li>在创建模型实例时，勾选<strong className={accentClass}>"公开此模型实例"</strong></li>
            <li>或者，在模型详情页的<strong className={accentClass}>"编辑信息"</strong>中修改公开状态</li>
            <li>公开的模型会出现在<strong className={accentClass}>"开放实例"</strong>页面</li>
            <li>其他用户可以查看、收藏和基于你的模型进行二次开发</li>
            <li>你可以选择是否公开训练集（训练样本）</li>
            <li>如果公开训练集，其他用户可以看到你的训练数据，有助于学习和参考</li>
          </ol>
          <div className={`p-3 rounded-lg ${cardClass} mt-3`}>
            <p className="text-sm opacity-80">
              <strong className={accentClass}>作者信息：</strong>公开的模型会显示作者信息。如果是二次开发的作品，会同时显示原创作者和二创作者信息，确保创作贡献得到认可。
            </p>
          </div>
        </div>
      ),
      action: { label: '查看公开实例', href: '/' }
    },
    {
      id: 7,
      title: '管理模型和训练集',
      icon: '📋',
      content: (
        <div className="space-y-4">
          <p className="opacity-80">通过用户下拉菜单，你可以方便地管理你的模型实例和训练集。</p>
          
          <div className="space-y-3">
            <div className={`p-4 rounded-lg ${cardClass}`}>
              <h4 className={`font-semibold mb-2 ${accentClass}`}>模型实例管理</h4>
              <p className="text-sm opacity-80 mb-2">统一管理你创建的所有模型实例。</p>
              <ol className="list-decimal list-inside space-y-1 text-sm opacity-90 ml-2">
                <li>点击右上角头像，打开用户下拉菜单</li>
                <li>选择<strong className={accentClass}>"模型实例管理"</strong></li>
                <li>查看所有你创建的模型实例（包括原创和二次开发的）</li>
                <li>可以查看详情、删除不需要的实例</li>
                <li>快速创建新实例</li>
              </ol>
              <p className="text-xs opacity-70 mt-2">💡 提示：在这里你可以一目了然地看到所有模型的状态，包括是否公开、是否已训练等。</p>
            </div>

            <div className={`p-4 rounded-lg ${cardClass}`}>
              <h4 className={`font-semibold mb-2 ${accentClass}`}>训练集管理</h4>
              <p className="text-sm opacity-80 mb-2">统一管理你的所有训练样本。</p>
              <ol className="list-decimal list-inside space-y-1 text-sm opacity-90 ml-2">
                <li>点击右上角头像，打开用户下拉菜单</li>
                <li>选择<strong className={accentClass}>"训练集管理"</strong></li>
                <li>查看所有训练样本，支持按人格类型筛选</li>
                <li>可以筛选已发布模型使用的样本和未使用的样本</li>
                <li>删除不需要的训练样本</li>
              </ol>
              <p className="text-xs opacity-70 mt-2">💡 提示：通过筛选功能，你可以快速找到特定人格的训练样本，或者查看哪些样本已经被公开模型使用。</p>
            </div>
          </div>
        </div>
      ),
      action: { label: '管理我的模型', href: '/me/instances' }
    },
    {
      id: 8,
      title: '持续优化',
      icon: '📈',
      content: (
        <div className="space-y-3">
          <p className="opacity-80">模型训练是一个持续的过程，需要不断优化和改进。</p>
          <ul className="list-disc list-inside space-y-2 opacity-90">
            <li><strong className={accentClass}>定期添加训练样本：</strong>根据实际使用情况，添加新的训练样本来改进模型表现</li>
            <li><strong className={accentClass}>调整参数：</strong>根据模型的表现，微调参数以获得更好的效果</li>
            <li><strong className={accentClass}>收集反馈：</strong>通过预览和实际使用，收集反馈并持续改进</li>
            <li><strong className={accentClass}>学习他人作品：</strong>浏览公开实例，学习其他用户的优秀实践</li>
            <li><strong className={accentClass}>二次开发：</strong>基于优秀的公开模型进行二次开发，站在巨人的肩膀上</li>
            <li><strong className={accentClass}>使用管理功能：</strong>通过模型实例管理和训练集管理，高效组织你的作品</li>
          </ul>
          <div className={`p-3 rounded-lg ${cardClass} mt-3`}>
            <p className="text-sm opacity-80">
              <strong className={accentClass}>💡 小贴士：</strong>好的模型需要时间和耐心。不要急于求成，逐步完善你的训练样本和参数设置，你会看到模型的表现越来越好。
            </p>
          </div>
        </div>
      ),
      action: { label: '开始优化', href: '/me' }
    }
  ];

  return (
    <div className="min-h-screen pb-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-8">
        <SectionHeader 
          title="歪比宇宙使用教程" 
          subtitle="快速上手，从零开始创建和训练你的AI模型实例"
          icon="📚"
        />

        <div className="space-y-6 mt-8">
          {steps.map((step, index) => (
            <div key={step.id} className={`${panelClass} rounded-xl p-6 shadow-lg`}>
              <div className="flex items-start gap-4 mb-4">
                <div className={`text-4xl flex-shrink-0 ${accentClass}`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-sm font-bold ${accentClass} bg-opacity-20 px-2 py-1 rounded`}>
                      步骤 {step.id}
                    </span>
                    <h2 className="text-xl font-bold pixel-text">{step.title}</h2>
                  </div>
                  <div className="opacity-90">
                    {step.content}
                  </div>
                  {step.action && (
                    <div className="mt-4">
                      <button
                        onClick={() => router.push(step.action!.href)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${buttonClass} hover:scale-105`}
                      >
                        {step.action.label} →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 快速链接 */}
        <div className={`${panelClass} rounded-xl p-6 mt-8`}>
          <h3 className={`text-lg font-bold mb-4 ${accentClass} pixel-text`}>
            🚀 快速链接
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link 
              href="/persona-instance/create"
              className={`${cardClass} p-4 rounded-lg transition-all hover:scale-[1.02]`}
            >
              <div className="font-semibold mb-1">✨ 创建模型实例</div>
              <div className="text-sm opacity-80">开始创建你的第一个模型</div>
            </Link>
            <Link 
              href="/mbti"
              className={`${cardClass} p-4 rounded-lg transition-all hover:scale-[1.02]`}
            >
              <div className="font-semibold mb-1">🎯 训练中心</div>
              <div className="text-sm opacity-80">基于MBTI人格进行训练</div>
            </Link>
            <Link 
              href="/"
              className={`${cardClass} p-4 rounded-lg transition-all hover:scale-[1.02]`}
            >
              <div className="font-semibold mb-1">⭐ 开放实例</div>
              <div className="text-sm opacity-80">浏览其他用户的优秀作品</div>
            </Link>
            <Link 
              href="/me"
              className={`${cardClass} p-4 rounded-lg transition-all hover:scale-[1.02]`}
            >
              <div className="font-semibold mb-1">👤 个人中心</div>
              <div className="text-sm opacity-80">管理你的模型和设置</div>
            </Link>
            <Link 
              href="/me/instances"
              className={`${cardClass} p-4 rounded-lg transition-all hover:scale-[1.02]`}
            >
              <div className="font-semibold mb-1">🤖 模型实例管理</div>
              <div className="text-sm opacity-80">统一管理所有模型实例</div>
            </Link>
            <Link 
              href="/me/training-samples"
              className={`${cardClass} p-4 rounded-lg transition-all hover:scale-[1.02]`}
            >
              <div className="font-semibold mb-1">📚 训练集管理</div>
              <div className="text-sm opacity-80">管理所有训练样本</div>
            </Link>
          </div>
        </div>

        {/* 帮助提示 */}
        <div className={`${panelClass} rounded-xl p-6 mt-8`}>
          <h3 className={`text-lg font-bold mb-4 ${accentClass} pixel-text`}>
            💡 需要帮助？
          </h3>
          <div className="space-y-2 opacity-80">
            <p>如果你在使用过程中遇到问题，可以：</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>查看<Link href="/about" className={`underline ${accentClass}`}>关于页面</Link>了解更多信息</li>
              <li>在<Link href="/guestbook" className={`underline ${accentClass}`}>留言板</Link>提问或分享经验</li>
              <li>浏览公开实例，学习其他用户的优秀实践</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

