/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

'use strict';

const { createAnthropic } = require('@ai-sdk/anthropic');
const { createCerebras } = require('@ai-sdk/cerebras');
const { createCohere } = require('@ai-sdk/cohere');
const { createDeepInfra } = require('@ai-sdk/deepinfra');
const { createFireworks } = require('@ai-sdk/fireworks');
const { generateText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { createGroq } = require('@ai-sdk/groq');
const { createMistral } = require('@ai-sdk/mistral');
const { createOpenAI } = require('@ai-sdk/openai');
const { createPerplexity } = require('@ai-sdk/perplexity');
const { createReplicate } = require('@ai-sdk/replicate');
const { createTogetherAI } = require('@ai-sdk/togetherai');
const { createXai } = require('@ai-sdk/xai');
const { createOpenAICompatible } = require('@ai-sdk/openai-compatible');
const config = require('../utils/config');
const logger = require('../utils/logger');
const SmError = require('../utils/error');

const AI_BASE_URLS = {
    anthropic: 'https://api.anthropic.com/v1',
    cerebras: 'https://api.cerebras.ai/v1',
    cohere: 'https://api.cohere.com/v2',
    deepinfra: 'https://api.deepinfra.com/v1/openai',
    fireworks: 'https://api.fireworks.ai/inference/v1',
    genai: 'https://api.genai.mil/v1',
    google: 'https://generativelanguage.googleapis.com/v1beta',
    groq: 'https://api.groq.com/openai/v1',
    mistral: 'https://api.mistral.ai/v1',
    ollama: 'http://localhost:11434/v1',
    openai: 'https://api.openai.com/v1',
    perplexity: 'https://api.perplexity.ai',
    replicate: 'https://api.replicate.com/v1',
    togetherai: 'https://api.together.xyz/v1',
    xai: 'https://api.x.ai/v1',
};

const AI_MODELS = {
    anthropic: 'claude-sonnet-4-20250514',
    cerebras: 'llama3.1-8b',
    cohere: 'command-r-plus',
    deepinfra: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
    fireworks: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
    genai: 'gemini-2.5-pro',
    google: 'gemini-2.5-pro',
    groq: 'gemma2-9b-it',
    mistral: 'mistral-medium-latest',
    ollama: 'llama3.2',
    openai: 'gpt-5',
    perplexity: 'sonar-pro',
    replicate: 'meta/meta-llama-3-8b-instruct',
    togetherai: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    xai: 'grok-4-latest',
};

async function getAIModel() {
    if (!config.ai.provider) {
        throw new Error('AI provider is not configured');
    }

    const provider = config.ai.provider.toLowerCase();
    if (!(provider in AI_MODELS)) {
        throw new Error(`Unsupported AI provider: ${config.ai.provider}`);
    }

    if (provider !== 'ollama' && !config.ai.apiKey) {
        throw new Error('AI API key is not configured');
    }

    const modelName = config.ai.modelName || AI_MODELS[provider];

    const providerSettings = { apiKey: config.ai.apiKey };
    if (config.ai.aiBaseURL) {
        providerSettings.baseURL = config.ai.aiBaseURL;
    }

    switch (provider) {
        case 'anthropic':
            return createAnthropic(providerSettings)(modelName);
        case 'cerebras':
            return createCerebras(providerSettings)(modelName);
        case 'cohere':
            return createCohere(providerSettings)(modelName);
        case 'deepinfra':
            return createDeepInfra(providerSettings)(modelName);
        case 'fireworks':
            return createFireworks(providerSettings)(modelName);
        case 'genai':
            return createOpenAICompatible({
                baseURL: config.ai.aiBaseURL || AI_BASE_URLS.genai,
                apiKey: config.ai.apiKey,
                name: 'genai-provider',
            }).chatModel(modelName);
        case 'google':
            return createGoogleGenerativeAI(providerSettings)(modelName);
        case 'groq':
            return createGroq(providerSettings)(modelName);
        case 'mistral':
            return createMistral(providerSettings)(modelName);
        case 'ollama':
            return createOpenAICompatible({
                baseURL: config.ai.aiBaseURL || AI_BASE_URLS.ollama,
                name: 'ollama-provider',
                apiKey: 'ollama',
            }).chatModel(modelName);
        case 'openai':
            return createOpenAI(providerSettings)(modelName);
        case 'perplexity':
            return createPerplexity(providerSettings)(modelName);
        case 'replicate':
            return createReplicate(providerSettings)(modelName);
        case 'togetherai':
            return createTogetherAI(providerSettings)(modelName);
        case 'xai':
            return createXai(providerSettings)(modelName);
        default:
            throw new Error('Unsupported AI provider');
    }
}

module.exports.generateMitigation = async function generateMitigation(req) {
    if (!config.ai.enabled) {
        throw new SmError.ClientError('AI is disabled');
    }

    if (!req.body) {
        logger.writeError('aiService', 'generateMitigation', {
            error: 'Missing prompt',
        });

        throw new SmError.ClientError('Prompt is required');
    }

    if (!config.ai.provider) {
        logger.writeError('aiService', 'generateMitigation', {
            error: 'Missing AI provider configuration',
        });

        throw new Error('AI provider is not configured');
    }

    try {
        const model = await getAIModel();

        const { text } = await generateText({
            model,
            prompt: req.body,
            timeout: 60000,
        });

        if (!text) {
            logger.writeError('aiService', 'generateMitigation', {
                error: 'Empty response from AI provider',
            });
            throw new Error('No response received from AI provider');
        }

        return {
            mitigation: text,
        };
    } catch (error) {
        logger.writeError('aiService', 'generateMitigation', {
            error: error.message,
            stack: error.stack,
            provider: config.ai.provider,
        });

        const isAuthError = error.message.includes('API key') || error.message.includes('authentication');

        throw new SmError.InternalError(isAuthError ? 'AI service configuration error' : 'AI service error');
    }
};
