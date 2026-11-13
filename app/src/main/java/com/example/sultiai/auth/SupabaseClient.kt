package com.example.sultiai.auth

import com.example.sultiai.BuildConfig
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.gotrue.GoTrue
import io.github.jan.supabase.gotrue.gotrue

object SupabaseClient {
    private lateinit var client: SupabaseClient

    fun initialize() {
        client = createSupabaseClient(
            supabaseUrl = BuildConfig.SUPABASE_URL,
            supabaseKey = BuildConfig.SUPABASE_ANON_KEY
        ) {
            install(Auth)
            install(GoTrue)
        }
    }

    fun getClient(): SupabaseClient {
        if (!::client.isInitialized) {
            throw IllegalStateException("SupabaseClient not initialized. Call initialize() first.")
        }
        return client
    }

    val auth: Auth
        get() = getClient().auth
}
