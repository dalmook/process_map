const runtimeConfig = typeof window !== 'undefined' ? window.__APP_CONFIG__ || {} : {};
const localApiKey =
  typeof localStorage !== 'undefined' ? localStorage.getItem('OPENAI_API_KEY') || '' : '';

export const APP_CONFIG = {
  enableLLMRefinement: runtimeConfig.enableLLMRefinement ?? true,
  llmTimeoutMs: runtimeConfig.llmTimeoutMs ?? 9000,
  maxTasksForRefinement: runtimeConfig.maxTasksForRefinement ?? 20,
  maxSourceCharsForLLM: runtimeConfig.maxSourceCharsForLLM ?? 5000,
  compareModeEnabled: runtimeConfig.compareModeEnabled ?? true,
  llmModel: runtimeConfig.llmModel ?? 'gpt-4.1-mini',
  openAIBaseUrl: runtimeConfig.openAIBaseUrl ?? 'https://api.openai.com/v1',
  openAIApiKey: runtimeConfig.openAIApiKey ?? localApiKey,
};
