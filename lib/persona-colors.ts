// lib/persona-colors.ts
// 人格颜色映射工具函数

export type PersonaColorGroup = 'nt' | 'nf' | 'st' | 'sf';
export type ThemeMode = 'waibi' | 'rational';

export interface PersonaColors {
  border: string;
  borderHover: string;
  bg: string;
  bgHover: string;
  text: string;
  accent: string;
  focus: string;
  shadow: string;
  shadowHover: string;
}

// NT组合：INTJ, INTP, ENTJ, ENTP - 紫色
const NT_PERSONAS = ['INTJ', 'INTP', 'ENTJ', 'ENTP'];

// NF组合：INFJ, INFP, ENFJ, ENFP - 绿色
const NF_PERSONAS = ['INFJ', 'INFP', 'ENFJ', 'ENFP'];

// ST组合：ISTJ, ISFJ, ESTJ, ESFJ - 蓝色
const ST_PERSONAS = ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'];

// SF组合：ISFP, ISTP, ESFP, ESTP - 黄色
const SF_PERSONAS = ['ISFP', 'ISTP', 'ESFP', 'ESTP'];

/**
 * 根据人格名称获取颜色组
 */
export function getPersonaColorGroup(personaName: string): PersonaColorGroup {
  const name = personaName.toUpperCase();
  if (NT_PERSONAS.includes(name)) return 'nt';
  if (NF_PERSONAS.includes(name)) return 'nf';
  if (ST_PERSONAS.includes(name)) return 'st';
  if (SF_PERSONAS.includes(name)) return 'sf';
  return 'nf'; // 默认返回nf
}

/**
 * 根据人格名称和主题模式获取颜色类名
 */
export function getPersonaColors(personaName: string, mode: ThemeMode): PersonaColors {
  const group = getPersonaColorGroup(personaName);
  
  if (mode === 'waibi') {
    switch (group) {
      case 'nt': // 紫色
        return {
          border: 'border-purple-400/30',
          borderHover: 'border-purple-400/50',
          bg: 'bg-purple-400',
          bgHover: 'bg-purple-500',
          text: 'text-purple-300',
          accent: 'text-purple-300',
          focus: 'focus:ring-purple-400/50',
          shadow: 'shadow-purple-400/30',
          shadowHover: 'shadow-purple-400/50',
        };
      case 'nf': // 绿色
        return {
          border: 'border-emerald-400/30',
          borderHover: 'border-emerald-400/50',
          bg: 'bg-emerald-400',
          bgHover: 'bg-emerald-500',
          text: 'text-emerald-300',
          accent: 'text-emerald-300',
          focus: 'focus:ring-emerald-400/50',
          shadow: 'shadow-emerald-400/30',
          shadowHover: 'shadow-emerald-400/50',
        };
      case 'st': // 蓝色
        return {
          border: 'border-blue-400/30',
          borderHover: 'border-blue-400/50',
          bg: 'bg-blue-400',
          bgHover: 'bg-blue-500',
          text: 'text-blue-300',
          accent: 'text-blue-300',
          focus: 'focus:ring-blue-400/50',
          shadow: 'shadow-blue-400/30',
          shadowHover: 'shadow-blue-400/50',
        };
      case 'sf': // 黄色
        return {
          border: 'border-amber-400/30',
          borderHover: 'border-amber-400/50',
          bg: 'bg-amber-400',
          bgHover: 'bg-amber-500',
          text: 'text-amber-300',
          accent: 'text-amber-300',
          focus: 'focus:ring-amber-400/50',
          shadow: 'shadow-amber-400/30',
          shadowHover: 'shadow-amber-400/50',
        };
    }
  } else {
    // rational 模式
    switch (group) {
      case 'nt': // 紫色
        return {
          border: 'border-purple-500',
          borderHover: 'border-purple-600',
          bg: 'bg-purple-500',
          bgHover: 'bg-purple-600',
          text: 'text-purple-700',
          accent: 'text-purple-700',
          focus: 'focus:ring-purple-500',
          shadow: 'shadow-purple-500/20',
          shadowHover: 'shadow-purple-500/40',
        };
      case 'nf': // 绿色
        return {
          border: 'border-emerald-500',
          borderHover: 'border-emerald-600',
          bg: 'bg-emerald-500',
          bgHover: 'bg-emerald-600',
          text: 'text-emerald-700',
          accent: 'text-emerald-700',
          focus: 'focus:ring-emerald-500',
          shadow: 'shadow-emerald-500/20',
          shadowHover: 'shadow-emerald-500/40',
        };
      case 'st': // 蓝色
        return {
          border: 'border-blue-500',
          borderHover: 'border-blue-600',
          bg: 'bg-blue-500',
          bgHover: 'bg-blue-600',
          text: 'text-blue-700',
          accent: 'text-blue-700',
          focus: 'focus:ring-blue-500',
          shadow: 'shadow-blue-500/20',
          shadowHover: 'shadow-blue-500/40',
        };
      case 'sf': // 黄色
        return {
          border: 'border-amber-500',
          borderHover: 'border-amber-600',
          bg: 'bg-amber-500',
          bgHover: 'bg-amber-600',
          text: 'text-amber-700',
          accent: 'text-amber-700',
          focus: 'focus:ring-amber-500',
          shadow: 'shadow-amber-500/20',
          shadowHover: 'shadow-amber-500/40',
        };
    }
  }
}

/**
 * 获取按钮样式类名（包含渐变和阴影）
 */
export function getPersonaButtonClasses(personaName: string, mode: ThemeMode): string {
  const colors = getPersonaColors(personaName, mode);
  const group = getPersonaColorGroup(personaName);
  
  if (mode === 'waibi') {
    switch (group) {
      case 'nt':
        return `bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg ${colors.shadow} hover:${colors.shadowHover} transition-all duration-200`;
      case 'nf':
        return `bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg ${colors.shadow} hover:${colors.shadowHover} transition-all duration-200`;
      case 'st':
        return `bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg ${colors.shadow} hover:${colors.shadowHover} transition-all duration-200`;
      case 'sf':
        return `bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg ${colors.shadow} hover:${colors.shadowHover} transition-all duration-200`;
    }
  } else {
    switch (group) {
      case 'nt':
        return `bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg ${colors.shadow} hover:${colors.shadowHover} transition-all duration-200`;
      case 'nf':
        return `bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg ${colors.shadow} hover:${colors.shadowHover} transition-all duration-200`;
      case 'st':
        return `bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg ${colors.shadow} hover:${colors.shadowHover} transition-all duration-200`;
      case 'sf':
        return `bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg ${colors.shadow} hover:${colors.shadowHover} transition-all duration-200`;
    }
  }
}

/**
 * 获取卡片样式类名
 */
export function getPersonaCardClasses(personaName: string, mode: ThemeMode): string {
  const colors = getPersonaColors(personaName, mode);
  if (mode === 'waibi') {
    return `bg-gray-900/50 ${colors.border} hover:${colors.borderHover} transition-all`;
  } else {
    return `bg-gray-50 ${colors.border} hover:${colors.borderHover} transition-all`;
  }
}

