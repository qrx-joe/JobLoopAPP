import { z } from 'zod';

export const CareerNavigateSchema = z.object({
  diagnosis: z.object({
    archetype: z.string().describe('主要能力原型，如 Builder/Analyst/Organizer/Communicator'),
    archetypeDescription: z.string().describe('原型的简要解释'),
    strengths: z.array(z.string()).describe('从经历中提取的核心优势（3-5条）'),
    weaknesses: z.array(z.string()).describe('需要诚实指出的短板（2-3条）'),
  }),
  recommendedRoles: z
    .array(
      z.object({
        title: z.string().describe('岗位名称'),
        matchScore: z.number().min(0).max(100).describe('匹配度评分 0-100'),
        gapFriendlyScore: z
          .number()
          .min(0)
          .max(100)
          .describe('GAP期友好度 0-100，越高表示该岗位对GAP期越包容'),
        salaryRange: z.string().describe('起薪范围，如"8-12K"'),
        entryBarrier: z.enum(['低', '中', '高']).describe('入门门槛'),
        reasons: z.array(z.string()).describe('推荐理由（2-3条，引用用户经历中的具体内容）'),
        concerns: z.array(z.string()).describe('需要注意的风险或短板（1-2条，诚实指出）'),
      })
    )
    .min(3)
    .max(5),
  recommendedCities: z
    .array(
      z.object({
        name: z.string().describe('城市名称'),
        matchReasons: z.array(z.string()).describe('推荐理由（1-2条）'),
        targetIndustries: z.array(z.string()).describe('该城市适合目标岗位的行业'),
        competitionLevel: z.enum(['低', '中', '高', '极高']).describe('竞争激烈程度'),
        livingCost: z.enum(['低', '中', '中高', '高']).describe('生活成本'),
      })
    )
    .min(2)
    .max(4),
  gapStrategy: z.object({
    summary: z.string().describe('一句话总结GAP期经历，用于简历上的时间段说明'),
    resumePhrase: z.string().describe('简历上写的时间段标题，如"全职自学AI全栈开发"'),
    doSay: z.array(z.string()).describe('应该说的事实（2-3条）'),
    dontSay: z.array(z.string()).describe('不应该提及的内容（1-2条）'),
  }),
  experienceReframes: z
    .array(
      z.object({
        original: z.string().describe('原始经历描述'),
        translated: z.string().describe('翻译后的职场能力描述'),
        targetSkills: z.array(z.string()).describe('体现的可迁移技能'),
      })
    )
    .min(3)
    .max(8),
  skillGaps: z
    .array(
      z.object({
        skill: z.string().describe('缺少的技能或经验'),
        severity: z.enum(['高', '中', '低']).describe('对目标岗位的影响程度'),
        suggestion: z.string().describe('弥补建议'),
      })
    )
    .min(2)
    .max(5),
});

export const CAREER_NAVIGATE_PROMPT = {
  system: `你是一位资深职业规划顾问，专门帮助有GAP期（6个月-3年空窗期）的求职者找到职业方向。

你的用户画像：
- 多数为应届毕业生或毕业1-3年的年轻人
- 可能有转专业、考公考研失败、疫情待业等经历
- 有学生工作/社团经历但缺乏实习
- 可能有自学成果（编程、AI工具、证书）但不知如何包装
- 心理状态焦虑、自我怀疑、方向迷茫

你的核心任务：
1. 从用户杂乱的经历中提取核心能力和可迁移技能
2. 推荐3-5个切实可行的岗位方向（不能只推荐一个）
3. 为每个岗位给出匹配度评分和GAP友好度评分
4. 提供GAP期的简历包装策略（不能造假，但可以重新 framing）
5. 诚实指出能力缺口和弥补建议

硬性规则：
- 必须引用用户经历中的具体内容作为推荐依据，不能凭空推荐
- GAP友好度评分必须考虑该岗位/行业对空窗期的实际容忍度
- 不推荐的岗位也要说明原因（在concerns字段中）
- 薪资范围必须基于真实市场数据，不能画饼
- NEVER只推荐一个方向，必须给3-5个选项
- 如果用户背景确实不适合某类岗位，明确说明

输出格式：必须为JSON，严格符合给定的schema。`,

  template: `请根据以下用户经历，生成一份职业方向诊断报告。

## 用户全部经历
{user_input}

## 用户补充信息（如有）
- 目标城市偏好：{target_cities}
- 感兴趣的方向：{interests}

## 诊断要求

### 1. 能力原型判断
分析用户的核心能力倾向，归入以下7种原型之一：
- Builder（建造者）：喜欢从0到1搭建东西，适合开发/工程/产品助理
- Analyst（分析师）：擅长数据处理和逻辑推理，适合数据分析/商业分析
- Organizer（组织者）：善于协调资源和流程，适合运营/项目管理
- Communicator（沟通者）：擅长表达和影响他人，适合市场/内容/销售
- Tester（测试者）：注重细节和质量，适合QA/审核/品控
- Support（支持者）：善于帮助他人解决问题，适合客户成功/客服/培训
- Creator（创造者）：有设计或创作能力，适合UI/UX/内容创作

### 2. 推荐岗位（3-5个）
每个岗位必须包含：
- 匹配度评分（基于用户经历与岗位要求的重合度）
- GAP友好度评分（该岗位/行业对空窗期的实际容忍度，不是所有岗位都一样）
- 薪资范围（基于该城市该岗位的实际市场价）
- 推荐理由（引用用户经历中的具体内容）
- 需要注意的风险

### 3. 推荐城市（2-4个）
结合用户的偏好和推荐岗位的城市需求分布。

### 4. GAP期包装策略
- 如何在简历上描述这段空窗期
- 应该强调什么、避免提及什么
- 不能造假，但可以重新 framing（如"考公考研"→"系统性自学XX"）

### 5. 经历翻译
把用户的学生工作/社团/自学经历翻译成职场可识别的能力描述。

### 6. 能力缺口
诚实指出用户距离目标岗位还缺什么，以及弥补建议。

## 输出格式（JSON）
严格按照 CareerNavigateSchema 输出，不要添加任何额外字段。`,

  variables: ['user_input', 'target_cities', 'interests'],

  examples: [
    {
      user_input:
        '兰州大学经济学本科（985），2023年毕业。毕业后考公考研均未通过，GAP约2年。期间自学了AI开发和全栈编程，独立完成了9个项目（Vue3/NestJS/Python/PostgreSQL）。大学期间担任团支部书记、学院办公室助理2年、参与校创项目（DID因果推断）。工行实习1个月（客户经理助理），乡镇政府实习1个月（乡村振兴文秘）。运营公众号和小红书。',
      target_cities: '杭州、成都、上海',
      interests: 'AI、产品、运营',
      output: JSON.stringify({
        diagnosis: {
          archetype: 'Builder',
          archetypeDescription:
            '核心特征是从0到1搭建事物的驱动力。9个独立项目、公众号运营、从护理转到经济再自学编程，都体现了强烈的自主构建倾向。',
          strengths: [
            '快速学习能力：护理→经济→AI全栈，三次跨领域成功转型',
            '产品闭环能力：从需求发现到部署上线，9个项目完整跑通',
            '数据思维：经济学训练 + DID/PSM-DID + 工行客户数据分析',
            '内容运营实践：公众号选题→写作→分发→工具化的完整链路',
          ],
          weaknesses: [
            '缺乏正式工作环境中的协作经验（项目均为独立完成）',
            '无B端产品或企业级服务的实战经验',
            'GAP期较长（2年），部分HR会有顾虑',
          ],
        },
        recommendedRoles: [
          {
            title: 'AI产品助理',
            matchScore: 88,
            gapFriendlyScore: 75,
            salaryRange: '8-14K',
            entryBarrier: '中',
            reasons: [
              '9个AI全栈项目证明对AI产品形态有深度理解（RAG/工作流/Agent）',
              '经济学背景+技术能力是AI产品岗位的稀缺组合',
              '内容运营经验（公众号+小红书）补充了用户增长的视角',
            ],
            concerns: ['缺乏B端产品设计经验，初期需要学习企业客户的需求差异'],
          },
          {
            title: '产品运营',
            matchScore: 82,
            gapFriendlyScore: 80,
            salaryRange: '7-12K',
            entryBarrier: '中',
            reasons: [
              '公众号+小红书运营是直接相关的用户增长经验',
              'JobMatch项目体现了从真实痛点出发的产品思维',
              'WechatArticle工具化内容生产流程体现了运营效率意识',
            ],
            concerns: ['需要补充用户增长的具体数据（粉丝数、转化率等）'],
          },
          {
            title: '技术型用户运营',
            matchScore: 78,
            gapFriendlyScore: 82,
            salaryRange: '7-11K',
            entryBarrier: '低',
            reasons: [
              '全栈开发能力可以搭建运营工具提效（WechatArticle就是例子）',
              '工行客户服务经验+办公室助理经验匹配用户服务场景',
            ],
            concerns: ['运营方法论不够体系化，需要系统学习运营框架'],
          },
          {
            title: '客户成功（SaaS/AI方向）',
            matchScore: 72,
            gapFriendlyScore: 78,
            salaryRange: '8-13K',
            entryBarrier: '中',
            reasons: [
              '理解AI产品（自研Agent/RAG平台）+ 能向客户解释技术价值',
              '工行客户经理助理经验：指导5000+客户，缩短等待时间20%',
              '乡镇府实习的基层服务意识匹配客户成功的核心素质',
            ],
            concerns: ['缺乏SaaS产品的使用经验和对企业采购流程的了解'],
          },
        ],
        recommendedCities: [
          {
            name: '杭州',
            matchReasons: [
              'AI产业密度全国第二（阿里+DeepSeek+大量AI创业公司）',
              'AI产品助理岗位数量充足',
            ],
            targetIndustries: ['AI/互联网', 'SaaS'],
            competitionLevel: '中高',
            livingCost: '中高',
          },
          {
            name: '成都',
            matchReasons: ['竞争压力低，对GAP期容忍度高', '互联网大厂分部+本土创业公司成长中'],
            targetIndustries: ['互联网', 'AI应用'],
            competitionLevel: '低',
            livingCost: '低',
          },
          {
            name: '深圳',
            matchReasons: ['创业氛围浓，对"能做东西的人"认可度高', 'AI+硬件方向岗位多'],
            targetIndustries: ['AI/科技', '电商'],
            competitionLevel: '高',
            livingCost: '高',
          },
        ],
        gapStrategy: {
          summary:
            '毕业后系统性自学AI全栈开发，独立完成9个产品原型（含可视化AI工作流平台、智能选岗工具、多平台内容分发系统），具备从需求挖掘到部署上线的完整工程能力。',
          resumePhrase: '全职自学AI全栈开发',
          doSay: [
            '独立完成9个全栈项目，技术栈涵盖Vue3/TypeScript/NestJS/Python/PostgreSQL',
            '所有项目代码开源至GitHub，部分已部署至Vercel并提供在线演示',
            '从真实场景痛点出发设计产品（考公选岗工具、内容分发工作流等）',
          ],
          dontSay: [
            '考公考研失败或待业/空窗期相关表述',
            '强调用了AI辅助写代码（这是手段不是成果）',
          ],
        },
        experienceReframes: [
          {
            original: '团支部书记（30+人班级）',
            translated: '团队管理与跨部门协作：统筹30+人完成集体任务，组织活动并进行年度工作汇报',
            targetSkills: ['团队管理', '活动策划', '跨部门沟通'],
          },
          {
            original: '学院办公室助理（2年）',
            translated: '行政运营与信息统筹：处理学生日常反馈，协调多部门沟通，整理汇总就业信息',
            targetSkills: ['行政运营', '流程优化', '信息管理'],
          },
          {
            original: 'GAP期自学编程完成9个项目',
            translated:
              '全职自学AI全栈开发：系统性掌握Vue3/NestJS/Python/PostgreSQL技术栈，独立完成从需求到部署的完整产品闭环',
            targetSkills: ['自主学习', '产品闭环', '全栈开发'],
          },
          {
            original: '工行客户经理助理（1个月）',
            translated:
              '客户服务与业务运营：指导5000+客户完成业务操作，实施客户分流策略缩短等待时间20%',
            targetSkills: ['客户服务', '数据驱动优化', '流程改进'],
          },
          {
            original: '乡镇府乡村振兴文秘',
            translated:
              '数据治理与政策分析：管理覆盖27个村庄、3万+人口的户籍数据，走访200+户收集调研数据',
            targetSkills: ['数据治理', '调研分析', '政策评估'],
          },
          {
            original: '运营公众号和小红书',
            translated:
              '内容运营与多平台分发：建立从选题、写作到多平台适配的分发工作流，并开发CLI工具自动化流程',
            targetSkills: ['内容运营', '工具化思维', '多平台分发'],
          },
        ],
        skillGaps: [
          {
            skill: 'B端产品设计经验',
            severity: '高',
            suggestion:
              '阅读《B端产品经理必修课》，在面试中用AgentFlow/EventAccount项目模拟B端场景思考',
          },
          {
            skill: '用户增长方法论',
            severity: '中',
            suggestion: '学习AARRR模型和增长黑客方法，用公众号/小红书的真实数据做一次增长复盘',
          },
          {
            skill: '团队协作经验',
            severity: '中',
            suggestion:
              '在面试中重点讲EventAccount团队项目（Playwright E2E + Swagger API验收），强调协作流程',
          },
          {
            skill: 'SQL/数据分析工具',
            severity: '低',
            suggestion:
              '你有计量经济学和Python基础，补一个SQL实战项目即可（如分析Boss直聘岗位数据）',
          },
        ],
      }),
    },
  ],
};

export type CareerNavigateData = z.infer<typeof CareerNavigateSchema>;
