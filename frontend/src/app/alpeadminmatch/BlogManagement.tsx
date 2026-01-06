'use client';

import { useState, useEffect } from 'react';
import { Save, X, Eye, Plus, Edit2, Trash2, Calendar, Clock, Tag, Image as ImageIcon, FileText, CheckCircle, Bold, Italic, Underline, List, Link as LinkIcon, Type, Upload, Loader2 } from 'lucide-react';
import type { BlogPost } from '@/types/blog';
import { collection, getDocs, orderBy, query, doc, deleteDoc, setDoc, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function BlogManagement() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const q = query(collection(db, 'blog_posts'), orderBy('updatedAt', 'desc'));
            const snapshot = await getDocs(q);

            const fetchedPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as BlogPost[];

            setPosts(fetchedPosts);
        } catch (error) {
            console.error('Error fetching blog posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        const newPost: BlogPost = {
            id: '',
            title: '',
            slug: '',
            excerpt: '',
            content: '',
            coverImage: '',
            author: 'Admin',
            publishedAt: null,
            updatedAt: null,
            status: 'draft',
            metaTitle: '',
            metaDescription: '',
            tags: [],
            readingTime: 0
        };
        setEditingPost(newPost);
        setIsCreating(true);
    };

    const handleEdit = (post: BlogPost) => {
        setEditingPost(post);
        setIsCreating(false);
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Sei sicuro di voler eliminare "${title}"?`)) return;

        try {
            await deleteDoc(doc(db, 'blog_posts', id));
            setPosts(prev => prev.filter(p => p.id !== id));
            alert('Articolo eliminato con successo!');
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Errore durante l\'eliminazione.');
        }
    };

    const handleCancel = () => {
        setEditingPost(null);
        setIsCreating(false);
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Mai';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('it-IT', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (editingPost) {
        return <BlogEditor post={editingPost} isCreating={isCreating} onSave={() => { fetchPosts(); handleCancel(); }} onCancel={handleCancel} />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Gestione Blog</h2>
                    <p className="text-slate-600 text-sm mt-1">Crea e gestisci gli articoli del blog</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 font-medium shadow-sm"
                >
                    <Plus size={18} />
                    Nuovo Articolo
                </button>
            </div>

            {/* Posts List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Caricamento articoli...</div>
                ) : posts.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-600 font-medium">Nessun articolo trovato</p>
                        <p className="text-slate-400 text-sm mt-1">Inizia creando il tuo primo articolo</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4 text-left">Articolo</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-left">Tags</th>
                                <th className="px-6 py-4 text-left">Pubblicato</th>
                                <th className="px-6 py-4 text-left">Aggiornato</th>
                                <th className="px-6 py-4 text-right">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {posts.map((post) => (
                                <tr key={post.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {post.coverImage && (
                                                <img
                                                    src={post.coverImage}
                                                    alt={post.title}
                                                    className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                                                />
                                            )}
                                            <div>
                                                <div className="font-semibold text-slate-900">{post.title || 'Senza titolo'}</div>
                                                <div className="text-sm text-slate-500 line-clamp-1">{post.excerpt}</div>
                                                <div className="text-xs text-slate-400 mt-1">/{post.slug}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${post.status === 'published'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {post.status === 'published' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                            {post.status === 'published' ? 'Pubblicato' : 'Bozza'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {post.tags && post.tags.length > 0 ? (
                                                post.tags.slice(0, 2).map((tag, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                                                        {tag}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 text-xs">-</span>
                                            )}
                                            {post.tags && post.tags.length > 2 && (
                                                <span className="text-slate-400 text-xs">+{post.tags.length - 2}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {formatDate(post.publishedAt)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {formatDate(post.updatedAt)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {post.status === 'published' && (
                                                <a
                                                    href={`/blog/${post.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Visualizza"
                                                >
                                                    <Eye size={16} />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleEdit(post)}
                                                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Modifica"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(post.id, post.title)}
                                                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Elimina"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function BlogEditor({ post, isCreating, onSave, onCancel }: { post: BlogPost; isCreating: boolean; onSave: () => void; onCancel: () => void }) {
    const [formData, setFormData] = useState(post);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const calculateReadingTime = (html: string) => {
        const text = html.replace(/<[^>]*>/g, '');
        const words = text.split(/\s+/).length;
        return Math.ceil(words / 200); // 200 words per minute
    };

    const handleChange = (field: keyof BlogPost, value: any) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };

            // Auto-generate slug from title
            if (field === 'title' && isCreating) {
                updated.slug = generateSlug(value);
            }

            // Auto-calculate reading time from content
            if (field === 'content') {
                updated.readingTime = calculateReadingTime(value);
            }

            return updated;
        });
    };

    const handleTagsChange = (tagsString: string) => {
        const tags = tagsString.split(',').map(t => t.trim()).filter(t => t.length > 0);
        setFormData(prev => ({ ...prev, tags }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check if file is image
        if (!file.type.startsWith('image/')) {
            alert('Per favore carica solo immagini.');
            return;
        }

        // Check size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('L\'immagine è troppo grande. Massimo 5MB.');
            return;
        }

        setUploadingImage(true);
        try {
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const storageRef = ref(storage, `blog_images/${fileName}`);

            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            handleChange('coverImage', downloadURL);
        } catch (error: any) {
            console.error('Error uploading image:', error);
            alert(`Errore durante il caricamento dell'immagine: ${error.message}`);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async (publish: boolean = false) => {
        if (!formData.title || !formData.slug || !formData.content) {
            alert('Compila almeno Titolo, Slug e Contenuto');
            return;
        }

        setSaving(true);
        try {
            const dataToSave: any = {
                ...formData,
                status: publish ? 'published' : 'draft',
                updatedAt: serverTimestamp(),
                publishedAt: publish && !formData.publishedAt ? serverTimestamp() : formData.publishedAt
            };

            if (isCreating) {
                // Remove ID for creation to let Firestore auto-generate it
                delete dataToSave.id;
                dataToSave.createdAt = serverTimestamp();
                await addDoc(collection(db, 'blog_posts'), dataToSave);
            } else {
                const { id, ...updateData } = dataToSave;
                await setDoc(doc(db, 'blog_posts', id), updateData, { merge: true });
            }

            alert(publish ? 'Articolo pubblicato con successo!' : 'Bozza salvata con successo!');
            onSave();
        } catch (error: any) {
            console.error('Error saving post:', error);
            alert(`Errore durante il salvataggio: ${error.message || error}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        {isCreating ? 'Nuovo Articolo' : 'Modifica Articolo'}
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">
                        {formData.slug && `/${formData.slug}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onCancel}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                        disabled={saving}
                    >
                        <X size={18} />
                        Annulla
                    </button>
                    <button
                        onClick={() => handleSave(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-medium"
                        disabled={saving}
                    >
                        <Save size={18} />
                        Salva Bozza
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                        disabled={saving}
                    >
                        <CheckCircle size={18} />
                        Pubblica
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'content'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        Contenuto
                    </button>
                    <button
                        onClick={() => setActiveTab('seo')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'seo'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        SEO & Meta
                    </button>
                </div>
            </div>

            {/* Content Tab */}
            {activeTab === 'content' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Titolo *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-lg font-semibold"
                            placeholder="Inserisci il titolo dell'articolo"
                        />
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Slug URL *
                        </label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => handleChange('slug', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-mono text-sm"
                            placeholder="slug-articolo"
                        />
                        <p className="text-xs text-slate-500 mt-1">URL: /blog/{formData.slug}</p>
                    </div>

                    {/* Excerpt */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Estratto (Anteprima)
                        </label>
                        <textarea
                            value={formData.excerpt}
                            onChange={(e) => handleChange('excerpt', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                            placeholder="Breve descrizione dell'articolo (max 200 caratteri)"
                            maxLength={200}
                        />
                        <p className="text-xs text-slate-500 mt-1">{formData.excerpt.length}/200 caratteri</p>
                    </div>

                    {/* Cover Image */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            <ImageIcon size={16} className="inline mr-1" />
                            Immagine di Copertina *
                        </label>
                        <div className="flex gap-4 items-start">
                            <div className="flex-1 space-y-2">
                                <input
                                    type="url"
                                    value={formData.coverImage}
                                    onChange={(e) => handleChange('coverImage', e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                                    placeholder="https://esempio.com/immagine.jpg"
                                />
                                <div className="flex items-center gap-2">
                                    <label className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-all font-medium text-xs ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                                        {uploadingImage ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Upload size={14} />
                                        )}
                                        {uploadingImage ? 'Caricamento...' : 'Carica Immagine'}
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploadingImage}
                                        />
                                    </label>
                                    <span className="text-[10px] text-slate-400 font-medium">PNG, JPG, WebP fino a 5MB</span>
                                </div>
                            </div>
                            {formData.coverImage && (
                                <div className="relative group shrink-0">
                                    <img
                                        src={formData.coverImage}
                                        alt="Preview"
                                        className="w-32 h-20 object-cover rounded-lg border border-slate-200 shadow-sm"
                                    />
                                    <button
                                        onClick={() => handleChange('coverImage', '')}
                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            <Tag size={16} className="inline mr-1" />
                            Tags (separati da virgola)
                        </label>
                        <input
                            type="text"
                            value={formData.tags?.join(', ') || ''}
                            onChange={(e) => handleTagsChange(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            placeholder="montagna, sci, trekking"
                        />
                    </div>

                    {/* Content HTML Editor */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Contenuto HTML *
                        </label>
                        <RichTextEditor
                            value={formData.content}
                            onChange={(html) => handleChange('content', html)}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Tempo di lettura stimato: {formData.readingTime} min
                        </p>
                    </div>

                    {/* Author */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Autore
                        </label>
                        <input
                            type="text"
                            value={formData.author}
                            onChange={(e) => handleChange('author', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            placeholder="Nome autore"
                        />
                    </div>
                </div>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Meta Title (SEO)
                        </label>
                        <input
                            type="text"
                            value={formData.metaTitle || ''}
                            onChange={(e) => handleChange('metaTitle', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            placeholder="Lascia vuoto per usare il titolo dell'articolo"
                            maxLength={60}
                        />
                        <p className="text-xs text-slate-500 mt-1">{(formData.metaTitle || '').length}/60 caratteri</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Meta Description (SEO)
                        </label>
                        <textarea
                            value={formData.metaDescription || ''}
                            onChange={(e) => handleChange('metaDescription', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                            placeholder="Lascia vuoto per usare l'estratto"
                            maxLength={160}
                        />
                        <p className="text-xs text-slate-500 mt-1">{(formData.metaDescription || '').length}/160 caratteri</p>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Anteprima Google</h4>
                        <div className="space-y-1">
                            <div className="text-blue-600 text-lg">{formData.metaTitle || formData.title || 'Titolo articolo'}</div>
                            <div className="text-green-700 text-sm">alpematch.com/blog/{formData.slug || 'slug'}</div>
                            <div className="text-slate-600 text-sm">{formData.metaDescription || formData.excerpt || 'Descrizione articolo...'}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function RichTextEditor({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    const handleCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
    };

    const handleLink = () => {
        const url = prompt('Inserisci URL:');
        if (url) handleCommand('createLink', url);
    };

    const handleImage = () => {
        const url = prompt('Inserisci URL immagine:');
        if (url) {
            handleCommand('insertImage', url);
        }
    };

    return (
        <div className="border border-slate-300 rounded-lg overflow-hidden flex flex-col h-[500px]">
            {/* Toolbar */}
            <div className="bg-slate-50 border-b border-slate-200 p-2 flex gap-1">
                <button type="button" onClick={() => handleCommand('bold')} className="p-2 hover:bg-white hover:shadow-sm rounded transition-all text-slate-600" title="Grassetto">
                    <Bold size={18} />
                </button>
                <button type="button" onClick={() => handleCommand('italic')} className="p-2 hover:bg-white hover:shadow-sm rounded transition-all text-slate-600" title="Corsivo">
                    <Italic size={18} />
                </button>
                <button type="button" onClick={() => handleCommand('underline')} className="p-2 hover:bg-white hover:shadow-sm rounded transition-all text-slate-600" title="Sottolineato">
                    <Underline size={18} />
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
                <button type="button" onClick={() => handleCommand('formatBlock', '<h2>')} className="p-2 hover:bg-white hover:shadow-sm rounded transition-all text-slate-600 flex items-center gap-1 font-bold" title="Titolo 2">
                    <Type size={18} />2
                </button>
                <button type="button" onClick={() => handleCommand('formatBlock', '<h3>')} className="p-2 hover:bg-white hover:shadow-sm rounded transition-all text-slate-600 flex items-center gap-1 font-bold" title="Titolo 3">
                    <Type size={18} />3
                </button>
                <button type="button" onClick={() => handleCommand('formatBlock', '<p>')} className="p-2 hover:bg-white hover:shadow-sm rounded transition-all text-slate-600" title="Paragrafo">
                    <Type size={14} />P
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
                <button type="button" onClick={() => handleCommand('insertUnorderedList')} className="p-2 hover:bg-white hover:shadow-sm rounded transition-all text-slate-600" title="Lista Puntata">
                    <List size={18} />
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
                <button type="button" onClick={handleLink} className="p-2 hover:bg-white hover:shadow-sm rounded transition-all text-slate-600" title="Link">
                    <LinkIcon size={18} />
                </button>
                <button type="button" onClick={handleImage} className="p-2 hover:bg-white hover:shadow-sm rounded transition-all text-slate-600" title="Immagine">
                    <ImageIcon size={18} />
                </button>
            </div>

            {/* Editable Area */}
            <div
                className="flex-1 p-4 overflow-y-auto focus:outline-none prose max-w-none"
                contentEditable
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                onBlur={(e) => onChange(e.currentTarget.innerHTML)}
                dangerouslySetInnerHTML={{ __html: value }}
                style={{ minHeight: '300px' }}
            />
            <div className="bg-slate-50 border-t border-slate-200 p-2 text-xs text-slate-400 font-mono">
                HTML Maker Mode
            </div>
        </div>
    );
}
