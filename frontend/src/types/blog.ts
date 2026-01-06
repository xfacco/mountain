// Blog Post Type
export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string; // HTML content
    coverImage: string;
    author: string;
    publishedAt: any; // Firestore Timestamp
    updatedAt: any; // Firestore Timestamp
    status: 'draft' | 'published';
    metaTitle?: string;
    metaDescription?: string;
    tags?: string[];
    readingTime?: number; // minutes
}
