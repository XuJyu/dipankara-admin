<script setup lang="ts">
/** 登录页：验证码 → /login → token；Notion 极简风 */
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getCaptchaImage } from '@/api/auth'
import { pick } from '@/types/api'
import { message } from '@/utils/message'
import AppIcon from '@/components/AppIcon.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

/** mock 模式标记：演示账号提示仅 mock 模式渲染 */
const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const form = reactive({
  username: 'admin',
  password: 'admin123',
  code: '',
  uuid: '',
})

const captcha = reactive({ enabled: true, img: '' })
const loading = ref(false)
const errorText = ref('')

async function loadCaptcha(): Promise<void> {
  try {
    const res = await getCaptchaImage()
    const data = pick<{ captchaEnabled: boolean; uuid?: string; img?: string }>(res as never, 'data')
    captcha.enabled = data?.captchaEnabled ?? false
    captcha.img = data?.img ?? ''
    form.uuid = data?.uuid ?? ''
    form.code = ''
  } catch {
    captcha.enabled = false
  }
}

async function submit(): Promise<void> {
  if (!form.username || !form.password) {
    errorText.value = '请输入账号和密码'
    return
  }
  if (captcha.enabled && !form.code) {
    errorText.value = '请输入验证码'
    return
  }
  loading.value = true
  errorText.value = ''
  try {
    await userStore.login({ ...form })
    message.success('登录成功')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirect)
  } catch (e) {
    errorText.value = e instanceof Error ? e.message : '登录失败'
    await loadCaptcha()
  } finally {
    loading.value = false
  }
}

onMounted(loadCaptcha)
onBeforeUnmount(() => undefined)
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-canvas px-4">
    <div class="w-full max-w-[352px]">
      <div class="flex flex-col items-center gap-2 mb-6">
        <span class="w-11 h-11 rounded-lg bg-ink text-paper flex items-center justify-center">
          <AppIcon name="seed" :size="24" />
        </span>
        <h1 class="text-xl font-semibold text-ink">Dipankara Platform</h1>
        <p class="text-sm text-muted">cookiecutter-java-scaffold 配套前端 · Notion 风格</p>
      </div>

      <div class="n-card p-6">
        <form class="flex flex-col gap-3.5" @submit.prevent="submit">
          <div>
            <label class="n-label" for="username">账号</label>
            <input id="username" v-model.trim="form.username" class="n-input" autocomplete="username" placeholder="admin" />
          </div>
          <div>
            <label class="n-label" for="password">密码</label>
            <input id="password" v-model.trim="form.password" type="password" class="n-input" autocomplete="current-password" placeholder="••••••••" />
          </div>
          <div v-if="captcha.enabled">
            <label class="n-label" for="code">验证码</label>
            <div class="flex gap-2">
              <input id="code" v-model.trim="form.code" class="n-input flex-1" placeholder="不区分大小写" @keyup.enter="submit" />
              <button
                type="button"
                class="shrink-0 rounded-md border border-line overflow-hidden bg-canvas hover:opacity-80"
                aria-label="刷新验证码"
                @click="loadCaptcha"
              >
                <img v-if="captcha.img" :src="captcha.img" alt="验证码" class="block h-[34px] w-[104px]" />
                <span v-else class="inline-block h-[34px] w-[104px] leading-[34px] text-[12px] text-muted">加载中…</span>
              </button>
            </div>
          </div>

          <p v-if="errorText" class="text-[13px] text-danger" role="alert">{{ errorText }}</p>

          <button type="submit" class="n-btn n-btn-primary w-full !py-2 mt-1" :disabled="loading">
            {{ loading ? '登录中…' : '登 录' }}
          </button>
        </form>

        <div class="mt-5 pt-4 border-t border-line text-[12px] text-muted leading-relaxed">
          <template v-if="useMock">
            <p>mock 演示账号：admin / admin123（全权限）· seed / user123（受限）</p>
            <p class="mt-1">后端 M3 登录链路落地后，.env 改 VITE_USE_MOCK=false 即可实机对接。</p>
          </template>
          <p v-else>默认账号：admin / admin123</p>
        </div>
      </div>
    </div>
  </div>
</template>
