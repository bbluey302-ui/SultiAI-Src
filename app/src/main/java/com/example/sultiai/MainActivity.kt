package com.example.sultiai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.sultiai.auth.AuthViewModel
import com.example.sultiai.auth.SupabaseClient
import com.example.sultiai.data.*
import com.example.sultiai.ui.components.AppTab
import com.example.sultiai.ui.components.BottomNavBar
import com.example.sultiai.ui.components.TopHeaderBar
import com.example.sultiai.ui.dialogs.CapstoneAuditDialog
import com.example.sultiai.ui.dialogs.DialectSelectionDialog
import com.example.sultiai.ui.screens.*
import com.example.sultiai.ui.theme.SultiTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Initialize Supabase client
        SupabaseClient.initialize()

        setContent {
            SultiTheme {
                SultiApp()
            }
        }
    }
}

@Composable
fun SultiApp() {
    val authViewModel: AuthViewModel = viewModel()
    val authState by authViewModel.authState.collectAsState()

    var currentTab by remember { mutableStateOf(AppTab.HOME) }
    var modules by remember { mutableStateOf(CurriculumData.INITIAL_MODULES) }
    var activeLesson by remember { mutableStateOf<Lesson?>(null) }
    var showDialectDialog by remember { mutableStateOf(false) }
    var showCapstoneDialog by remember { mutableStateOf(false) }
    var sultiPrefillPrompt by remember { mutableStateOf<String?>(null) }
    var showLoginScreen by remember { mutableStateOf(!authState.isAuthenticated) }

    // Update showLoginScreen based on auth state
    LaunchedEffect(authState.isAuthenticated) {
        showLoginScreen = !authState.isAuthenticated
    }

    var profile by remember {
        mutableStateOf(
            UserProfile(
                id = authState.user?.id ?: "usr_genesis",
                name = authState.user?.name ?: "Genesis Diaz",
                email = authState.user?.email ?: "genesis.diaz@jmc.edu.ph",
                avatarUrl = authState.user?.avatarUrl ?: "",
                targetDialect = TargetDialect.DAVAO_BISAYA,
                dailyGoalMinutes = 15,
                todayMinutes = 8,
                xp = 420,
                streakDays = 7,
                level = "Level 3: Bisaya Explorer",
                gems = 240,
                hearts = 5,
                maxHearts = 5,
                streakFreezesAvailable = 1,
                weeklyActivity = CurriculumData.DEFAULT_WEEKLY_ACTIVITY,
                completedLessons = listOf("les_1_1"),
                vocabularyMastered = 38,
                speechScoreAverage = 91,
                joinedDate = "September 2026"
            )
        )
    }

    // Find the next incomplete lesson
    val allLessons = modules.flatMap { it.lessons }
    val nextLesson = allLessons.find { !profile.completedLessons.contains(it.id) } ?: allLessons.first()

    // Show Login/Signup screen if not authenticated
    if (showLoginScreen) {
        var isSignUp by remember { mutableStateOf(false) }

        if (isSignUp) {
            SignUpScreen(
                authViewModel = authViewModel,
                onSignUpSuccess = {
                    showLoginScreen = false
                },
                onNavigateBack = {
                    isSignUp = false
                }
            )
        } else {
            LoginScreen(
                authViewModel = authViewModel,
                onLoginSuccess = {
                    showLoginScreen = false
                },
                onNavigateToSignUp = {
                    isSignUp = true
                }
            )
        }
        return
    }

    // Handle back button when playing a lesson
    if (activeLesson != null) {
        BackHandler {
            activeLesson = null
        }
    }

    if (showDialectDialog) {
        DialectSelectionDialog(
            currentDialect = profile.targetDialect,
            onDialectSelected = { newDialect ->
                profile = profile.copy(targetDialect = newDialect)
            },
            onDismiss = { showDialectDialog = false }
        )
    }

    if (showCapstoneDialog) {
        CapstoneAuditDialog(
            onDismiss = { showCapstoneDialog = false }
        )
    }

    if (activeLesson != null) {
        LessonPlayerScreen(
            lesson = activeLesson!!,
            onCompleteLesson = { lessonId, earnedXp, score ->
                val alreadyCompleted = profile.completedLessons.contains(lessonId)
                val newCompleted = if (alreadyCompleted) profile.completedLessons else profile.completedLessons + lessonId
                val newXp = profile.xp + earnedXp
                val newGems = profile.gems + 15
                val newVocab = profile.vocabularyMastered + 4
                val newTodayMins = profile.todayMinutes + 5
                val newAvgSpeech = ((profile.speechScoreAverage * 4 + score) / 5)

                val updatedWeekly = profile.weeklyActivity.map { d ->
                    if (d.isToday) {
                        val m = d.minutes + 5
                        d.copy(
                            minutes = m,
                            xpEarned = d.xpEarned + earnedXp,
                            lessonsCompleted = d.lessonsCompleted + 1,
                            goalMet = m >= d.goalMinutes
                        )
                    } else d
                }

                profile = profile.copy(
                    xp = newXp,
                    gems = newGems,
                    completedLessons = newCompleted,
                    vocabularyMastered = newVocab,
                    todayMinutes = newTodayMins,
                    speechScoreAverage = newAvgSpeech,
                    weeklyActivity = updatedWeekly
                )
                activeLesson = null
            },
            onClose = { activeLesson = null }
        )
    } else {
        Scaffold(
            topBar = {
                TopHeaderBar(
                    profile = profile,
                    onDialectClick = { showDialectDialog = true },
                    onCapstoneClick = { showCapstoneDialog = true },
                    onRefillHeartsClick = {
                        profile = profile.copy(hearts = profile.maxHearts)
                    }
                )
            },
            bottomBar = {
                BottomNavBar(
                    currentTab = currentTab,
                    onTabSelected = { tab ->
                        currentTab = tab
                    }
                )
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                when (currentTab) {
                    AppTab.HOME -> HomeScreen(
                        profile = profile,
                        nextLesson = nextLesson,
                        onStartLesson = { lesson -> activeLesson = lesson },
                        onNavigateToSultiWithPrompt = { prompt ->
                            sultiPrefillPrompt = prompt
                            currentTab = AppTab.SULTI
                        },
                        onQuickPracticeClick = { addedMinutes ->
                            val newToday = profile.todayMinutes + addedMinutes
                            val updatedWeekly = profile.weeklyActivity.map { d ->
                                if (d.isToday) {
                                    val m = d.minutes + addedMinutes
                                    d.copy(minutes = m, xpEarned = d.xpEarned + addedMinutes * 5, goalMet = m >= d.goalMinutes)
                                } else d
                            }
                            profile = profile.copy(
                                xp = profile.xp + addedMinutes * 5,
                                todayMinutes = newToday,
                                weeklyActivity = updatedWeekly
                            )
                        }
                    )
                    AppTab.LEARN -> LearnScreen(
                        modules = modules,
                        profile = profile,
                        onStartLesson = { lesson -> activeLesson = lesson }
                    )
                    AppTab.SULTI -> SultiScreen(
                        profile = profile,
                        prefillPrompt = sultiPrefillPrompt,
                        onActivityRecorded = {
                            val newToday = profile.todayMinutes + 2
                            val updatedWeekly = profile.weeklyActivity.map { d ->
                                if (d.isToday) {
                                    val m = d.minutes + 2
                                    d.copy(minutes = m, xpEarned = d.xpEarned + 10, goalMet = m >= d.goalMinutes)
                                } else d
                            }
                            profile = profile.copy(
                                xp = profile.xp + 10,
                                todayMinutes = newToday,
                                weeklyActivity = updatedWeekly
                            )
                        }
                    )
                    AppTab.COMMUNITY -> CommunityScreen()
                    AppTab.PROFILE -> ProfileScreen(
                        profile = profile,
                        onDialectClick = { showDialectDialog = true },
                        onCapstoneClick = { showCapstoneDialog = true },
                        onUpdateDailyGoal = { mins ->
                            profile = profile.copy(dailyGoalMinutes = mins)
                        },
                        onRefillHearts = {
                            profile = profile.copy(hearts = profile.maxHearts)
                        },
                        onUseStreakFreeze = {
                            profile = profile.copy(
                                streakFreezesAvailable = kotlin.math.max(0, profile.streakFreezesAvailable - 1)
                            )
                        },
                        onSignOut = {
                            authViewModel.signOut()
                            showLoginScreen = true
                        }
                    )
                }
            }
        }
    }
}
