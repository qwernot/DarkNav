export interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string; // URL to icon or Lucide icon name
  description?: string;
}

export interface Category {
  id: string;
  title: string;
  iconName: string; // Lucide icon name
  items: LinkItem[];
}

export interface AppData {
  categories: Category[];
}

export type SearchEngine = 'google' | 'bing' | 'baidu';

export const ADMIN_PASSWORD = "666333";