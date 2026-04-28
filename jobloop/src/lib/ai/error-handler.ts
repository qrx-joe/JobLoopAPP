interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelayMs: 1000,
  maxDelayMs: 5000,
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const cfg = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < cfg.maxRetries) {
        const delay = Math.min(cfg.baseDelayMs * Math.pow(2, attempt), cfg.maxDelayMs);
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

// Fallback responses when AI is unavailable
export const FALLBACK_RESPONSES: Record<string, string> = {
  'resume-generate': `{
      "experienceItems": [],
      "skillTags": [],
      "rawSuggestions": "AI服务暂时繁忙，请稍后重试。"
    }`,
  'jd-match': `{
      "overallScore": 50,
      "dimensionScores": {"skills": 50, "experience": 50, "expression": 50},
      "gaps": [{"area": "分析服务暂不可用", "severity": "medium", "suggestion": "请稍后重试", "isShortTerm": true}],
      "optimizedBullets": [],
      "keywordTrends": []
    }`,
  'interview-generate': `{
      "questions": [
        {"id": "q1", "type": "open", "category": "通用", "text": "请简单自我介绍", "followUpStrategy": {"depth": "", "challenge": "", "scenario": ""}, "idealAnswerElements": ["基本信息", "核心优势"]}
      ],
      "scoringCriteria": {"dimensions": [], "scoreRange": [1,10], "feedbackTemplate": ""}
    }`,
  'interview-review': `{
      "summary": "复盘分析服务暂不可用，请稍后重试。",
      "interviewAnalysis": {"interviewerFocus": [], "questionCategories": {}, "difficulty": "medium", "overallVibe": "不确定"},
      "strengths": [],
      "gaps": [{"area": "服务暂不可用", "severity": "low", "description": "", "suggestion": "稍后重试"}],
      "improvementPlan": {"shortTerm": ["稍后重试"], "mediumTerm": [], "longTerm": []},
      "likelyNextSteps": [],
      "keyQuestionsToPrepare": [],
      "score": {"overall": 5, "dimensions": {}}
    }`,
};

export class AIOperationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'AIOperationError';
  }

  static TIMEOUT = new AIOperationError('AI请求超时', 'TIMEOUT');
  static RATE_LIMITED = new AIOperationError('请求过于频繁，请稍后再试', 'RATE_LIMITED');
  static PROVIDER_ERROR = (error: Error) =>
    new AIOperationError('AI服务异常，请稍后重试', 'PROVIDER_ERROR', error);
  static INVALID_RESPONSE = new AIOperationError('AI返回结果格式错误', 'INVALID_RESPONSE');
}

export const USER_FRIENDLY_ERRORS: Record<string, string> = {
  TIMEOUT: '处理时间过长，请简化内容后重试',
  RATE_LIMITED: '操作太频繁啦，休息一下再试吧~',
  PROVIDER_ERROR: 'AI助手正在休息中，请稍后重试',
  INVALID_RESPONSE: '生成结果格式异常，请重试',
  NETWORK: '网络连接不稳定，请检查网络后重试',
  UNKNOWN: '发生了未知错误，请刷新页面重试或联系客服',
};

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(AIOperationError.TIMEOUT), timeoutMs)
  );

  return Promise.race([promise, timeoutPromise]);
}
