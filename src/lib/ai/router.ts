import OpenAI from 'openai'
import { AI_MODELS, TASK_TYPES, type TaskType } from '@/lib/constants'

// Provider configurations
interface ProviderConfig {
  apiKey: string
  baseURL?: string
  defaultModel: string
}

const providers: Record<string, ProviderConfig> = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseURL: process.env.OPENAI_API_BASE_URL,
    defaultModel: AI_MODELS.GPT4O,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    defaultModel: AI_MODELS.CLAUDE_35_SONNET,
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseURL: process.env.DEEPSEEK_API_BASE_URL,
    defaultModel: AI_MODELS.DEEPSEEK,
  },
}

// Model routing strategy based on task type
const taskModelMap: Record<TaskType, { primary: string; fallback: string }> = {
  [TASK_TYPES.RESUME_GENERATE]: { primary: 'openai', fallback: 'anthropic' },
  [TASK_TYPES.JD_MATCH]: { primary: 'openai', fallback: 'deepseek' },
  [TASK_TYPES.INTERVIEW_GENERATE]: { primary: 'anthropic', fallback: 'openai' },
  [TASK_TYPES.INTERVIEW_FOLLOWUP]: { primary: 'openai', fallback: 'anthropic' },
  [TASK_TYPES.FILE_PARSE]: { primary: 'deepseek', fallback: 'openai' },
}

export interface CallLLMOptions {
  taskType: TaskType
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  temperature?: number
  maxTokens?: number
  jsonMode?: boolean
  userTier?: 'free' | 'pro'
}

export interface LLMResponse {
  content: string
  model: string
  provider: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

class LLMRouter {
  private openaiClient: OpenAI | null = null

  private getOpenAIClient(provider: string): OpenAI {
    if (!this.openaiClient) {
      this.openaiClient = new OpenAI({
        apiKey: providers[provider].apiKey,
        baseURL: providers[provider].baseURL,
      })
    }
    return this.openaiClient
  }

  async call(options: CallLLMOptions): Promise<LLMResponse> {
    const routing = taskModelMap[options.taskType] || { primary: 'openai', fallback: 'deepseek' }
    
    // Try primary provider first, then fallback
    for (const providerKey of [routing.primary, routing.fallback]) {
      try {
        const result = await this.callProvider(providerKey, options)
        return { ...result, provider: providerKey }
      } catch (error) {
        console.warn(`Provider ${providerKey} failed, trying next...`, error)
      }
    }

    throw new Error('All LLM providers failed')
  }

  private async callProvider(
    providerKey: string,
    options: CallLLMOptions
  ): Promise<Omit<LLMResponse, 'provider'>> {
    const config = providers[providerKey]

    // Only support OpenAI-compatible API for MVP
    // Anthropic can be added via SDK later
    if (providerKey === 'anthropic') {
      // Use OpenAI-compatible endpoint or Anthropic SDK
      // For now, fall back through OpenAI-compatible pattern
    }

    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    })

    const response = await client.chat.completions.create({
      model: config.defaultModel,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      response_format: options.jsonMode ? { type: 'json_object' } : undefined,
    })

    const choice = response.choices[0]
    return {
      content: choice?.message?.content || '',
      model: response.model,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    }
  }
}

// Export singleton
export const llmRouter = new LLMRouter()
