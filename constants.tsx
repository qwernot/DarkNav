import { AppData, Category } from './types';
import { 
  LayoutGrid, Code, Palette, BookOpen, Coffee, 
  Briefcase, Music, Video, ShoppingBag, Heart, 
  Star, Settings, Home, Gamepad2, Folder,
  Cloud, Zap, Globe
} from 'lucide-react';

export const INITIAL_DATA: AppData = {
  categories: [
    {
      id: 'c1',
      title: '日常办公',
      iconName: 'Coffee',
      items: [
        { id: 'l1', title: 'Gmail', url: 'https://mail.google.com', icon: 'https://favicon.yandex.net/favicon/mail.google.com' },
        { id: 'l2', title: 'Bilibili', url: 'https://www.bilibili.com', icon: 'https://favicon.yandex.net/favicon/www.bilibili.com' },
        { id: 'l3', title: 'Notion', url: 'https://www.notion.so', icon: 'https://favicon.yandex.net/favicon/www.notion.so' },
      ]
    },
    {
      id: 'c2',
      title: '开发工具',
      iconName: 'Code',
      items: [
        { id: 'l4', title: 'GitHub', url: 'https://github.com', icon: 'https://favicon.yandex.net/favicon/github.com' },
        { id: 'l5', title: 'Stack Overflow', url: 'https://stackoverflow.com', icon: 'https://favicon.yandex.net/favicon/stackoverflow.com' },
        { id: 'l6', title: 'ChatGPT', url: 'https://chat.openai.com', icon: 'https://favicon.yandex.net/favicon/openai.com' },
      ]
    },
    {
      id: 'c3',
      title: '设计灵感',
      iconName: 'Palette',
      items: [
        { id: 'l7', title: 'Dribbble', url: 'https://dribbble.com', icon: 'https://favicon.yandex.net/favicon/dribbble.com' },
        { id: 'l8', title: 'Figma', url: 'https://www.figma.com', icon: 'https://favicon.yandex.net/favicon/www.figma.com' },
        { id: 'l9', title: 'Behance', url: 'https://www.behance.net', icon: 'https://favicon.yandex.net/favicon/www.behance.net' },
      ]
    },
    {
      id: 'c4',
      title: '阅读学习',
      iconName: 'BookOpen',
      items: [
        { id: 'l10', title: 'Medium', url: 'https://medium.com', icon: 'https://favicon.yandex.net/favicon/medium.com' },
        { id: 'l11', title: 'Dev.to', url: 'https://dev.to', icon: 'https://favicon.yandex.net/favicon/dev.to' },
      ]
    }
  ]
};

export const ICON_MAP: Record<string, any> = {
  LayoutGrid,
  Code,
  Palette,
  BookOpen,
  Coffee,
  Briefcase,
  Music,
  Video,
  ShoppingBag,
  Heart,
  Star,
  Settings,
  Home,
  Gamepad2,
  Folder,
  Cloud,
  Zap,
  Globe
};