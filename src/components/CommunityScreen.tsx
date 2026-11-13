import React, { useState } from 'react';
import { 
  Heart, MessageCircle, Flag, Plus, Send, AlertTriangle, 
  CheckCircle, Sparkles, Volume2, Search, Filter, ShieldCheck, 
  HelpCircle, MessageSquare
} from 'lucide-react';
import { CommunityPost, CommunityComment } from '../types';
import { INITIAL_COMMUNITY_POSTS } from '../data/curriculumData';
import { speakBisaya } from '../utils/audio';
import { sounds } from '../utils/soundEffects';
import { ASSETS } from '../assets/images';

interface CommunityScreenProps {
  /** Signed-in learner's display name — new posts/comments are authored by them */
  userName?: string;
  /** Signed-in learner's avatar */
  userAvatar?: string;
}

export const CommunityScreen: React.FC<CommunityScreenProps> = ({
  userName = 'You',
  userAvatar,
}) => {
  const authorName = `${userName} (You)`;
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_COMMUNITY_POSTS);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBisaya, setNewPostBisaya] = useState('');
  const [newPostEnglish, setNewPostEnglish] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'Expression' | 'Question' | 'Cultural Tip'>('Expression');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportedPostIds, setReportedPostIds] = useState<string[]>([]);
  const [reportModalPostId, setReportModalPostId] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [playingPostId, setPlayingPostId] = useState<string | null>(null);

  // Toggle Like with sound
  const handleToggleLike = (postId: string) => {
    sounds.playTap();
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextLiked = !p.likedByMe;
          if (nextLiked) sounds.playCorrect();
          return {
            ...p,
            likedByMe: nextLiked,
            likes: nextLiked ? p.likes + 1 : p.likes - 1,
          };
        }
        return p;
      })
    );
  };

  // Play audio for post
  const handlePlayAudio = async (postId: string, text: string) => {
    setPlayingPostId(postId);
    sounds.playTap();
    await speakBisaya(text);
    setPlayingPostId(null);
  };

  // Add Comment
  const handleAddComment = (postId: string) => {
    if (!newCommentText.trim()) return;
    sounds.playTap();

    const newComment: CommunityComment = {
      id: 'c_' + Date.now(),
      authorName,
      authorRole: 'Non-Native Learner',
      text: newCommentText.trim(),
      timestamp: 'Just now',
      likes: 0,
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [...p.comments, newComment],
          };
        }
        return p;
      })
    );

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost({
        ...selectedPost,
        comments: [...selectedPost.comments, newComment],
      });
    }

    setNewCommentText('');
  };

  // Create New Post
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostBisaya.trim()) return;

    sounds.playFanfare();
    const newPost: CommunityPost = {
      id: 'post_' + Date.now(),
      authorName,
      authorAvatar: userAvatar || ASSETS.logo,
      authorTag: 'Active Learner',
      category: newPostCategory,
      title: newPostTitle.trim(),
      contentBisaya: newPostBisaya.trim(),
      contentEnglish: newPostEnglish.trim() || 'Translation provided by learner.',
      likes: 1,
      likedByMe: true,
      comments: [],
      timestamp: 'Just now',
    };

    setPosts([newPost, ...posts]);
    setShowNewPostModal(false);
    setNewPostTitle('');
    setNewPostBisaya('');
    setNewPostEnglish('');
  };

  // Report post
  const handleConfirmReport = () => {
    if (reportModalPostId) {
      sounds.playTap();
      setReportedPostIds((prev) => [...prev, reportModalPostId]);
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setReportModalPostId(null);
      }, 1500);
    }
  };

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    const matchesCat = selectedCategoryFilter === 'All' || p.category === selectedCategoryFilter;
    const matchesSearch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contentBisaya.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contentEnglish.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-24 px-4 pt-3 max-w-md mx-auto">
      {/* Community Header & Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-black text-xl text-stone-900 dark:text-white">
            SultiAI Community Hub
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-300 font-medium">
            Learn from native speakers & fellow Bisaya learners
          </p>
        </div>

        <button
          onClick={() => {
            sounds.playTap();
            setShowNewPostModal(true);
          }}
          className="min-h-[44px] bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all btn-3d-teal shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Post</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search discussions & phrases..."
          className="w-full bg-white dark:bg-stone-900 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 text-xs pl-10 pr-4 py-3 rounded-2xl border border-stone-200/90 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
        />
      </div>

      {/* Posts Feed */}
      <div className="space-y-3.5">
        {filteredPosts.map((post) => {
          const isReported = reportedPostIds.includes(post.id);
          const isPlayingAudio = playingPostId === post.id;

          return (
            <div
              key={post.id}
              className={`bg-white dark:bg-[#11222D] rounded-3xl p-4 border border-stone-200/90 dark:border-white/10 shadow-sm space-y-3 transition-opacity ${
                isReported ? 'opacity-40 pointer-events-none' : ''
              }`}
            >
              {/* Author Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover border-2 border-stone-200 dark:border-stone-700 shadow-sm"
                  />
                  <div>
                    <div className="text-xs font-black text-stone-900 dark:text-white font-display">
                      {post.authorName}
                    </div>
                    <div className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-1">
                      <span>{post.authorTag}</span>
                      <span>·</span>
                      <span className="text-stone-400 dark:text-stone-500 font-normal">{post.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-2.5 py-0.5 rounded-full font-bold">
                    {post.category}
                  </span>
                  <button
                    onClick={() => setReportModalPostId(post.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                    title="Report inappropriate post"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title & Bisaya Body */}
              <div className="space-y-1.5">
                <h3 className="font-display font-black text-sm text-stone-900 dark:text-white leading-snug">
                  {post.title}
                </h3>
                <div className="text-xs text-stone-900 dark:text-stone-100 bg-stone-50 dark:bg-stone-800/70 p-3 rounded-2xl border border-stone-100 dark:border-stone-700/60 leading-relaxed font-bold flex items-start justify-between gap-2">
                  <span>"{post.contentBisaya}"</span>
                  <button
                    onClick={() => handlePlayAudio(post.id, post.contentBisaya)}
                    className={`p-1.5 rounded-xl shrink-0 transition-all cursor-pointer ${
                      isPlayingAudio ? 'bg-teal-500 text-white animate-pulse' : 'bg-teal-50 dark:bg-teal-950/80 hover:bg-teal-100 dark:hover:bg-teal-900/80 text-teal-700 dark:text-teal-300'
                    }`}
                    title="Listen to phrase"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 italic leading-relaxed font-medium">
                  Translation: {post.contentEnglish}
                </p>
                {post.dialectNote && (
                  <div className="text-[11px] text-teal-900 dark:text-teal-200 bg-teal-50/80 dark:bg-teal-950/40 p-2.5 rounded-xl border border-teal-100 dark:border-teal-800/40 font-medium">
                    💡 {post.dialectNote}
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-white/5 text-xs text-stone-500 dark:text-stone-400">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className={`flex items-center gap-1.5 font-bold transition-all min-h-[36px] cursor-pointer ${
                      post.likedByMe ? 'text-rose-500' : 'hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${post.likedByMe ? 'fill-rose-500 animate-heart' : ''}`} />
                    <span className="font-mono tabular-nums">{post.likes}</span>
                  </button>

                  <button
                    onClick={() => {
                      sounds.playTap();
                      setSelectedPost(selectedPost?.id === post.id ? null : post);
                    }}
                    className="flex items-center gap-1.5 hover:text-stone-800 dark:hover:text-stone-200 font-bold transition-colors min-h-[36px] cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="font-mono tabular-nums">{post.comments.length} replies</span>
                  </button>
                </div>

                {isReported && (
                  <span className="text-[10px] text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                    Flagged for Review
                  </span>
                )}
              </div>

              {/* Inline Comments Section */}
              {selectedPost?.id === post.id && (
                <div className="pt-2 border-t border-stone-100 dark:border-white/5 space-y-2.5 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    {post.comments.length === 0 ? (
                      <p className="text-[11px] text-stone-400 dark:text-stone-500 italic">No comments yet. Be the first to share an answer!</p>
                    ) : (
                      post.comments.map((c) => (
                        <div key={c.id} className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl space-y-1 text-xs border border-stone-100 dark:border-stone-700/50">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-stone-900 dark:text-white font-display">{c.authorName}</span>
                            <span className="text-stone-400 dark:text-stone-500 font-mono text-[10px]">{c.timestamp}</span>
                          </div>
                          <p className="text-stone-700 dark:text-stone-300 text-xs font-normal leading-relaxed">{c.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                      placeholder="Add a friendly reply or clarification..."
                      className="flex-1 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 text-xs px-3.5 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[42px] border border-transparent dark:border-white/5"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="min-h-[42px] px-3.5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs font-black flex items-center justify-center btn-3d-teal shadow-sm cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11222D] rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-stone-200 dark:border-white/10">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/5 pb-2">
              <h3 className="font-display font-black text-sm text-stone-900 dark:text-white">
                Share a Bisaya Learning Post
              </h3>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  Category
                </label>
                <select
                  value={newPostCategory}
                  onChange={(e) => setNewPostCategory(e.target.value as any)}
                  className="w-full bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white p-2.5 rounded-xl border border-stone-200 dark:border-white/10 text-xs font-bold focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Expression">Local Expression & Slang</option>
                  <option value="Question">Question / Meaning Clarification</option>
                  <option value="Cultural Tip">Cultural Context & Etiquette</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="e.g. When do locals use 'Lugar lang'?"
                  className="w-full bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 p-2.5 rounded-xl border border-stone-200 dark:border-white/10 text-xs focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  Bisaya Phrase or Query
                </label>
                <textarea
                  value={newPostBisaya}
                  onChange={(e) => setNewPostBisaya(e.target.value)}
                  placeholder="Write the Bisaya phrase or question..."
                  rows={2}
                  className="w-full bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 p-2.5 rounded-xl border border-stone-200 dark:border-white/10 text-xs focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  English Translation / Explanation
                </label>
                <input
                  type="text"
                  value={newPostEnglish}
                  onChange={(e) => setNewPostEnglish(e.target.value)}
                  placeholder="e.g. Stop here, driver! Used in jeepneys."
                  className="w-full bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 p-2.5 rounded-xl border border-stone-200 dark:border-white/10 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs btn-3d-teal shadow-md"
                >
                  Publish Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Post Modal */}
      {reportModalPostId && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11222D] rounded-3xl p-5 max-w-xs w-full text-center space-y-4 shadow-2xl border border-stone-200 dark:border-white/10">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl mx-auto flex items-center justify-center border border-rose-200 dark:border-rose-900/40">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-black text-base text-stone-900 dark:text-white">
                Report this Community Post?
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Help keep SultiAI safe and supportive for all language learners.
              </p>
            </div>

            {reportSuccess ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800/40">
                ✓ Report submitted for review!
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setReportModalPostId(null)}
                  className="py-2.5 px-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReport}
                  className="py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold btn-3d-rose"
                >
                  Confirm Report
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
