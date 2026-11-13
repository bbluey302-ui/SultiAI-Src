// ElevenLabs integration — STT and TTS ONLY.
//
// Deliberately no chat/completion calls: every character has its own account so
// voice credits are ring-fenced per coach. Chat tokens go through `router.ts`.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  VOICE_FALLBACKS,
  elevenLabsKey,
  elevenLabsKeyAlias,
  elevenLabsSttModel,
  elevenLabsTtsModel,
  elevenLabsVoiceId,
} from '../config';
import { supabaseServer } from '../../supabaseServer';
import type { AgentId } from '../types';

const CACHE_DIR = path.join(process.cwd(), 'server', 'audio-cache');
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_MEMORY_AUDIO = 40;

function baseUrl(): string {
  return (process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io/v1').replace(/\/$/, '');
}

const audioMemory = new Map<string, { buffer: Buffer; expiresAt: number }>();

export class ElevenLabsError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = 'ElevenLabsError';
    this.status = status;
  }
}

function allKeys(agentId: AgentId): { key: string; alias: string }[] {
  const out: { key: string; alias: string }[] = [];
  const own = elevenLabsKey(agentId);
  if (own) out.push({ key: own, alias: elevenLabsKeyAlias(agentId) });

  const shared = (process.env.ELEVENLABS_API_KEY || '').trim();
  if (shared && shared !== own) out.push({ key: shared, alias: 'ELEVENLABS_API_KEY' });

  // Last resort: another character's slot. Better a different voice than
  // silence when one free account hits its monthly quota.
  (['jen', 'adam', 'gentech', 'kevin', 'mika'] as AgentId[]).forEach((id) => {
    if (id === agentId) return;
    const key = elevenLabsKey(id);
    if (key && !out.some((entry) => entry.key === key)) {
      out.push({ key, alias: elevenLabsKeyAlias(id) });
    }
  });
  return out;
}

export function isElevenLabsAvailable(): boolean {
  return allKeys('jen').length > 0;
}

function audioCacheKey(text: string, voiceId: string, model: string): string {
  return crypto.createHash('sha256').update(`${voiceId}|${model}|${text}`).digest('hex');
}

async function readDiskCache(key: string): Promise<Buffer | null> {
  try {
    const file = path.join(CACHE_DIR, `${key}.mp3`);
    const stat = await fs.promises.stat(file);
    if (Date.now() - stat.mtimeMs > CACHE_TTL_MS) return null;
    return await fs.promises.readFile(file);
  } catch {
    return null;
  }
}

async function writeDiskCache(key: string, buffer: Buffer) {
  try {
    await fs.promises.mkdir(CACHE_DIR, { recursive: true });
    await fs.promises.writeFile(path.join(CACHE_DIR, `${key}.mp3`), buffer);
  } catch {
    // Non-fatal.
  }
}

/** Cached lookup of an operator-provisioned voice in `ai_voice_profiles`. */
const dbVoiceCache = new Map<string, { voiceId: string | null; at: number }>();

async function dbVoiceId(agentId: AgentId, language: string): Promise<string | null> {
  const key = `${agentId}:${language}`;
  const cached = dbVoiceCache.get(key);
  if (cached && Date.now() - cached.at < 60_000) return cached.voiceId;

  let voiceId: string | null = null;
  if (supabaseServer) {
    try {
      const { data } = await supabaseServer
        .from('ai_voice_profiles')
        .select('elevenlabs_voice_id')
        .eq('agent_id', agentId)
        .eq('language', language)
        .eq('is_active', true)
        .maybeSingle();
      voiceId = data?.elevenlabs_voice_id || null;
    } catch {
      voiceId = null;
    }
  }
  dbVoiceCache.set(key, { voiceId, at: Date.now() });
  return voiceId;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

/**
 * Text-to-speech. Returns MP3 bytes and caches identical lines to avoid paying
 * for the same greeting on every session.
 *
 * Voice resolution order:
 *   1. `ai_voice_profiles` (admin-provisioned)
 *   2. `ELEVENLABS_VOICE_<AGENT>_<LANG>` / `ELEVENLABS_VOICE_<AGENT>`
 *   3. Verified free-tier-safe premade voices
 * When a voice is library-locked (HTTP 402 on free plans) the next candidate is
 * tried automatically, so the app always speaks.
 */
export async function synthesizeSpeech(
  text: string,
  agentId: AgentId,
  language = 'english'
): Promise<{ audio: Buffer; cached: boolean; voiceId: string; model: string; keyAlias: string }> {
  const clean = (text || '').trim().slice(0, 2000);
  if (!clean) throw new ElevenLabsError('Text is required', 400);

  const model = elevenLabsTtsModel(language);
  const dbVoice = await dbVoiceId(agentId, language);
  const candidates = unique([
    dbVoice || '',
    elevenLabsVoiceId(agentId, language),
    ...VOICE_FALLBACKS[agentId],
  ]);

  const keys = allKeys(agentId);
  if (!keys.length) throw new ElevenLabsError('ElevenLabs is not configured', 503);

  let lastError: Error | null = null;

  for (const voiceId of candidates) {
    const cacheKey = audioCacheKey(clean, voiceId, model);

    const mem = audioMemory.get(cacheKey);
    if (mem && mem.expiresAt > Date.now()) {
      return { audio: mem.buffer, cached: true, voiceId, model, keyAlias: 'cache' };
    }
    const disk = await readDiskCache(cacheKey);
    if (disk) {
      audioMemory.set(cacheKey, { buffer: disk, expiresAt: Date.now() + CACHE_TTL_MS });
      return { audio: disk, cached: true, voiceId, model, keyAlias: 'cache' };
    }

    for (const { key, alias } of keys) {
      try {
        const res = await fetch(`${baseUrl()}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
          method: 'POST',
          headers: {
            'xi-api-key': key,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text: clean,
            model_id: model,
            voice_settings: {
              stability: 0.45,
              similarity_boost: 0.75,
              style: 0.25,
              use_speaker_boost: true,
            },
          }),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => '');
          lastError = new ElevenLabsError(
            `ElevenLabs TTS ${res.status}: ${body.slice(0, 180) || res.statusText}`,
            res.status
          );
          // 402/404 mean the *voice* is unavailable (library-locked or gone),
          // so another account will not help — move to the next voice.
          if (res.status === 402 || res.status === 404) break;
          continue;
        }

        const buffer = Buffer.from(await res.arrayBuffer());
        if (!buffer.length) {
          lastError = new ElevenLabsError('ElevenLabs returned empty audio', 502);
          continue;
        }

        audioMemory.set(cacheKey, { buffer, expiresAt: Date.now() + CACHE_TTL_MS });
        while (audioMemory.size > MAX_MEMORY_AUDIO) {
          const oldest = audioMemory.keys().next().value;
          if (oldest === undefined) break;
          audioMemory.delete(oldest);
        }
        void writeDiskCache(cacheKey, buffer);

        return { audio: buffer, cached: false, voiceId, model, keyAlias: alias };
      } catch (error: any) {
        lastError = error instanceof Error ? error : new ElevenLabsError(String(error));
      }
    }
  }

  throw lastError || new ElevenLabsError('All ElevenLabs accounts failed');
}

/**
 * Speech-to-text using ElevenLabs Scribe.
 */
export async function transcribeAudio(
  audio: Buffer,
  mimeType = 'audio/webm',
  agentId: AgentId = 'jen',
  language?: string
): Promise<{ text: string; keyAlias: string }> {
  if (!audio.length) throw new ElevenLabsError('Audio payload is empty', 400);

  const keys = allKeys(agentId);
  if (!keys.length) throw new ElevenLabsError('ElevenLabs is not configured', 503);

  let lastError: Error | null = null;
  for (const { key, alias } of keys) {
    try {
      const form = new FormData();
      const extension = mimeType.includes('wav') ? 'wav' : mimeType.includes('mp4') ? 'mp4' : 'webm';
      form.append('file', new Blob([new Uint8Array(audio)], { type: mimeType }), `audio.${extension}`);
      form.append('model_id', elevenLabsSttModel());
      form.append('tag_audio_events', 'false');
      form.append('diarize', 'false');
      if (language === 'filipino') form.append('language_code', 'fil');

      const res = await fetch(`${baseUrl()}/speech-to-text`, {
        method: 'POST',
        headers: { 'xi-api-key': key },
        body: form,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        lastError = new ElevenLabsError(
          `ElevenLabs STT ${res.status}: ${body.slice(0, 180) || res.statusText}`,
          res.status
        );
        continue;
      }

      const data = (await res.json()) as { text?: string };
      return { text: (data.text || '').trim(), keyAlias: alias };
    } catch (error: any) {
      lastError = error instanceof Error ? error : new ElevenLabsError(String(error));
    }
  }

  throw lastError || new ElevenLabsError('All ElevenLabs accounts failed');
}

/**
 * Voice Design: generate a preview voice for a character/language.
 * Returns preview audio plus the generated voice ids so an operator can keep one.
 */
export async function designVoice(
  agentId: AgentId,
  description: string,
  previewText: string,
  language = 'english'
): Promise<{ previews: { generatedVoiceId: string; audioBase64: string }[] }> {
  const key = elevenLabsKey(agentId);
  if (!key) throw new ElevenLabsError('ElevenLabs is not configured', 503);

  const res = await fetch(`${baseUrl()}/text-to-voice/create-previews`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      voice_description: description,
      text: previewText,
      ...(language === 'filipino' ? { language: 'fil' } : {}),
      loudness: 0.5,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ElevenLabsError(`ElevenLabs voice design ${res.status}: ${body.slice(0, 180)}`, res.status);
  }

  const data = (await res.json()) as {
    previews?: { generated_voice_id?: string; audio_base_64?: string }[];
  };
  return {
    previews: (data.previews || [])
      .filter((p) => p.generated_voice_id && p.audio_base_64)
      .map((p) => ({ generatedVoiceId: p.generated_voice_id as string, audioBase64: p.audio_base_64 as string })),
  };
}

/** Persist a chosen Voice Design preview into the character's account. */
export async function saveDesignedVoice(
  agentId: AgentId,
  generatedVoiceId: string,
  name: string,
  description: string
): Promise<{ voiceId: string }> {
  const key = elevenLabsKey(agentId);
  if (!key) throw new ElevenLabsError('ElevenLabs is not configured', 503);

  const res = await fetch(`${baseUrl()}/text-to-voice/create-voice-from-preview`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      voice_name: name,
      voice_description: description,
      generated_voice_id: generatedVoiceId,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ElevenLabsError(`ElevenLabs save voice ${res.status}: ${body.slice(0, 180)}`, res.status);
  }

  const data = (await res.json()) as { voice_id?: string };
  if (!data.voice_id) throw new ElevenLabsError('ElevenLabs did not return a voice id', 502);
  return { voiceId: data.voice_id };
}
