import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogPostClient from './BlogPostClient';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Generate static params for all published blog posts
export async function generateStaticParams() {
    try {
        const q = query(
            collection(db, 'blog_posts'),
            where('status', '==', 'published')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({
                slug: doc.data().slug
            }))
            .filter(item => item.slug); // Filter out any missing slugs
    } catch (error) {
        console.error('Error generating static params:', error);
        return [];
    }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
    // Handle both Next.js 14 (object) and Next.js 15 (promise)
    const resolvedParams = await params;
    const slug = resolvedParams?.slug;

    if (!slug) {
        return { title: 'Post Not Found' };
    }

    try {
        const q = query(
            collection(db, 'blog_posts'),
            where('slug', '==', slug)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return {
                title: 'Post Not Found',
            };
        }

        const post = snapshot.docs[0].data();

        return {
            title: post.metaTitle || post.title,
            description: post.metaDescription || post.excerpt,
            openGraph: {
                title: post.metaTitle || post.title,
                description: post.metaDescription || post.excerpt,
                images: post.coverImage ? [post.coverImage] : [],
                type: 'article',
                publishedTime: post.publishedAt?.toDate?.()?.toISOString(),
            },
            twitter: {
                card: 'summary_large_image',
                title: post.metaTitle || post.title,
                description: post.metaDescription || post.excerpt,
                images: post.coverImage ? [post.coverImage] : [],
            },
        };
    } catch (error) {
        console.error('Error generating metadata:', error);
        return {
            title: 'Blog Post',
        };
    }
}

export default async function BlogPostPage({ params }: { params: any }) {
    // Handle both Next.js 14 (object) and Next.js 15 (promise)
    const resolvedParams = await params;
    const slug = resolvedParams?.slug;

    if (!slug) {
        return notFound();
    }

    return <BlogPostClient slug={slug} />;
}
