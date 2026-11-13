package com.example.sultiai.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.example.sultiai.data.UserProfile
import com.example.sultiai.ui.theme.AmberAccent
import com.example.sultiai.ui.theme.IndigoPrimary
import com.example.sultiai.ui.theme.RoseAccent
import com.example.sultiai.ui.theme.TealPrimary

@Composable
fun ProfileScreen(
    profile: UserProfile,
    onDialectClick: () -> Unit,
    onCapstoneClick: () -> Unit,
    onUpdateDailyGoal: (Int) -> Unit,
    onRefillHearts: () -> Unit,
    onUseStreakFreeze: () -> Unit,
    onSignOut: () -> Unit = {}
) {
    var selectedGoalMins by remember { mutableIntStateOf(profile.dailyGoalMinutes) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = 16.dp)
            .testTag("profile_screen_lazy_column"),
        contentPadding = PaddingValues(vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // User Profile Header Card
        item {
            Card(
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth().testTag("profile_header_card")
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Surface(
                        shape = CircleShape,
                        color = TealPrimary,
                        modifier = Modifier.size(72.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = "GD",
                                fontSize = 24.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = profile.name,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        text = profile.email,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = TealPrimary.copy(alpha = 0.12f)
                    ) {
                        Text(
                            text = profile.level,
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = TealPrimary,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp)
                        )
                    }
                }
            }
        }

        // Stats Grid Card
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth().testTag("profile_stats_card")
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        text = "Learning Statistics",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(14.dp))
                    Row(modifier = Modifier.fillMaxWidth()) {
                        // Metric 1: Streak
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = AmberAccent.copy(alpha = 0.1f),
                            modifier = Modifier.weight(1f).padding(end = 6.dp)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text(text = "🔥 Streak", style = MaterialTheme.typography.labelSmall, color = AmberAccent)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(text = "${profile.streakDays} Days", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                            }
                        }
                        // Metric 2: XP
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = IndigoPrimary.copy(alpha = 0.1f),
                            modifier = Modifier.weight(1f).padding(start = 6.dp)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text(text = "⭐ Total XP", style = MaterialTheme.typography.labelSmall, color = IndigoPrimary)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(text = "${profile.xp} XP", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(modifier = Modifier.fillMaxWidth()) {
                        // Metric 3: Vocabulary
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = TealPrimary.copy(alpha = 0.1f),
                            modifier = Modifier.weight(1f).padding(end = 6.dp)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text(text = "📖 Words", style = MaterialTheme.typography.labelSmall, color = TealPrimary)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(text = "${profile.vocabularyMastered}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                            }
                        }
                        // Metric 4: Speech
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = Color(0xFF10B981).copy(alpha = 0.1f),
                            modifier = Modifier.weight(1f).padding(start = 6.dp)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text(text = "🎙️ Speech Acc.", style = MaterialTheme.typography.labelSmall, color = Color(0xFF10B981))
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(text = "${profile.speechScoreAverage}%", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // Dialect Preference
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth().testTag("profile_dialect_card")
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Target Dialect",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = profile.targetDialect.displayName,
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Bold,
                                color = TealPrimary
                            )
                        }
                        FilledTonalButton(
                            onClick = onDialectClick,
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.testTag("change_dialect_button")
                        ) {
                            Text(text = "Change", style = MaterialTheme.typography.labelSmall)
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = profile.targetDialect.subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }
            }
        }

        // Daily Study Goal Target
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        text = "Daily Goal: $selectedGoalMins Minutes",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf(10, 15, 20, 30).forEach { mins ->
                            val isSelected = selectedGoalMins == mins
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = if (isSelected) TealPrimary else MaterialTheme.colorScheme.surfaceVariant,
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable {
                                        selectedGoalMins = mins
                                        onUpdateDailyGoal(mins)
                                    }
                            ) {
                                Box(
                                    contentAlignment = Alignment.Center,
                                    modifier = Modifier.padding(vertical = 10.dp)
                                ) {
                                    Text(
                                        text = "${mins}m",
                                        fontWeight = FontWeight.Bold,
                                        color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Actions & Capstone
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(
                    onClick = onCapstoneClick,
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4F46E5)),
                    modifier = Modifier.fillMaxWidth().height(50.dp).testTag("profile_capstone_audit_btn")
                ) {
                    Icon(imageVector = Icons.Default.School, contentDescription = null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "View JMCFI Capstone Research Audit", fontWeight = FontWeight.Bold)
                }

                OutlinedButton(
                    onClick = onRefillHearts,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth().height(48.dp).testTag("refill_hearts_button")
                ) {
                    Icon(imageVector = Icons.Default.Favorite, contentDescription = null, tint = RoseAccent, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "Refill Energy Hearts (5/5)", fontWeight = FontWeight.SemiBold)
                }

                OutlinedButton(
                    onClick = onSignOut,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth().height(48.dp)
                ) {
                    Icon(imageVector = Icons.Default.ExitToApp, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "Sign Out", fontWeight = FontWeight.SemiBold)
                )
            }
        }
    }
}
