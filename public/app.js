import { micromark } from 'https://esm.sh/micromark@3?bundle'

const messagesContainer = document.getElementById("messages");
const scoreDisplay = document.getElementById("scoreDisplay");
const modelDisplay = document.getElementById("modelDisplay");
const choicesContainer = document.getElementById("choicesContainer");
const loadingIndicator = document.getElementById("loadingIndicator");
const helpButton = document.getElementById("helpButton");
const introDialog = document.getElementById("introDialog");
const introStartButton = document.getElementById("introStartButton");
const introCloseButton = document.getElementById("introCloseButton");

let isWaitingForAI = false;

function setupIntroDialog() {
    if (!helpButton || !introDialog) return;

    helpButton.addEventListener("click", () => {
        if (!introDialog.open) introDialog.showModal();
    });

    if (introCloseButton) {
        introCloseButton.addEventListener("click", () => {
            introDialog.close();
        });
    }
}

async function init() {
    let userId = localStorage.getItem("userid");
    if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem("userid", userId);
    }

    try {
        const response = await fetch("./api/history", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        if (response.ok) {
            const history = await response.json();
            history
                .filter(item => item.role !== "system")
                .forEach(item => {
                    if (item.role === "assistant") {
                        const extracted = JSON.parse(item.content);

                        addMessage("assistant", extracted.question, {
                            model: item.model,
                            tokens: item.tokens,
                            score: extracted.score
                        });
                        renderChoiceButtons(extracted.answers);
                        if (extracted.score !== undefined) scoreDisplay.textContent = extracted.score;
                        if (item.model) modelDisplay.textContent = item.model;
                    } else if (item.role === "user") {
                        addMessage("user", item.content || "");
                    }
                });

            if (!history.some(item => item.role === "assistant")) {
                await requestQuizQuestion("Lets start the F1 quiz!", false);
            }
        }
    } catch (err) {
        console.error("Geschiedenis kon niet worden geladen:", err);
    }
}


// Start de initialisatie
init();
setupIntroDialog();

// Chat wordt getoond in interface met tekst ballonnetjes.
function addMessage(role, text, meta = null) {
    const wrapper = document.createElement("div");
    const bubble = document.createElement("div");

    wrapper.className = `chat ${role === "user" ? "chat-end" : "chat-start"}`;
    bubble.className = `chat-bubble ${role === "user" ? "chat-bubble-primary" : "chat-bubble-secondary"}`;
    bubble.innerHTML = micromark(text); // Markdown uit taalmodel wordt correct getoond.

    wrapper.appendChild(bubble);

    if (role === "assistant" && meta && (meta.model || meta.tokens !== undefined)) {
        const footer = document.createElement("div");
        const model = meta.model || "Onbekend model";
        const tokenCount = meta.tokens ?? "Onbekend aantal";
        const score = meta.score !== undefined ? ` • Score: ${meta.score}` : "";

        footer.className = "chat-footer opacity-70 text-xs mt-1";
        footer.textContent = `Model: ${model} • Tokens: ${tokenCount}${score}`;
        wrapper.appendChild(footer);
    }

    messagesContainer.appendChild(wrapper);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Submit button inactief tijdens verwerken prompt.
function setLoadingState(isLoading) {
    isWaitingForAI = isLoading;
    if (loadingIndicator) {
        loadingIndicator.classList.toggle("hidden", !isLoading);
        loadingIndicator.classList.toggle("flex", isLoading);
    }

    if (choicesContainer) {
        Array.from(choicesContainer.querySelectorAll("button")).forEach(button => {
            button.disabled = isLoading;
            button.classList.toggle("opacity-60", isLoading);
            button.classList.toggle("cursor-not-allowed", isLoading);
        });
    }
}

// Frontend kan prompt sturen.
async function requestQuizQuestion(prompt, includeUserBubble = true) {
    if (isWaitingForAI) return;
    const userId = localStorage.getItem("userid");

    setLoadingState(true);

    if (includeUserBubble) {
        addMessage("user", prompt);
    }

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ userId, prompt })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        const tokens = data.tokens || "Onbekend aantal";
        const model = data.model || "Onbekend model";
        const extracted = data.message;

        if (extracted.score !== undefined) scoreDisplay.textContent = extracted.score;
        if (model) modelDisplay.textContent = model;

        if (extracted.answers) {
            addMessage("assistant", extracted.question, { model, tokens, score: extracted.score });
            renderChoiceButtons(extracted.answers);
        } else {
            addMessage("assistant", extracted.question, { model, tokens, score: extracted.score });
        }
    } catch (error) {
        addMessage("assistant", `Fout bij ophalen van antwoord: ${error.message}`);
    } finally {
        setLoadingState(false);
    }
}

async function sendUserAnswer(answerText) {
    return requestQuizQuestion(answerText, true);
}

function clearChoices() {
    if (!choicesContainer) return;
    choicesContainer.innerHTML = "";
}

function renderChoiceButtons(choices) {
    if (!choicesContainer) return;
    clearChoices();

    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline btn-sm';
        btn.textContent = typeof choice === 'string' ? choice : (choice.label ?? JSON.stringify(choice));
        btn.addEventListener('click', () => {
            if (isWaitingForAI) return;
            sendUserAnswer(btn.textContent);
        });
        choicesContainer.appendChild(btn);
    });
}

