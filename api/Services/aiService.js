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

const config = require('../utils/config');
const logger = require('../utils/logger');
const { generateText } = require('ai');
const { anthropic } = require('@ai-sdk/anthropic');
const { openai } = require('@ai-sdk/openai');
const { gemini } = require('@ai-sdk/google');
const { mistral } = require('@ai-sdk/mistral');
const { groq } = require('@ai-sdk/groq');
const { xai } = require('@ai-sdk/xai');
const { togetherai } = require('@ai-sdk/togetherai');
const { cohere } = require('@ai-sdk/cohere');
const { fireworks } = require('@ai-sdk/fireworks');
const { cerebras } = require('@ai-sdk/cerebras');
const { perplexity } = require('@ai-sdk/perplexity');
const { deepinfra } = require('@ai-sdk/deepinfra');
const { ollama } = require('ollama-ai-provider');

const AI_MODELS = {
    anthropic: 'claude-3-5-haiku-20241022',
    openai: 'gpt-4-turbo',
    gemini: 'gemini-1.5-pro-latest',
    mistral: 'mistral-small-latest',
    groq: 'gemma2-9b-it',
    xai: 'grok-2-1212',
    togetherai: 'google/gemma-2-9b-it',
    cohere: 'command-r-plus',
    fireworks: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
    cerebras: 'llama3.1-8b',
    perplexity: 'sonar-pro',
    deepinfra: 'google/gemma-2-9b-it',
    ollama: 'llama3.2'
};

const ENV_KEYS = {
    anthropic: 'ANTHROPIC_API_KEY',
    openai: 'OPENAI_API_KEY',
    gemini: 'GOOGLE_API_KEY',
    mistral: 'MISTRAL_API_KEY',
    groq: 'GROQ_API_KEY',
    xai: 'XAI_API_KEY',
    togetherai: 'TOGETHER_AI_API_KEY',
    cohere: 'COHERE_API_KEY',
    fireworks: 'FIREWORKS_API_KEY',
    cerebras: 'CEREBRAS_API_KEY',
    perplexity: 'PERPLEXITY_API_KEY',
    deepinfra: 'DEEPINFRA_API_KEY'
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

    if (provider !== 'ollama' && ENV_KEYS[provider]) {
        process.env[ENV_KEYS[provider]] = config.ai.apiKey;
    }

    const modelName = config.ai.modelName || AI_MODELS[provider];

    switch (provider) {
        case 'anthropic':
            return anthropic(modelName);
        case 'openai':
            return openai(modelName);
        case 'gemini':
            return gemini(modelName);
        case 'mistral':
            return mistral(modelName);
        case 'groq':
            return groq(modelName);
        case 'xai':
            return xai(modelName);
        case 'togetherai':
            return togetherai(modelName);
        case 'cohere':
            return cohere(modelName);
        case 'fireworks':
            return fireworks(modelName);
        case 'cerebras':
            return cerebras(modelName);
        case 'perplexity':
            return perplexity(modelName);
        case 'deepinfra':
            return deepinfra(modelName);
        case 'ollama':
            return ollama(modelName);
        default:
            throw new Error('Unsupported AI provider');
    }
}

exports.generateMitigation = async function generateMitigation(req, res, next) {
    if (!config.ai.enabled) {
        return next({
            status: 400,
            errors: {
                message: 'AI is disabled'
            }
        });
    }
    if (!req.body) {
        logger.writeError('aiService', 'generateMitigation', {
            error: 'Missing prompt'
        });
        return next({
            status: 400,
            errors: {
                message: 'Prompt is required'
            }
        });
    }

    if (!config.ai.provider) {
        logger.writeError('aiService', 'generateMitigation', {
            error: 'Missing AI provider configuration'
        });
        return next({
            status: 500,
            errors: {
                message: 'AI provider is not configured'
            }
        });
    }

    try {
        const model = await getAIModel();
        const { text } = await generateText({
            model,
            prompt: req.body,
            timeout: 60000
        });

        if (!text) {
            logger.writeError('aiService', 'generateMitigation', {
                error: 'Empty response from AI provider'
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
            provider: config.ai.provider
        });

        const isAuthError = error.message.includes('API key') ||
            error.message.includes('authentication');

        return next({
            status: 500,
            errors: {
                message: isAuthError ? 'AI service configuration error' : 'AI service error',
                detail: error.message
            }
        });
    }
};