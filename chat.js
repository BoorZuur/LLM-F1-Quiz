import { AzureChatOpenAI } from "@langchain/openai";
import { systemPrompt } from "./systemPrompt.js";

const model = new AzureChatOpenAI({
    temperature: 0.4,
    verbose: false,
    maxTokens: 200
})

const messages = new Map();

function parseAiContent(content) {
    const parsed = JSON.parse(content);

    return {
        question: parsed.question,
        score: parsed.score,
        answers: parsed.answers
    };
}

export function getUserChat(userId) {
    if (!messages.has(userId)) {
        messages.set(userId, [systemPrompt]);
    }

    return messages.get(userId);
}

export async function callOpenAI(userId, prompt) {
    const userMessages = getUserChat(userId);
    userMessages.push({ role: "user", content: prompt });

    const result = await model.invoke(userMessages);

    const parsedContent = parseAiContent(result.content);

    userMessages.push({
        role: "assistant",
        content: JSON.stringify(parsedContent),
        score: parsedContent.score,
        model: result.response_metadata?.model_name,
        tokens: result.usage_metadata?.total_tokens || result.response_metadata?.tokenUsage?.totalTokens
    });

    return {
        message: parsedContent,
        tokens: result.usage_metadata?.total_tokens || result.response_metadata?.tokenUsage?.totalTokens,
        model: result.response_metadata?.model_name
    }
}

// prompt sturen vanuit node
if (process.env.NODE_ENV === "development") {
    const testPrompt = "Lets begin the quiz! Ask the first question.";
    const result = await callOpenAI("testUser", testPrompt);
    console.log("Test Result:", result);
}