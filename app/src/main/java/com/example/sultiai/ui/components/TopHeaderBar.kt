package com.example.sultiai.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Stars
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.sultiai.data.UserProfile
import com.example.sultiai.ui.theme.AmberAccent
import com.example.sultiai.ui.theme.RoseAccent
import com.example.sultiai.ui.theme.TealPrimary

@Composable
fun TopHeaderBar(
    profile: UserProfile,
    onDialectClick: () -> Unit,
    onCapstoneClick: () -> Unit,
    onRefillHeartsClick: () -> Unit
) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 2.dp,
        modifier = Modifier.fillMaxWidth().testTag("top_header_bar")
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Dialect selector button
                Surface(
                    color = TealPrimary.copy(alpha = 0.12f),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier
                        .clickable { onDialectClick() }
                        .testTag("dialect_selector_button")
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                    ) {
                        Text(
                            text = "🏝️",
                            fontSize = 13.sp,
                            modifier = Modifier.padding(end = 4.dp)
                        )
                        Text(
                            text = profile.targetDialect.displayName,
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = TealPrimary
                        )
                    }
                }

                // Capstone Research Audit button
                Surface(
                    color = Color(0xFF6366F1).copy(alpha = 0.14f),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier
                        .clickable { onCapstoneClick() }
                        .testTag("capstone_audit_button")
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.School,
                            contentDescription = "Capstone Audit",
                            tint = Color(0xFF4F46E5),
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "JMC Defense Audit",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF4338CA)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Stats row (Streak, Hearts, Gems, XP)
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Streak
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.testTag("streak_pill")
                ) {
                    Icon(
                        imageVector = Icons.Default.LocalFireDepartment,
                        contentDescription = "Streak",
                        tint = AmberAccent,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(2.dp))
                    Text(
                        text = "${profile.streakDays}d",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.ExtraBold,
                        color = AmberAccent
                    )
                }

                // Hearts
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .clickable { onRefillHeartsClick() }
                        .padding(horizontal = 4.dp, vertical = 2.dp)
                        .testTag("hearts_pill")
                ) {
                    Icon(
                        imageVector = Icons.Default.Favorite,
                        contentDescription = "Hearts",
                        tint = RoseAccent,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = "${profile.hearts}/${profile.maxHearts}",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = RoseAccent
                    )
                }

                // Gems
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.testTag("gems_pill")
                ) {
                    Text(
                        text = "💎",
                        fontSize = 14.sp
                    )
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = "${profile.gems}",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF0284C7)
                    )
                }

                // XP
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.testTag("xp_pill")
                ) {
                    Icon(
                        imageVector = Icons.Default.Stars,
                        contentDescription = "XP",
                        tint = Color(0xFF8B5CF6),
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = "${profile.xp} XP",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF8B5CF6)
                    )
                }
            }
        }
    }
}
