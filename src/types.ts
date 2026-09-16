export type Language = 'ar' | 'en';

export interface Match {
  id: string;
  league: string;
  league_logo?: string;
  home: string;
  away: string;
  home_logo: string;
  away_logo: string;
  score: string;
  time: string;
  date: string;
  status: '0' | '1' | '2'; // 0: Upcoming, 1: Live, 2: Finished
  channel?: string;
  commentary?: string;
  stadium?: string;
  streams?: StreamLink[];
}

export interface PlayerWrapperOptions {
  referrer?: string;
  userAgent?: string;
  origin?: string;
  drmKey?: string;
  clearKey?: string;
  playerEngine?: 'auto' | 'shaka' | 'player_wrapper' | 'mux' | 'iframe' | 'hls' | 'dash' | 'video';
  useProxy?: boolean;
}

export interface StreamLink {
  id: string;
  matchId?: string; // specific match or global channel
  channelName: string;
  serverName: string; // e.g. "Server 1 - Ultra HD", "Server 2 - Fast CDN"
  streamUrl: string;
  playerType: 'shaka' | 'player_wrapper' | 'mux' | 'iframe' | 'hls' | 'dash' | 'video' | 'embed';
  quality: '1080p 60fps' | '720p HD' | '480p SD' | 'Auto';
  isActive: boolean;
  priority: number;
  latencyMs?: number;
  lastTested?: string;
  errorCount?: number;
  successRate?: number;
  customReferer?: string;
  referrer?: string;
  userAgent?: string;
  origin?: string;
  drmKey?: string;
  clearKey?: string;
}

export interface ProxySettings {
  engineMode: 'mondepro_resilient' | 'direct' | 'failover_cluster';
  cacheTTLSeconds: number;
  userAgent: string;
  customReferer: string;
  tokenEncryptionEnabled: boolean;
  maxRetries: number;
  corsBypassActive: boolean;
  rateLimitPerMinute: number;
  backupProxyUrl: string;
}

export interface LinkReport {
  id: string;
  linkId: string;
  channelName: string;
  serverName: string;
  status: 'healthy' | 'degraded' | 'offline';
  uptimePercent: number;
  avgLatencyMs: number;
  totalRequests: number;
  failedRequests: number;
  lastPingTime: string;
}

export interface ServerStats {
  uptime: string;
  totalProxiedRequests: number;
  cacheHitRate: number;
  avgResponseTimeMs: number;
  activeStreamsCount: number;
  reportedIssues: number;
}
