import { RESUME_GENERATE_PROMPT } from './templates/resume-generate';
import { JD_MATCH_PROMPT } from './templates/jd-match';
import { INTERVIEW_GENERATE_PROMPT } from './templates/interview-generate';
import { INTERVIEW_REVIEW_PROMPT } from './templates/interview-review';

export type PromptName = 'resume-generate' | 'jd-match' | 'interview-generate' | 'interview-review';

export interface PromptTemplate {
  name: PromptName;
  version: string;
  system: string;
  template: string;
  variables: string[];
  examples?: Array<{ [key: string]: unknown }>;
}

const promptRegistry: Record<PromptName, PromptTemplate> = {
  'resume-generate': {
    name: 'resume-generate',
    version: 'v1.0',
    ...RESUME_GENERATE_PROMPT,
  },
  'jd-match': {
    name: 'jd-match',
    version: 'v1.0',
    ...JD_MATCH_PROMPT,
  },
  'interview-generate': {
    name: 'interview-generate',
    version: 'v1.0',
    ...INTERVIEW_GENERATE_PROMPT,
  },
  'interview-review': {
    name: 'interview-review',
    version: 'v1.0',
    ...INTERVIEW_REVIEW_PROMPT,
  },
};

export function getPrompt(name: PromptName): PromptTemplate {
  return promptRegistry[name];
}

export function renderPrompt(
  name: PromptName,
  variables: Record<string, string> = {}
): { system: string; user: string } {
  const prompt = getPrompt(name);
  let userPrompt = prompt.template;

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    userPrompt = userPrompt.replace(new RegExp(placeholder, 'g'), value || `[${key}]`);
  });

  userPrompt = userPrompt.replace(/\{[a-z_]+\}/g, '[未提供]');

  return {
    system: prompt.system,
    user: userPrompt,
  };
}

export function listPrompts(): Array<{ name: string; version: string }> {
  return Object.values(promptRegistry).map((p) => ({
    name: p.name,
    version: p.version,
  }));
}
