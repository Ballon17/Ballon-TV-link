import Hls from 'hls.js';
import type { PlayerWrapperOptions } from '../types';

// Type definition for ClearKey mapping
export type ClearKeyMap = Record<string, string>;

export interface PlayerStats {
  engine: 'shaka' | 'hls' | 'video' | 'iframe';
  bufferedSeconds: number;
  currentLatencyMs: number;
  resolution: string;
  hasDrm: boolean;
  drmType?: 'clearkey' | 'widevine' | 'playready' | 'none';
  headersApplied: {
    referrer: boolean;
    userAgent: boolean;
    origin: boolean;
  };
}

export interface PlayerWrapperInstance {
  play: () => Promise<void>;
  pause: () => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  reload: () => Promise<void>;
  destroy: () => void;
  getStats: () => PlayerStats;
  updateOptions: (newOptions: Partial<PlayerWrapperOptions>) => Promise<void>;
}

/**
 * Parses user input for ClearKey.
 * Supports:
 * 1. "hexId:hexKey" (e.g. "e0d8b749...:a4f321...")
 * 2. JSON: '{"e0d8b749...": "a4f321..."}'
 * 3. Multi-line "keyId:key\nkeyId2:key2"
 */
export function parseClearKey(input?: string): ClearKeyMap | null {
  if (!input || !input.trim()) return null;

  const trimmed = input.trim();

  // Try JSON first
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as ClearKeyMap;
      }
    } catch {
      // Not valid JSON, continue to key:value parsing
    }
  }

  // Parse lines or comma-separated pairs of "id:key"
  const lines = trimmed.split(/[\n,]+/);
  const result: ClearKeyMap = {};
  let validCount = 0;

  for (const line of lines) {
    const parts = line.trim().split(':');
    if (parts.length >= 2) {
      const keyId = parts[0].trim().replace(/['"]/g, '');
      const key = parts[1].trim().replace(/['"]/g, '');
      if (keyId && key) {
        result[keyId] = key;
        validCount++;
      }
    }
  }

  return validCount > 0 ? result : null;
}

/**
 * Constructs a proxy URL that forwards custom Referer, User-Agent, and Origin
 * directly at the backend HTTP layer to bypass browser cross-origin and forbidden header restrictions.
 */
export function buildProxiedStreamUrl(
  originalUrl: string,
  options: {
    referrer?: string;
    userAgent?: string;
    origin?: string;
    drmKey?: string;
    clearKey?: string;
  }
): string {
  if (!originalUrl) return '';

  const params = new URLSearchParams();
  params.set('url', originalUrl);

  if (options.referrer) {
    params.set('ref', options.referrer);
  }
  if (options.userAgent) {
    params.set('user_agent', options.userAgent);
  }
  if (options.origin) {
    params.set('origin', options.origin);
  }
  if (options.drmKey) {
    params.set('drmkey', options.drmKey);
  }
  if (options.clearKey) {
    params.set('clearkey', options.clearKey);
  }

  return `/api/proxy?${params.toString()}`;
}

/**
 * Common preset headers for sports broadcasters
 */
export const STREAM_PRESETS = [
  {
    id: 'bein',
    name: 'beIN Sports HD',
    referrer: 'https://live.beinsports.com/',
    origin: 'https://live.beinsports.com',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    engine: 'auto' as const,
  },
  {
    id: 'ssc-clearkey',
    name: 'SSC Sports (ClearKey DRM)',
    referrer: 'https://shahid.mbc.net/',
    origin: 'https://shahid.mbc.net',
    userAgent: 'Mozilla/5.0 (SmartHub; SMART-TV; U; Linux/SmartTV) AppleWebKit/538.1+ (KHTML, like Gecko) TV Safari/538.1+',
    engine: 'shaka' as const,
  },
  {
    id: 'exoplayer',
    name: 'Android ExoPlayer Feed',
    referrer: '',
    origin: '',
    userAgent: 'ExoPlayerLib/2.19.1 (Linux; Android 14) ExoPlayerDemo/2.19.1',
    engine: 'auto' as const,
  },
  {
    id: 'vlc-clean',
    name: 'VLC Media Player Feed',
    referrer: '',
    origin: '',
    userAgent: 'VLC/3.0.20 LibVLC/3.0.20',
    engine: 'auto' as const,
  },
  {
    id: 'clean',
    name: 'Default Direct Stream',
    referrer: '',
    origin: '',
    userAgent: '',
    engine: 'auto' as const,
  },
];

/**
 * Creates and mounts a managed Player Wrapper
 */
export async function createPlayerWrapper(
  videoElement: HTMLVideoElement,
  streamUrl: string,
  initialOptions: PlayerWrapperOptions = {},
  onBufferingChange?: (buffering: boolean) => void,
  onError?: (errorMessage: string) => void
): Promise<PlayerWrapperInstance> {
  let currentOptions: PlayerWrapperOptions = { ...initialOptions };
  let activeEngine: 'shaka' | 'hls' | 'video' | 'iframe' = 'hls';
  let shakaPlayerInstance: any = null;
  let hlsInstance: Hls | null = null;
  let isDestroyed = false;

  const isDrmStream = Boolean(currentOptions.clearKey || currentOptions.drmKey);
  const isMpd = streamUrl.includes('.mpd');
  const isM3U8 = streamUrl.includes('.m3u8');

  // Determine optimal engine
  const targetEngine =
    currentOptions.playerEngine && currentOptions.playerEngine !== 'auto'
      ? currentOptions.playerEngine
      : isDrmStream || isMpd
      ? 'shaka'
      : isM3U8
      ? 'hls'
      : 'video';

  const cleanup = () => {
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
    if (shakaPlayerInstance) {
      try {
        shakaPlayerInstance.destroy();
      } catch (e) {
        console.error('Error destroying Shaka player:', e);
      }
      shakaPlayerInstance = null;
    }
    videoElement.removeAttribute('src');
    videoElement.load();
  };

  const loadStream = async () => {
    if (isDestroyed) return;
    cleanup();
    onBufferingChange?.(true);

    // If custom headers are provided, we can route the manifest and chunks through the backend proxy
    const needsProxy =
      currentOptions.useProxy ??
      Boolean(currentOptions.referrer || currentOptions.userAgent || currentOptions.origin);

    const effectiveStreamUrl = needsProxy
      ? buildProxiedStreamUrl(streamUrl, {
          referrer: currentOptions.referrer,
          userAgent: currentOptions.userAgent,
          origin: currentOptions.origin,
          drmKey: currentOptions.drmKey,
          clearKey: currentOptions.clearKey,
        })
      : streamUrl;

    // 1. SHAKA PLAYER INITIALIZATION (Handles ClearKey, Widevine DRM, MPD, HLS)
    if (targetEngine === 'shaka') {
      try {
        // Dynamically load Shaka Player
        const shakaModule = await import('shaka-player/dist/shaka-player.compiled.js');
        const shaka = (shakaModule.default || shakaModule) as any;

        if (shaka.polyfill) {
          shaka.polyfill.installAll();
        }

        if (!shaka.Player.isBrowserSupported()) {
          throw new Error('Shaka Player is not supported in this browser.');
        }

        const player = new shaka.Player();
        await player.attach(videoElement);
        shakaPlayerInstance = player;
        activeEngine = 'shaka';

        // Configure ClearKey DRM if provided
        const clearKeyMap = parseClearKey(currentOptions.clearKey);
        if (clearKeyMap && Object.keys(clearKeyMap).length > 0) {
          player.configure({
            drm: {
              clearKeys: clearKeyMap,
            },
          });
        }

        // Configure Widevine / PlayReady DRM license server if provided
        if (currentOptions.drmKey) {
          player.configure({
            drm: {
              servers: {
                'com.widevine.alpha': currentOptions.drmKey,
                'com.microsoft.playready': currentOptions.drmKey,
              },
            },
          });
        }

        // Configure Networking Request Filter for custom headers (Referrer, User-Agent, Origin)
        player.getNetworkingEngine().registerRequestFilter((type: any, request: any) => {
          if (currentOptions.referrer) {
            request.headers['Referer'] = currentOptions.referrer;
          }
          if (currentOptions.userAgent) {
            request.headers['User-Agent'] = currentOptions.userAgent;
          }
          if (currentOptions.origin) {
            request.headers['Origin'] = currentOptions.origin;
          }
        });

        // Error handling
        player.addEventListener('error', (event: any) => {
          console.warn('Shaka Player Error event:', event.detail);
          onError?.(
            `خطأ في تشغيل البث عبر Shaka Player (${event.detail?.code || 'DRM/Stream Error'})`
          );
        });

        await player.load(effectiveStreamUrl);
        onBufferingChange?.(false);
        await videoElement.play().catch(() => {});
        return;
      } catch (err: any) {
        console.warn('Failed to initialize Shaka Player, falling back to HLS.js:', err);
        // Fallback to Hls or Video if Shaka fails
      }
    }

    // 2. HLS.JS INITIALIZATION
    if (isM3U8 || targetEngine === 'hls') {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 60,
          xhrSetup: (xhr) => {
            // Add custom headers where allowed
            if (currentOptions.drmKey) {
              xhr.setRequestHeader('X-DRM-Key', currentOptions.drmKey);
            }
          },
        });

        hlsInstance = hls;
        activeEngine = 'hls';
        hls.loadSource(effectiveStreamUrl);
        hls.attachMedia(videoElement);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          onBufferingChange?.(false);
          videoElement.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                onError?.('تعذر تحميل رابط البث المباشر (HLS Error).');
                hls.destroy();
                break;
            }
          }
        });
        return;
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari HLS
        activeEngine = 'video';
        videoElement.src = effectiveStreamUrl;
        videoElement.addEventListener(
          'loadedmetadata',
          () => {
            onBufferingChange?.(false);
            videoElement.play().catch(() => {});
          },
          { once: true }
        );
        return;
      }
    }

    // 3. NATIVE HTML5 VIDEO (MP4, WebM)
    activeEngine = 'video';
    videoElement.src = effectiveStreamUrl;
    videoElement.load();
    videoElement
      .play()
      .then(() => onBufferingChange?.(false))
      .catch(() => onBufferingChange?.(false));
  };

  // Initial load
  await loadStream();

  return {
    play: async () => {
      await videoElement.play();
    },
    pause: () => {
      videoElement.pause();
    },
    setVolume: (vol: number) => {
      videoElement.volume = Math.max(0, Math.min(1, vol));
    },
    setMuted: (muted: boolean) => {
      videoElement.muted = muted;
    },
    reload: async () => {
      await loadStream();
    },
    destroy: () => {
      isDestroyed = true;
      cleanup();
    },
    getStats: (): PlayerStats => {
      let buffered = 0;
      if (videoElement.buffered.length > 0) {
        buffered = Math.round(
          videoElement.buffered.end(videoElement.buffered.length - 1) - videoElement.currentTime
        );
      }

      return {
        engine: activeEngine,
        bufferedSeconds: Math.max(0, buffered),
        currentLatencyMs: 35,
        resolution: `${videoElement.videoWidth || 1920}x${videoElement.videoHeight || 1080}`,
        hasDrm: Boolean(currentOptions.clearKey || currentOptions.drmKey),
        drmType: currentOptions.clearKey
          ? 'clearkey'
          : currentOptions.drmKey
          ? 'widevine'
          : 'none',
        headersApplied: {
          referrer: Boolean(currentOptions.referrer),
          userAgent: Boolean(currentOptions.userAgent),
          origin: Boolean(currentOptions.origin),
        },
      };
    },
    updateOptions: async (newOptions: Partial<PlayerWrapperOptions>) => {
      currentOptions = { ...currentOptions, ...newOptions };
      await loadStream();
    },
  };
}
