
import { AppData, Category } from './types';
import { 
  LayoutGrid, Code, Palette, BookOpen, Coffee, 
  Briefcase, Music, Video, ShoppingBag, Heart, 
  Star, Settings, Home, Gamepad2, Folder,
  Cloud, Zap, Globe
} from 'lucide-react';

export const INITIAL_DATA: AppData = {
  adminPassword: "666333", // Default password
  categories: []
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
