import React, { useState } from 'react';
import { Shield, Search, CheckCircle, Trash2, Heart, MessageSquare, AlertTriangle } from 'lucide-react';
import { INITIAL_COMMUNITY_POSTS } from '@/src/data/curriculumData';
import { CommunityPost } from '@/src/types';

export function CommunityModerationView() {
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_COMMUNITY_POSTS);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = (id: string) => {
    if (confirm('Delete post and comments from community?')) {
      setPosts(posts.filter((p) => p.id !== id));
    }
  };

  const filtered = posts.filter((p) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return p.title.toLowerCase().includes(s) || p.authorName.toLowerCase().includes(s) || p.contentBisaya.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600" />
            Community Forum & Moderation Control (/admin/community)
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Moderate learner discussions, grammar questions, peer tips, and user-generated vocabulary contributions.
          </p>
        </div>

        <div className="text-xs font-semibold text-stone-500 bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-xl">
          Total Posts: {posts.length} Active
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by post title, author, or Bisaya words..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs bg-white dark:bg-[#11222D] border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="space-y-4">
        {filtered.map((post) => (
          <div
            key={post.id}
            className="bg-white dark:bg-[#11222D] p-5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-xs text-stone-900 dark:text-white">{post.authorName}</span>
                <span className="text-[11px] text-stone-400">({post.authorTag})</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                  {post.category}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400">{post.timestamp}</span>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Remove post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h4 className="text-sm font-bold text-stone-900 dark:text-white">{post.title}</h4>
            <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">{post.contentBisaya}</p>
            <p className="text-xs text-stone-600 dark:text-stone-300">{post.contentEnglish}</p>

            <div className="pt-2 border-t border-stone-100 dark:border-white/5 flex items-center justify-between text-xs text-stone-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-rose-500 font-semibold">
                  <Heart className="w-3.5 h-3.5 fill-rose-500" /> {post.likes} Likes
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> {post.comments.length} Comments
                </span>
              </div>
              <span className="text-[11px] font-medium text-emerald-600">Status: Approved / Published</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
