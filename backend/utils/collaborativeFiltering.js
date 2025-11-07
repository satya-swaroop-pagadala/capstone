/**
 * User-User Collaborative Filtering Utility
 * Implements cosine similarity-based recommendations
 */

/**
 * Calculate cosine similarity between two users based on their liked items
 * @param {Array} userAItems - Array of item IDs liked by user A
 * @param {Array} userBItems - Array of item IDs liked by user B
 * @returns {Number} Cosine similarity score (0-1)
 */
function cosineSimilarity(userAItems, userBItems) {
  // Convert ObjectIds to strings for comparison
  const setA = new Set(userAItems.map(id => id.toString()));
  const setB = new Set(userBItems.map(id => id.toString()));
  
  // Calculate intersection (common items)
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const intersectionSize = intersection.size;
  
  // If no common items, similarity is 0
  if (intersectionSize === 0) {
    return 0;
  }
  
  // Cosine similarity formula: |A ∩ B| / sqrt(|A| * |B|)
  const denominator = Math.sqrt(setA.size * setB.size);
  
  if (denominator === 0) {
    return 0;
  }
  
  return intersectionSize / denominator;
}

/**
 * Get collaborative filtering recommendations for a user
 * @param {Array} users - Array of all user documents with likedMovies and likedMusic populated
 * @param {String} currentUserId - ID of the user to get recommendations for
 * @returns {Array} Array of recommended item IDs (both movies and music)
 */
function getCollaborativeRecommendations(users, currentUserId) {
  // Find the current user
  const currentUser = users.find(u => u._id.toString() === currentUserId.toString());
  
  if (!currentUser) {
    console.log('Current user not found');
    return [];
  }
  
  // Get all items liked by current user (combine movies and music)
  const currentUserItems = [
    ...(currentUser.likedMovies || []),
    ...(currentUser.likedMusic || [])
  ];
  
  if (currentUserItems.length === 0) {
    console.log('Current user has no liked items');
    return [];
  }
  
  // Calculate similarity with all other users
  const similarities = [];
  
  for (const otherUser of users) {
    // Skip the current user
    if (otherUser._id.toString() === currentUserId.toString()) {
      continue;
    }
    
    // Get all items liked by other user
    const otherUserItems = [
      ...(otherUser.likedMovies || []),
      ...(otherUser.likedMusic || [])
    ];
    
    if (otherUserItems.length === 0) {
      continue;
    }
    
    // Calculate similarity
    const similarity = cosineSimilarity(currentUserItems, otherUserItems);
    
    if (similarity > 0) {
      similarities.push({
        userId: otherUser._id,
        similarity,
        likedMovies: otherUser.likedMovies || [],
        likedMusic: otherUser.likedMusic || []
      });
    }
  }
  
  // Sort by similarity (descending)
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  if (similarities.length === 0) {
    console.log('No similar users found');
    return [];
  }
  
  // Get the most similar user
  const mostSimilarUser = similarities[0];
  
  console.log(`Most similar user has similarity score: ${mostSimilarUser.similarity.toFixed(3)}`);
  
  // Get items liked by similar user but not by current user
  const currentUserItemIds = new Set(currentUserItems.map(id => id.toString()));
  const recommendedItems = [
    ...mostSimilarUser.likedMovies,
    ...mostSimilarUser.likedMusic
  ].filter(itemId => !currentUserItemIds.has(itemId.toString()));
  
  console.log(`Recommending ${recommendedItems.length} items`);
  
  return recommendedItems;
}

export {
  cosineSimilarity,
  getCollaborativeRecommendations
};
