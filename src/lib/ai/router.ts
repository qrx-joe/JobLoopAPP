import OpenAI from 'openai';
import { AI_MODELS, TASK_TYPES, type TaskType } from '@/lib/constants';

// Provider configurations
interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel: string;
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
    defaultModel: process.env.LLM_MODEL || AI_MODELS.DEEPSEEK,
  },
};

// Model routing strategy based on task type
const taskModelMap: Record<TaskType, { primary: string; fallback: string }> = {
  [TASK_TYPES.RESUME_GENERATE]: { primary: 'deepseek', fallback: 'openai' },
  [TASK_TYPES.JD_MATCH]: { primary: 'deepseek', fallback: 'openai' },
  [TASK_TYPES.INTERVIEW_GENERATE]: { primary: 'deepseek', fallback: 'openai' },
  [TASK_TYPES.INTERVIEW_FOLLOWUP]: { primary: 'deepseek', fallback: 'openai' },
  [TASK_TYPES.FILE_PARSE]: { primary: 'deepseek', fallback: 'openai' },
};

export interface CallLLMOptions {
  taskType: TaskType;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  userTier?: 'free' | 'pro';
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class LLMRouter {
  async call(options: CallLLMOptions): Promise<LLMResponse> {
    const routing = taskModelMap[options.taskType] || { primary: 'deepseek', fallback: 'openai' };

    // Try primary provider first, then fallback
    for (const providerKey of [routing.primary, routing.fallback]) {
      try {
        const result = await this.callProvider(providerKey, options);
        console.log(`[LLMRouter] ${providerKey} succeeded, model=${result.model}`);
        return { ...result, provider: providerKey };
      } catch (error) {
        console.warn(
          `[LLMRouter] ${providerKey} failed:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    throw new Error('All LLM providers failed');
  }

  private async callProvider(
    providerKey: string,
    options: CallLLMOptions
  ): Promise<Omit<LLMResponse, 'provider'>> {
    const config = providers[providerKey];

    // Check API key exists
    if (!config.apiKey) {
      throw new Error(`No API key configured for provider: ${providerKey}`);
    }

    // Check base URL exists
    if (!config.baseURL && providerKey !== 'openai') {
      // Only openai has a sensible default
      throw new Error(`No base URL configured for provider: ${providerKey}`);
    }

    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL || undefined,
    });

    // Build request params
    const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      model: config.defaultModel,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
    };

    // jsonMode may not be supported on all providers (e.g., SiliconFlow)
    // Only enable for known-compatible providers or when explicitly requested
    if (options.jsonMode && config.baseURL?.includes('api.openai.com')) {
      params.response_format = { type: 'json_object' };
    }

    // For non-OpenAI providers, instruct JSON output via system prompt instead of jsonMode
    if (options.jsonMode && !params.response_format) {
      console.log(`[LLMRouter] Using prompt-based JSON mode for ${providerKey}`);
    }

    try {
      const response = await client.chat.completions.create(params);

      const choice = response.choices[0];
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
      };
    } catch (error) {
      // Enhance error message for debugging
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(`[LLMRouter] API call failed for ${providerKey}:`, errMsg);
      console.error(
        `[LLMRouter] Config: baseURL=${config.baseURL}, model=${config.defaultModel}, hasKey=${!!config.apiKey}`
      );
      throw new Error(`${providerKey} API error: ${errMsg}`);
    }
  }
}

// Export singleton
export const llmRouter = new LLMRouter();
