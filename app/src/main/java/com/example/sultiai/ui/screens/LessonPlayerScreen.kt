package com.example.sultiai.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.sultiai.data.*
import com.example.sultiai.ui.theme.*

@Composable
fun LessonPlayerScreen(
    lesson: Lesson,
    onCompleteLesson: (lessonId: String, earnedXp: Int, score: Int) -> Unit,
    onClose: () -> Unit
) {
    var currentActivityIndex by remember { mutableIntStateOf(0) }
    var selectedOptionIndex by remember { mutableStateOf<Int?>(null) }
    var assembledTokens by remember { mutableStateOf<List<String>>(emptyList()) }
    var isAnswerChecked by remember { mutableStateOf(false) }
    var isAnswerCorrect by remember { mutableStateOf(false) }
    var speechAnalysisResult by remember { mutableStateOf<SpeechAnalysis?>(null) }
    var isRecordingSimulated by remember { mutableStateOf(false) }
    var showCompletionModal by remember { mutableStateOf(false) }

    val currentActivity = lesson.activities.getOrNull(currentActivityIndex)
    val progress = (currentActivityIndex.toFloat() / lesson.activities.size.toFloat()).coerceIn(0f, 1f)

    if (showCompletionModal) {
        AlertDialog(
            onDismissRequest = {},
            title = {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Text(text = "🎉", fontSize = 42.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Lesson Completed!",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.ExtraBold,
                        textAlign = TextAlign.Center
                    )
                }
            },
            text = {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "Maayo kaayo! You finished \"${lesson.title}\".",
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = TealPrimary.copy(alpha = 0.15f),
                            modifier = Modifier.padding(4.dp)
                        ) {
                            Column(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "+${lesson.xpReward} XP",
                                    fontWeight = FontWeight.ExtraBold,
                                    color = TealPrimary,
                                    fontSize = 18.sp
                                )
                                Text(text = "Experience", style = MaterialTheme.typography.labelSmall)
                            }
                        }
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = AmberAccent.copy(alpha = 0.15f),
                            modifier = Modifier.padding(4.dp)
                        ) {
                            Column(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "100%",
                                    fontWeight = FontWeight.ExtraBold,
                                    color = AmberAccent,
                                    fontSize = 18.sp
                                )
                                Text(text = "Accuracy", style = MaterialTheme.typography.labelSmall)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onCompleteLesson(lesson.id, lesson.xpReward, 100)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = TealPrimary),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().testTag("lesson_finish_confirm_button")
                ) {
                    Text(text = "Claim Rewards & Continue", fontWeight = FontWeight.Bold)
                }
            }
        )
    }

    Scaffold(
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surface)
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    IconButton(
                        onClick = onClose,
                        modifier = Modifier.testTag("lesson_player_close_button")
                    ) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close")
                    }

                    LinearProgressIndicator(
                        progress = { progress },
                        color = TealPrimary,
                        trackColor = TealPrimary.copy(alpha = 0.15f),
                        modifier = Modifier
                            .weight(1f)
                            .height(10.dp)
                            .padding(horizontal = 12.dp)
                            .clip(RoundedCornerShape(5.dp))
                    )

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Favorite,
                            contentDescription = "Hearts",
                            tint = RoseAccent,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "5",
                            fontWeight = FontWeight.Bold,
                            color = RoseAccent
                        )
                    }
                }
            }
        },
        bottomBar = {
            Surface(
                color = MaterialTheme.colorScheme.surface,
                tonalElevation = 8.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    if (isAnswerChecked) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = if (isAnswerCorrect) EmeraldContainer else RoseContainer,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 12.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = if (isAnswerCorrect) Icons.Default.CheckCircle else Icons.Default.Cancel,
                                    contentDescription = null,
                                    tint = if (isAnswerCorrect) EmeraldDark else Color(0xFFBE123C)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Column {
                                    Text(
                                        text = if (isAnswerCorrect) "Sakto kaayo! (Correct!)" else "Dili mao. Try again!",
                                        fontWeight = FontWeight.Bold,
                                        color = if (isAnswerCorrect) EmeraldDark else Color(0xFFBE123C)
                                    )
                                    currentActivity?.explanation?.let { exp ->
                                        Text(
                                            text = exp,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = if (isAnswerCorrect) EmeraldDark else Color(0xFFBE123C)
                                        )
                                    }
                                }
                            }
                        }

                        Button(
                            onClick = {
                                if (currentActivityIndex < lesson.activities.size - 1) {
                                    currentActivityIndex++
                                    isAnswerChecked = false
                                    selectedOptionIndex = null
                                    assembledTokens = emptyList()
                                    speechAnalysisResult = null
                                } else {
                                    showCompletionModal = true
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = TealPrimary),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                                .testTag("lesson_next_step_button")
                        ) {
                            Text(
                                text = if (currentActivityIndex < lesson.activities.size - 1) "Continue" else "Finish Lesson",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                        }
                    } else {
                        Button(
                            onClick = {
                                when (currentActivity?.type) {
                                    ActivityType.FLASHCARD -> {
                                        isAnswerChecked = true
                                        isAnswerCorrect = true
                                    }
                                    ActivityType.MULTIPLE_CHOICE -> {
                                        isAnswerChecked = true
                                        isAnswerCorrect = (selectedOptionIndex == currentActivity.correctAnswerIndex)
                                    }
                                    ActivityType.SENTENCE_ASSEMBLY -> {
                                        isAnswerChecked = true
                                        val assembledStr = assembledTokens.joinToString(" ")
                                        isAnswerCorrect = (assembledStr == currentActivity.correctAnswerText)
                                    }
                                    ActivityType.PRONUNCIATION_DRILL -> {
                                        isAnswerChecked = true
                                        isAnswerCorrect = (speechAnalysisResult?.accuracyScore ?: 0) >= 70
                                    }
                                    else -> {
                                        isAnswerChecked = true
                                        isAnswerCorrect = true
                                    }
                                }
                            },
                            enabled = when (currentActivity?.type) {
                                ActivityType.MULTIPLE_CHOICE -> selectedOptionIndex != null
                                ActivityType.SENTENCE_ASSEMBLY -> assembledTokens.isNotEmpty()
                                ActivityType.PRONUNCIATION_DRILL -> speechAnalysisResult != null
                                else -> true
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = TealPrimary),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                                .testTag("lesson_check_answer_button")
                        ) {
                            Text(
                                text = if (currentActivity?.type == ActivityType.FLASHCARD) "I Understand This" else "Check Answer",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                        }
                    }
                }
            }
        }
    ) { paddingValues ->
        currentActivity?.let { activity ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    // Activity type header badge
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = TealPrimary.copy(alpha = 0.12f)
                    ) {
                        Text(
                            text = when (activity.type) {
                                ActivityType.FLASHCARD -> "CULTURAL FLASHCARD"
                                ActivityType.MULTIPLE_CHOICE -> "MULTIPLE CHOICE"
                                ActivityType.PRONUNCIATION_DRILL -> "WHISPER PRONUNCIATION DRILL"
                                ActivityType.SENTENCE_ASSEMBLY -> "SENTENCE ASSEMBLY"
                                else -> "DIALOGUE PRACTICE"
                            },
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = TealPrimary,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                // Prompt
                item {
                    Text(
                        text = activity.prompt,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Activity Body depending on type
                when (activity.type) {
                    ActivityType.FLASHCARD -> {
                        item {
                            Card(
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(20.dp)) {
                                    activity.promptBisaya?.let { bisaya ->
                                        Text(
                                            text = bisaya,
                                            style = MaterialTheme.typography.headlineMedium,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = TealPrimary
                                        )
                                    }
                                    activity.phonetics?.let { phonetics ->
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = phonetics,
                                            style = MaterialTheme.typography.bodyMedium,
                                            fontWeight = FontWeight.Medium,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                        )
                                    }
                                    activity.explanation?.let { exp ->
                                        Spacer(modifier = Modifier.height(12.dp))
                                        Text(
                                            text = exp,
                                            style = MaterialTheme.typography.bodyMedium
                                        )
                                    }
                                    activity.culturalNote?.let { note ->
                                        Spacer(modifier = Modifier.height(16.dp))
                                        Surface(
                                            shape = RoundedCornerShape(12.dp),
                                            color = AmberContainer.copy(alpha = 0.5f),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Row(modifier = Modifier.padding(12.dp)) {
                                                Text(text = "💡", fontSize = 16.sp)
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Text(
                                                    text = note,
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = AmberDark
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    ActivityType.MULTIPLE_CHOICE -> {
                        item {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                activity.options.forEachIndexed { idx, opt ->
                                    val isSelected = selectedOptionIndex == idx
                                    Surface(
                                        shape = RoundedCornerShape(14.dp),
                                        color = if (isSelected) TealPrimary.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surface,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(14.dp))
                                            .border(
                                                width = if (isSelected) 2.dp else 1.dp,
                                                color = if (isSelected) TealPrimary else MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                                                shape = RoundedCornerShape(14.dp)
                                            )
                                            .clickable { if (!isAnswerChecked) selectedOptionIndex = idx }
                                            .testTag("option_button_$idx")
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(16.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Surface(
                                                shape = CircleShape,
                                                color = if (isSelected) TealPrimary else MaterialTheme.colorScheme.surfaceVariant,
                                                modifier = Modifier.size(24.dp)
                                            ) {
                                                Box(contentAlignment = Alignment.Center) {
                                                    Text(
                                                        text = ('A'.code + idx).toChar().toString(),
                                                        fontSize = 12.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface
                                                    )
                                                }
                                            }
                                            Spacer(modifier = Modifier.width(12.dp))
                                            Text(
                                                text = opt,
                                                style = MaterialTheme.typography.bodyLarge,
                                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    ActivityType.SENTENCE_ASSEMBLY -> {
                        item {
                            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                // Assemble slot area
                                Surface(
                                    shape = RoundedCornerShape(14.dp),
                                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .heightIn(min = 70.dp)
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .padding(12.dp)
                                            .fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        if (assembledTokens.isEmpty()) {
                                            Text(
                                                text = "Tap word tiles below in the correct order...",
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                            )
                                        } else {
                                            assembledTokens.forEach { token ->
                                                Surface(
                                                    shape = RoundedCornerShape(8.dp),
                                                    color = TealPrimary,
                                                    modifier = Modifier.clickable {
                                                        assembledTokens = assembledTokens - token
                                                    }
                                                ) {
                                                    Text(
                                                        text = token,
                                                        color = Color.White,
                                                        fontWeight = FontWeight.Bold,
                                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }

                                // Word chips available
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    activity.options.forEach { token ->
                                        val isUsed = assembledTokens.contains(token)
                                        Surface(
                                            shape = RoundedCornerShape(10.dp),
                                            color = if (isUsed) MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f) else MaterialTheme.colorScheme.surface,
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(10.dp))
                                                .border(
                                                    width = 1.dp,
                                                    color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                                                    shape = RoundedCornerShape(10.dp)
                                                )
                                                .clickable(enabled = !isUsed) {
                                                    assembledTokens = assembledTokens + token
                                                }
                                                .testTag("word_chip_$token")
                                        ) {
                                            Text(
                                                text = token,
                                                fontWeight = FontWeight.Bold,
                                                color = if (isUsed) MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f) else MaterialTheme.colorScheme.onSurface,
                                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    ActivityType.PRONUNCIATION_DRILL -> {
                        item {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                activity.promptBisaya?.let { bisaya ->
                                    Text(
                                        text = bisaya,
                                        style = MaterialTheme.typography.headlineMedium,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = TealPrimary,
                                        textAlign = TextAlign.Center
                                    )
                                }
                                activity.phonetics?.let { phonetics ->
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = phonetics,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                        textAlign = TextAlign.Center
                                    )
                                }

                                Spacer(modifier = Modifier.height(24.dp))

                                // Microphone record button
                                Surface(
                                    shape = CircleShape,
                                    color = if (isRecordingSimulated) RoseAccent else TealPrimary,
                                    modifier = Modifier
                                        .size(76.dp)
                                        .clickable {
                                            isRecordingSimulated = true
                                            val expected = activity.promptBisaya ?: "Kumusta ka karon?"
                                            speechAnalysisResult = SultiAiEngine.evaluateSpeechWhisper(expected, expected)
                                            isRecordingSimulated = false
                                        }
                                        .testTag("record_speech_drill_button")
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(
                                            imageVector = Icons.Default.Mic,
                                            contentDescription = "Record Speech",
                                            tint = Color.White,
                                            modifier = Modifier.size(36.dp)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Tap to Speak (Whisper STT Analysis)",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Medium
                                )

                                speechAnalysisResult?.let { speech ->
                                    Spacer(modifier = Modifier.height(20.dp))
                                    Card(
                                        shape = RoundedCornerShape(16.dp),
                                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column(modifier = Modifier.padding(16.dp)) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text(
                                                    text = "Whisper WER Telemetry",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    fontWeight = FontWeight.Bold,
                                                    color = TealPrimary
                                                )
                                                Text(
                                                    text = "Accuracy: ${speech.accuracyScore}%",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    fontWeight = FontWeight.Bold,
                                                    color = Color(0xFF10B981)
                                                )
                                            }
                                            Spacer(modifier = Modifier.height(6.dp))
                                            Text(
                                                text = speech.phonemeFeedback,
                                                style = MaterialTheme.typography.bodySmall
                                            )
                                            Spacer(modifier = Modifier.height(8.dp))
                                            Text(
                                                text = "Syllable breakdown: ${speech.syllableBreakdown.joinToString(" · ")}",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    else -> {}
                }
            }
        }
    }
}
