package com.example.sultiai.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.providers.builtin.IDToken
import io.github.jan.supabase.auth.user.UserSession
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AuthState(
    val isAuthenticated: Boolean = false,
    val isLoading: Boolean = false,
    val error: String? = null,
    val user: UserInfo? = null
)

data class UserInfo(
    val id: String,
    val email: String?,
    val name: String?,
    val avatarUrl: String?
)

class AuthViewModel : ViewModel() {
    private val _authState = MutableStateFlow(AuthState())
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    init {
        checkSession()
    }

    private fun checkSession() {
        viewModelScope.launch {
            _authState.value = _authState.value.copy(isLoading = true)
            try {
                val session = SupabaseClient.auth.currentSessionOrNull()
                if (session != null) {
                    val user = session.user
                    _authState.value = AuthState(
                        isAuthenticated = true,
                        isLoading = false,
                        user = UserInfo(
                            id = user.id,
                            email = user.email,
                            name = user.userMetadata["full_name"] as? String,
                            avatarUrl = user.userMetadata["avatar_url"] as? String
                        )
                    )
                } else {
                    _authState.value = AuthState(isLoading = false)
                }
            } catch (e: Exception) {
                _authState.value = AuthState(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }

    fun signInWithEmail(email: String, password: String) {
        viewModelScope.launch {
            _authState.value = _authState.value.copy(isLoading = true, error = null)
            try {
                SupabaseClient.auth.signInWith(Email) {
                    this.email = email
                    this.password = password
                }
                checkSession()
            } catch (e: Exception) {
                _authState.value = AuthState(
                    isLoading = false,
                    error = e.message ?: "Sign in failed"
                )
            }
        }
    }

    fun signUpWithEmail(email: String, password: String, name: String) {
        viewModelScope.launch {
            _authState.value = _authState.value.copy(isLoading = true, error = null)
            try {
                SupabaseClient.auth.signUpWith(Email) {
                    this.email = email
                    this.password = password
                    data["full_name"] = name
                }
                checkSession()
            } catch (e: Exception) {
                _authState.value = AuthState(
                    isLoading = false,
                    error = e.message ?: "Sign up failed"
                )
            }
        }
    }

    fun signInWithGoogle(idToken: String) {
        viewModelScope.launch {
            _authState.value = _authState.value.copy(isLoading = true, error = null)
            try {
                SupabaseClient.auth.signInWith(IDToken) {
                    this.idToken = idToken
                    this.provider = "google"
                }
                checkSession()
            } catch (e: Exception) {
                _authState.value = AuthState(
                    isLoading = false,
                    error = e.message ?: "Google sign in failed"
                )
            }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            try {
                SupabaseClient.auth.signOut()
                _authState.value = AuthState()
            } catch (e: Exception) {
                _authState.value = _authState.value.copy(
                    error = e.message ?: "Sign out failed"
                )
            }
        }
    }

    fun clearError() {
        _authState.value = _authState.value.copy(error = null)
    }
}
