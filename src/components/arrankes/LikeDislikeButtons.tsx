import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface LikeDislikeButtonsProps {
    arrankeId: string;
    initialLikes?: number;
    initialDislikes?: number;
    size?: number;
    showCounts?: boolean;
    className?: string;
}

const LikeDislikeButtons = ({
    arrankeId,
    initialLikes = 0,
    initialDislikes = 0,
    size = 24,
    showCounts = true,
    className = ''
}: LikeDislikeButtonsProps) => {
    const [likes, setLikes] = useState(initialLikes);
    const [dislikes, setDislikes] = useState(initialDislikes);
    const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    useEffect(() => {
        // Get the current user and stats
        const getUserAndStats = async () => {
            try {
                // Get user session
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user || null);

                // Get stats for this arranke
                const { data: statsData, error: statsError } = await supabase
                    .from('arrankes_stats')
                    .select('likes_count, dislikes_count')
                    .eq('id', arrankeId)
                    .single();

                if (statsError) {
                    console.error('Error fetching stats:', statsError);
                    // If stats don't exist, use the initial values from props
                    setLikes(initialLikes);
                    setDislikes(initialDislikes);
                } else if (statsData) {
                    setLikes(statsData.likes_count || 0);
                    setDislikes(statsData.dislikes_count || 0);
                }

                // Check if user has already voted
                if (session?.user) {
                    try {
                        const { data, error: voteError } = await supabase
                            .from('user_votes')
                            .select('vote_type')
                            .eq('arranke_id', arrankeId)
                            .eq('user_id', session.user.id)
                            .single();

                        if (voteError && voteError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
                            console.error('Error fetching user vote:', voteError);
                        } else if (data) {
                            setUserVote(data.vote_type as 'like' | 'dislike');
                        }
                    } catch (error) {
                        console.error('Error checking user vote:', error);
                    }
                }
            } catch (error) {
                console.error('Error in getUserAndStats:', error);
            }
        };

        getUserAndStats();

        // Subscribe to stats changes
        const statsSubscription = supabase
            .channel(`arrankes_stats:id=eq.${arrankeId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'arrankes_stats',
                filter: `id=eq.${arrankeId}`
            }, (payload) => {
                if (payload.new) {
                    setLikes(payload.new.likes_count || 0);
                    setDislikes(payload.new.dislikes_count || 0);
                }
            })
            .subscribe();

        return () => {
            statsSubscription.unsubscribe();
        };
    }, [arrankeId, initialLikes, initialDislikes]);

    // Update local state when props change
    useEffect(() => {
        setLikes(initialLikes);
        setDislikes(initialDislikes);
    }, [initialLikes, initialDislikes]);

    const handleLike = async () => {
        if (!user) {
            setShowLoginPrompt(true);
            setTimeout(() => setShowLoginPrompt(false), 3000);
            return;
        }

        setLoading(true);
        try {
            if (userVote === 'like') {
                // User already liked, so remove the like
                const { error } = await supabase
                    .rpc('decrement_likes', { arranke_id: arrankeId });

                if (error) {
                    console.error('Error decrementing likes:', error);
                    return;
                }

                try {
                    const { error: voteError } = await supabase
                        .from('user_votes')
                        .delete()
                        .eq('arranke_id', arrankeId)
                        .eq('user_id', user.id);

                    if (voteError) {
                        console.error('Error deleting user vote:', voteError);
                    }
                } catch (voteError) {
                    console.error('Exception deleting user vote:', voteError);
                }

                // Wait for the database operation to complete before updating UI
                // Get the latest stats to ensure accuracy
                const { data: updatedStats } = await supabase
                    .from('arrankes_stats')
                    .select('likes_count')
                    .eq('id', arrankeId)
                    .single();

                setLikes(updatedStats?.likes_count || 0);
                setUserVote(null);
            } else if (userVote === 'dislike') {
                // User previously disliked, so change to like
                const { error: dislikeError } = await supabase
                    .rpc('decrement_dislikes', { arranke_id: arrankeId });

                if (dislikeError) {
                    console.error('Error decrementing dislikes:', dislikeError);
                    return;
                }

                const { error: likeError } = await supabase
                    .rpc('increment_likes', { arranke_id: arrankeId });

                if (likeError) {
                    console.error('Error incrementing likes:', likeError);
                    return;
                }

                try {
                    const { error: voteError } = await supabase
                        .from('user_votes')
                        .update({ vote_type: 'like' })
                        .eq('arranke_id', arrankeId)
                        .eq('user_id', user.id);

                    if (voteError) {
                        console.error('Error updating user vote:', voteError);
                    }
                } catch (voteError) {
                    console.error('Exception updating user vote:', voteError);
                }

                // Wait for the database operation to complete before updating UI
                // Get the latest stats to ensure accuracy
                const { data: updatedStats } = await supabase
                    .from('arrankes_stats')
                    .select('likes_count, dislikes_count')
                    .eq('id', arrankeId)
                    .single();

                setLikes(updatedStats?.likes_count || 0);
                setDislikes(updatedStats?.dislikes_count || 0);
                setUserVote('like');
            } else {
                // User hasn't voted yet, so add a like
                const { error } = await supabase
                    .rpc('increment_likes', { arranke_id: arrankeId });

                if (error) {
                    console.error('Error incrementing likes:', error);
                    return;
                }

                try {
                    const { error: voteError } = await supabase
                        .from('user_votes')
                        .insert([{
                            arranke_id: arrankeId,
                            user_id: user.id,
                            vote_type: 'like'
                        }]);

                    if (voteError) {
                        console.error('Error inserting user vote:', voteError);
                    }
                } catch (voteError) {
                    console.error('Exception inserting user vote:', voteError);
                }

                // Wait for the database operation to complete before updating UI
                // Get the latest stats to ensure accuracy
                const { data: updatedStats } = await supabase
                    .from('arrankes_stats')
                    .select('likes_count')
                    .eq('id', arrankeId)
                    .single();

                setLikes(updatedStats?.likes_count || 0);
                setUserVote('like');
            }
        } catch (error) {
            console.error('Error liking arranke:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDislike = async () => {
        if (!user) {
            setShowLoginPrompt(true);
            setTimeout(() => setShowLoginPrompt(false), 3000);
            return;
        }

        setLoading(true);
        try {
            if (userVote === 'dislike') {
                // User already disliked, so remove the dislike
                const { error } = await supabase
                    .rpc('decrement_dislikes', { arranke_id: arrankeId });

                if (error) {
                    console.error('Error decrementing dislikes:', error);
                    return;
                }

                try {
                    const { error: voteError } = await supabase
                        .from('user_votes')
                        .delete()
                        .eq('arranke_id', arrankeId)
                        .eq('user_id', user.id);

                    if (voteError) {
                        console.error('Error deleting user vote:', voteError);
                    }
                } catch (voteError) {
                    console.error('Exception deleting user vote:', voteError);
                }

                // Wait for the database operation to complete before updating UI
                // Get the latest stats to ensure accuracy
                const { data: updatedStats } = await supabase
                    .from('arrankes_stats')
                    .select('dislikes_count')
                    .eq('id', arrankeId)
                    .single();

                setDislikes(updatedStats?.dislikes_count || 0);
                setUserVote(null);
            } else if (userVote === 'like') {
                // User previously liked, so change to dislike
                const { error: likeError } = await supabase
                    .rpc('decrement_likes', { arranke_id: arrankeId });

                if (likeError) {
                    console.error('Error decrementing likes:', likeError);
                    return;
                }

                const { error: dislikeError } = await supabase
                    .rpc('increment_dislikes', { arranke_id: arrankeId });

                if (dislikeError) {
                    console.error('Error incrementing dislikes:', dislikeError);
                    return;
                }

                try {
                    const { error: voteError } = await supabase
                        .from('user_votes')
                        .update({ vote_type: 'dislike' })
                        .eq('arranke_id', arrankeId)
                        .eq('user_id', user.id);

                    if (voteError) {
                        console.error('Error updating user vote:', voteError);
                    }
                } catch (voteError) {
                    console.error('Exception updating user vote:', voteError);
                }

                // Wait for the database operation to complete before updating UI
                // Get the latest stats to ensure accuracy
                const { data: updatedStats } = await supabase
                    .from('arrankes_stats')
                    .select('likes_count, dislikes_count')
                    .eq('id', arrankeId)
                    .single();

                setLikes(updatedStats?.likes_count || 0);
                setDislikes(updatedStats?.dislikes_count || 0);
                setUserVote('dislike');
            } else {
                // User hasn't voted yet, so add a dislike
                const { error } = await supabase
                    .rpc('increment_dislikes', { arranke_id: arrankeId });

                if (error) {
                    console.error('Error incrementing dislikes:', error);
                    return;
                }

                try {
                    const { error: voteError } = await supabase
                        .from('user_votes')
                        .insert([{
                            arranke_id: arrankeId,
                            user_id: user.id,
                            vote_type: 'dislike'
                        }]);

                    if (voteError) {
                        console.error('Error inserting user vote:', voteError);
                    }
                } catch (voteError) {
                    console.error('Exception inserting user vote:', voteError);
                }

                // Wait for the database operation to complete before updating UI
                // Get the latest stats to ensure accuracy
                const { data: updatedStats } = await supabase
                    .from('arrankes_stats')
                    .select('dislikes_count')
                    .eq('id', arrankeId)
                    .single();

                setDislikes(updatedStats?.dislikes_count || 0);
                setUserVote('dislike');
            }
        } catch (error) {
            console.error('Error disliking arranke:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <button
                className={`btn btn-ghost ${userVote === 'like' ? 'text-primary' : ''}`}
                onClick={handleLike}
                disabled={loading}
                aria-label="Like"
            >
                {showCounts && <span>{likes}</span>}
                <ThumbsUp size={size} className={userVote === 'like' ? 'fill-current' : ''} />
            </button>

            <button
                className={`btn btn-ghost ${userVote === 'dislike' ? 'text-error' : ''}`}
                onClick={handleDislike}
                disabled={loading}
                aria-label="Dislike"
            >
                {showCounts && <span>{dislikes}</span>}
                <ThumbsDown size={size} className={userVote === 'dislike' ? 'fill-current' : ''} />
            </button>

            {showLoginPrompt && (
                <div className="tooltip tooltip-open tooltip-right" data-tip="Inicia sesión para votar">
                    <span></span>
                </div>
            )}
        </div>
    );
};

export default LikeDislikeButtons;
