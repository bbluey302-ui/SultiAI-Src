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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.sultiai.data.*
import com.example.sultiai.ui.theme.*

@Composable
fun SultiScreen(
    profile: UserProfile,
    prefillPrompt: String? = null,
    onActivityRecorded: () -> Unit
) {
    var selectedScenario by remember { mutableStateOf<RoleplayScenario?>(CurriculumData.ROLEPLAY_SCENARIOS.firstOrNull()) }
    var inputText by remember { mutableStateOf(prefillPrompt ?: "") }

    val initialMessages = remember {
        mutableStateListOf(
            SultiMessage(
                id = "init_1",
                sender = "sulti",
                text = "Maayong adlaw! Ako si Sulti, imong Bisaya conversation companion. Unsay gusto nimong estoryahan karon?",
                translation = "Good day! I am Sulti, your Bisaya conversation companion. What would you like to talk about today?",
                phoneticGuide = "Mah-ah-YONG ad-LAW! Ah-KOH see SOOL-tee, EE-mong bee-SAH-yah companion.",
                timestamp = "Today",
                culturalTip = "In Bisaya, politeness is conveyed through warm tone and expressions like \"palihog\" (please) rather than Tagalog \"po\".",
                suggestedReplies = listOf(
                    "Palihog ko sa plete, Nong. (Please pass my fare, sir.)",
                    "Tagpila ang kilo sa mangga? (How much per kilo for mangoes?)",
                    "Asa dapit ang Roxas Night Market? (Where is Roxas Night Market?)"
                ),
                vocabularyBreakdown = listOf(
                    VocabBreakdown("Maayong", "Good", "adjective"),
                    VocabBreakdown("adlaw", "day", "noun"),
                    VocabBreakdown("estoryahan", "to talk about", "verb")
                )
            )
        )
    }

    LaunchedEffect(prefillPrompt) {
        if (!prefillPrompt.isNullOrBlank()) {
            inputText = prefillPrompt
        }
    }

    Scaffold(
        bottomBar = {
            Surface(
                color = MaterialTheme.colorScheme.surface,
                tonalElevation = 8.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    // Quick Suggested Replies
                    val lastMessage = initialMessages.lastOrNull { it.sender == "sulti" }
                    if (lastMessage != null && lastMessage.suggestedReplies.isNotEmpty()) {
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.padding(bottom = 8.dp)
                        ) {
                            items(lastMessage.suggestedReplies) { reply ->
                                Surface(
                                    shape = RoundedCornerShape(16.dp),
                                    color = TealPrimary.copy(alpha = 0.1f),
                                    modifier = Modifier
                                        .clickable {
                                            val cleanText = reply.substringBefore(" (")
                                            inputText = cleanText
                                        }
                                        .testTag("suggested_reply_chip")
                                ) {
                                    Text(
                                        text = reply,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TealPrimary,
                                        fontWeight = FontWeight.SemiBold,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                    )
                                }
                            }
                        }
                    }

                    // Input Field & Action Buttons
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        OutlinedTextField(
                            value = inputText,
                            onValueChange = { inputText = it },
                            placeholder = { Text("Tubag sa Bisaya (Type in Bisaya)...") },
                            shape = RoundedCornerShape(20.dp),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("sulti_chat_input_field"),
                            maxLines = 3
                        )

                        Spacer(modifier = Modifier.width(8.dp))

                        // Mic button for speech
                        IconButton(
                            onClick = {
                                val sampleSpeech = "Palihog ko sa plete padulong Matina"
                                inputText = sampleSpeech
                            },
                            modifier = Modifier.testTag("sulti_voice_mic_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Mic,
                                contentDescription = "Voice Mode",
                                tint = TealPrimary
                            )
                        }

                        // Send button
                        IconButton(
                            onClick = {
                                if (inputText.isNotBlank()) {
                                    val text = inputText.trim()
                                    val bert = SultiAiEngine.runBertNlpInference(text)
                                    val userMsg = SultiMessage(
                                        id = "usr_${System.currentTimeMillis()}",
                                        sender = "user",
                                        text = text,
                                        timestamp = "Just now",
                                        bertAnalysis = bert
                                    )
                                    initialMessages.add(userMsg)
                                    inputText = ""

                                    // Generate AI reply
                                    val aiReply = SultiAiEngine.generateSultiResponse(
                                        userMessage = text,
                                        targetDialect = profile.targetDialect,
                                        scenario = selectedScenario
                                    )
                                    initialMessages.add(aiReply)
                                    onActivityRecorded()
                                }
                            },
                            modifier = Modifier
                                .background(TealPrimary, CircleShape)
                                .size(44.dp)
                                .testTag("sulti_send_message_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Send,
                                contentDescription = "Send",
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
                .padding(horizontal = 14.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Scenario Selection Header
            item {
                Column(modifier = Modifier.padding(top = 10.dp)) {
                    Text(
                        text = "Immersive Roleplay Scenarios",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        items(CurriculumData.ROLEPLAY_SCENARIOS) { scenario ->
                            val isSelected = selectedScenario?.id == scenario.id
                            Surface(
                                shape = RoundedCornerShape(14.dp),
                                color = if (isSelected) TealPrimary else MaterialTheme.colorScheme.surface,
                                shadowElevation = if (isSelected) 3.dp else 1.dp,
                                modifier = Modifier
                                    .clickable { selectedScenario = scenario }
                                    .testTag("roleplay_scenario_${scenario.id}")
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                                ) {
                                    Text(
                                        text = when (scenario.id) {
                                            "scen_jeepney" -> "🚌"
                                            "scen_merkado" -> "🥭"
                                            "scen_carenderia" -> "🍲"
                                            else -> "📍"
                                        },
                                        fontSize = 16.sp
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Column {
                                        Text(
                                            text = scenario.title,
                                            style = MaterialTheme.typography.labelMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface
                                        )
                                        Text(
                                            text = scenario.location,
                                            style = MaterialTheme.typography.labelSmall,
                                            fontSize = 10.sp,
                                            color = if (isSelected) Color.White.copy(alpha = 0.8f) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Message list
            items(initialMessages) { msg ->
                val isUser = msg.sender == "user"
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = if (isUser) Alignment.End else Alignment.Start
                ) {
                    Surface(
                        shape = RoundedCornerShape(
                            topStart = 18.dp,
                            topEnd = 18.dp,
                            bottomStart = if (isUser) 18.dp else 4.dp,
                            bottomEnd = if (isUser) 4.dp else 18.dp
                        ),
                        color = if (isUser) TealPrimary else MaterialTheme.colorScheme.surface,
                        shadowElevation = 2.dp,
                        modifier = Modifier
                            .widthIn(max = 320.dp)
                            .testTag(if (isUser) "user_chat_bubble" else "sulti_chat_bubble")
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            // Header badge
                            if (!isUser) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(text = "🦜", fontSize = 16.sp)
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "SULTI AI TUTOR",
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = TealPrimary
                                    )
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                            }

                            // Main message text
                            Text(
                                text = msg.text,
                                style = MaterialTheme.typography.bodyLarge,
                                fontWeight = FontWeight.SemiBold,
                                color = if (isUser) Color.White else MaterialTheme.colorScheme.onSurface
                            )

                            // Phonetics guide
                            msg.phoneticGuide?.let { guide ->
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "🗣️ $guide",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (isUser) Color.White.copy(alpha = 0.8f) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                            }

                            // English translation
                            msg.translation?.let { tr ->
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = tr,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = if (isUser) Color.White.copy(alpha = 0.9f) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                                )
                            }

                            // Cultural tip
                            msg.culturalTip?.let { tip ->
                                Spacer(modifier = Modifier.height(10.dp))
                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = AmberContainer.copy(alpha = 0.6f),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(modifier = Modifier.padding(8.dp)) {
                                        Text(text = "💡", fontSize = 13.sp)
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = tip,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = AmberDark
                                        )
                                    }
                                }
                            }

                            // Vocabulary breakdown chips
                            if (msg.vocabularyBreakdown.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(
                                    text = "Vocabulary Breakdown:",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = TealPrimary
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    msg.vocabularyBreakdown.forEach { item ->
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                text = "• ${item.bisaya}: ",
                                                style = MaterialTheme.typography.labelSmall,
                                                fontWeight = FontWeight.Bold
                                            )
                                            Text(
                                                text = "${item.english} (${item.pos})",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // BERT NLP Badge for user message
                    if (isUser && msg.bertAnalysis != null) {
                        val bert = msg.bertAnalysis
                        Spacer(modifier = Modifier.height(4.dp))
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = Color(0xFF6366F1).copy(alpha = 0.12f),
                            modifier = Modifier.padding(end = 4.dp).testTag("bert_nlp_telemetry_badge")
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text(
                                    text = "BERT Intent: ${bert.predictedIntent} (${(bert.intentConfidence * 100).toInt()}%) · ${bert.detectedLanguage}",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF4338CA)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
