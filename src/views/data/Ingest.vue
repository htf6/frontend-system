<template>
  <div class="ingest-page">
    <section class="hero-card glass-card">
      <div>
        <h2>监控网页播放</h2>
        <p>复用教室管理中的 RTSP 源地址，在网页端按可播放协议进行预览。</p>
      </div>
      <div class="hero-actions">
        <el-tag effect="dark" type="primary">模式 {{ playModeLabel }}</el-tag>
        <el-button v-if="isFocusedPlayback" plain @click="backToClassrooms">
          <span>返回教室管理</span>
        </el-button>
        <el-button plain :loading="loading" @click="loadSources">
          <RefreshCw :size="16" />
          <span>刷新源</span>
        </el-button>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card glass-card">
        <span class="stat-label">监控源总数</span>
        <strong>{{ stats.total }}</strong>
      </article>
      <article class="stat-card glass-card">
        <span class="stat-label">启用源</span>
        <strong>{{ stats.enabled }}</strong>
      </article>
      <article class="stat-card glass-card">
        <span class="stat-label">可播地址</span>
        <strong>{{ stats.playable }}</strong>
      </article>
      <article class="stat-card glass-card">
        <span class="stat-label">推导规则</span>
        <strong>{{ playModeLabel }}</strong>
      </article>
    </section>

    <section class="tip-card glass-card">
      <p>
        浏览器不能直接播放 <code>rtsp://</code>。
        当前页面会把 RTSP 源地址转换成网页可播地址再播放，默认规则为
        <code>{{ playbackRuleText }}</code>。
      </p>
      <p>
        如果你的转流服务不是这条规则，请配置环境变量 <code>VITE_STREAM_GATEWAY_BASE</code>、
        <code>VITE_STREAM_PLAY_MODE</code>、<code>VITE_STREAM_PLAY_SUFFIX</code>。
      </p>
    </section>

    <section class="workspace-grid">
      <aside class="source-panel glass-card">
        <div class="panel-head">
          <div>
            <h3>监控源列表</h3>
            <p>{{ isFocusedPlayback ? '当前从教室管理指定教室跳转，只加载当前教室。' : '来源于教室管理接口，仅展示带 RTSP 地址的教室。' }}</p>
          </div>
          <el-tag type="info">{{ filteredSources.length }} / {{ sources.length }}</el-tag>
        </div>

        <el-input
          v-model="searchQuery"
          clearable
          class="search-input"
          placeholder="搜索校区、楼栋、教室编码"
        >
          <template #prefix>
            <Search :size="16" />
          </template>
        </el-input>

        <div v-loading="loading" class="source-list">
          <el-empty v-if="!filteredSources.length" description="暂无可播放监控源" />
          <button
            v-for="item in filteredSources"
            :key="item.id"
            type="button"
            class="source-item"
            :class="{ active: item.id === selectedSourceId }"
            @click="selectedSourceId = item.id"
          >
            <div class="source-item__main">
              <strong>{{ item.classroomCode }}</strong>
              <span>{{ item.locationText }}</span>
            </div>
            <div class="source-item__meta">
              <el-tag size="small" :type="item.enabled ? 'success' : 'info'">
                {{ item.enabled ? '启用' : '停用' }}
              </el-tag>
              <span class="source-item__mode">{{ item.playerType === 'iframe' ? '嵌入播放' : playModeLabel }}</span>
            </div>
          </button>
        </div>
      </aside>

      <div class="player-column">
        <section class="player-card glass-card">
          <div class="panel-head panel-head--player">
            <div>
              <h3>{{ selectedSource?.classroomCode || '未选择监控源' }}</h3>
              <p>{{ selectedSource?.locationText || '从左侧选择一个教室开始播放' }}</p>
            </div>
            <div class="player-tags" v-if="selectedSource">
              <el-tag>{{ selectedSource.campus }}</el-tag>
              <el-tag type="success">{{ selectedSource.building }}</el-tag>
              <el-tag type="warning">{{ selectedSource.floorLabel }}</el-tag>
            </div>
          </div>

          <div class="player-stage" :class="`status-${playerStatus}`">
            <iframe
              v-if="selectedSource?.playerType === 'iframe' && selectedSource.playUrl"
              class="player-frame"
              :src="selectedSource.playUrl"
              allow="autoplay; fullscreen"
            />
            <video
              v-else
              ref="videoRef"
              class="player-video"
              controls
              autoplay
              muted
              playsinline
              @loadeddata="handleVideoReady"
              @canplay="handleVideoReady"
              @waiting="handleVideoWaiting"
              @error="handleVideoError"
            ></video>

            <div v-if="!selectedSource" class="player-overlay">
              <Video :size="38" />
              <strong>选择一个监控源开始播放</strong>
            </div>

            <div v-else-if="playerStatus === 'loading'" class="player-overlay">
              <el-icon class="is-loading"><Loading /></el-icon>
              <strong>正在加载视频流</strong>
            </div>

            <div v-else-if="playerStatus === 'error'" class="player-overlay player-overlay--error">
              <CircleAlert :size="34" />
              <strong>播放失败</strong>
              <p>{{ playerError }}</p>
            </div>
          </div>

          <div class="player-actions" v-if="selectedSource">
            <el-button plain @click="copyText(selectedSource.rtspUrl, 'RTSP 地址')">
              <Copy :size="15" />
              <span>复制 RTSP</span>
            </el-button>
            <el-button plain :disabled="!selectedSource.playUrl" @click="copyText(selectedSource.playUrl, '网页播放地址')">
              <Copy :size="15" />
              <span>复制网播地址</span>
            </el-button>
            <el-button type="primary" :disabled="!selectedSource.playUrl" @click="openPlayableUrl">
              <ExternalLink :size="15" />
              <span>新窗口打开</span>
            </el-button>
          </div>
        </section>

        <section class="detail-card glass-card" v-if="selectedSource">
          <div class="panel-head">
            <div>
              <h3>播放详情</h3>
              <p>RTSP 仅作为源地址，页面实际播放的是转流后的网页地址。</p>
            </div>
            <el-tag :type="selectedSource.playUrl ? 'success' : 'danger'">
              {{ selectedSource.playUrl ? '已生成可播地址' : '未生成可播地址' }}
            </el-tag>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <span>校区 / 楼栋 / 楼层</span>
              <strong>{{ selectedSource.locationText }}</strong>
            </div>
            <div class="detail-item">
              <span>教室编码</span>
              <strong>{{ selectedSource.classroomCode }}</strong>
            </div>
            <div class="detail-item detail-item--full">
              <span>RTSP 源地址</span>
              <code>{{ selectedSource.rtspUrl }}</code>
            </div>
            <div class="detail-item detail-item--full">
              <span>网页播放地址</span>
              <code>{{ selectedSource.playUrl || '未能根据当前规则生成，请检查环境变量配置' }}</code>
            </div>
          </div>

          <div class="detail-notes">
            <p v-if="isHlsUrl(selectedSource.playUrl) && !nativeHlsSupport">
              当前浏览器原生不支持 HLS，页面已接入 <code>hls.js</code> 进行播放。
            </p>
            <p>
              默认按 RTSP 的主机和路径推导播放地址。
              {{ configuredGatewayBase ? `当前网关基地址：${configuredGatewayBase}` : '未显式配置网关基地址，默认使用 RTSP 主机 + 8888 端口。' }}
            </p>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CircleAlert, Copy, ExternalLink, RefreshCw, Search, Video } from 'lucide-vue-next'
import { getClassroomById, getClassrooms } from '@/api/classrooms'

const STREAM_PLAY_MODE = String(import.meta.env.VITE_STREAM_PLAY_MODE || 'hls').trim().toLowerCase()
const STREAM_GATEWAY_BASE = String(import.meta.env.VITE_STREAM_GATEWAY_BASE || '').trim()
const STREAM_PLAY_SUFFIX = String(import.meta.env.VITE_STREAM_PLAY_SUFFIX || '/index.m3u8').trim() || '/index.m3u8'
const STREAM_PLAY_QUERY = String(import.meta.env.VITE_STREAM_PLAY_QUERY || '').trim()
const STREAM_GATEWAY_PORT = String(import.meta.env.VITE_STREAM_GATEWAY_PORT || (STREAM_PLAY_MODE === 'hls' ? '8888' : '')).trim()

const playModeLabelMap = {
  hls: 'HLS',
  iframe: 'iframe',
  webrtc: 'WebRTC',
  whep: 'WHEP',
  mp4: 'MP4'
}

const loading = ref(false)
const searchQuery = ref('')
const selectedSourceId = ref(null)
const sources = ref([])
const videoRef = ref(null)
const playerStatus = ref('idle')
const playerError = ref('')
let hlsInstance = null
let hlsModulePromise = null
const route = useRoute()
const router = useRouter()

const playModeLabel = computed(() => playModeLabelMap[STREAM_PLAY_MODE] || STREAM_PLAY_MODE.toUpperCase())
const configuredGatewayBase = STREAM_GATEWAY_BASE.replace(/\/+$/, '')
const requestedClassroomId = computed(() => String(route.query.classroomId || '').trim())
const isFocusedPlayback = computed(() => Boolean(requestedClassroomId.value))
const nativeHlsSupport = (() => {
  if (typeof document === 'undefined') return false
  const video = document.createElement('video')
  return Boolean(video.canPlayType?.('application/vnd.apple.mpegurl'))
})()

const playbackRuleText = computed(() => {
  const gateway = configuredGatewayBase || `http://{rtsp-host}${STREAM_GATEWAY_PORT ? `:${STREAM_GATEWAY_PORT}` : ''}`
  const suffix = STREAM_PLAY_MODE === 'webrtc' || STREAM_PLAY_MODE === 'whep'
    ? '/whep'
    : STREAM_PLAY_SUFFIX.startsWith('/')
      ? STREAM_PLAY_SUFFIX
      : `/${STREAM_PLAY_SUFFIX}`
  return `${gateway}{rtsp-path}${suffix}`
})

const filteredSources = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()
  if (!keyword) return sources.value
  return sources.value.filter((item) => {
    return [item.campus, item.building, item.floorLabel, item.classroomCode, item.locationText, item.rtspUrl]
      .filter(Boolean)
      .some((text) => String(text).toLowerCase().includes(keyword))
  })
})

const selectedSource = computed(() => {
  return sources.value.find((item) => item.id === selectedSourceId.value) || null
})

const stats = computed(() => ({
  total: sources.value.length,
  enabled: sources.value.filter((item) => item.enabled).length,
  playable: sources.value.filter((item) => !!item.playUrl).length
}))

watch(filteredSources, (list) => {
  if (!list.length) {
    selectedSourceId.value = null
    return
  }
  if (!list.some((item) => item.id === selectedSourceId.value)) {
    selectedSourceId.value = list[0].id
  }
}, { immediate: true })

watch(selectedSource, async (source) => {
  await setupPlayback(source)
})

watch(requestedClassroomId, async (nextId, prevId) => {
  if (nextId === prevId) return
  await loadSources()
})

onMounted(() => {
  loadSources()
})

onBeforeUnmount(() => {
  destroyPlayer()
})

function formatFloorLabel(value) {
  if (!value && value !== 0) return '-'
  const text = String(value)
  return text.endsWith('层') ? text : `${text}层`
}

async function ensureHlsModule() {
  if (!hlsModulePromise) {
    hlsModulePromise = import('hls.js')
  }
  const module = await hlsModulePromise
  return module.default
}

function parseClassroomList(res) {
  const payload = res?.data ?? res ?? {}
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.records)) return payload.records
  if (Array.isArray(payload.list)) return payload.list
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.page?.records)) return payload.page.records
  return []
}

function parseClassroomDetail(res) {
  const payload = res?.data ?? res ?? {}
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) return payload.data
    if (payload.record && typeof payload.record === 'object') return payload.record
    if (payload.result && typeof payload.result === 'object') return payload.result
  }
  return payload
}

function buildGatewayBase(rtspUrl) {
  if (configuredGatewayBase) return configuredGatewayBase
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
  const portSegment = STREAM_GATEWAY_PORT ? `:${STREAM_GATEWAY_PORT}` : ''
  return `${protocol}//${rtspUrl.hostname}${portSegment}`
}

function appendPlayQuery(url) {
  if (!STREAM_PLAY_QUERY) return url
  return `${url}${url.includes('?') ? '&' : '?'}${STREAM_PLAY_QUERY}`
}

function buildPlayableUrl(rtspUrl) {
  if (!rtspUrl) return ''
  try {
    const parsed = new URL(rtspUrl)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return rtspUrl
    }
    const pathname = parsed.pathname.replace(/\/+$/, '')
    if (!pathname) return ''
    const gatewayBase = buildGatewayBase(parsed)
    if (STREAM_PLAY_MODE === 'webrtc' || STREAM_PLAY_MODE === 'whep') {
      return appendPlayQuery(`${gatewayBase}${pathname}/whep`)
    }
    const suffix = STREAM_PLAY_SUFFIX.startsWith('/') ? STREAM_PLAY_SUFFIX : `/${STREAM_PLAY_SUFFIX}`
    return appendPlayQuery(`${gatewayBase}${pathname}${suffix}`)
  } catch (error) {
    return ''
  }
}

function isHlsUrl(playUrl) {
  if (!playUrl) return false
  try {
    return new URL(playUrl).pathname.endsWith('.m3u8')
  } catch (error) {
    return playUrl.split('?')[0].endsWith('.m3u8')
  }
}

function resolvePlayerType(playUrl) {
  if (!playUrl) return 'video'
  if (STREAM_PLAY_MODE === 'iframe' || STREAM_PLAY_MODE === 'webrtc' || STREAM_PLAY_MODE === 'whep') {
    return 'iframe'
  }
  return 'video'
}

function normalizeSource(item, index) {
  const status = Number(item.status ?? (item.enabled ? 1 : 0))
  const rtspUrl = String(item.rtspUrl || '').trim()
  const floorLabel = formatFloorLabel(item.floor)
  const playUrl = buildPlayableUrl(rtspUrl)
  return {
    id: item.id ?? `classroom-${index}`,
    campus: item.campus || '-',
    building: item.building || '-',
    floorLabel,
    classroomCode: item.classroomCode || `未命名教室-${index + 1}`,
    rtspUrl,
    playUrl,
    enabled: status === 1,
    playerType: resolvePlayerType(playUrl),
    locationText: [item.campus, item.building, floorLabel].filter(Boolean).join(' / ')
  }
}

async function loadSources() {
  loading.value = true
  try {
    if (requestedClassroomId.value) {
      const res = await getClassroomById(requestedClassroomId.value)
      const item = normalizeSource(parseClassroomDetail(res), 0)
      sources.value = item.rtspUrl ? [item] : []
      selectedSourceId.value = item.rtspUrl ? item.id : null
    } else {
      const res = await getClassrooms({ current: 1, size: 500 })
      const list = parseClassroomList(res)
      sources.value = list
        .map(normalizeSource)
        .filter((item) => item.rtspUrl)
    }
    if (!sources.value.length) {
      ElMessage.warning(requestedClassroomId.value ? '当前教室未配置 RTSP 地址' : '没有查询到带 RTSP 地址的教室')
    }
  } catch (error) {
    sources.value = []
    selectedSourceId.value = null
    ElMessage.error(requestedClassroomId.value ? '获取当前教室监控失败' : '获取监控源失败')
  } finally {
    loading.value = false
  }
}

function destroyPlayer() {
  if (hlsInstance) {
    hlsInstance.destroy()
    hlsInstance = null
  }
  const video = videoRef.value
  if (video) {
    video.pause()
    video.removeAttribute('src')
    video.load()
  }
}

async function setupPlayback(source) {
  destroyPlayer()
  playerError.value = ''

  if (!source) {
    playerStatus.value = 'idle'
    return
  }

  if (!source.playUrl) {
    playerStatus.value = 'error'
    playerError.value = '未能生成网页播放地址，请检查转流网关配置'
    return
  }

  if (source.playerType === 'iframe') {
    playerStatus.value = 'ready'
    return
  }

  playerStatus.value = 'loading'
  await nextTick()

  const video = videoRef.value
  if (!video) {
    playerStatus.value = 'error'
    playerError.value = '播放器节点初始化失败'
    return
  }

  if (isHlsUrl(source.playUrl)) {
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source.playUrl
      video.load()
      video.play().catch(() => {})
      return
    }

    const Hls = await ensureHlsModule()
    if (Hls.isSupported()) {
      hlsInstance = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      })
      hlsInstance.loadSource(source.playUrl)
      hlsInstance.attachMedia(video)
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        playerStatus.value = 'ready'
        video.play().catch(() => {})
      })
      hlsInstance.on(Hls.Events.ERROR, (_, data) => {
        if (!data?.fatal) return
        playerStatus.value = 'error'
        playerError.value = `HLS 播放失败：${data.details || '流媒体不可用'}`
      })
      return
    }

    playerStatus.value = 'error'
    playerError.value = '当前浏览器不支持 HLS，请切换到 iframe/WebRTC 模式'
    return
  }

  video.src = source.playUrl
  video.load()
  video.play().catch(() => {})
}

function handleVideoReady() {
  if (playerStatus.value !== 'error') {
    playerStatus.value = 'ready'
  }
}

function handleVideoWaiting() {
  if (playerStatus.value !== 'error') {
    playerStatus.value = 'loading'
  }
}

function handleVideoError() {
  playerStatus.value = 'error'
  playerError.value = '视频流加载失败，请检查转流服务、跨域和播放地址'
}

async function copyText(text, label) {
  if (!text) {
    ElMessage.warning(`${label}为空`)
    return
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const input = document.createElement('textarea')
      input.value = text
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    ElMessage.success(`${label}已复制`)
  } catch (error) {
    ElMessage.error(`复制${label}失败`)
  }
}

function openPlayableUrl() {
  if (!selectedSource.value?.playUrl) {
    ElMessage.warning('当前监控源没有可打开的网页播放地址')
    return
  }
  window.open(selectedSource.value.playUrl, '_blank', 'noopener')
}

function backToClassrooms() {
  router.push({ name: 'Classrooms' })
}
</script>

<style lang="scss" scoped>
.ingest-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-card,
.tip-card,
.source-panel,
.player-card,
.detail-card,
.stat-card {
  padding: 20px;
}

.hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  h2 {
    margin: 0 0 8px;
    font-size: 24px;
    color: #0f172a;
  }

  p {
    margin: 0;
    color: #64748b;
  }
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  :deep(.el-button) {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 10px;

  strong {
    font-size: 30px;
    color: #0f172a;
  }
}

.stat-label {
  color: #64748b;
  font-size: 13px;
}

.tip-card {
  background: linear-gradient(135deg, rgba(239, 246, 255, 0.92) 0%, rgba(248, 250, 252, 0.96) 100%);
  border: 1px solid rgba(191, 219, 254, 0.9);

  p {
    margin: 0;
    color: #334155;
    line-height: 1.7;
  }

  p + p {
    margin-top: 8px;
  }

  code {
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    color: #1d4ed8;
  }
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(300px, 340px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;

  h3 {
    margin: 0 0 6px;
    font-size: 18px;
    color: #0f172a;
  }

  p {
    margin: 0;
    color: #64748b;
    line-height: 1.6;
  }
}

.search-input {
  margin-bottom: 16px;

  :deep(.el-input__wrapper) {
    min-height: 44px;
    border-radius: 14px;
  }
}

.source-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 560px;
  max-height: 760px;
  overflow: auto;
}

.source-item {
  width: 100%;
  padding: 14px;
  border: 1px solid rgba(226, 232, 240, 0.96);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.96) 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover,
  &.active {
    transform: translateY(-1px);
    border-color: rgba(37, 99, 235, 0.28);
    box-shadow: 0 16px 24px rgba(15, 23, 42, 0.06);
  }
}

.source-item__main {
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    color: #0f172a;
    font-size: 15px;
  }

  span {
    color: #64748b;
    font-size: 12px;
  }
}

.source-item__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.source-item__mode {
  font-size: 12px;
  color: #2563eb;
  font-weight: 700;
}

.player-column {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.panel-head--player {
  margin-bottom: 12px;
}

.player-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.player-stage {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 42%),
    linear-gradient(160deg, #0f172a 0%, #111827 100%);
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.player-video,
.player-frame {
  width: 100%;
  height: 100%;
  border: none;
}

.player-video {
  object-fit: contain;
}

.player-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
  background: rgba(15, 23, 42, 0.5);
  color: #e2e8f0;

  strong {
    font-size: 18px;
  }

  p {
    margin: 0;
    max-width: 420px;
    line-height: 1.6;
    color: #cbd5e1;
  }

  :deep(.el-icon) {
    font-size: 34px;
  }
}

.player-overlay--error {
  background: rgba(15, 23, 42, 0.68);
}

.player-actions {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  :deep(.el-button) {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.detail-item {
  padding: 16px;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.96);
  display: flex;
  flex-direction: column;
  gap: 8px;

  span {
    font-size: 12px;
    color: #64748b;
  }

  strong {
    color: #0f172a;
    font-size: 15px;
  }

  code {
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    font-size: 12px;
    color: #1e293b;
    white-space: normal;
    word-break: break-all;
    line-height: 1.6;
  }
}

.detail-item--full {
  grid-column: 1 / -1;
}

.detail-notes {
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #eff6ff;
  border: 1px solid rgba(191, 219, 254, 0.92);

  p {
    margin: 0;
    color: #334155;
    line-height: 1.7;
  }

  p + p {
    margin-top: 8px;
  }

  code {
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    color: #1d4ed8;
  }
}

@media (max-width: 1280px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workspace-grid {
    grid-template-columns: 1fr;
  }

  .source-list {
    min-height: 0;
    max-height: 420px;
  }
}

@media (max-width: 768px) {
  .hero-card,
  .panel-head,
  .player-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .source-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .source-item__meta {
    width: 100%;
    align-items: flex-start;
  }
}
</style>
