package com.example.sultiai.data

import kotlinx.serialization.Serializable

enum class TargetDialect(val displayName: String, val subtitle: String) {
    CEBUANO_STANDARD("Cebuano (Standard)", "Formal & classic Visayan vocabulary"),
    DAVAO_BISAYA("Davao Bisaya", "Friendly Mindanao colloquial blend with 'gud' & 'bitaw'"),
    BOHOLANO("Boholano (Bol-anon)", "Rich dialect with signature 'y' to 'j' phonetics")
}

@Serializable
data class DayActivity(
    val id: String,
    val date: String,
    val dayOfWeek: String,
    val dayBisaya: String,
    val dayNumber: Int,
    val minutes: Int,
    val goalMinutes: Int,
    val goalMet: Boolean,
    val xpEarned: Int,
    val lessonsCompleted: Int,
    val isToday: Boolean = false
)

@Serializable
data class SultiRecommendation(
    val id: String,
    val title: String,
    val rationale: String,
    val targetPhrase: String,
    val targetPhraseEnglish: String,
    val contextScenario: String,
    val actionPrompt: String,
    val scenarioId: String? = null
)

@Serializable
data class UserProfile(
    val id: String,
    val name: String,
    val email: String,
    val avatarUrl: String,
    val targetDialect: TargetDialect,
    val dailyGoalMinutes: Int,
    val todayMinutes: Int,
    val xp: Int,
    val streakDays: Int,
    val level: String,
    val gems: Int = 240,
    val hearts: Int = 5,
    val maxHearts: Int = 5,
    val streakFreezesAvailable: Int = 1,
    val weeklyActivity: List<DayActivity> = emptyList(),
    val completedLessons: List<String> = emptyList(),
    val vocabularyMastered: Int = 38,
    val speechScoreAverage: Int = 91,
    val joinedDate: String = "September 2026"
)

enum class ActivityType {
    FLASHCARD,
    MULTIPLE_CHOICE,
    PRONUNCIATION_DRILL,
    SENTENCE_ASSEMBLY,
    DIALOGUE_PROMPT
}

@Serializable
data class LessonActivity(
    val id: String,
    val type: ActivityType,
    val prompt: String,
    val promptBisaya: String? = null,
    val phonetics: String? = null,
    val options: List<String> = emptyList(),
    val correctAnswerIndex: Int = 0,
    val correctAnswerText: String? = null,
    val explanation: String? = null,
    val culturalNote: String? = null
)

@Serializable
data class Lesson(
    val id: String,
    val moduleId: String,
    val title: String,
    val titleBisaya: String,
    val description: String,
    val level: String,
    val xpReward: Int,
    val estimatedMinutes: Int,
    val completed: Boolean = false,
    val score: Int = 0,
    val activities: List<LessonActivity>
)

@Serializable
data class Module(
    val id: String,
    val title: String,
    val titleBisaya: String,
    val description: String,
    val iconName: String,
    val accentColorHex: Long,
    val lessons: List<Lesson>
)

@Serializable
data class TokenWeight(
    val token: String,
    val weight: Float
)

@Serializable
data class BertNlpAnalysis(
    val predictedIntent: String,
    val intentConfidence: Float,
    val detectedLanguage: String,
    val languageConfidence: Float,
    val sentiment: String,
    val sentimentScore: Float,
    val keyTokens: List<TokenWeight>,
    val bertModelRef: String,
    val latencyMs: Long
)

@Serializable
data class SpeechAnalysis(
    val transcription: String,
    val expectedText: String,
    val confidence: Float,
    val accuracyScore: Int,
    val whisperWer: Int, // Word Error Rate %
    val phonemeFeedback: String,
    val syllableBreakdown: List<String>
)

@Serializable
data class VocabBreakdown(
    val bisaya: String,
    val english: String,
    val pos: String
)

@Serializable
data class SultiMessage(
    val id: String,
    val sender: String, // "user" or "sulti"
    val text: String,
    val translation: String? = null,
    val phoneticGuide: String? = null,
    val timestamp: String,
    val isAudio: Boolean = false,
    val bertAnalysis: BertNlpAnalysis? = null,
    val speechAnalysis: SpeechAnalysis? = null,
    val suggestedReplies: List<String> = emptyList(),
    val culturalTip: String? = null,
    val vocabularyBreakdown: List<VocabBreakdown> = emptyList(),
    val grammarCorrection: String? = null,
    val groundingNote: String? = null
)

@Serializable
data class UsefulPhrase(
    val bisaya: String,
    val english: String
)

@Serializable
data class RoleplayScenario(
    val id: String,
    val title: String,
    val titleBisaya: String,
    val context: String,
    val location: String,
    val difficulty: String,
    val initialPrompt: String,
    val suggestedGoal: String,
    val usefulPhrases: List<UsefulPhrase>
)

@Serializable
data class CommunityComment(
    val id: String,
    val authorName: String,
    val authorRole: String,
    val text: String,
    val timestamp: String,
    val likes: Int
)

@Serializable
data class CommunityPost(
    val id: String,
    val authorName: String,
    val authorTag: String,
    val category: String, // "Expression", "Grammar", "Cultural Tip", "Question", "Pronunciation"
    val title: String,
    val contentBisaya: String,
    val contentEnglish: String,
    val dialectNote: String? = null,
    val likes: Int,
    val likedByMe: Boolean = false,
    val comments: List<CommunityComment> = emptyList(),
    val timestamp: String
)

@Serializable
data class CapstoneRequirement(
    val id: Int,
    val title: String,
    val status: String, // "verified", "in_progress", "ready_for_defense"
    val description: String,
    val evidence: String,
    val verifiedTimestamp: String
)

@Serializable
data class ResearchMetricData(
    val preTestAverage: Float,
    val postTestAverage: Float,
    val improvementPercentage: Float,
    val susScore: Float, // System Usability Scale (0-100)
    val whisperAvgWer: Float, // Word Error Rate %
    val bertIntentAccuracy: Float, // Intent classification %
    val sampleSize: Int
)
