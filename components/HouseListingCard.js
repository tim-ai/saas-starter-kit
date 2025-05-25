import { useState, useMemo } from 'react';
import {
   Heart, MessageCircle, ThumbsUp, Trash2,
   DollarSign, MapPin, AlertTriangle, Info as InfoIcon, XCircle, Snowflake, Flame,
  CookingPot, Droplet, Wrench, Plug, Home, ShieldAlert, LayoutGrid, Car, Users, TrendingUp
} from 'lucide-react';
import { FaBed, FaBath, FaExpand, FaHeart } from 'react-icons/fa';
import { getCookie } from 'cookies-next';

// --- Constants ---
const ISSUE_CATEGORIES_WITH_ICONS = {
  "Heating/Cooling": (props) => <Snowflake {...props} />,
  "Water Heater": (props) => <Flame {...props} />,
  "Cooking Range": (props) => <CookingPot {...props} />,
  "Water Supply": (props) => <Droplet {...props} />,
  "Sewage": (props) => <Wrench {...props} />,
  "Electrical": (props) => <Plug {...props} />,
  "Roof": (props) => <Home {...props} />,
  "Natural Hazards and Environmental": (props) => <ShieldAlert {...props} />,
  "Interior Layout": (props) => <LayoutGrid {...props} />,
  "Parking/Commute": (props) => <Car {...props} />,
  "Neighborhood/Crime": (props) => <Users {...props} />,
  "Resale Value": (props) => <TrendingUp {...props} />
};
const ALL_ISSUE_CATEGORY_NAMES = Object.keys(ISSUE_CATEGORIES_WITH_ICONS);
const SEVERITY_ORDER = { high: 3, medium: 2, low: 1, unknown: 0 };
const SEVERITY_CLASSES = { 
  low: 'severity-low bg-green-500', 
  medium: 'severity-medium bg-yellow-500', 
  high: 'severity-high bg-red-500', 
  unknown: 'severity-unknown bg-gray-400' 
};
const SEVERITY_TEXT = { low: 'Low', medium: 'Medium', high: 'High', unknown: 'Unknown' };

const severityGlowMap = {
  low: 'rgba(16, 185, 129, 0.8)',      // green-500
  medium: 'rgba(245, 158, 11, 0.8)',     // yellow-500
  high: 'rgba(239, 68, 68, 0.8)',        // red-500
  unknown: 'rgba(156, 163, 175, 0.8)',   // gray-400
};

const DEFAULT_CURRENT_USER = { id: 'userSystem', name: 'System' };
const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// --- Helper Components ---
const StyledInput = ({ value, onChange, placeholder, onKeyDown, className = "" }) => (
  <input type="text" value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder}
    className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow ${className}`} />
);

const StyledSelect = ({ value, onChange, children, className = "" }) => (
  <select value={value} onChange={onChange}
    className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white ${className}`}>
    {children}
  </select>
);

const StyledButton = ({ onClick, children, variant = 'primary', size = 'md', className = "", disabled = false }) => {
  const baseStyle = "font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ease-in-out flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400",
    danger: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-300",
  };
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };
  return (<button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}>{children}</button>);
};

// --- Sub-Components ---
const CommentItem = ({ comment, onLikeComment, onDeleteComment, concernId, categoryName, currentUser }) => (
  <div className="pl-4 py-2 bg-gray-50 rounded-md mt-2">
    <p className="text-xs text-gray-700">{comment.content}</p>
    <div className="flex items-center justify-between mt-1">
      <span className="text-xs text-gray-500">By: {comment.user.name} - {new Date(comment.createdAt).toLocaleDateString()}</span>
      <div className="flex items-center space-x-2">
        
        {currentUser && comment.userId === currentUser.id && (
          <button onClick={() => onDeleteComment(categoryName, concernId, comment.id)} className="text-xs text-red-500 hover:text-red-700" aria-label="Delete comment">
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  </div>
);

const ConcernDetailRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="text-xs mt-1">
      <span className="font-semibold text-gray-600">{label}:</span>
      <span className="text-gray-700 ml-1">{value}</span>
    </div>
  );
};

// {"area": "Heating/Cooling",
// "type": "issue", 
// "impact": "可能增加能源费用，需定期维护不同系统。", 
// "source": "Heating: Forced Air, Electric Baseboard, Oil", 
// "problem": "供暖系统采用强制空气和电暖器混合模式，可能导致能源效率不一致。", 
// "severity": "medium", 
// "highlight": "混合供暖系统", 
// "recommendation": "建议进行能源审计以优化供暖效率，考虑升级为统一系统。"}
const ConcernItem = ({ concern, categoryName, onLikeConcern, onDisableConcern, onAddCommentToConcern, onLikeComment, onDeleteComment, currentUser, activeCommentInput, setActiveCommentInput }) => {
  const [newCommentText, setNewCommentText] = useState('');
  const handleAddComment = () => {
    if (newCommentText.trim()) {
      onAddCommentToConcern(categoryName, concern.id, newCommentText);
      setNewCommentText('');
      setActiveCommentInput(null);
    }
  };
  
  return (
    <div className="p-3 my-2 ">
      <div className="flex justify-between items-start mb-1">
        <p className="text-gray-800 flex-grow pr-2">
            {concern.problem}{' '}
        </p>
        <div className="flex items-center flex-shrink-0 space-x-1 sm:space-x-2">
            <button onClick={() => onLikeConcern(categoryName, concern.id)} className="flex items-center text-sm text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50" aria-label="Like concern">
              <ThumbsUp size={16} className="mr-0.5 sm:mr-1" /> {concern.likes}
            </button>
            <button onClick={() => onDisableConcern(categoryName, concern.id)} className="text-sm text-gray-500 hover:text-red-600 p-1 rounded-md hover:bg-red-50" aria-label="Remove concern">
              <XCircle size={16} />
            </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center text-xs text-gray-500 mb-2">
        <span className={`h-2.5 w-2.5 rounded-full mr-1.5 ${SEVERITY_CLASSES[concern.severity] || SEVERITY_CLASSES.unknown}`}></span>
        Severity: {SEVERITY_TEXT[concern.severity] || SEVERITY_TEXT.unknown}
        {/* <span className="mx-1.5 sm:mx-2"></span>
        Added by: {concern.user.name || 'AI'} on: {new Date(concern.timestamp).toLocaleDateString()} */}
      </div>
      <div className="mb-2 space-y-0.5">
        <ConcernDetailRow label="Impact" value={concern.impact} />
        <ConcernDetailRow label="Source" value={concern.source} />
        <ConcernDetailRow label="Recommendation" value={concern.recommendation} />
      </div>
      <div className="mt-3">
        <h4 className="text-xs font-semibold text-gray-600 mb-1">Comments ({concern.comments?.length})</h4>
        {concern.comments.sort((a,b) => b.timestamp - a.timestamp).map(comment => (
          <CommentItem key={comment.id} comment={comment} onLikeComment={onLikeComment} onDeleteComment={onDeleteComment} concernId={concern.id} categoryName={categoryName} currentUser={currentUser} />
        ))}
        {activeCommentInput === concern.id ? (
          <div className="mt-2">
            <StyledInput value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} placeholder="Add your comment..." onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} className="text-sm" />
            <div className="flex justify-end space-x-2 mt-2 text-xs">
              <StyledButton onClick={() => setActiveCommentInput(null)} variant="secondary" size="sm">Cancel</StyledButton>
              <StyledButton onClick={handleAddComment} size="sm">Post Comment</StyledButton>
            </div>
          </div>
        ) : (
          <StyledButton onClick={() => setActiveCommentInput(concern.id)} variant="ghost" size="sm" className="mt-2 text-xs text-blue-600">
            <MessageCircle size={20} className="mr-1"/> Add Comment
          </StyledButton>
        )}
      </div>
    </div>
  );
};

const IssueCategory = ({
  categoryName,
  concerns,
  IconComponent,
  onLikeConcern,
  onDisableConcern,
  onAddCommentToConcern,
  onLikeComment,
  onDeleteComment,
  currentUser,
  activeCommentInput,
  setActiveCommentInput,
  isPreview = false
}) => {
  // Always have an array (even if empty) so that hooks are always called in the same order
  const safeConcerns = concerns || [];

  // Always call useMemo even if the list is empty
  const maxSeverityValue = useMemo(() => {
    return safeConcerns.length
      ? Math.max(...safeConcerns.map(c => SEVERITY_ORDER[c.severity] || SEVERITY_ORDER.unknown))
      : 0;
  }, [safeConcerns]);

  const categorySeverity = useMemo(() => {
    return safeConcerns.length
      ? Object.keys(SEVERITY_ORDER).find(key => SEVERITY_ORDER[key] === maxSeverityValue) || 'unknown'
      : 'unknown';
  }, [maxSeverityValue, safeConcerns]);

  // Optionally, if there are no concerns you can return null now.
  if (safeConcerns.length === 0) return null;

  return (
    <div className={`${isPreview ? 'border-0 shadow-none' : 'mb-3 border border-gray-200 rounded-lg overflow-hidden shadow'}`}>
      {safeConcerns
        .sort((a, b) => (SEVERITY_ORDER[b.severity] || 0) - (SEVERITY_ORDER[a.severity] || 0) || b.likes - a.likes || b.timestamp - a.timestamp)
        .map(concern => (
          <ConcernItem
            key={concern.id}
            concern={concern}
            categoryName={categoryName}
            onLikeConcern={onLikeConcern}
            onDisableConcern={onDisableConcern}
            onAddCommentToConcern={onAddCommentToConcern}
            onLikeComment={onLikeComment}
            onDeleteComment={onDeleteComment}
            currentUser={currentUser}
            activeCommentInput={activeCommentInput}
            setActiveCommentInput={setActiveCommentInput}
          />
        ))
      }
    </div>
  );
};

const CategoryTile = ({ categoryName, concerns, currentUser, activeCommentInput, setActiveCommentInput, onConcernDisabled }) => {
  // If categoryName is unknown, use a fallback which renders nothing
  const Icon = ISSUE_CATEGORIES_WITH_ICONS[categoryName] || (() => null);
  const maxSeverity = concerns.length > 0 ? Math.max(...concerns.map(c => SEVERITY_ORDER[c.severity] || 0)) : 0;
  const severity = Object.keys(SEVERITY_ORDER).find(k => SEVERITY_ORDER[k] === maxSeverity) || 'unknown';
  const [isHovered, setIsHovered] = useState(false);
  
  // Inline style for glowing effect using CSS variable and animation
  const glowStyle = {
    '--glow-color': severityGlowMap[severity],
    boxShadow: `0 0 5px 2px var(--glow-color)`,
    // animation: 'glow 2s ease-in-out infinite'
  };

  return (
    <>
      {/* Optionally, include the keyframes below or add them to your global CSS */}
      <style jsx>{`
        @keyframes glow {
          0% {
            box-shadow: 0 0 5px 2px var(--glow-color);
          }
          50% {
            box-shadow: 0 0 20px 4px var(--glow-color);
          }
          100% {
            box-shadow: 0 0 5px 2px var(--glow-color);
          }
        }
      `}</style>
      <div
        style={glowStyle}
        className="group relative flex flex-col items-center p-4 rounded-xl bg-gray-50 hover:bg-blue-50 transition-all"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative mb-2">
          <Icon className="w-14 h-14 text-blue-600 group-hover:text-blue-700 transition-colors p-2.5" />
          <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full ${SEVERITY_CLASSES[severity]} ring-2 ring-white`} />
        </div>
        <span className="text-xs text-gray-700 text-center group-hover:text-blue-800">
          {concerns[0]?.problem || 'No issues noted yet.'}
        </span>
        {isHovered && (
          <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50">
            <div className="p-4 overflow-y-auto">
              <IssueCategory
                categoryName={categoryName}
                concerns={concerns}
                IconComponent={Icon}
                onLikeConcern={onLikeConcern}
                onDisableConcern={
                  (categoryName, issueId) => {
                    onDisableConcern(categoryName, issueId);
                    if (onConcernDisabled) {
                      onConcernDisabled(categoryName, issueId);
                    }
                  }
                }
                onAddCommentToConcern={onAddCommentToConcern}
                onDeleteComment={onDeleteComment}
                currentUser={currentUser}
                activeCommentInput={activeCommentInput}
                setActiveCommentInput={setActiveCommentInput}
                isExpanded={true}
                className="border-0 shadow-none"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// --- Main Component ---
export default function HouseListingCard({ listingData, currentUser, onFavorite, ...props }) {
  // Initialize the liked state based on available data
  const [listingLiked, setListingLiked] = useState(!!listingData.isFavorite);
  
  // Define activeCommentInput state to manage which concern's comment input is active
  const [activeCommentInput, setActiveCommentInput] = useState(null);
  
  // Toggle favorite state and call the onFavorite callback if provided.
  const toggleListingLike = async (e) => {
    e.stopPropagation();
    // Optimistically update UI.
    setListingLiked((prev) => !prev);
    try {
      if (onFavorite) {
        await onFavorite(listingData);
      }
    } catch (error) {
      console.error('Error processing favorite:', error);
      // Revert the UI change on error.
      setListingLiked((prev) => !prev);
    }
  };

  // State for description expansion
  const [showFullDescription, setShowFullDescription] = useState(false);
  

  // No-op functions for issue manipulation – update these as needed to integrate with external state management.

  const getStatusColor = (status) => {
    if (status === 'Active' || (status && status.startsWith('FOR SALE'))) return 'bg-green-100 text-green-700';
    if (status === 'Pending' || status === 'CONTINGENT' || status === 'ACTIVE WITH CONTRACT') return 'bg-yellow-100 text-yellow-700';
    if (status === 'Sold' || status === 'Off Market') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-lg my-8 font-sans relative">
      {/* Image Section with Favorite Heart Button */}
      <div className="relative">
        <img 
          src={listingData.image || 'https://placehold.co/600x400/E2E8F0/slate-900?text=Property+Image'} 
          alt={`Image of ${listingData.address}`} 
          onClick={() => window.open(listingData.url, '_blank')}
          className="w-full h-64 sm:h-72 md:h-80 object-cover"
          onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/E2E8F0/slate-900?text=Image+Error'; }} 
        />
          <FaHeart
            onClick={toggleListingLike}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              fontSize: '28px',
              color: listingLiked ? '#EF4444' : '#ccc',
              cursor: 'pointer',
              zIndex: 10,
            }}
          />
      </div>

      {/* Rest of the HouseListingCard content */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
          <div>
            <h1 className=" md:text-sm font-semibold text-gray-800 flex items-center">
              <MapPin size={18} className="mr-2 text-blue-600 flex-shrink-0" />
              {listingData.address || 'Address not available'}
            </h1>
            <p className="text-sm md:text-sm text-blue-500 font-bold mt-1 flex items-center">
              <DollarSign  className="mr-1 flex-shrink-0" />
              {listingData.price ? listingData.price.toLocaleString('en-US') : 'Price not available'}
            </p>
          </div>
          <div className={`mt-2 sm:mt-0 text-xs self-start px-3 py-1 font-medium rounded-full whitespace-nowrap ${getStatusColor(listingData.status)}`}>
              Status: {listingData.status || 'Unknown'}
          </div>

        </div>
        <div className={"flex justify-between text-gray-600"}>
          <span className="text-xs">
            Year Built <br />
             {listingData.year_built || 'Unknown'}
          </span>
          <span className="text-xs">
            <FaBed /> {listingData.beds}
          </span>
          <span className="text-xs">
            <FaBath /> {listingData.baths}
          </span>
          <span className="text-xs">
            <FaExpand /> {listingData.sqft} sqft
          </span>

        </div>
        {listingData.status !== 'Active' && !listingData.status?.startsWith('FOR SALE') && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 text-yellow-700 rounded-md text-sm flex items-center">
            <InfoIcon size={20} className="mr-2 flex-shrink-0"/>
            This listing is currently not available for offers.
          </div>
        )}
        
        {/* Description Section with limited height */}
        <div className="mb-6">
          <p className={`text-gray-600 text-xs ${showFullDescription ? '' : 'line-clamp-3'}`}>
            {listingData.description || "No description available."}
          </p>
          {listingData.description && listingData.description.split('\n').join('').length > 100 && (
            <button 
              onClick={() => setShowFullDescription(prev => !prev)}
              className="text-blue-500 text-xs mt-1 focus:outline-none"
            >
              {showFullDescription ? 'Show Less' : 'Show More'}
            </button>
          )}
        </div>

        {/* Issues Section using icon grid */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <AlertTriangle size={20} className="mr-2 text-orange-500" />
            Key Considerations
          </h2>
          {props.sections && Object.keys(props.sections).length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {Object.keys(props.sections).map((categoryName) => {
                const concerns = props.sections[categoryName] || [];
                var disabledConcerns = 0;
                for (const c of concerns) {
                  // go through each vote and check if concern is disabled
                  if (c.votes && c.votes.some(v => v.vote === -100000)) {
                    disabledConcerns++;
                  }
                } 

                if (disabledConcerns == concerns.length) {
                  return null; // Skip rendering this category if all concerns are disabled
                }

                return (
                  <CategoryTile
                    key={categoryName}
                    categoryName={categoryName}
                    concerns={concerns}
                    currentUser={currentUser}
                    activeCommentInput={activeCommentInput}
                    setActiveCommentInput={setActiveCommentInput}
                    onConcernDisabled={
                      (categoryName, issueId) => {
                        // update sections accordingly and remove key if all concerns are disabled
                        const updatedSections = { ...props.sections };
                        const updatedConcerns = updatedSections[categoryName].filter(c => c.id !== issueId);
                        if (updatedConcerns.length === 0) {
                          delete updatedSections[categoryName];
                        } else {
                          updatedSections[categoryName] = updatedConcerns;
                        }
                        props.setSections(updatedSections);
                      }
                    }
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No issues noted yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Example implementations for concern actions

// 1. onLikeConcern: Adds a new vote record (thumb-up) to the IssueVote table.
export async function onLikeConcern(categoryName, issueId) {
  try {
    const res = await fetch('/api/issues/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issueId,
        vote: +1, // Using +1 for thumb-up. Change as needed.
      }),
    });
    if (!res.ok) {
      throw new Error('Failed to like concern');
    }
    const data = await res.json();
    // Return the new vote record for further processing (e.g. update state)
    return data;
  } catch (error) {
    console.error('onLikeConcern error:', error);
    throw error;
  }
}

export async function onDislikeConcern(categoryName, issueId) {
  try {
    const res = await fetch('/api/issues/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issueId,
        vote: -1, // Using -1 for thumb-down. Change as needed.
      }),
    });
    if (!res.ok) {
      throw new Error('Failed to dislike concern');
    }
    const data = await res.json();
    // Return the new vote record for further processing (e.g. update state)
    return data;
  } catch (error) {
    console.error('onDislikeConcern error:', error);
    throw error;
  }
}

export async function onDisableConcern(categoryName, issueId) {
  try {
    const res = await fetch('/api/issues/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issueId,
        vote: -100000, // Using -1 for thumb-down. Change as needed.
      }),
    });
    if (!res.ok) {
      throw new Error('Failed to dislike concern');
    }
    const data = await res.json();
    // Return the new vote record for further processing (e.g. update state)

    // remove the concern from the list

    return data;
  } catch (error) {
    console.error('onDislikeConcern error:', error);
    throw error;
  }
}

// 2. onDeleteConcern: Deletes a concern (RealEstateIssue record) if it is owned by the current user.
export async function onDeleteConcern(categoryName, issueId) {
  console.log('onDeleteConcern called with:', categoryName, issueId);
  if (!issueId) {
    return;
  }
  try {
    const res = await fetch(`/api/issues/${issueId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to delete concern');
    }
    // Return a success flag (or any response you choose)
    return true;
  } catch (error) {
    console.error('onDeleteConcern error:', error);
    throw error;
  }
}

// 3. onAddCommentToConcern: Adds a new comment record to the IssueComment table.
export async function onAddCommentToConcern(categoryName, issueId, text) {
  try {
    const res = await fetch('/api/issues/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issueId,
        text, // Comment text
      }),
    });
    if (!res.ok) {
      throw new Error('Failed to add comment');
    }
    const data = await res.json();
    // Return the newly created comment record
    return data;
  } catch (error) {
    console.error('onAddCommentToConcern error:', error);
    throw error;
  }
}

// 4. onDeleteComment: Deletes an existing comment from the IssueComment table.
export async function onDeleteComment(categoryName, issueId, commentId) {
  try {
    const res = await fetch(`/api/issues/comment/${commentId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to delete comment');
    }
    // Return a success flag (or any chosen response)
    return true;
  } catch (error) {
    console.error('onDeleteComment error:', error);
    throw error;
  }
}

