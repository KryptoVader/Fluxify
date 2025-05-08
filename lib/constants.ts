import { SupportedFormat } from './types';

export const APP_NAME = "Fluxify";
export const APP_DESCRIPTION = "Convert any file to any format with ease";
export const APP_TAGLINE = "File conversion reimagined";

export const SUPPORTED_FORMATS: SupportedFormat[] = [
  {
    extension: 'docx',
    name: 'Word Document',
    category: 'document',
    icon: 'file-text',
    description: 'Microsoft Word Document',
    canConvertTo: ['pdf', 'txt', 'html', 'odt', 'rtf', 'md'],
  },
  {
    extension: 'xlsx',
    name: 'Excel Spreadsheet',
    category: 'document',
    icon: 'table',
    description: 'Microsoft Excel Spreadsheet',
    canConvertTo: ['csv', 'pdf', 'html', 'ods', 'json'],
  },
  {
    extension: 'pdf',
    name: 'PDF Document',
    category: 'document',
    icon: 'file',
    description: 'Portable Document Format',
    canConvertTo: ['docx', 'txt', 'html', 'jpg', 'png'],
  },
  {
    extension: 'jpg',
    name: 'JPEG Image',
    category: 'image',
    icon: 'image',
    description: 'JPEG Image Format',
    canConvertTo: ['png', 'webp', 'gif', 'bmp', 'tiff', 'pdf'],
  },
  {
    extension: 'png',
    name: 'PNG Image',
    category: 'image',
    icon: 'image',
    description: 'Portable Network Graphics',
    canConvertTo: ['jpg', 'webp', 'gif', 'bmp', 'tiff', 'pdf'],
  },
  {
    extension: 'mp4',
    name: 'MP4 Video',
    category: 'video',
    icon: 'video',
    description: 'MPEG-4 Video Format',
    canConvertTo: ['avi', 'mov', 'webm', 'mkv', 'gif'],
  },
  {
    extension: 'mp3',
    name: 'MP3 Audio',
    category: 'audio',
    icon: 'music',
    description: 'MPEG-3 Audio Format',
    canConvertTo: ['wav', 'ogg', 'flac', 'm4a', 'aac'],
  },
  {
    extension: 'zip',
    name: 'ZIP Archive',
    category: 'archive',
    icon: 'folder',
    description: 'ZIP Compressed Archive',
    canConvertTo: ['7z', 'rar', 'tar', 'gz'],
  },
];

export const COLOR_THEMES = {
  light: {
    primary: {
      50: '#eef4ff',
      100: '#d9e6ff',
      200: '#bcd3ff',
      300: '#8ab7ff',
      400: '#5590ff',
      500: '#2d7ff9',
      600: '#0a84ff',
      700: '#0270e5',
      800: '#0958b2',
      900: '#0d4a8d',
    },
    accent: {
      50: '#f3f1ff',
      100: '#e9e5ff',
      200: '#d6ceff',
      300: '#b9a7ff',
      400: '#967aff',
      500: '#7b56f6',
      600: '#5e5ce6',
      700: '#5746c5',
      800: '#433989',
      900: '#38306f',
    },
  },
  dark: {
    primary: {
      50: '#0d4a8d',
      100: '#0958b2',
      200: '#0270e5',
      300: '#0a84ff',
      400: '#2d7ff9',
      500: '#5590ff',
      600: '#8ab7ff',
      700: '#bcd3ff',
      800: '#d9e6ff',
      900: '#eef4ff',
    },
    accent: {
      50: '#38306f',
      100: '#433989',
      200: '#5746c5',
      300: '#5e5ce6',
      400: '#7b56f6',
      500: '#967aff',
      600: '#b9a7ff',
      700: '#d6ceff',
      800: '#e9e5ff',
      900: '#f3f1ff',
    },
  },
};

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB