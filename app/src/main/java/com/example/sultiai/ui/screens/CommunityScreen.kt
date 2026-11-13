package com.example.sultiai.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.sultiai.data.CommunityComment
import com.example.sultiai.data.CommunityPost
import com.example.sultiai.data.CurriculumData
import com.example.sultiai.ui.theme.AmberAccent
import com.example.sultiai.ui.theme.RoseAccent
import com.example.sultiai.ui.theme.TealPrimary

@Composable
fun CommunityScreen() {
    val posts = remember { mutableStateListOf(*CurriculumData.INITIAL_COMMUNITY_POSTS.toTypedArray()) }
    var selectedCategory by remember { mutableStateOf("All") }
    var showCreateDialog by remember { mutableStateOf(false) }

    val categories = listOf("All", "Expression", "Grammar", "Cultural Tip", "Question", "Pronunciation")

    val filteredPosts = if (selectedCategory == "All") {
        posts
    } else {
        posts.filter { it.category == selectedCategory }
    }

    if (showCreateDialog) {
        var newTitle by remember { mutableStateOf("") }
        var newBisaya by remember { mutableStateOf("") }
        var newEnglish by remember { mutableStateOf("") }
        var newCategory by remember { mutableStateOf("Question") }

        AlertDialog(
            onDismissRequest = { showCreateDialog = false },
            title = {
                Text(
                    text = "Share Bisaya Query or Tip",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = newTitle,
                        onValueChange = { newTitle = it },
                        label = { Text("Title") },
                        modifier = Modifier.fillMaxWidth().testTag("new_post_title_input")
                    )
                    OutlinedTextField(
                        value = newBisaya,
                        onValueChange = { newBisaya = it },
                        label = { Text("Bisaya Expression / Question") },
                        modifier = Modifier.fillMaxWidth().testTag("new_post_bisaya_input")
                    )
                    OutlinedTextField(
                        value = newEnglish,
                        onValueChange = { newEnglish = it },
                        label = { Text("English Translation / Context") },
                        modifier = Modifier.fillMaxWidth().testTag("new_post_english_input")
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newTitle.isNotBlank() && newBisaya.isNotBlank()) {
                            posts.add(
                                0,
                                CommunityPost(
                                    id = "post_${System.currentTimeMillis()}",
                                    authorName = "Genesis Diaz",
                                    authorTag = "Learner · JMCFI",
                                    category = newCategory,
                                    title = newTitle.trim(),
                                    contentBisaya = newBisaya.trim(),
                                    contentEnglish = newEnglish.trim(),
                                    likes = 1,
                                    likedByMe = true,
                                    timestamp = "Just now"
                                )
                            )
                            showCreateDialog = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = TealPrimary),
                    modifier = Modifier.testTag("publish_post_button")
                ) {
                    Text("Publish Post")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreateDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showCreateDialog = true },
                containerColor = TealPrimary,
                contentColor = Color.White,
                modifier = Modifier.testTag("create_community_post_fab")
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "Add Post")
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            item {
                Column(modifier = Modifier.padding(top = 12.dp)) {
                    Text(
                        text = "Community Hub",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        text = "Connect with native Bisaya speakers and language learners",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }
            }

            // Categories horizontal filter
            item {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(categories) { cat ->
                        val isSelected = selectedCategory == cat
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = if (isSelected) TealPrimary else MaterialTheme.colorScheme.surface,
                            shadowElevation = if (isSelected) 2.dp else 1.dp,
                            modifier = Modifier
                                .clickable { selectedCategory = cat }
                                .testTag("category_filter_$cat")
                        ) {
                            Text(
                                text = cat,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                            )
                        }
                    }
                }
            }

            // Posts list
            items(filteredPosts) { post ->
                var isLiked by remember { mutableStateOf(post.likedByMe) }
                var likeCount by remember { mutableIntStateOf(post.likes) }
                var showComments by remember { mutableStateOf(false) }
                var newCommentText by remember { mutableStateOf("") }
                val commentsList = remember { mutableStateListOf(*post.comments.toTypedArray()) }

                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("community_post_${post.id}")
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        // Author header
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = TealPrimary.copy(alpha = 0.15f),
                                modifier = Modifier.size(38.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = post.authorName.take(1),
                                        fontWeight = FontWeight.Bold,
                                        color = TealPrimary
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = post.authorName,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "${post.authorTag} · ${post.timestamp}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                            }
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant
                            ) {
                                Text(
                                    text = post.category,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TealPrimary,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(
                            text = post.title,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = post.contentBisaya,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = TealDark
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = post.contentEnglish,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.75f)
                        )

                        post.dialectNote?.let { note ->
                            Spacer(modifier = Modifier.height(8.dp))
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = AmberAccent.copy(alpha = 0.15f)
                            ) {
                                Row(modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)) {
                                    Text(text = "📌 $note", fontSize = 11.sp, color = AmberAccent)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))
                        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                        Spacer(modifier = Modifier.height(8.dp))

                        // Actions row (Like, Comments)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .clickable {
                                        if (isLiked) {
                                            isLiked = false
                                            likeCount--
                                        } else {
                                            isLiked = true
                                            likeCount++
                                        }
                                    }
                                    .padding(vertical = 4.dp)
                                    .testTag("like_button_${post.id}")
                            ) {
                                Icon(
                                    imageVector = if (isLiked) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                    contentDescription = "Like",
                                    tint = if (isLiked) RoseAccent else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "$likeCount likes",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = if (isLiked) FontWeight.Bold else FontWeight.Normal,
                                    color = if (isLiked) RoseAccent else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                )
                            }

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .clickable { showComments = !showComments }
                                    .padding(vertical = 4.dp)
                                    .testTag("comments_toggle_${post.id}")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ChatBubbleOutline,
                                    contentDescription = "Comments",
                                    tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "${commentsList.size} comments",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                )
                            }
                        }

                        // Expanded comments section
                        if (showComments) {
                            Spacer(modifier = Modifier.height(12.dp))
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                commentsList.forEach { comment ->
                                    Surface(
                                        shape = RoundedCornerShape(10.dp),
                                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column(modifier = Modifier.padding(10.dp)) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Text(
                                                    text = "${comment.authorName} (${comment.authorRole})",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    fontWeight = FontWeight.Bold
                                                )
                                                Text(
                                                    text = comment.timestamp,
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                                )
                                            }
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(
                                                text = comment.text,
                                                style = MaterialTheme.typography.bodySmall
                                            )
                                        }
                                    }
                                }

                                // New comment input
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.fillMaxWidth().padding(top = 6.dp)
                                ) {
                                    OutlinedTextField(
                                        value = newCommentText,
                                        onValueChange = { newCommentText = it },
                                        placeholder = { Text("Add comment...") },
                                        shape = RoundedCornerShape(12.dp),
                                        modifier = Modifier.weight(1f).testTag("add_comment_input")
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    IconButton(
                                        onClick = {
                                            if (newCommentText.isNotBlank()) {
                                                commentsList.add(
                                                    CommunityComment(
                                                        id = "c_${System.currentTimeMillis()}",
                                                        authorName = "Genesis Diaz",
                                                        authorRole = "Learner",
                                                        text = newCommentText.trim(),
                                                        timestamp = "Just now",
                                                        likes = 0
                                                    )
                                                )
                                                newCommentText = ""
                                            }
                                        },
                                        modifier = Modifier.testTag("send_comment_button")
                                    ) {
                                        Icon(imageVector = Icons.Default.Send, contentDescription = "Send", tint = TealPrimary)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
