'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Calendar, Clock, ArrowLeft, Share2, Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { BlogPost } from '@/types/blog';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function BlogPostClient({ slug }: { slug: string }) {
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
    const router = useRouter();
    const t = useTranslations('Blog');

    useEffect(() => {
        const fetchPost = async () => {
            try {
                if (!slug) {
                    setLoading(false);
                    return;
                }

                // Fetch the post
                const q = query(
                    collection(db, 'blog_posts'),
                    where('slug', '==', slug)
                );

                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    router.push('/blog');
                    return;
                }

                const postData = snapshot.docs[0].data() as BlogPost;

                // Only show if published (or handle draft preview if needed in future)
                if (postData.status !== 'published') {
                    router.push('/blog');
                    return;
                }

                const fetchedPost = {
                    ...postData,
                    id: snapshot.docs[0].id,
                };

                setPost(fetchedPost);

                // Fetch related posts (same tags)
                if (fetchedPost.tags && fetchedPost.tags.length > 0) {
                    try {
                        const relatedQuery = query(
                            collection(db, 'blog_posts'),
                            orderBy('updatedAt', 'desc'),
                            limit(10) // Fetch more to allow for filtering current post and non-published ones
                        );

                        const relatedSnapshot = await getDocs(relatedQuery);
                        const related = relatedSnapshot.docs
                            .map(doc => ({ id: doc.id, ...doc.data() } as BlogPost))
                            .filter(p => p.id !== fetchedPost.id && p.status === 'published')
                            .slice(0, 3);

                        setRelatedPosts(related);
                    } catch (relatedError) {
                        console.error('Error fetching related posts:', relatedError);
                    }
                }
            } catch (error) {
                console.error('Error fetching blog post:', error);
                router.push('/blog');
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [slug, router]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    };

    const handleShare = async () => {
        if (navigator.share && post) {
            try {
                await navigator.share({
                    title: post.title,
                    text: post.excerpt,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="pt-32 pb-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p className="mt-4 text-slate-600">{t('loading')}</p>
                    </div>
                </div>
            </main>
        );
    }

    if (!post) {
        return null;
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />

            <article className="pt-32 pb-12">
                {/* Back Button */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                    <button
                        onClick={() => router.push('/blog')}
                        className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors font-medium"
                    >
                        <ArrowLeft size={20} />
                        {t('back_to_blog')}
                    </button>
                </div>

                {/* Hero Image */}
                {post.coverImage && (
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                        <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
                            <img
                                src={post.coverImage}
                                alt={post.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {post.tags.map((tag, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 text-sm font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full flex items-center gap-1"
                                >
                                    <Tag size={14} />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                        {post.title}
                    </h1>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-6 text-slate-600 mb-8 pb-8 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                            <Calendar size={18} />
                            <span>{formatDate(post.publishedAt)}</span>
                        </div>
                        {post.readingTime && (
                            <div className="flex items-center gap-2">
                                <Clock size={18} />
                                <span>{post.readingTime} min read</span>
                            </div>
                        )}
                        {post.author && (
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">{post.author}</span>
                            </div>
                        )}
                        <button
                            onClick={handleShare}
                            className="ml-auto flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            <Share2 size={18} />
                            {t('share')}
                        </button>
                    </div>

                    {/* Article Content */}
                    <div
                        className="prose prose-lg prose-slate max-w-none
                            prose-headings:font-bold prose-headings:text-slate-900
                            prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                            prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                            prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-6
                            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                            prose-strong:text-slate-900 prose-strong:font-bold
                            prose-ul:my-6 prose-ol:my-6
                            prose-li:text-slate-700 prose-li:my-2
                            prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8
                            prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-slate-600"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </div>

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-16 border-t border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8">{t('related_posts')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {relatedPosts.map((relatedPost) => (
                                <a
                                    key={relatedPost.id}
                                    href={`/blog/${relatedPost.slug}`}
                                    className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-slate-100"
                                >
                                    {relatedPost.coverImage && (
                                        <div className="relative h-32 overflow-hidden bg-slate-200">
                                            <img
                                                src={relatedPost.coverImage}
                                                alt={relatedPost.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                                            {relatedPost.title}
                                        </h3>
                                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                                            {relatedPost.excerpt}
                                        </p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </article>
        </main>
    );
}
